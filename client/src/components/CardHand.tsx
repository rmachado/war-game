import { useState } from 'react'
import { TERRITORY_NAMES, type Card, type GamePhase } from '../types'

const SYMBOL_LABELS: Record<string, string> = {
  triangulo: '🔺',
  cuadrado: '◼️',
  circulo: '⚫',
  joker: '🃏',
}

interface CardHandProps {
  cards: Card[]
  pendingArmies: number
  forcedExchange: boolean
  phase: GamePhase
  onExchange: (cardIds: string[]) => void
  onClose: () => void
}

export default function CardHand({ cards, pendingArmies, forcedExchange, phase, onExchange, onClose }: CardHandProps) {
  const [selected, setSelected] = useState<string[]>([])

  function toggleCard(id: string) {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : prev.length < 3 ? [...prev, id] : prev
    )
  }

  const canExchange = (phase === 'receive' || phase === 'place' || phase === 'first_round')
  const isExchangeValid = selected.length === 3

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="bg-stone-800 rounded-xl max-w-lg w-full p-6 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold">Tus cartas ({cards.length})</h3>
          <button onClick={onClose} className="text-stone-400 hover:text-white text-xl">✕</button>
        </div>

        {cards.length === 0 && (
          <p className="text-stone-400 text-center py-8">No tienes cartas aún.</p>
        )}

        {cards.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {cards.map(card => {
              const isSelected = selected.includes(card.id)
              const territoryName = TERRITORY_NAMES[card.id]
              return (
                <button
                  key={card.id}
                  onClick={() => canExchange ? toggleCard(card.id) : undefined}
                  disabled={!canExchange && !isSelected}
                  className={`aspect-[3/4] rounded-lg border-2 p-2 flex flex-col items-center justify-center transition ${
                    isSelected ? 'border-amber-400 bg-amber-600/20 scale-105' : 'border-stone-600 bg-stone-700/50 hover:border-stone-500'
                  } ${!canExchange ? 'cursor-default' : ''}`}
                >
                  <span className="text-2xl">{SYMBOL_LABELS[card.symbol] || '?'}</span>
                  <span className="text-xs text-center mt-1 leading-tight text-stone-300">
                    {territoryName || card.id}
                  </span>
                </button>
              )
            })}
          </div>
        )}

        {canExchange && (
          <div className="space-y-2 border-t border-stone-700 pt-3">
            <p className="text-xs text-stone-400">
              Canje válido: 3 figuras iguales o 3 figuras diferentes.
              {forcedExchange && <span className="text-red-400 font-bold block">Debes canjear (tienes 5 o más cartas)</span>}
            </p>
            <button
              onClick={() => { onExchange(selected); setSelected([]) }}
              disabled={!isExchangeValid}
              className="w-full py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 rounded font-bold transition"
            >
              Canjear 3 cartas por ejércitos
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
