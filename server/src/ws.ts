import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";
import type { GameState } from "./game/types.js";
import { getPublicState, getPlayerSecretState } from "./game/engine.js";

interface Client {
  ws: WebSocket;
  code: string;
  color: string;
}

const rooms = new Map<string, Client[]>();

let wss: WebSocketServer;

export function createWSServer(server: Server) {
  wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (ws) => {
    let client: Client | null = null;

    ws.on("message", (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.type === "auth") {
          client = { ws, code: msg.code, color: msg.color };
          const room = rooms.get(msg.code) || [];
          room.push(client);
          rooms.set(msg.code, room);
          ws.send(JSON.stringify({ type: "auth:ok" }));
        } else if (msg.type === "attack:intent" && client) {
          broadcastAttackIntent(
            client.code,
            msg.from ?? null,
            msg.to ?? null,
            client.color,
          );
        }
      } catch {}
    });

    ws.on("close", () => {
      if (client) {
        const room = rooms.get(client.code);
        if (room) {
          const idx = room.indexOf(client);
          if (idx !== -1) room.splice(idx, 1);
          if (room.length === 0) rooms.delete(client.code);
        }
      }
    });
  });

  return wss;
}

export function broadcastGameState(code: string, state: GameState) {
  const room = rooms.get(code);
  if (!room) return;

  const msg = JSON.stringify({ type: "game:state", state });

  for (const client of room) {
    if (client.ws.readyState === WebSocket.OPEN) {
      const playerIdx = state.players.findIndex(
        (p) => p.color === client.color,
      );
      if (playerIdx === -1) continue;
      client.ws.send(
        JSON.stringify({
          type: "game:state",
          public: getPublicState(state, playerIdx),
          secret: getPlayerSecretState(state, playerIdx),
        }),
      );
    }
  }
}

export function broadcastAttackIntent(
  code: string,
  from: string | null,
  to: string | null,
  senderColor?: string,
) {
  const room = rooms.get(code);
  if (!room) return;

  const msg = JSON.stringify({
    type: "attack:intent",
    from,
    to,
    color: senderColor,
  });

  for (const client of room) {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(msg);
    }
  }
}

export function broadcastAttackResult(
  code: string,
  result: { from: string; to: string; attack: number[]; defense: number[]; attackLosses: number; defenseLosses: number; conquered: boolean },
) {
  const room = rooms.get(code);
  if (!room) return;

  const msg = JSON.stringify({ type: "attack:result", ...result });

  for (const client of room) {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(msg);
    }
  }
}
