import { DurableObject } from "cloudflare:workers";
import type { GameState } from "./game/types.js";
import {
  createGame,
  startFirstRound,
  exchangeCards,
  checkForcedExchange,
  checkVictory,
  resolveAttack,
  conquerTerritory,
  drawCard,
  endTurn,
  moveArmies,
  getPublicState,
  getPlayerSecretState,
} from "./game/engine.js";
import type { Color, GamePhase } from "./game/types.js";

interface PlayerAttachment {
  color: string;
  name: string;
  code: string;
}

interface AuthMessage {
  type: "auth";
  code: string;
  color: string;
  name: string;
}

interface RequestStateMessage {
  type: "request-state";
}

interface KickMessage {
  type: "kick";
  targetColor: string;
}

interface ChangeColorMessage {
  type: "change-color";
  color: Color;
}

interface StartMessage {
  type: "start";
}

interface ExchangeMessage {
  type: "exchange";
  cardIds: string[];
}

interface PlaceArmiesMessage {
  type: "place-armies";
  placements: Record<string, number>;
}

interface AttackMessage {
  type: "attack";
  from: string;
  to: string;
  armies: number;
}

interface AttackIntentMessage {
  type: "attack:intent";
  from: string | null;
  to: string | null;
}

interface ConquerMessage {
  type: "conquer";
  armies: number;
}

interface MoveMessage {
  type: "move";
  from: string;
  to: string;
  count: number;
}

interface EndAttacksMessage {
  type: "end-attacks";
}

interface EndMovesMessage {
  type: "end-moves";
}

type IncomingMessage =
  | AuthMessage
  | RequestStateMessage
  | KickMessage
  | ChangeColorMessage
  | StartMessage
  | ExchangeMessage
  | PlaceArmiesMessage
  | AttackMessage
  | AttackIntentMessage
  | ConquerMessage
  | MoveMessage
  | EndAttacksMessage
  | EndMovesMessage;

interface Env {
  DB: D1Database;
  ROOM: DurableObjectNamespace<GameRoom>;
}

export class GameRoom extends DurableObject {
  sql: SqlStorage;
  gameState: GameState | null = null;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;
    this.sql.exec(
      "CREATE TABLE IF NOT EXISTS game_state (key TEXT PRIMARY KEY, value TEXT NOT NULL)",
    );
    ctx.blockConcurrencyWhile(async () => {
      const rows = this.sql
        .exec("SELECT value FROM game_state WHERE key = 'state'")
        .toArray();
      if (rows.length > 0) {
        this.gameState = JSON.parse(rows[0].value as string);
        if (this.gameState?.phase === "game_over") {
          this.scheduleCleanup();
        }
      }
    });
  }

  async fetch(request: Request): Promise<Response> {
    if (request.headers.get("Upgrade") === "websocket") {
      return this.handleWebSocketUpgrade();
    }
    const url = new URL(request.url);
    switch (url.pathname) {
      case "/init":
        return this.handleInit(request);
      case "/join":
        return this.handleJoin(request);
      case "/rejoin":
        return this.handleRejoin(request);
      default:
        return new Response("No encontrado", { status: 404 });
    }
  }

  private handleWebSocketUpgrade(): Response {
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    this.ctx.acceptWebSocket(server);
    return new Response(null, { status: 101, webSocket: client });
  }

  private async handleInit(request: Request): Promise<Response> {
    if (this.gameState) {
      return Response.json({ error: "El juego ya existe" }, { status: 409 });
    }
    const { name, color } = (await request.json()) as {
      name: string;
      color: Color;
    };
    this.gameState = createGame([{ name, color }]);
    this.ctx.storage.put({ gameState: this.gameState });
    this.sql.exec(
      "INSERT OR REPLACE INTO game_state (key, value) VALUES ('state', ?)",
      JSON.stringify(this.gameState),
    );
    return Response.json({ success: true });
  }

  private async handleJoin(request: Request): Promise<Response> {
    if (!this.gameState) {
      return Response.json({ error: "Juego no encontrado" }, { status: 404 });
    }
    const { name, color } = (await request.json()) as {
      name: string;
      color: Color;
    };
    if (this.gameState.phase !== "lobby") {
      return Response.json({ error: "El juego ya comenzó" }, { status: 400 });
    }
    if (this.gameState.players.some((p) => p.color === color)) {
      return Response.json({ error: "Color ya ocupado" }, { status: 409 });
    }
    this.gameState.players.push({
      name,
      color,
      objective: "" as any,
      objectiveDescription: "",
      cards: [],
      alive: true,
    });
    this.persistAndBroadcastLobby();
    return Response.json({ success: true });
  }

  private async handleRejoin(request: Request): Promise<Response> {
    if (!this.gameState) {
      return Response.json({ error: "Juego no encontrado" }, { status: 404 });
    }
    const url = new URL(request.url);
    const color = url.searchParams.get("color");
    const name = url.searchParams.get("name");
    if (!color || !name) {
      return Response.json(
        { error: "Se requiere color y nombre" },
        { status: 400 },
      );
    }
    const player = this.gameState.players.find(
      (p) => p.color === color && p.name === name,
    );
    if (!player) {
      return Response.json(
        { error: "No se encontró jugador con ese color y nombre" },
        { status: 404 },
      );
    }
    if (!player.alive) {
      return Response.json({ error: "Jugador eliminado" }, { status: 400 });
    }
    return Response.json({
      success: true,
      name: player.name,
      color: player.color,
    });
  }

  async webSocketMessage(ws: WebSocket, raw: string) {
    let msg: IncomingMessage;
    try {
      msg = JSON.parse(raw);
    } catch {
      return;
    }

    if (msg.type === "auth") {
      this.handleAuth(ws, msg);
      return;
    }

    if (msg.type === "request-state") {
      this.sendPlayerState(ws);
      return;
    }

    const gameState = this.gameState;
    if (!gameState) return;

    const att = ws.deserializeAttachment() as PlayerAttachment | null;
    if (!att) return;

    const playerIdx = gameState.players.findIndex((p) => p.color === att.color);
    if (playerIdx === -1) return;

    try {
      let needPersist = false;
      let needBroadcast = false;

      switch (msg.type) {
        case "change-color": {
          if (gameState.phase !== "lobby") {
            this.sendError(ws, "El juego ya comenzó");
            return;
          }
          if (
            gameState.players.some(
              (p) => p.color === msg.color && p.color !== att.color,
            )
          ) {
            this.sendError(ws, "Color ya ocupado");
            return;
          }
          gameState.players[playerIdx].color = msg.color;
          ws.serializeAttachment({ ...att, color: msg.color });
          needPersist = true;
          break;
        }

        case "kick": {
          if (playerIdx !== 0) {
            this.sendError(ws, "Solo el anfitrión puede expulsar");
            return;
          }
          if (gameState.phase !== "lobby") {
            this.sendError(ws, "El juego ya comenzó");
            return;
          }
          const targetIdx = gameState.players.findIndex(
            (p) => p.color === msg.targetColor && p.color !== att.color,
          );
          if (targetIdx === -1) {
            this.sendError(ws, "Jugador no encontrado");
            return;
          }
          gameState.players.splice(targetIdx, 1);
          needPersist = true;
          break;
        }

        case "start": {
          if (playerIdx !== 0) {
            this.sendError(ws, "Solo el anfitrión puede iniciar");
            return;
          }
          if (gameState.phase !== "lobby") {
            this.sendError(ws, "El juego ya comenzó");
            return;
          }
          if (gameState.players.length < 3) {
            this.sendError(ws, "Se necesitan al menos 3 jugadores");
            return;
          }
          const fullGame = createGame(
            gameState.players.map((p) => ({ name: p.name, color: p.color })),
          );
          startFirstRound(fullGame);
          this.gameState = fullGame;
          needPersist = true;
          needBroadcast = true;
          break;
        }

        case "exchange": {
          if (playerIdx !== gameState.turnPlayer) {
            this.sendError(ws, "No es tu turno");
            return;
          }
          if (gameState.phase !== "receive" && gameState.phase !== "place") {
            this.sendError(ws, "Fase incorrecta");
            return;
          }
          if (gameState.forcedExchange && msg.cardIds.length !== 3) {
            this.sendError(ws, "Debes canjear");
            return;
          }
          const armies = exchangeCards(gameState, msg.cardIds);
          if (armies === null) {
            this.sendError(ws, "Canje inválido");
            return;
          }
          gameState.pendingArmies += armies;
          needPersist = true;
          needBroadcast = true;
          break;
        }

        case "place-armies": {
          if (playerIdx !== gameState.turnPlayer) {
            this.sendError(ws, "No es tu turno");
            return;
          }
          if (gameState.phase !== "receive" && gameState.phase !== "place") {
            this.sendError(ws, "Fase incorrecta");
            return;
          }
          if (gameState.forcedExchange) {
            this.sendError(ws, "Debes canjear cartas primero");
            return;
          }
          const total = Object.values(msg.placements).reduce(
            (a: number, b: number) => a + b,
            0,
          );
          if (total !== gameState.pendingArmies) {
            this.sendError(
              ws,
              `Debes colocar exactamente ${gameState.pendingArmies} ejércitos`,
            );
            return;
          }
          for (const [territory, count] of Object.entries(msg.placements)) {
            if (gameState.territories[territory]?.owner !== playerIdx) {
              this.sendError(ws, `No eres dueño de ${territory}`);
              return;
            }
            gameState.territories[territory].armies += count;
          }
          gameState.log.push({
            time: getTimeString(),
            message: `${gameState.players[playerIdx].name} colocó ${total} ejércitos`,
          });
          if (gameState.round === 1) {
            gameState.phase = "receive";
            endTurn(gameState);
          } else {
            gameState.phase = "attack";
          }
          needPersist = true;
          needBroadcast = true;
          break;
        }

        case "attack": {
          if (playerIdx !== gameState.turnPlayer) {
            this.sendError(ws, "No es tu turno");
            return;
          }
          if (gameState.phase !== "attack") {
            this.sendError(ws, "No es fase de ataque");
            return;
          }
          if (gameState.territories[msg.from]?.owner !== playerIdx) {
            this.sendError(ws, "El origen no es tuyo");
            return;
          }
          if (gameState.territories[msg.to]?.owner === playerIdx) {
            this.sendError(ws, "No puedes atacarte a ti mismo");
            return;
          }
          if (gameState.territories[msg.from].armies <= msg.armies) {
            this.sendError(ws, "No hay suficientes ejércitos");
            return;
          }
          const result = resolveAttack(gameState, msg.from, msg.to, msg.armies);
          if (!result) {
            this.sendError(ws, "Ataque inválido");
            return;
          }
          let conquered = false;
          if (gameState.territories[msg.to].armies <= 0) {
            conquered = true;
            gameState.pendingConquest = { from: msg.from, to: msg.to };
          }
          if (checkVictory(gameState)) {
            gameState.phase = "game_over";
            gameState.winner = playerIdx;
          }
          needPersist = true;
          needBroadcast = true;
          this.broadcastAttackResult({
            code: this.ctx.id.name || "",
            from: msg.from,
            to: msg.to,
            attack: result.attack,
            defense: result.defense,
            attackLosses: result.attackLosses,
            defenseLosses: result.defenseLosses,
            conquered,
          });
          break;
        }

        case "conquer": {
          if (playerIdx !== gameState.turnPlayer) {
            this.sendError(ws, "No es tu turno");
            return;
          }
          if (!gameState.pendingConquest) {
            this.sendError(ws, "No hay conquista pendiente");
            return;
          }
          const { from, to } = gameState.pendingConquest;
          const maxMove = Math.min(3, gameState.territories[from].armies - 1);
          if (msg.armies < 1 || msg.armies > maxMove) {
            this.sendError(ws, `Debes mover entre 1 y ${maxMove} ejércitos`);
            return;
          }
          const success = conquerTerritory(gameState, from, to, msg.armies);
          if (!success) {
            this.sendError(ws, "Conquista inválida");
            return;
          }
          gameState.pendingConquest = null;
          if (checkVictory(gameState)) {
            gameState.phase = "game_over";
            gameState.winner = playerIdx;
          }
          needPersist = true;
          needBroadcast = true;
          break;
        }

        case "attack:intent": {
          const recipients = this.ctx.getWebSockets();
          for (const client of recipients) {
            if (client !== ws) {
              this.sendWs(client, {
                type: "attack:intent",
                from: msg.from,
                to: msg.to,
                color: att.color,
              });
            }
          }
          break;
        }

        case "move": {
          if (playerIdx !== gameState.turnPlayer) {
            this.sendError(ws, "No es tu turno");
            return;
          }
          if (gameState.phase !== "move") {
            this.sendError(ws, "No es fase de movimiento");
            return;
          }
          const moved = moveArmies(gameState, msg.from, msg.to, msg.count);
          if (!moved) {
            this.sendError(ws, "Movimiento inválido");
            return;
          }
          needPersist = true;
          needBroadcast = true;
          break;
        }

        case "end-attacks": {
          if (playerIdx !== gameState.turnPlayer) {
            this.sendError(ws, "No es tu turno");
            return;
          }
          if (gameState.phase !== "attack") {
            this.sendError(ws, "No es fase de ataque");
            return;
          }
          gameState.phase = "move";
          needPersist = true;
          needBroadcast = true;
          break;
        }

        case "end-moves": {
          if (playerIdx !== gameState.turnPlayer) {
            this.sendError(ws, "No es tu turno");
            return;
          }
          if (gameState.phase !== "move") {
            this.sendError(ws, "No es fase de movimiento");
            return;
          }
          if (gameState.conqueredThisTurn) {
            drawCard(gameState);
          }
          endTurn(gameState);
          if (gameState.phase === "game_over") {
            gameState.winner = gameState.turnPlayer;
          }
          needPersist = true;
          needBroadcast = true;
          break;
        }

        default:
          return;
      }

      if (needPersist) {
        this.persistState();
      }

      if (needBroadcast || msg.type === "change-color" || msg.type === "kick") {
        this.broadcastGameState();
      } else if (needPersist) {
        this.sendPlayerState(ws);
      }

      if (gameState.phase === "game_over") {
        await this.recordGameEnd();
        this.scheduleCleanup();
      }
    } catch (e: any) {
      this.sendError(ws, e.message || "Error interno");
    }
  }

  async webSocketClose(ws: WebSocket) {}

  async alarm() {
    await this.ctx.storage.deleteAll();
  }

  private scheduleCleanup() {
    this.ctx.storage.setAlarm(Date.now() + 24 * 3_600_000);
  }

  private handleAuth(ws: WebSocket, msg: AuthMessage) {
    if (!this.gameState) {
      this.sendError(ws, "Juego no encontrado");
      ws.close(4000, "Juego no encontrado");
      return;
    }
    const player = this.gameState.players.find(
      (p) => p.color === msg.color,
    );
    if (!player) {
      this.sendError(ws, "Autenticación inválida");
      ws.close(4000, "Autenticación fallida");
      return;
    }
    ws.serializeAttachment({
      color: msg.color,
      name: msg.name,
      code: msg.code,
    } as PlayerAttachment);
    if (this.gameState.phase === "lobby") {
      this.sendWs(ws, {
        type: "lobby:state",
        players: this.gameState.players.map((p) => ({
          name: p.name,
          color: p.color,
          cardCount: p.cards.length,
        })),
      });
    } else {
      this.sendPlayerState(ws);
    }
  }

  private sendPlayerState(ws: WebSocket) {
    if (!this.gameState) return;
    const att = ws.deserializeAttachment() as PlayerAttachment | null;
    if (!att) return;
    const playerIdx = this.gameState.players.findIndex(
      (p) => p.color === att.color,
    );
    if (playerIdx === -1) return;
    this.sendWs(ws, {
      type: "game:state",
      public: getPublicState(this.gameState, playerIdx),
      secret: getPlayerSecretState(this.gameState, playerIdx),
    });
  }

  private broadcastGameState() {
    if (!this.gameState) return;
    for (const ws of this.ctx.getWebSockets()) {
      this.sendPlayerState(ws);
    }
  }

  private broadcastLobbyState() {
    if (!this.gameState) return;
    const players = this.gameState.players.map((p) => ({
      name: p.name,
      color: p.color,
      cardCount: p.cards.length,
    }));
    for (const ws of this.ctx.getWebSockets()) {
      this.sendWs(ws, { type: "lobby:state", players });
    }
  }

  private persistAndBroadcastLobby() {
    this.persistState();
    this.broadcastLobbyState();
  }

  private broadcastAttackResult(result: {
    code: string;
    from: string;
    to: string;
    attack: number[];
    defense: number[];
    attackLosses: number;
    defenseLosses: number;
    conquered: boolean;
  }) {
    for (const ws of this.ctx.getWebSockets()) {
      this.sendWs(ws, { type: "attack:result", ...result });
    }
  }

  private sendError(ws: WebSocket, message: string) {
    this.sendWs(ws, { type: "error", message });
  }

  private sendWs(ws: WebSocket, data: any) {
    try {
      ws.send(JSON.stringify(data));
    } catch {}
  }

  private persistState() {
    if (!this.gameState) return;
    this.sql.exec(
      "INSERT OR REPLACE INTO game_state (key, value) VALUES ('state', ?)",
      JSON.stringify(this.gameState),
    );
  }

  private async recordGameEnd() {
    if (!this.gameState || this.gameState.winner === null) return;
    const gameCode = this.ctx.id.name;
    if (!gameCode) return;
    const winnerColor = this.gameState.players[this.gameState.winner]?.color;
    const now = new Date().toISOString();
    try {
      await this.env.DB.prepare(
        "UPDATE games SET status = 'finished', winner = ?, finished_at = ?, updated_at = ? WHERE code = ?",
      )
        .bind(winnerColor, now, now, gameCode)
        .run();
    } catch {}
  }
}

function getTimeString(): string {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const mins = String(now.getMinutes()).padStart(2, "0");
  return `${day}/${month} ${hours}:${mins}`;
}
