import type { Card } from './cards.js';
import type { ObjectiveType } from './objectives.js';

export type Color = 'white' | 'red' | 'black' | 'blue' | 'yellow' | 'green';
export type GamePhase = 'lobby' | 'first_round' | 'receive' | 'place' | 'attack' | 'move' | 'game_over';
export type GameStatus = 'waiting' | 'playing' | 'finished';

export const ALL_COLORS: Color[] = ['white', 'red', 'black', 'blue', 'yellow', 'green'];

export interface TerritoryState {
  owner: number;       // player index
  armies: number;
}

export interface PlayerState {
  name: string;
  color: Color;
  objective: ObjectiveType;
  objectiveDescription: string;
  objectiveTargetColor?: string;
  cards: Card[];
  alive: boolean;
  eliminatedBy?: number;
}

export interface GameState {
  players: PlayerState[];
  territories: Record<string, TerritoryState>;
  deck: Card[];
  discard: Card[];
  exchangeCounter: number;
  turnPlayer: number;
  round: number;
  roundStartPlayer: number;
  phase: GamePhase;
  conqueredThisTurn: boolean;
  pendingArmies: number;        // armies to place
  continentBonuses: Record<string, number>; // continent -> bonus armies
  forcedExchange: boolean;      // player has 5+ cards, must exchange
  winner: number | null;
  log: LogEntry[];
  pendingConquest: { from: string; to: string } | null;
}

export interface LogEntry {
  time: string;
  message: string;
}

export interface DiceResult {
  attack: number[];
  defense: number[];
  attackLosses: number;
  defenseLosses: number;
}

export const EXCHANGE_TABLE: Record<number, number> = {
  1: 4,
  2: 6,
  3: 8,
  4: 10,
  5: 12,
  6: 15,
  7: 20,
};

export function getExchangeArmies(counter: number): number {
  if (counter <= 7) return EXCHANGE_TABLE[counter] ?? 20;
  return 20 + (counter - 7) * 5;
}
