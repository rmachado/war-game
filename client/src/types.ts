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
  "white",
  "red",
  "black",
  "blue",
  "yellow",
  "green",
];

export const TERRITORY_NAMES: Record<string, string> = {
  alaska: "Alaska",
  california: "California",
  groenlandia: "Groenlandia",
  labrador: "Labrador",
  mackenzie: "Mackenzie",
  mexico: "México",
  nuevayork: "Nueva York",
  ottawa: "Ottawa",
  vancouver: "Vancouver",
  argentina: "Argentina / Uruguay",
  brasil: "Brasil",
  peru: "Chile",
  colombia: "Colombia / Venezuela",
  alemania: "Alemania",
  inglaterra: "Inglaterra",
  islandia: "Islandia",
  moscu: "Moscú",
  yugoslavia: "Polonia / Yugoslavia",
  francia: "Portugal / España",
  suecia: "Suecia",
  sudafrica: "África del Sur",
  argelia: "Argelia",
  congo: "Congo",
  egipto: "Egipto",
  madagascar: "Madagascar",
  sudan: "Sudán",
  aral: "Aral",
  china: "China",
  chita: "Chita",
  dudinka: "Dudinka",
  india: "India",
  japon: "Japón",
  mediooriente: "Medio Oriente",
  mongolia: "Mongolia",
  omsk: "Omsk",
  siberia: "Siberia",
  vietnam: "Vietnam",
  vladivostok: "Vladivostok",
  australia: "Australia",
  borneo: "Borneo",
  nuevaguinea: "Nueva Guinea",
  sumatra: "Sumatra",
};

export const CONTINENT_TERRITORIES: Record<string, string[]> = {
  "América del Norte": [
    "alaska",
    "california",
    "groenlandia",
    "labrador",
    "mackenzie",
    "mexico",
    "nuevayork",
    "ottawa",
    "vancouver",
  ],
  "América del Sur": ["argentina", "brasil", "peru", "colombia"],
  Europa: [
    "alemania",
    "inglaterra",
    "islandia",
    "moscu",
    "yugoslavia",
    "francia",
    "suecia",
  ],
  África: ["sudafrica", "argelia", "congo", "egipto", "madagascar", "sudan"],
  Asia: [
    "aral",
    "china",
    "chita",
    "dudinka",
    "india",
    "japon",
    "mediooriente",
    "mongolia",
    "omsk",
    "siberia",
    "vietnam",
    "vladivostok",
  ],
  Oceanía: ["australia", "borneo", "nuevaguinea", "sumatra"],
};

export const ADJACENCY: Record<string, string[]> = {
  alaska: ["mackenzie", "vancouver", "vladivostok"],
  mackenzie: ["alaska", "vancouver", "ottawa", "groenlandia"],
  vancouver: ["alaska", "mackenzie", "ottawa", "california"],
  ottawa: ["mackenzie", "vancouver", "california", "nuevayork", "labrador"],
  labrador: ["ottawa", "nuevayork", "groenlandia"],
  california: ["vancouver", "ottawa", "nuevayork", "mexico"],
  nuevayork: ["ottawa", "labrador", "california", "mexico"],
  mexico: ["california", "nuevayork", "colombia"],
  groenlandia: ["mackenzie", "labrador", "islandia"],
  colombia: ["mexico", "brasil", "peru"],
  brasil: ["colombia", "peru", "argentina", "argelia"],
  peru: ["colombia", "brasil", "argentina"],
  argentina: ["peru", "brasil"],
  islandia: ["groenlandia", "inglaterra"],
  inglaterra: ["islandia", "suecia", "alemania"],
  suecia: ["inglaterra", "moscu"],
  alemania: ["inglaterra", "francia", "yugoslavia", "argelia"],
  francia: ["alemania", "argelia"],
  yugoslavia: ["alemania", "moscu", "egipto"],
  moscu: ["suecia", "yugoslavia", "mediooriente", "aral", "omsk"],
  argelia: ["francia", "alemania", "brasil", "egipto", "sudan", "congo"],
  egipto: ["argelia", "sudan", "mediooriente", "yugoslavia"],
  sudan: ["egipto", "argelia", "congo", "sudafrica"],
  congo: ["argelia", "sudan", "sudafrica"],
  sudafrica: ["congo", "sudan", "madagascar"],
  madagascar: ["sudafrica"],
  mediooriente: ["moscu", "aral", "india", "egipto"],
  aral: ["moscu", "omsk", "china", "india", "mediooriente"],
  omsk: ["moscu", "dudinka", "siberia", "china", "aral"],
  dudinka: ["omsk", "siberia"],
  siberia: ["dudinka", "omsk", "china", "chita"],
  chita: ["siberia", "china", "mongolia", "vladivostok"],
  vladivostok: ["chita", "mongolia", "china", "alaska", "japon"],
  mongolia: ["chita", "vladivostok", "china"],
  china: [
    "aral",
    "omsk",
    "siberia",
    "chita",
    "mongolia",
    "vladivostok",
    "vietnam",
    "india",
  ],
  india: ["mediooriente", "aral", "china", "vietnam", "sumatra"],
  vietnam: ["india", "china", "borneo"],
  japon: ["vladivostok"],
  sumatra: ["india", "australia"],
  borneo: ["vietnam", "nuevaguinea", "australia"],
  nuevaguinea: ["borneo", "australia"],
  australia: ["sumatra", "borneo", "nuevaguinea"],
};

export const TABLE_I: string[][] = [
  ["1er Canje", "4 ejércitos"],
  ["2do Canje", "6 ejércitos"],
  ["3er Canje", "8 ejércitos"],
  ["4to Canje", "10 ejércitos"],
  ["5to Canje", "12 ejércitos"],
  ["6to Canje", "15 ejércitos"],
  ["7mo Canje", "20 ejércitos"],
  ["Sucesivamente", "25, 30, 35, 40..."],
];

export const TABLE_II: { continent: string; bonus: number }[] = [
  { continent: "Oceanía", bonus: 2 },
  { continent: "América del Sur", bonus: 2 },
  { continent: "África", bonus: 3 },
  { continent: "Europa", bonus: 5 },
  { continent: "América del Norte", bonus: 5 },
  { continent: "Asia", bonus: 7 },
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
