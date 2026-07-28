import { useEffect, useRef, useCallback } from 'react'
import { useGameStore, useGameState } from '../store/game'

const sockets = new Map<string, WebSocket>()
const initialized = new Set<string>()

export function useGameSocket(
  code: string | null,
  token: string | null,
) {
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const playerName = useGameStore((s) => s.playerName)

  const connect = useCallback(() => {
    if (!code || !token) return

    const key = `${code}:${token}`
    const existing = sockets.get(key)
    if (existing && existing.readyState === WebSocket.OPEN) {
      wsRef.current = existing
      return
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const ws = new WebSocket(
      `${protocol}//${window.location.host}/ws?code=${encodeURIComponent(code)}&token=${encodeURIComponent(token)}`,
    )

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          type: 'auth',
          code,
          color: token.split(':')[1],
          name: playerName,
        }),
      )
    }

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)

        if (msg.type === 'game:state' && msg.public && msg.secret) {
          useGameState.getState().setGameState(msg.public, msg.secret)
        }

        if (msg.type === 'lobby:state' && msg.players) {
          useGameState.getState().setLobbyState(msg.players)
        }

        if (msg.type === 'attack:intent') {
          if (msg.from && msg.to) {
            useGameState.getState().setSpectatorIntent({
              from: msg.from,
              to: msg.to,
              color: msg.color ?? '',
            })
            useGameState.getState().setSpectatorResult(null)
          } else {
            useGameState.getState().setSpectatorIntent(null)
            useGameState.getState().setSpectatorResult(null)
          }
        }

        if (msg.type === 'attack:result') {
          useGameState.getState().setSpectatorResult(msg)
        }

        if (msg.type === 'error') {
          useGameState.getState().setError(msg.message)
        }
      } catch {}
    }

    ws.onclose = () => {
      useGameState.getState().setConnected(false)
      sockets.delete(key)
      reconnectRef.current = setTimeout(connect, 3000)
    }

    ws.onerror = () => {
      ws.close()
    }

    sockets.set(key, ws)
    wsRef.current = ws
  }, [code, token, playerName])

  const sendAction = useCallback((type: string, payload?: any) => {
    const ws = wsRef.current
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type, ...payload }))
    }
  }, [])

  useEffect(() => {
    const key = code && token ? `${code}:${token}` : null

    if (key && !initialized.has(key)) {
      initialized.add(key)
      useGameState.getState().reset()
    }

    if (key) {
      connect()
      useGameState.getState().setSendAction(sendAction)
    }

    return () => {
      if (reconnectRef.current) clearTimeout(reconnectRef.current)
      const ws = wsRef.current
      if (ws) {
        ws.onclose = null
        ws.close()
        sockets.delete(key!)
      }
      if (key) initialized.delete(key)
    }
  }, [connect, sendAction])

  return { sendAction }
}
