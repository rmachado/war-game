import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useGameStore, useGameState } from '../store/game'
import { useGameSocket } from '../hooks/useGameSocket'
import { COLOR_MAP, COLOR_NAMES, ALL_COLORS, type Color } from '../types'
import GameBoard from './GameBoard'
import { Copy, Play, X, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Lobby() {
  const { code } = useParams<{ code: string }>()
  const { token, code: storedCode } = useGameStore()
  const { lobbyPlayers, isConnected, error, public: pub } = useGameState()
  const [localError, setLocalError] = useState('')

  const { sendAction } = useGameSocket(code!, token)

  if (!isConnected) return <div className="flex items-center justify-center min-h-screen text-stone-400">Cargando...</div>

  if (pub && pub.phase !== 'lobby') {
    return <GameBoard />
  }

  if (error || !lobbyPlayers) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-900/50 flex items-center justify-center">
            <X size={32} className="text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">No se pudo unir a la sala de juego</h2>
          <p className="text-stone-400 mb-6">El juego no existe o el enlace es inválido</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-stone-800 hover:bg-stone-700 rounded-lg text-sm font-medium transition"
          >
            <ArrowLeft size={16} /> Volver al inicio
          </Link>
        </div>
      </div>
    )
  }

  if (lobbyPlayers.length === 0) return null

  const isCreator = lobbyPlayers[0]?.color === token?.split(':')[1]
  const myColor = token?.split(':')[1] || ''
  const activeCode = code || storedCode || ''
  const totalSlots = 6
  const filledSlots = lobbyPlayers.length
  const emptySlots = Math.max(0, totalSlots - filledSlots)

  function handleStart() {
    sendAction('start')
  }

  function handleChangeColor(newColor: Color) {
    sendAction('change-color', { color: newColor })
    const newToken = `${activeCode}:${newColor}`
    useGameStore.getState().setSession(activeCode, newToken, useGameStore.getState().playerName || '')
  }

  function handleKick(targetColor: string) {
    sendAction('kick', { targetColor })
  }

  const takenColors = new Set(lobbyPlayers.map(p => p.color))
  const allColorsUnique = lobbyPlayers.length === new Set(lobbyPlayers.map(p => p.color)).size

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
          {lobbyPlayers.map((p, i) => {
            const isMe = p.color === myColor
            return (
              <div key={i} className="flex items-center gap-3 bg-stone-800 rounded-lg p-3">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: COLOR_MAP[p.color as keyof typeof COLOR_MAP] }} />
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
                  <span className="text-xs text-stone-400">{COLOR_NAMES[p.color as keyof typeof COLOR_NAMES]}</span>
                )}
                {i === 0 && <span className="text-xs bg-amber-600 px-2 py-0.5 rounded">Anfitrión</span>}
                {isCreator && i !== 0 && (
                  <button
                    onClick={() => handleKick(p.color)}
                    className="text-red-400 hover:text-red-300 transition"
                    title="Expulsar jugador"
                  >
                    <X size={16} />
                  </button>
                )}
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

        {localError && <p className="text-red-400 text-sm text-center mb-3">{localError}</p>}
        {!allColorsUnique && (
          <p className="text-red-400 text-sm text-center mb-3">Cada jugador debe tener un color único</p>
        )}

        {isCreator && (
          <button
            onClick={handleStart}
            disabled={!allColorsUnique || filledSlots < 3}
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
