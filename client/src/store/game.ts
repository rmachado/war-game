import { create } from "zustand";
import { useQuery } from "@tanstack/react-query";
import { getGameState } from "../api/game";
import type { GameStateResponse } from "../types";

interface GameStore {
  token: string | null;
  code: string | null;
  setSession: (code: string, token: string) => void;
  clearSession: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  token: localStorage.getItem("war_token"),
  code: localStorage.getItem("war_code"),
  setSession: (code, token) => {
    localStorage.setItem("war_code", code);
    localStorage.setItem("war_token", token);
    set({ code, token });
  },
  clearSession: () => {
    localStorage.removeItem("war_code");
    localStorage.removeItem("war_token");
    set({ code: null, token: null });
  },
}));

export function useGame(code: string | null, token: string | null) {
  return useQuery<GameStateResponse>({
    queryKey: ['game', code],
    queryFn: () => getGameState(code!, token!),
    enabled: !!code && !!token,
    staleTime: Infinity,
  });
}
