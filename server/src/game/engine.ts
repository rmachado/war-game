import type { Card, JokerCard, TerritoryCard } from "./cards.js";
import {
  createShuffledDeck,
  createTerritoryOnlyDeck,
  isJokerCard,
} from "./cards.js";
import {
  ALL_TERRITORIES,
  ADJACENCY,
  CONTINENTS,
  TERRITORY_NAMES,
} from "./map.js";
import { type ObjectiveType, OBJECTIVES } from "./objectives.js";
import type {
  Color,
  DiceResult,
  GameState,
  LogEntry,
  PlayerState,
  TerritoryState,
} from "./types.js";
import { getExchangeArmies } from "./types.js";

function logEvent(state: GameState, message: string) {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const mins = String(now.getMinutes()).padStart(2, "0");
  state.log.push({
    time: `${day}/${month} ${hours}:${mins}`,
    message,
  });
}

export function createGame(
  players: { name: string; color: Color }[],
): GameState {
  const territoryDeck = createTerritoryOnlyDeck();
  const numPlayers = players.length;

  const availableObjectives = getAvailableObjectives(
    players.map((p) => p.color),
  );
  const shuffledObjectives = [...availableObjectives];
  for (let i = shuffledObjectives.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledObjectives[i], shuffledObjectives[j]] = [
      shuffledObjectives[j],
      shuffledObjectives[i],
    ];
  }

  const shuffledPlayers = players.map((p, i) => ({
    name: p.name,
    color: p.color,
    objective: shuffledObjectives[i].type,
    objectiveDescription: shuffledObjectives[i].description,
    objectiveTargetColor: shuffledObjectives[i].targetColor,
    cards: [] as Card[],
    alive: true,
  }));

  for (let i = shuffledPlayers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledPlayers[i], shuffledPlayers[j]] = [
      shuffledPlayers[j],
      shuffledPlayers[i],
    ];
  }

  const territoryCards: Record<number, string[]> = {};
  for (let i = 0; i < numPlayers; i++) territoryCards[i] = [];

  for (let i = 0; i < territoryDeck.length; i++) {
    const pIdx = i % numPlayers;
    territoryCards[pIdx].push(territoryDeck[i].id);
  }

  const territories: Record<string, TerritoryState> = {};
  for (const t of ALL_TERRITORIES) {
    territories[t] = { owner: -1, armies: 0 };
  }

  for (let i = 0; i < numPlayers; i++) {
    for (const territoryId of territoryCards[i]) {
      territories[territoryId] = { owner: i, armies: 1 };
    }
  }

  const deck = createShuffledDeck();

  return {
    players: shuffledPlayers,
    territories,
    deck,
    discard: [],
    exchangeCounter: 0,
    turnPlayer: 0,
    round: 1,
    roundStartPlayer: 0,
    phase: "lobby",
    conqueredThisTurn: false,
    pendingArmies: 0,
    continentBonuses: {},
    forcedExchange: false,
    winner: null,
    log: [],
    pendingConquest: null,
  };
}

function getAvailableObjectives(colors: Color[]) {
  return OBJECTIVES.filter((obj) => {
    if (obj.targetColor && !colors.includes(obj.targetColor as Color)) {
      return false;
    }
    return true;
  });
}

export function startFirstRound(state: GameState) {
  const p = state.players[state.turnPlayer];
  const { total, continentBonuses } = calculateReinforcements(
    state,
    state.turnPlayer,
  );
  state.pendingArmies = total;
  state.continentBonuses = continentBonuses;
  state.phase = "receive";
  logEvent(
    state,
    `Turno de ${p.name} — Ronda ${state.round} — Recibe ${total} ejércitos`,
  );
}

export function calculateReinforcements(
  state: GameState,
  playerIdx: number,
): { total: number; continentBonuses: Record<string, number> } {
  const territoryCount = countTerritories(state, playerIdx);
  const baseArmies = Math.max(3, Math.floor(territoryCount / 2));

  const continentBonuses: Record<string, number> = {};
  let bonusTotal = 0;

  for (const [key, continent] of Object.entries(CONTINENTS)) {
    if (ownsContinent(state, playerIdx, key)) {
      continentBonuses[key] = continent.bonus;
      bonusTotal += continent.bonus;
    }
  }

  return { total: baseArmies + bonusTotal, continentBonuses };
}

export function countTerritories(state: GameState, playerIdx: number): number {
  let count = 0;
  for (const t of Object.values(state.territories)) {
    if (t.owner === playerIdx) count++;
  }
  return count;
}

function ownsContinent(
  state: GameState,
  playerIdx: number,
  continentKey: string,
): boolean {
  const continent = CONTINENTS[continentKey as keyof typeof CONTINENTS];
  if (!continent) return false;
  return continent.territories.every(
    (t) => state.territories[t].owner === playerIdx,
  );
}

export function exchangeCards(
  state: GameState,
  cardIds: string[],
): number | null {
  const player = state.players[state.turnPlayer];
  if (cardIds.length !== 3) return null;

  const cardsToExchange = cardIds
    .map((id) => player.cards.find((c) => c.id === id))
    .filter(Boolean) as Card[];
  if (cardsToExchange.length !== 3) return null;

  if (!isValidExchange(cardsToExchange)) return null;

  for (const id of cardIds) {
    const idx = player.cards.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    player.cards.splice(idx, 1);
  }

  state.discard.push(...cardsToExchange);
  const counter = state.exchangeCounter + 1;
  state.exchangeCounter = counter;
  const armies = getExchangeArmies(counter);

  let bonusArmies = 0;
  for (const card of cardsToExchange) {
    if (
      !isJokerCard(card) &&
      state.territories[card.id]?.owner === state.turnPlayer
    ) {
      bonusArmies += 2;
    }
  }

  state.forcedExchange = player.cards.length >= 5;
  const totalArmies = armies + bonusArmies;
  logEvent(
    state,
    `${player.name} canjeó 3 cartas y recibió ${totalArmies} ejércitos`,
  );
  return totalArmies;
}

export function checkForcedExchange(state: GameState): boolean {
  const player = state.players[state.turnPlayer];
  return player.cards.length >= 5;
}

function isValidExchange(cards: Card[]): boolean {
  if (cards.length !== 3) return false;

  const jokers = cards.filter((c) => c.symbol === "joker");
  const nonJokers = cards.filter((c) => c.symbol !== "joker");

  if (nonJokers.length === 0) return false;

  if (jokers.length === 2) return true;

  const symbols = nonJokers.map((c) => (c as TerritoryCard).symbol);

  if (jokers.length === 1) {
    if (symbols.length !== 2) return false;
    return true;
  }

  const allSame = symbols.every((s) => s === symbols[0]);
  const allDifferent = new Set(symbols).size === symbols.length;
  return allSame || allDifferent;
}

export function resolveAttack(
  state: GameState,
  from: string,
  to: string,
  attackingArmies: number,
): DiceResult | null {
  const defArmies = state.territories[to]?.armies ?? 0;
  const atkTerritory = state.territories[from];
  if (!atkTerritory || atkTerritory.armies < attackingArmies + 1) return null;
  if (attackingArmies < 1 || attackingArmies > 3) return null;

  const atkDice = Math.min(attackingArmies, 3);
  const defDice = Math.min(defArmies, 3);

  const attackRolls: number[] = [];
  for (let i = 0; i < atkDice; i++) {
    attackRolls.push(rollDie());
  }
  attackRolls.sort((a, b) => b - a);

  const defenseRolls: number[] = [];
  for (let i = 0; i < defDice; i++) {
    defenseRolls.push(rollDie());
  }
  defenseRolls.sort((a, b) => b - a);

  const comparisons = Math.min(atkDice, defDice);
  let atkLosses = 0;
  let defLosses = 0;

  for (let i = 0; i < comparisons; i++) {
    if (attackRolls[i] > defenseRolls[i]) {
      defLosses++;
    } else {
      atkLosses++;
    }
  }

  state.territories[from].armies -= atkLosses;
  state.territories[to].armies -= defLosses;

  if (state.territories[to].armies <= 0) {
    state.territories[to].armies = 0;
  }

  return {
    attack: attackRolls,
    defense: defenseRolls,
    attackLosses: atkLosses,
    defenseLosses: defLosses,
  };
}

function rollDie(): number {
  return Math.floor(Math.random() * 6) + 1;
}

export function conquerTerritory(
  state: GameState,
  from: string,
  to: string,
  moveArmies: number,
): boolean {
  if (state.territories[to].armies > 0) return false;
  if (state.territories[from].armies < moveArmies + 1) return false;
  if (moveArmies < 1) return false;

  const defOwner = state.territories[to].owner;
  state.territories[to].owner = state.turnPlayer;
  state.territories[to].armies = moveArmies;
  state.territories[from].armies -= moveArmies;
  state.conqueredThisTurn = true;

  const atkPlayer = state.players[state.turnPlayer];
  logEvent(
    state,
    `${atkPlayer.name} conquistó ${TERRITORY_NAMES[to]} desde ${TERRITORY_NAMES[from]}`,
  );

  if (defOwner >= 0 && countTerritories(state, defOwner) === 0) {
    const eliminatedPlayer = state.players[defOwner];
    logEvent(
      state,
      `${eliminatedPlayer.name} (${eliminatedPlayer.color}) fue eliminado por ${atkPlayer.name}`,
    );
    state.players[defOwner].alive = false;
    state.players[defOwner].eliminatedBy = state.turnPlayer;

    const eliminator = state.players[state.turnPlayer];
    const eliminated = state.players[defOwner];

    eliminator.cards.push(...eliminated.cards);

    while (eliminator.cards.length > 5) {
      const randomIdx = Math.floor(Math.random() * eliminator.cards.length);
      state.discard.push(eliminator.cards[randomIdx]);
      eliminator.cards.splice(randomIdx, 1);
    }

    if (checkVictory(state)) {
      state.phase = "game_over";
    }
  }

  return true;
}

export function moveArmies(
  state: GameState,
  from: string,
  to: string,
  count: number,
): boolean {
  const fromT = state.territories[from];
  const toT = state.territories[to];
  if (!fromT || !toT) return false;
  if (fromT.owner !== state.turnPlayer || toT.owner !== state.turnPlayer)
    return false;
  if (fromT.armies <= count) return false;
  fromT.armies -= count;
  toT.armies += count;
  return true;
}

export function drawCard(state: GameState): Card | null {
  if (state.deck.length === 0) {
    if (state.discard.length === 0) return null;
    state.deck = [...state.discard];
    state.discard = [];
    for (let i = state.deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [state.deck[i], state.deck[j]] = [state.deck[j], state.deck[i]];
    }
  }

  const card = state.deck.pop()!;
  state.players[state.turnPlayer].cards.push(card);
  state.forcedExchange = state.players[state.turnPlayer].cards.length >= 5;
  const p = state.players[state.turnPlayer];
  logEvent(state, `${p.name} recibió una carta de territorio por conquistar`);
  return card;
}

export function endTurn(state: GameState) {
  state.phase = "receive";
  state.conqueredThisTurn = false;
  state.continentBonuses = {};
  state.pendingArmies = 0;

  const numPlayers = state.players.filter((p) => p.alive).length;
  if (numPlayers <= 1) {
    state.phase = "game_over";
    state.winner = state.players.findIndex((p) => p.alive);
    return;
  }

  let next = (state.turnPlayer + 1) % state.players.length;
  while (!state.players[next].alive) {
    next = (next + 1) % state.players.length;
  }

  state.turnPlayer = next;

  if (next === state.roundStartPlayer) {
    state.round++;
    state.roundStartPlayer = next;
  }
  state.forcedExchange = state.players[next].cards.length >= 5;

  const { total, continentBonuses } = calculateReinforcements(state, next);
  state.pendingArmies = total;
  state.continentBonuses = continentBonuses;

  const nextPlayer = state.players[next];
  logEvent(
    state,
    `Turno de ${nextPlayer.name} — Ronda ${state.round} — Recibe ${total} ejércitos`,
  );
}

export function checkVictory(state: GameState): boolean {
  const player = state.players[state.turnPlayer];
  return checkObjective(
    state,
    state.turnPlayer,
    player.objective,
    player.objectiveTargetColor,
  );
}

export function checkObjective(
  state: GameState,
  playerIdx: number,
  type: ObjectiveType,
  targetColor?: string,
): boolean {
  switch (type) {
    case "conquer_24":
      return countTerritories(state, playerIdx) >= 24;

    case "conquer_18_with_2": {
      let count = 0;
      for (const t of Object.values(state.territories)) {
        if (t.owner === playerIdx && t.armies >= 2) count++;
      }
      return count >= 18;
    }

    case "continents_na_africa":
      return (
        ownsContinent(state, playerIdx, "america-del-norte") &&
        ownsContinent(state, playerIdx, "africa")
      );

    case "continents_eu_oceania_plus_one":
      return (
        ownsContinent(state, playerIdx, "europa") &&
        ownsContinent(state, playerIdx, "oceania") &&
        ownsAnyOtherContinent(state, playerIdx, new Set(["europa", "oceania"]))
      );

    case "continents_eu_sa_plus_one":
      return (
        ownsContinent(state, playerIdx, "europa") &&
        ownsContinent(state, playerIdx, "america-del-sur") &&
        ownsAnyOtherContinent(
          state,
          playerIdx,
          new Set(["europa", "america-del-sur"]),
        )
      );

    case "continents_asia_africa":
      return (
        ownsContinent(state, playerIdx, "asia") &&
        ownsContinent(state, playerIdx, "africa")
      );

    case "continents_asia_sa":
      return (
        ownsContinent(state, playerIdx, "asia") &&
        ownsContinent(state, playerIdx, "america-del-sur")
      );

    case "continents_na_oceania":
      return (
        ownsContinent(state, playerIdx, "america-del-norte") &&
        ownsContinent(state, playerIdx, "oceania")
      );

    case "destroy_black":
    case "destroy_red":
    case "destroy_green":
    case "destroy_blue":
    case "destroy_white":
    case "destroy_yellow": {
      const targetIdx = state.players.findIndex((p) => p.color === targetColor);
      if (targetIdx === playerIdx)
        return countTerritories(state, playerIdx) >= 24;
      if (
        !state.players[targetIdx]?.alive &&
        state.players[targetIdx]?.eliminatedBy === playerIdx
      )
        return true;
      if (
        !state.players[targetIdx]?.alive &&
        state.players[targetIdx]?.eliminatedBy !== playerIdx
      ) {
        return countTerritories(state, playerIdx) >= 24;
      }
      return false;
    }

    default:
      return false;
  }
}

function ownsAnyOtherContinent(
  state: GameState,
  playerIdx: number,
  exclude: Set<string>,
): boolean {
  for (const key of Object.keys(CONTINENTS)) {
    if (exclude.has(key)) continue;
    if (ownsContinent(state, playerIdx, key)) return true;
  }
  return false;
}

export function getPublicState(state: GameState, playerIdx: number) {
  return {
    players: state.players.map((p, i) => ({
      name: p.name,
      color: p.color,
      alive: p.alive,
      cardCount: p.cards.length,
      isCurrentPlayer: i === playerIdx,
    })),
    territories: state.territories,
    turnPlayer: state.turnPlayer,
    round: state.round,
    phase: state.phase,
    exchangeCounter: state.exchangeCounter,
    winner: state.winner,
    playerCount: state.players.length,
    log: state.log,
    pendingConquest: state.pendingConquest,
  };
}

export function getPlayerSecretState(state: GameState, playerIdx: number) {
  const player = state.players[playerIdx];
  return {
    name: player.name,
    color: player.color,
    objective: player.objective,
    objectiveDescription: player.objectiveDescription,
    objectiveTargetColor: player.objectiveTargetColor,
    cards: player.cards,
    pendingArmies: state.pendingArmies,
    continentBonuses: state.continentBonuses,
    forcedExchange: state.forcedExchange,
    conqueredThisTurn: state.conqueredThisTurn,
  };
}
