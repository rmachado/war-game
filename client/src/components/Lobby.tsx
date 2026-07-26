import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useGame, useGameStore } from '../store/game'
import { startGame } from '../api/game'
import { COLOR_MAP, COLOR_NAMES, ALL_COLORS, type Color } from '../types'
import GameBoard from './GameBoard'
import { Copy, Play } from 'lucide-react'

export default function Lobby() {
  const { code } = useParams<{ code: string }>()
  const { token, code: storedCode } = useGameStore()
  const { data, isLoading, error, refetch } = useGame(code!, token)

  if (isLoading) return <div className="flex items-center justify-center min-h-screen text-stone-400">Cargando...</div>
  if (error || !data) return <div className="flex items-center justify-center min-h-screen text-red-400">Error al cargar el juego</div>

  if (data.public.phase !== 'lobby') {
    return <GameBoard />
  }

  const isCreator = data.public.players[0]?.color === token?.split(':')[1]
  const myColor = token?.split(':')[1] || ''
  const activeCode = code || storedCode || ''
  const totalSlots = data.public.playerCount
  const filledSlots = data.public.players.length
  const emptySlots = Math.max(0, totalSlots - filledSlots)

  async function handleStart() {
    try {
      await startGame(activeCode, token!)
      refetch()
    } catch (e: any) {
      alert(e.message)
    }
  }

  async function handleChangeColor(newColor: Color) {
    try {
      const res = await fetch(`/api/games/${activeCode}/change-color`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, color: newColor }),
      })
      if (!res.ok) {
        const d = await res.json()
        alert(d.error)
        return
      }
      const d = await res.json()
      const newToken = `${activeCode}:${newColor}`
      useGameStore.getState().setSession(activeCode, newToken)
      refetch()
    } catch (e: any) {
      alert(e.message)
    }
  }

  const takenColors = new Set(data.public.players.map(p => p.color))
  const allColorsUnique = data.public.players.length === new Set(data.public.players.map(p => p.color)).size

  function handleCopyLink() {
    const link = `${window.location.origin}/?join=${activeCode}`
    navigator.clipboard.writeText(link)
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-2">WAR</h1>
        <p className="text-stone-400 text-center mb-6">Sala de espera</p>

        <div className="bg-stone-800 rounded-xl p-6 mb-6">
          <p className="text-sm text-stone-400 mb-1">Código del juego</p>
          <p className="text-4xl font-mono font-bold text-center tracking-[0.3em] text-amber-400">
            {activeCode}
          </p>
          <p className="text-sm text-stone-500 text-center mt-2">Comparte este código con los demás jugadores</p>
          <button
            onClick={handleCopyLink}
            className="w-full mt-3 py-2 bg-stone-700 hover:bg-stone-600 rounded text-sm font-medium transition flex items-center justify-center gap-2"
          >
            <Copy size={16} /> Copiar enlace de invitación
          </button>
        </div>

        <div className="space-y-2 mb-6">
          {data.public.players.map((p, i) => {
            const isMe = p.color === myColor
            return (
              <div key={i} className="flex items-center gap-3 bg-stone-800 rounded-lg p-3">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: COLOR_MAP[p.color] }} />
                <span className="flex-1">{p.name}{isMe ? ' (tú)' : ''}</span>

                {isMe ? (
                  <div className="flex gap-0.5">
                    {ALL_COLORS.map(c => (
                      <button
                        key={c}
                        onClick={() => handleChangeColor(c)}
                        disabled={takenColors.has(c) && c !== p.color}
                        className={`w-5 h-5 rounded-full border transition ${c === p.color ? 'border-white scale-110' : 'border-transparent'} ${takenColors.has(c) && c !== p.color ? 'opacity-30 cursor-not-allowed' : 'hover:scale-110'}`}
                        style={{ backgroundColor: COLOR_MAP[c] }}
                        title={COLOR_NAMES[c]}
                      />
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-stone-400">{COLOR_NAMES[p.color]}</span>
                )}
                {i === 0 && <span className="text-xs bg-amber-600 px-2 py-0.5 rounded">Anfitrión</span>}
              </div>
            )
          })}
          {Array.from({ length: emptySlots }).map((_, i) => (
            <div key={`empty-${i}`} className="flex items-center gap-3 bg-stone-800/50 rounded-lg p-3 opacity-50">
              <div className="w-4 h-4 rounded-full bg-stone-600" />
              <span className="text-stone-500">Esperando jugador...</span>
            </div>
          ))}
        </div>

        {!allColorsUnique && (
          <p className="text-red-400 text-sm text-center mb-3">Cada jugador debe tener un color único</p>
        )}

        {isCreator && (
          <button
            onClick={handleStart}
            disabled={!allColorsUnique}
            className="w-full py-3 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 rounded-lg font-bold text-lg transition flex items-center justify-center gap-2"
          >
            <Play size={20} /> Iniciar juego
          </button>
        )}
        {!isCreator && (
          <p className="text-center text-stone-400">Esperando que el anfitrión inicie el juego...</p>
        )}
      </div>
    </div>
  )
}
