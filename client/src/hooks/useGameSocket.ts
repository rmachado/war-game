import { useEffect, useRef, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'

interface WSEvent {
  type: 'game:state' | 'attack:intent' | 'attack:result' | 'auth:ok'
  public?: any
  secret?: any
  from?: string | null
  to?: string | null
  color?: string
  attack?: number[]
  defense?: number[]
  attackLosses?: number
  defenseLosses?: number
  conquered?: boolean
}

export function useGameSocket(
  code: string | null,
  token: string | null,
  onAttackIntent: (from: string | null, to: string | null, color?: string) => void,
  onAttackResult: (result: any) => void,
) {
  const queryClient = useQueryClient()
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectRef = useRef<ReturnType<typeof setTimeout>>()

  const connect = useCallback(() => {
    if (!code || !token) return

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`)

    ws.onopen = () => {
      ws.send(JSON.stringify({
        type: 'auth',
        code,
        color: token.split(':')[1],
      }))
    }

    ws.onmessage = (event) => {
      try {
        const msg: WSEvent = JSON.parse(event.data)

        if (msg.type === 'game:state' && msg.public && msg.secret) {
          queryClient.setQueryData(['game', code], {
            public: msg.public,
            secret: msg.secret,
          })
        }

        if (msg.type === 'attack:intent') {
          onAttackIntent(msg.from ?? null, msg.to ?? null, msg.color)
        }

        if (msg.type === 'attack:result') {
          onAttackResult(msg)
        }
      } catch {}
    }

    ws.onclose = () => {
      reconnectRef.current = setTimeout(connect, 3000)
    }

    ws.onerror = () => {
      ws.close()
    }

    wsRef.current = ws
  }, [code, token, queryClient, onAttackIntent, onAttackResult])

  useEffect(() => {
    connect()
    return () => {
      clearTimeout(reconnectRef.current)
      wsRef.current?.close()
    }
  }, [connect])

  function sendAttackIntent(from: string | null, to: string | null) {
    wsRef.current?.send(JSON.stringify({
      type: 'attack:intent',
      from,
      to,
    }))
  }

  return { sendAttackIntent }
}
