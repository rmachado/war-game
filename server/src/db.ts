import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import type { GameState } from "../game/types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_DIR = path.resolve(__dirname, "../../data");
const DB_PATH = path.resolve(DB_DIR, "war.db");

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.exec(`
      CREATE TABLE IF NOT EXISTS games (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        player_count INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'waiting',
        state TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
      )
    `);
  }
  return db;
}

export function loadGame(code: string): GameState | null {
  const db = getDb();
  const row = db.prepare("SELECT state FROM games WHERE code = ?").get(code) as
    | { state: string }
    | undefined;
  if (!row) return null;
  return JSON.parse(row.state);
}

export function saveGame(
  code: string,
  state: GameState,
  status: string,
  playerCount: number,
) {
  const db = getDb();
  const stateJson = JSON.stringify(state);
  const existing = db.prepare("SELECT id FROM games WHERE code = ?").get(code);
  if (existing) {
    const now = new Date().toISOString();
    db.prepare(
      "UPDATE games SET state = ?, status = ?, updated_at = ? WHERE code = ?",
    ).run(stateJson, status, now, code);
  } else {
    const now = new Date().toISOString();
    db.prepare(
      "INSERT INTO games (code, player_count, status, state, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
    ).run(code, playerCount, status, stateJson, now, now);
  }
}

export function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function closeDb() {
  if (db) {
    db.close();
    db = undefined as any;
  }
}
