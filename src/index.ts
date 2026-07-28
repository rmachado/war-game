import { Hono } from "hono";
import { getGameData } from "./game/game-data.js";
import { GameRoom } from "./room.js";
import type { Color } from "./game/types.js";

export { GameRoom };

interface Env {
  DB: D1Database;
  ROOM: DurableObjectNamespace<GameRoom>;
}

const app = new Hono<{ Bindings: Env }>();

app.post("/api/games", async (c) => {
  const { name, color } = await c.req.json();
  if (!name || !color) {
    return c.json({ error: "Name and color required" }, 400);
  }

  const code = generateCode();
  const existing = await c.env.DB.prepare("SELECT code FROM games WHERE code = ?")
    .bind(code)
    .first();
  if (existing) {
    return c.json({ error: "Try again" }, 500);
  }

  const id = c.env.ROOM.idFromName(code);
  const stub = c.env.ROOM.get(id);
  const result = await stub.fetch(new Request("http://fake/init", {
    method: "POST",
    body: JSON.stringify({ name, color }),
  }));
  if (!result.ok) {
    const err = await result.json();
    return c.json(err, 409);
  }

  const now = new Date().toISOString();
  await c.env.DB.prepare(
    "INSERT INTO games (code, player_count, status, created_at, updated_at) VALUES (?, 1, 'waiting', ?, ?)"
  )
    .bind(code, now, now)
    .run();

  const token = `${code}:${color}`;
  return c.json({ code, token, playerIndex: 0 });
});

app.post("/api/games/:code/join", async (c) => {
  const { code } = c.req.param();
  const { name, color } = await c.req.json();
  if (!name || !color) {
    return c.json({ error: "Name and color required" }, 400);
  }

  const id = c.env.ROOM.idFromName(code);
  const stub = c.env.ROOM.get(id);
  const result = await stub.fetch(new Request("http://fake/join", {
    method: "POST",
    body: JSON.stringify({ name, color }),
  }));
  if (!result.ok) {
    const err = await result.json();
    return c.json(err, result.status);
  }

  const now = new Date().toISOString();
  await c.env.DB.prepare(
    "UPDATE games SET player_count = player_count + 1, updated_at = ? WHERE code = ?"
  )
    .bind(now, code)
    .run();

  const token = `${code}:${color}`;
  return c.json({ code, token });
});

app.get("/api/games/:code/rejoin", async (c) => {
  const { code } = c.req.param();
  const color = c.req.query("color");
  const name = c.req.query("name");
  if (!color || !name) {
    return c.json({ error: "Color and name required" }, 400);
  }

  const id = c.env.ROOM.idFromName(code);
  const stub = c.env.ROOM.get(id);
  const result = await stub.fetch(new Request(`http://fake/rejoin?color=${encodeURIComponent(color)}&name=${encodeURIComponent(name)}`));
  if (!result.ok) {
    const err = await result.json();
    return c.json(err, result.status);
  }

  const data = await result.json();
  const token = `${code}:${color}`;
  return c.json({ code, token, name: data.name });
});

app.get("/api/game-data", (c) => {
  const data = getGameData();
  return c.json(data);
});

app.get("/ws", async (c) => {
  const code = c.req.query("code");
  const token = c.req.query("token");
  if (!code || !token) {
    return c.text("Missing code or token", 400);
  }
  const id = c.env.ROOM.idFromName(code);
  const stub = c.env.ROOM.get(id);
  return stub.fetch(c.req.raw);
});

export default app;

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
