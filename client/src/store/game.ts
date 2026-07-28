import { create } from 'zustand'
import type { GamePublic, GameSecret } from '../types'

interface GameStore {
  token: string | null
  code: string | null
  playerName: string | null
  setSession: (code: string, token: string, name: string) => void
  clearSession: () => void
}

export const useGameStore = create<GameStore>((set) => ({
  token: localStorage.getItem('war_token'),
  code: localStorage.getItem('war_code'),
  playerName: localStorage.getItem('war_name'),
  setSession: (code, token, name) => {
    localStorage.setItem('war_code', code)
    localStorage.setItem('war_token', token)
    localStorage.setItem('war_name', name)
    set({ code, token, playerName: name })
  },
  clearSession: () => {
    localStorage.removeItem('war_code')
    localStorage.removeItem('war_token')
    localStorage.removeItem('war_name')
    set({ code: null, token: null, playerName: null })
  },
}))

interface GameStateStore {
  public: GamePublic | null
  secret: GameSecret | null
  isConnected: boolean
  error: string | null
  lobbyPlayers: { name: string; color: string }[] | null
  sendAction: ((type: string, payload?: any) => void) | null
  spectatorIntent: { from: string; to: string; color: string } | null
  spectatorResult: any | null
  setGameState: (pub: GamePublic, secret: GameSecret) => void
  setLobbyState: (players: { name: string; color: string }[]) => void
  setConnected: (connected: boolean) => void
  setError: (error: string | null) => void
  setSendAction: (fn: ((type: string, payload?: any) => void) | null) => void
  setSpectatorIntent: (intent: { from: string; to: string; color: string } | null) => void
  setSpectatorResult: (result: any | null) => void
  reset: () => void
}

export const useGameState = create<GameStateStore>((set) => ({
  public: null,
  secret: null,
  isConnected: false,
  error: null,
  lobbyPlayers: null,
  sendAction: null,
  spectatorIntent: null,
  spectatorResult: null,
  setGameState: (pub, secret) =>
    set({ public: pub, secret, isConnected: true, error: null }),
  setLobbyState: (players) =>
    set({ lobbyPlayers: players, isConnected: true, error: null }),
  setConnected: (isConnected) => set({ isConnected }),
  setError: (error) => set({ error, isConnected: false }),
  setSendAction: (fn) => set({ sendAction: fn }),
  setSpectatorIntent: (intent) => set({ spectatorIntent: intent }),
  setSpectatorResult: (result) => set({ spectatorResult: result }),
  reset: () =>
    set({
      public: null,
      secret: null,
      isConnected: false,
      error: null,
      lobbyPlayers: null,
      sendAction: null,
      spectatorIntent: null,
      spectatorResult: null,
    }),
}))
