import { useState, useEffect } from 'react'
import { TERRITORY_NAMES } from '../types'
import { getDiceSvg } from './Dice'

interface DiceResult {
  attack: number[]
  defense: number[]
  attackLosses: number
  defenseLosses: number
  conquered: boolean
}

interface AttackModalProps {
  from: string
  to: string
  fromArmies: number
  toArmies: number
  attackerName: string
  defenderName: string
  readonly: boolean
  spectatorResult?: any
  onAttack?: (from: string, to: string, armies: number) => Promise<any>
  onConquer?: (from: string, to: string, armies: number) => void
  onClose: () => void
}

export default function AttackModal({
  from, to, fromArmies, toArmies, attackerName, defenderName, readonly, spectatorResult,
  onAttack = async () => null, onConquer = () => {}, onClose,
}: AttackModalProps) {
  const maxAttack = Math.min(3, fromArmies - 1)
  const [attackingArmies, setAttackingArmies] = useState(maxAttack)
  const [result, setResult] = useState<DiceResult | null>(null)
  const [rolling, setRolling] = useState(false)
  const [rollingFrames, setRollingFrames] = useState<number[][]>([[], []])
  const [conquerArmies, setConquerArmies] = useState(attackingArmies)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setAttackingArmies(Math.min(3, fromArmies - 1))
  }, [fromArmies])

  async function handleAttack() {
    setLoading(true)
    setRolling(true)
    setResult(null)

    const frames: number[][] = [[], []]
    const interval = setInterval(() => {
      const atk = Array.from({ length: attackingArmies }, () => Math.ceil(Math.random() * 6))
      const def = Array.from({ length: Math.min(3, toArmies) }, () => Math.ceil(Math.random() * 6))
      atk.sort((a, b) => b - a)
      def.sort((a, b) => b - a)
      setRollingFrames([atk, def])
    }, 80)

    setTimeout(async () => {
      clearInterval(interval)
      try {
        const res = await onAttack(from, to, attackingArmies)
        setResult(res)
        setRolling(false)
      } catch (e: any) {
        setRolling(false)
      }
      setLoading(false)
    }, 1000)
  }

  function handleConquer() {
    onConquer(from, to, conquerArmies)
    setResult(null)
  }

  const effectiveResult = readonly ? spectatorResult : result;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={effectiveResult?.conquered ? undefined : onClose}>
      <div className="bg-stone-800 rounded-2xl max-w-lg w-full p-6 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">
            Batalla: {TERRITORY_NAMES[from]} → {TERRITORY_NAMES[to]}
          </h3>
          <button onClick={onClose} className="text-stone-400 hover:text-white text-2xl leading-none">&times;</button>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div>
            <span className="text-stone-400">Atacante: </span>
            <span className="text-white font-medium">{attackerName}</span>
            <span className="text-stone-500 ml-1">({fromArmies} ejércitos)</span>
          </div>
          <div>
            <span className="text-stone-400">Defensor: </span>
            <span className="text-white font-medium">{defenderName}</span>
            <span className="text-stone-500 ml-1">({toArmies} ejércitos)</span>
          </div>
        </div>

        {!effectiveResult?.conquered && !readonly && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-stone-400">Ejércitos atacantes</span>
              <span className="text-white font-bold text-lg">{attackingArmies}</span>
            </div>
            <input
              type="range"
              min={1}
              max={maxAttack}
              value={attackingArmies}
              onChange={e => setAttackingArmies(Number(e.target.value))}
              className="w-full h-2 bg-stone-700 rounded-lg appearance-none cursor-pointer accent-red-500"
              disabled={loading}
            />
            <div className="flex justify-between text-xs text-stone-500">
              <span>1</span>
              <span>{maxAttack}</span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-center gap-8 py-2">
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs text-stone-400">Ataque</span>
            <div className="flex gap-1">
              {(rolling ? rollingFrames[0] : effectiveResult?.attack || [1, 1, 1].slice(0, attackingArmies)).map((v: number, i: number) => (
                <span
                  key={i}
                  dangerouslySetInnerHTML={{ __html: getDiceSvg(v, 'red') }}
                  className={rolling ? 'animate-pulse' : ''}
                />
              ))}
            </div>
            {effectiveResult && !rolling && (
              <span className="text-xs text-red-400">-{effectiveResult.attackLosses}</span>
            )}
          </div>

          <span className="text-stone-500 text-2xl font-bold">VS</span>

          <div className="flex flex-col items-center gap-1">
            <span className="text-xs text-stone-400">Defensa</span>
            <div className="flex gap-1">
              {(rolling ? rollingFrames[1] : effectiveResult?.defense || [1, 1, 1].slice(0, Math.min(3, toArmies))).map((v: number, i: number) => (
                <span
                  key={i}
                  dangerouslySetInnerHTML={{ __html: getDiceSvg(v, 'yellow') }}
                  className={rolling ? 'animate-pulse' : ''}
                />
              ))}
            </div>
            {effectiveResult && !rolling && (
              <span className="text-xs text-yellow-400">-{effectiveResult.defenseLosses}</span>
            )}
          </div>
        </div>

        {effectiveResult?.conquered && (
          <div className="bg-green-900/30 border border-green-600 rounded-lg p-4 text-center space-y-3">
            <p className="text-green-400 font-bold text-lg">¡Territorio conquistado!</p>
            {!readonly ? (
              <>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-stone-400">Ejércitos a mover</span>
                    <span className="text-white font-bold text-lg">{conquerArmies}</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={maxAttack}
                    value={conquerArmies}
                    onChange={e => setConquerArmies(Number(e.target.value))}
                    className="w-full h-2 bg-stone-700 rounded-lg appearance-none cursor-pointer accent-green-500"
                  />
                  <div className="flex justify-between text-xs text-stone-500">
                    <span>1</span>
                    <span>{maxAttack}</span>
                  </div>
                </div>
                <button
                  onClick={handleConquer}
                  className="w-full py-2 bg-green-600 hover:bg-green-500 rounded-lg font-bold transition"
                >
                  Ocupar ({conquerArmies} ejércitos)
                </button>
              </>
            ) : (
              <p className="text-sm text-stone-400">Esperando que el atacante ocupe el territorio...</p>
            )}
          </div>
        )}

        {!effectiveResult?.conquered && !readonly && (
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 py-2 bg-stone-700 hover:bg-stone-600 rounded-lg font-medium transition"
            >
              Cerrar
            </button>
            <button
              onClick={handleAttack}
              disabled={loading || fromArmies <= 1}
              className="flex-1 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-40 rounded-lg font-bold transition"
            >
              {result ? 'Atacar de nuevo' : 'Atacar'}
            </button>
          </div>
        )}

        {readonly && !effectiveResult && (
          <p className="text-center text-stone-400 text-sm">El atacante está decidiendo su estrategia...</p>
        )}
      </div>
    </div>
  )
}
