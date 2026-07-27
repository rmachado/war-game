export type Color = "white" | "red" | "black" | "blue" | "yellow" | "green";
export type GamePhase =
  | "lobby"
  | "first_round"
  | "receive"
  | "place"
  | "attack"
  | "move"
  | "game_over";
export type CardSymbol = "triangulo" | "cuadrado" | "circulo" | "joker";

export const COLOR_MAP: Record<Color, string> = {
  white: "#f0f0f0",
  red: "#d1522e",
  black: "#333333",
  blue: "#2563eb",
  yellow: "#eab308",
  green: "#16a34a",
};

export const COLOR_NAMES: Record<Color, string> = {
  white: "Blanco",
  red: "Rojo",
  black: "Negro",
  blue: "Azul",
  yellow: "Amarillo",
  green: "Verde",
};

export const ALL_COLORS: Color[] = [
  "white", "red", "black", "blue", "yellow", "green",
];

export interface TerritoryState {
  owner: number;
  armies: number;
}

export interface PlayerPublic {
  name: string;
  color: Color;
  alive: boolean;
  cardCount: number;
  isCurrentPlayer: boolean;
}

export interface GamePublic {
  players: PlayerPublic[];
  territories: Record<string, TerritoryState>;
  turnPlayer: number;
  round: number;
  phase: GamePhase;
  exchangeCounter: number;
  winner: number | null;
  playerCount: number;
  log: LogEntry[];
  pendingConquest: { from: string; to: string } | null;
  winnerObjective: string | null;
}

export interface LogEntry {
  time: string;
  message: string;
}

export interface Card {
  id: string;
  symbol: CardSymbol;
}

export interface GameSecret {
  name: string;
  color: Color;
  objective: string;
  objectiveDescription: string;
  objectiveTargetColor?: string;
  cards: Card[];
  pendingArmies: number;
  continentBonuses: Record<string, number>;
  forcedExchange: boolean;
  conqueredThisTurn: boolean;
}

export interface GameStateResponse {
  public: GamePublic;
  secret: GameSecret;
}
