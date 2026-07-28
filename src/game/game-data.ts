import { ALL_TERRITORIES, TERRITORY_NAMES, ADJACENCY, CONTINENTS } from './map.js';
import { OBJECTIVES } from './objectives.js';
import { EXCHANGE_TABLE, getExchangeArmies } from './types.js';

export interface GameDataResponse {
  territories: Record<string, {
    name: string;
    continent: string;
    neighbors: string[];
  }>;
  continents: Record<string, {
    name: string;
    bonus: number;
  }>;
  exchangeTable: {
    values: Record<number, number>;
    increment: number;
  };
  objectives: {
    type: string;
    description: string;
  }[];
}

export function getGameData(): GameDataResponse {
  const territories: GameDataResponse['territories'] = {};
  for (const id of ALL_TERRITORIES) {
    const continentKey = Object.entries(CONTINENTS).find(([_, c]) =>
      c.territories.includes(id)
    )?.[0] || '';
    territories[id] = {
      name: TERRITORY_NAMES[id] || id,
      continent: continentKey,
      neighbors: ADJACENCY[id] || [],
    };
  }

  const continents: GameDataResponse['continents'] = {};
  for (const [key, c] of Object.entries(CONTINENTS)) {
    continents[key] = {
      name: c.name,
      bonus: c.bonus,
    };
  }

  return {
    territories,
    continents,
    exchangeTable: {
      values: { ...EXCHANGE_TABLE },
      increment: 5,
    },
    objectives: OBJECTIVES.map(o => ({
      type: o.type,
      description: o.description,
    })),
  };
}
