import { Router, type Request, type Response } from "express";
import { generateCode, loadGame, saveGame } from "../db.js";
import {
  calculateReinforcements,
  checkForcedExchange,
  checkObjective,
  checkVictory,
  conquerTerritory,
  createGame,
  drawCard,
  endTurn,
  exchangeCards,
  getPlayerSecretState,
  getPublicState,
  moveArmies,
  resolveAttack,
  startFirstRound,
} from "../game/engine.js";
import { ALL_COLORS, type Color } from "../game/types.js";
import { TERRITORY_NAMES, CONTINENTS } from "../game/map.js";
import { broadcastGameState, broadcastAttackResult } from "../ws.js";
import { getGameData } from "../game/game-data.js";

const router = Router();
const MAX_PLAYERS = 6;
const MIN_PLAYERS = 3;

router.get("/game-data", (_req: Request, res: Response) => {
  res.json(getGameData());
});

function getTimeString(): string {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const mins = String(now.getMinutes()).padStart(2, "0");
  return `${day}/${month} ${hours}:${mins}`;
}

function saveAndBroadcast(code: string, state: any, status: string) {
  saveGame(code, state, status, MAX_PLAYERS);
  broadcastGameState(code, state);
}

router.post("/games", (req: Request, res: Response) => {
  const { name, color } = req.body;
  if (!name || !color) {
    res.status(400).json({ error: "Nombre y color requeridos" });
    return;
  }
  if (!ALL_COLORS.includes(color)) {
    res.status(400).json({ error: "Color inválido" });
    return;
  }

  let code = generateCode();
  while (loadGame(code)) {
    code = generateCode();
  }

  const initialState = createGame([{ name, color }]);
  saveAndBroadcast(code, initialState, "waiting");

  const token = `${code}:${color}`;
  res.json({ code, token, playerIndex: 0 });
});

router.post("/games/:code/join", (req: Request, res: Response) => {
  const { code } = req.params;
  const { name, color } = req.body;
  if (!name || !color) {
    res.status(400).json({ error: "Nombre y color requeridos" });
    return;
  }

  const state = loadGame(code);
  if (!state) {
    res.status(404).json({ error: "Juego no encontrado" });
    return;
  }

  if (state.phase !== "lobby") {
    res.status(400).json({ error: "El juego ya comenzó. Usa el nombre de jugador que usaste al unirte." });
    return;
  }

  if (state.players.some((p) => p.color === color)) {
    res.status(400).json({ error: "El color ya fue tomado" });
    return;
  }

  if (state.players.length >= MAX_PLAYERS) {
    res.status(400).json({ error: "Juego lleno" });
    return;
  }

  state.players.push({
    name,
    color,
    objective: "" as any,
    objectiveDescription: "",
    cards: [],
    alive: true,
  });
  saveAndBroadcast(code, state, "waiting");

  const token = `${code}:${color}`;
  res.json({ code, token, playerIndex: state.players.length - 1 });
});

router.post("/games/:code/rejoin", (req: Request, res: Response) => {
  const { code } = req.params;
  const { color } = req.body;
  if (!color) {
    res.status(400).json({ error: "Color requerido" });
    return;
  }

  const state = loadGame(code);
  if (!state) {
    res.status(404).json({ error: "Juego no encontrado" });
    return;
  }

  if (state.phase === "lobby") {
    res.status(400).json({ error: "El juego aún no comenzó. Usa la opción Unirse." });
    return;
  }

  const player = state.players.find((p) => p.color === color);
  if (!player) {
    res.status(400).json({ error: "No hay un jugador con ese color en este juego" });
    return;
  }

  if (!player.alive) {
    res.status(400).json({ error: "Este jugador ya fue eliminado" });
    return;
  }

  const token = `${code}:${color}`;
  res.json({ code, token, name: player.name, color: player.color });
});

router.post("/games/:code/change-color", (req: Request, res: Response) => {
  const { code } = req.params;
  const { token, color } = req.body;
  if (!token || !color) {
    res.status(400).json({ error: "Token y color requeridos" });
    return;
  }

  const state = loadGame(code);
  if (!state) {
    res.status(404).json({ error: "Juego no encontrado" });
    return;
  }
  if (state.phase !== "lobby") {
    res.status(400).json({ error: "El juego ya comenzó" });
    return;
  }

  const oldColor = token.split(":")[1];
  const player = state.players.find((p) => p.color === oldColor);
  if (!player) {
    res.status(400).json({ error: "Jugador no encontrado" });
    return;
  }

  if (state.players.some((p) => p.color === color)) {
    res.status(400).json({ error: "Color ya tomado" });
    return;
  }

  player.color = color as any;
  saveAndBroadcast(code, state, "waiting");
  res.json({ success: true, newToken: `${code}:${color}` });
});

router.post("/games/:code/start", (req: Request, res: Response) => {
  const { code } = req.params;
  const { token } = req.body;

  const state = loadGame(code);
  if (!state) {
    res.status(404).json({ error: "Juego no encontrado" });
    return;
  }

  if (!token) {
    res.status(400).json({ error: "Token requerido" });
    return;
  }

  const color = token.split(":")[1];
  if (state.players[0]?.color !== color) {
    res.status(403).json({ error: "Solo el creador puede iniciar el juego" });
    return;
  }

  if (state.players.length < MIN_PLAYERS) {
    res
      .status(400)
      .json({
        error: `Se necesitan al menos ${MIN_PLAYERS} jugadores para iniciar, hay ${state.players.length}`,
      });
    return;
  }

  const fullGame = createGame(
    state.players.map((p) => ({ name: p.name, color: p.color })),
  );
  startFirstRound(fullGame);
  saveAndBroadcast(code, fullGame, "playing");
  res.json({ success: true });
});

router.post("/games/:code/kick", (req: Request, res: Response) => {
  const { code } = req.params;
  const { token, targetColor } = req.body;

  const state = loadGame(code);
  if (!state) {
    res.status(404).json({ error: "Juego no encontrado" });
    return;
  }

  if (state.phase !== "lobby") {
    res.status(400).json({ error: "Solo se puede expulsar jugadores en la sala de espera" });
    return;
  }

  if (!token || !targetColor) {
    res.status(400).json({ error: "Token y color requeridos" });
    return;
  }

  const color = token.split(":")[1];
  if (state.players[0]?.color !== color) {
    res.status(403).json({ error: "Solo el anfitrión puede expulsar jugadores" });
    return;
  }

  if (color === targetColor) {
    res.status(400).json({ error: "No puedes expulsarte a ti mismo" });
    return;
  }

  const targetIdx = state.players.findIndex((p) => p.color === targetColor);
  if (targetIdx === -1) {
    res.status(400).json({ error: "Jugador no encontrado" });
    return;
  }

  state.players.splice(targetIdx, 1);
  saveAndBroadcast(code, state, "waiting");
  res.json({ success: true });
});

router.get("/games/:code", (req: Request, res: Response) => {
  const { code } = req.params;
  const token = req.query.token as string;
  if (!token) {
    res.status(400).json({ error: "Token requerido" });
    return;
  }

  const state = loadGame(code);
  if (!state) {
    res.status(404).json({ error: "Juego no encontrado" });
    return;
  }

  const playerIdx = state.players.findIndex(
    (p) => p.color === token.split(":")[1],
  );
  if (playerIdx === -1) {
    res.status(403).json({ error: "Token inválido" });
    return;
  }
  res.json({
    public: getPublicState(state, playerIdx),
    secret: getPlayerSecretState(state, playerIdx),
  });
});

router.post("/games/:code/exchange", (req: Request, res: Response) => {
  const { code } = req.params;
  const { token, cardIds } = req.body;

  const state = loadGame(code);
  if (!state) {
    res.status(404).json({ error: "Juego no encontrado" });
    return;
  }

  const playerIdx = state.players.findIndex(
    (p) => p.color === token.split(":")[1],
  );
  if (playerIdx === -1 || playerIdx !== state.turnPlayer) {
    res.status(400).json({ error: "No es tu turno" });
    return;
  }

  if (state.phase !== "receive") {
    res.status(400).json({ error: "Solo se puede canjear durante la fase de recepción" });
    return;
  }

  const result = exchangeCards(state, cardIds);
  if (result === null) {
    res.status(400).json({ error: "Canje inválido" });
    return;
  }

  state.pendingArmies += result;
  saveAndBroadcast(code, state, "playing");
  res.json({ armiesReceived: result, pendingArmies: state.pendingArmies });
});

router.post("/games/:code/place-armies", (req: Request, res: Response) => {
  const { code } = req.params;
  const { token, placements } = req.body;

  const state = loadGame(code);
  if (!state) {
    res.status(404).json({ error: "Juego no encontrado" });
    return;
  }

  const playerIdx = state.players.findIndex(
    (p) => p.color === token.split(":")[1],
  );
  if (playerIdx === -1 || playerIdx !== state.turnPlayer) {
    res.status(400).json({ error: "No es tu turno" });
    return;
  }

  if (state.phase !== "receive" && state.phase !== "place") {
    res.status(400).json({ error: "No estás en fase de colocación" });
    return;
  }

  if (state.forcedExchange) {
    res
      .status(400)
      .json({ error: "Debes canjear cartas primero (5 o más cartas)" });
    return;
  }

  const continentBonuses = state.continentBonuses || {};
  const playerTerritories = Object.entries(state.territories)
    .filter(([_, t]) => t.owner === playerIdx)
    .map(([id]) => id);

  let totalPlaced = 0;
  for (const [territory, count] of Object.entries(
    placements as Record<string, number>,
  )) {
    if (!playerTerritories.includes(territory)) {
      res.status(400).json({ error: `No posees ${territory}` });
      return;
    }
    if (typeof count !== "number" || count <= 0) continue;
    totalPlaced += count;
    state.territories[territory].armies += count;
  }

  if (totalPlaced !== state.pendingArmies) {
    res
      .status(400)
      .json({
        error: `Debes colocar exactamente ${state.pendingArmies} ejércitos, colocaste ${totalPlaced}`,
      });
    return;
  }

  for (const [continentKey, bonus] of Object.entries(state.continentBonuses || {})) {
    const continent = CONTINENTS[continentKey as keyof typeof CONTINENTS];
    if (!continent) continue;
    let placedInContinent = 0;
    for (const territory of continent.territories) {
      if (placements[territory]) {
        placedInContinent += placements[territory];
      }
    }
    if (placedInContinent < bonus) {
      res.status(400).json({
        error: `Debes colocar al menos ${bonus} ejércitos en ${continent.name} (colocaste ${placedInContinent})`,
      });
      return;
    }
  }

  const p = state.players[playerIdx];
  state.log.push({ time: getTimeString(), message: `${p.name} colocó ${totalPlaced} ejércitos` });

  if (state.round === 1) {
    state.phase = "receive";
    endTurn(state);
  } else {
    state.phase = "attack";
  }

  saveAndBroadcast(code, state, "playing");
  res.json({ success: true, phase: state.phase });
});

router.post("/games/:code/attack", (req: Request, res: Response) => {
  const { code } = req.params;
  const { token, from, to, armies } = req.body;

  const state = loadGame(code);
  if (!state) {
    res.status(404).json({ error: "Juego no encontrado" });
    return;
  }

  const playerIdx = state.players.findIndex(
    (p) => p.color === token.split(":")[1],
  );
  if (playerIdx === -1 || playerIdx !== state.turnPlayer) {
    res.status(400).json({ error: "No es tu turno" });
    return;
  }

  if (state.phase !== "attack") {
    res.status(400).json({ error: "No estás en fase de ataque" });
    return;
  }

  if (!from || !to || !armies || armies < 1 || armies > 3) {
    res.status(400).json({ error: "Parámetros de ataque inválidos" });
    return;
  }

  if (state.territories[from]?.owner !== playerIdx) {
    res.status(400).json({ error: "El territorio de origen no es tuyo" });
    return;
  }

  if (state.territories[to]?.owner === playerIdx) {
    res.status(400).json({ error: "No puedes atacarte a ti mismo" });
    return;
  }

  if (state.territories[from].armies <= armies) {
    res.status(400).json({ error: "No tienes suficientes ejércitos (necesitas 1 para ocupar)" });
    return;
  }

  const result = resolveAttack(state, from, to, armies);
  if (!result) {
    res.status(400).json({ error: "Ataque inválido" });
    return;
  }

  let conquered = false;
  if (state.territories[to].armies <= 0) {
    conquered = true;
    state.pendingConquest = { from, to };
  }

  const p = state.players[playerIdx];
  const defender = state.players[state.territories[to].owner];
  state.log.push({
    time: getTimeString(),
    message: `${p.name} atacó ${TERRITORY_NAMES[to]} desde ${TERRITORY_NAMES[from]} — Ataque: [${result.attack.join(', ')}] Defensa: [${result.defense.join(', ')}] — Bajas: ${result.attackLosses}/${result.defenseLosses}${conquered ? ' (conquistado)' : ''}`,
  });

  if (checkVictory(state)) {
    state.phase = "game_over";
    state.winner = playerIdx;
  }

  const status = state.phase === "game_over" ? "finished" : "playing";
  saveAndBroadcast(code, state, status);
  broadcastAttackResult(code, {
    from, to,
    attack: result.attack,
    defense: result.defense,
    attackLosses: result.attackLosses,
    defenseLosses: result.defenseLosses,
    conquered,
  });
  res.json({ ...result, conquered, phase: state.phase });
});

router.post("/games/:code/conquer", (req: Request, res: Response) => {
  const { code } = req.params;
  const { token, armies } = req.body;

  const state = loadGame(code);
  if (!state) {
    res.status(404).json({ error: "Juego no encontrado" });
    return;
  }

  const playerIdx = state.players.findIndex(
    (p) => p.color === token.split(":")[1],
  );
  if (playerIdx === -1 || playerIdx !== state.turnPlayer) {
    res.status(400).json({ error: "No es tu turno" });
    return;
  }

  if (!state.pendingConquest) {
    res.status(400).json({ error: "No hay conquista pendiente" });
    return;
  }

  const { from, to } = state.pendingConquest;

  if (state.territories[to].armies !== 0) {
    res.status(400).json({ error: "El territorio aún tiene defensores" });
    return;
  }

  const maxMove = Math.min(3, state.territories[from].armies - 1);
  if (armies < 1 || armies > maxMove) {
    res.status(400).json({ error: `Debes mover entre 1 y ${maxMove} ejércitos` });
    return;
  }

  const success = conquerTerritory(state, from, to, armies);
  if (!success) {
    res.status(400).json({ error: "Movimiento de conquista inválido" });
    return;
  }

  state.pendingConquest = null;

  if (checkVictory(state)) {
    state.phase = "game_over";
    state.winner = playerIdx;
  }

  const status = state.phase === "game_over" ? "finished" : "playing";
  saveAndBroadcast(code, state, status);
  res.json({ success: true, phase: state.phase });
});

router.post("/games/:code/move", (req: Request, res: Response) => {
  const { code } = req.params;
  const { token, from, to, count } = req.body;

  const state = loadGame(code);
  if (!state) {
    res.status(404).json({ error: "Juego no encontrado" });
    return;
  }

  const playerIdx = state.players.findIndex(
    (p) => p.color === token.split(":")[1],
  );
  if (playerIdx === -1 || playerIdx !== state.turnPlayer) {
    res.status(400).json({ error: "No es tu turno" });
    return;
  }

  if (state.phase !== "move") {
    res.status(400).json({ error: "No estás en fase de movimiento" });
    return;
  }

  const success = moveArmies(state, from, to, count);
  if (!success) {
    res.status(400).json({ error: "Movimiento inválido" });
    return;
  }

  saveAndBroadcast(code, state, "playing");
  res.json({ success: true });
});

router.post("/games/:code/end-attacks", (req: Request, res: Response) => {
  const { code } = req.params;
  const { token } = req.body;

  const state = loadGame(code);
  if (!state) {
    res.status(404).json({ error: "Juego no encontrado" });
    return;
  }

  const playerIdx = state.players.findIndex(
    (p) => p.color === token.split(":")[1],
  );
  if (playerIdx === -1 || playerIdx !== state.turnPlayer) {
    res.status(400).json({ error: "No es tu turno" });
    return;
  }

  if (state.phase !== "attack") {
    res.status(400).json({ error: "No estás en fase de ataque" });
    return;
  }

  state.phase = "move";
  saveAndBroadcast(code, state, "playing");
  res.json({ success: true });
});

router.post("/games/:code/end-moves", (req: Request, res: Response) => {
  const { code } = req.params;
  const { token } = req.body;

  const state = loadGame(code);
  if (!state) {
    res.status(404).json({ error: "Juego no encontrado" });
    return;
  }

  const playerIdx = state.players.findIndex(
    (p) => p.color === token.split(":")[1],
  );
  if (playerIdx === -1 || playerIdx !== state.turnPlayer) {
    res.status(400).json({ error: "No es tu turno" });
    return;
  }

  if (state.phase !== "move") {
    res.status(400).json({ error: "No estás en fase de movimiento" });
    return;
  }

  if (state.conqueredThisTurn) {
    drawCard(state);
  }

  endTurn(state);
  const status = state.phase === "game_over" ? "finished" : "playing";
  saveAndBroadcast(code, state, status);
  res.json({ success: true, phase: state.phase });
});

export default router;
