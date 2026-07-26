import { useState } from 'react'
import { useTerritoryName } from '../hooks/useGameData'
import { X, ArrowRight, Minus, Plus } from 'lucide-react'

interface MoveModalProps {
  from: string
  to: string
  maxArmies: number
  onMove: (count: number) => void
  onClose: () => void
}

export default function MoveModal({ from, to, maxArmies, onMove, onClose }: MoveModalProps) {
  const [count, setCount] = useState(1)
  const tn = useTerritoryName()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="bg-stone-800 rounded-xl max-w-sm w-full p-6 space-y-4" onClick={e => e.stopPropagation()}>
        <h3 className="text-xl font-bold text-center">Mover ejércitos</h3>
        <p className="text-sm text-stone-300 text-center">
          {tn(from)} → {tn(to)}
        </p>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-stone-400">Ejércitos</span>
            <span className="text-white font-bold text-lg">{count}</span>
          </div>
          <input
            type="range"
            min={1}
            max={maxArmies}
            value={count}
            onChange={e => setCount(Number(e.target.value))}
            className="w-full h-2 bg-stone-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
          <div className="flex justify-between text-xs text-stone-500">
            <span>1</span>
            <span>{maxArmies}</span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 bg-stone-700 hover:bg-stone-600 rounded font-medium transition"
          >
            Cancelar
          </button>
          <button
            onClick={() => onMove(count)}
            className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 rounded font-bold transition"
          >
            Mover {count}
          </button>
        </div>
      </div>
    </div>
  )
}
