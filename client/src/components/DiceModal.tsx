import { useState } from 'react'
import { type PlayerPublic, type TerritoryState } from '../types'
import { useTerritoryName } from '../hooks/useGameData'

interface DiceModalProps {
  result: {
    attack: number[]
    defense: number[]
    attackLosses: number
    defenseLosses: number
    from: string
    to: string
    conquered: boolean
  }
  territories: Record<string, TerritoryState>
  players: PlayerPublic[]
  turnPlayer: number
  onConquer: (armies: number) => void
  onClose: () => void
}

export default function DiceModal({ result, territories, players, turnPlayer, onConquer, onClose }: DiceModalProps) {
  const tn = useTerritoryName();
  const [conquerCount, setConquerCount] = useState(1)
  const fromArmies = territories[result.from]?.armies ?? 0
  const maxMove = Math.min(result.attack.length, fromArmies - 1)

  const defOwner = result.conquered ? null : territories[result.to]?.owner

  function renderDice(values: number[], lost: number) {
    const sorted = [...values].sort((a, b) => b - a)
    return (
      <div className="flex gap-1 justify-center">
        {sorted.map((v, i) => (
          <div
            key={i}
            className={`w-10 h-10 rounded flex items-center justify-center font-bold text-lg ${
              i < lost ? 'bg-red-900/60 text-red-300 border border-red-700' : 'bg-stone-600 text-white border border-stone-500'
            }`}
          >
            {v}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="bg-stone-800 rounded-xl max-w-sm w-full p-6 space-y-4" onClick={e => e.stopPropagation()}>
        <h3 className="text-xl font-bold text-center">
          Batalla: {tn(result.from)} → {tn(result.to)}
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <p className="text-sm text-stone-400 mb-1">Ataque</p>
            {renderDice(result.attack, result.attackLosses)}
            <p className="text-xs text-red-400 mt-1">-{result.attackLosses} ejércitos</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-stone-400 mb-1">Defensa</p>
            {renderDice(result.defense, result.defenseLosses)}
            <p className="text-xs text-yellow-400 mt-1">-{result.defenseLosses} ejércitos</p>
          </div>
        </div>

        {result.conquered && maxMove > 0 && (
          <div className="space-y-2 border-t border-stone-700 pt-3">
            <p className="text-sm font-bold text-green-400 text-center">Territorio conquistado</p>
            <p className="text-xs text-stone-400 text-center">Ejércitos a mover al territorio conquistado:</p>
            <div className="flex gap-1 justify-center">
              {Array.from({ length: maxMove }, (_, i) => i + 1).map(n => (
                <button
                  key={n}
                  onClick={() => setConquerCount(n)}
                  className={`w-10 h-10 rounded font-bold transition ${conquerCount === n ? 'bg-green-600' : 'bg-stone-700 hover:bg-stone-600'}`}
                >
                  {n}
                </button>
              ))}
            </div>
            <button
              onClick={() => onConquer(conquerCount)}
              className="w-full py-2 bg-green-600 hover:bg-green-500 rounded font-bold transition"
            >
              Ocupar ({conquerCount} ejércitos)
            </button>
          </div>
        )}

        {!result.conquered && (
          <button
            onClick={onClose}
            className="w-full py-2 bg-stone-700 hover:bg-stone-600 rounded font-bold transition"
          >
            Continuar
          </button>
        )}
      </div>
    </div>
  )
}
