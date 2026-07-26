import { useQuery } from '@tanstack/react-query';

export interface GameData {
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

async function fetchGameData(): Promise<GameData> {
  const res = await fetch('/api/game-data');
  if (!res.ok) throw new Error('Failed to fetch game data');
  return res.json();
}

export function useGameData() {
  return useQuery<GameData>({
    queryKey: ['game-data'],
    queryFn: fetchGameData,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

export function useTerritoryName() {
  const { data } = useGameData();
  return (id: string) => data?.territories[id]?.name ?? id;
}

export function useNeighbors() {
  const { data } = useGameData();
  return (id: string) => data?.territories[id]?.neighbors ?? [];
}

export function useTerritoryNames() {
  const { data } = useGameData();
  return data?.territories ?? {};
}

export function useContinents() {
  const { data } = useGameData();
  return data?.continents ?? {};
}

export function useExchangeTable() {
  const { data } = useGameData();
  return data?.exchangeTable ?? { values: {} as Record<number, number>, increment: 5 };
}
