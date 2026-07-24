import { useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { useGame, useGameStore } from '../store/game'
import { placeArmies, exchangeCards, attack as apiAttack, conquer as apiConquer, endAttacks, endMoves, moveArmies } from '../api/game'
import MapView from './MapView'
import Sidebar from './Sidebar'
import DiceModal from './DiceModal'
import CardHand from './CardHand'
import MoveModal from './MoveModal'
import { ADJACENCY, TERRITORY_NAMES, type GamePublic, type GameSecret, type TerritoryState } from '../types'

export default function GameBoard() {
  const { code } = useParams<{ code: string }>()
  const { token } = useGameStore()
  const { data, refetch } = useGame(code!, token)

  const [selectedTerritory, setSelectedTerritory] = useState<string | null>(null)
  const [attackTarget, setAttackTarget] = useState<string | null>(null)
  const [placementMap, setPlacementMap] = useState<Record<string, number>>({})
  const [error, setError] = useState('')
  const [diceResult, setDiceResult] = useState<any>(null)
  const [showCards, setShowCards] = useState(false)
  const [moveFrom, setMoveFrom] = useState<string | null>(null)
  const [moveModal, setMoveModal] = useState<{ from: string; to: string } | null>(null)
  const [loading, setLoading] = useState(false)

  if (!data) return <div className="flex items-center justify-center min-h-screen text-stone-400">Cargando...</div>

  const { public: pub, secret } = data
  const isMyTurn = secret.color === pub.players[pub.turnPlayer]?.color

  async function handleExchange(cardIds: string[]) {
    setLoading(true)
    setError('')
    try {
      await exchangeCards(code!, token!, cardIds)
      refetch()
    } catch (e: any) {
      setError(e.message)
    }
    setLoading(false)
  }

  async function handlePlaceArmies() {
    const total = Object.values(placementMap).reduce((a, b) => a + b, 0)
    if (total !== secret.pendingArmies) {
      setError(`Debes colocar exactamente ${secret.pendingArmies} ejércitos (colocados: ${total})`)
      return
    }
    setLoading(true)
    setError('')
    try {
      await placeArmies(code!, token!, placementMap)
      setPlacementMap({})
      refetch()
    } catch (e: any) {
      setError(e.message)
    }
    setLoading(false)
  }

  function addArmy(territory: string) {
    const current = Object.values(placementMap).reduce((a, b) => a + b, 0)
    if (current >= secret.pendingArmies) return
    setPlacementMap(prev => ({ ...prev, [territory]: (prev[territory] || 0) + 1 }))
  }

  function removeArmy(territory: string) {
    setPlacementMap(prev => {
      const next = { ...prev }
      if (next[territory] <= 1) {
        delete next[territory]
      } else {
        next[territory]--
      }
      return next
    })
  }

  function handleTerritoryClick(territoryId: string) {
    if (!isMyTurn) return

    const terr = pub.territories[territoryId]
    const isMine = terr?.owner === pub.turnPlayer

    if (pub.phase === 'receive' || pub.phase === 'place' || pub.phase === 'first_round') {
      if (isMine) {
        setSelectedTerritory(select => select === territoryId ? null : territoryId)
        addArmy(territoryId)
      }
      return
    }

    if (pub.phase === 'attack') {
      if (isMine && terr.armies >= 2) {
        setSelectedTerritory(select => select === territoryId ? null : territoryId)
        setAttackTarget(null)
      } else if (!isMine && selectedTerritory) {
        const neighbors = ADJACENCY[selectedTerritory] || []
        if (!neighbors.includes(territoryId)) {
          setError(`${TERRITORY_NAMES[territoryId]} no es adyacente a ${TERRITORY_NAMES[selectedTerritory]}`)
          return
        }
        setAttackTarget(territoryId)
      }
      return
    }

    if (pub.phase === 'move') {
      if (isMine && terr.armies >= 2 && !moveFrom) {
        setMoveFrom(territoryId)
        setSelectedTerritory(territoryId)
      } else if (moveFrom && isMine && territoryId !== moveFrom) {
        const neighbors = ADJACENCY[moveFrom] || []
        if (!neighbors.includes(territoryId)) {
          setError(`${TERRITORY_NAMES[territoryId]} no es adyacente a ${TERRITORY_NAMES[moveFrom]}`)
          setMoveFrom(null)
          setSelectedTerritory(null)
          return
        }
        setMoveFrom(null)
        setSelectedTerritory(null)
        setMoveModal({ from: moveFrom, to: territoryId })
      } else if (moveFrom === territoryId) {
        setMoveFrom(null)
        setSelectedTerritory(null)
      }
      return
    }
  }

  async function handleAttack(from: string, to: string, armies: number) {
    setLoading(true)
    setError('')
    try {
      const result = await apiAttack(code!, token!, from, to, armies)
      setDiceResult({ ...result, from, to })

      if (result.conquered) {
        setSelectedTerritory(null)
        setAttackTarget(null)
      }

      refetch()
    } catch (e: any) {
      setError(e.message)
    }
    setLoading(false)
  }

  async function handleConquer(from: string, to: string, armies: number) {
    setLoading(true)
    setError('')
    try {
      await apiConquer(code!, token!, from, to, armies)
      setDiceResult(null)
      setSelectedTerritory(null)
      setAttackTarget(null)
      refetch()
    } catch (e: any) {
      setError(e.message)
    }
    setLoading(false)
  }

  async function handleMove(from: string, to: string, count: number = 1) {
    setLoading(true)
    setError('')
    try {
      await moveArmies(code!, token!, from, to, count)
      setMoveModal(null)
      refetch()
    } catch (e: any) {
      setError(e.message)
    }
    setLoading(false)
  }

  async function handleEndAttacks() {
    setLoading(true)
    try {
      await endAttacks(code!, token!)
      setSelectedTerritory(null)
      setAttackTarget(null)
      refetch()
    } catch (e: any) {
      setError(e.message)
    }
    setLoading(false)
  }

  async function handleEndMoves() {
    setLoading(true)
    try {
      await endMoves(code!, token!)
      refetch()
    } catch (e: any) {
      setError(e.message)
    }
    setLoading(false)
  }

  if (pub.phase === 'game_over') {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">{pub.winner !== null ? '¡Juego terminado!' : 'Juego terminado'}</h1>
          {pub.winner !== null && (
            <p className="text-2xl text-amber-400">{pub.players[pub.winner]?.name} ha ganado</p>
          )}
          <button
            onClick={() => window.location.href = '/'}
            className="mt-6 px-6 py-3 bg-stone-700 hover:bg-stone-600 rounded-lg transition"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen overflow-hidden">
      <div className="flex-1 relative min-h-0">
        <MapView
          territories={pub.territories}
          players={pub.players}
          phase={pub.phase}
          turnPlayer={pub.turnPlayer}
          selectedTerritory={selectedTerritory}
          attackTarget={attackTarget}
          moveFrom={moveFrom}
          placementMap={placementMap}
          onTerritoryClick={handleTerritoryClick}
          onShowCards={() => setShowCards(true)}
          cardCount={secret.cards.length}
        />
      </div>

      <Sidebar
        pub={pub}
        secret={secret}
        isMyTurn={isMyTurn}
        selectedTerritory={selectedTerritory}
        placementMap={placementMap}
        error={error}
        loading={loading}
        onAddArmy={addArmy}
        onRemoveArmy={removeArmy}
        onPlaceArmies={handlePlaceArmies}
        onExchange={handleExchange}
        onAttack={handleAttack}
        onEndAttacks={handleEndAttacks}
        onEndMoves={handleEndMoves}
        onShowCards={() => setShowCards(true)}
        attackTarget={attackTarget}
      />

      {showCards && (
        <CardHand
          cards={secret.cards}
          objectiveDescription={secret.objectiveDescription}
          forcedExchange={secret.forcedExchange}
          isMyTurn={isMyTurn}
          phase={pub.phase}
          onExchange={handleExchange}
          onClose={() => setShowCards(false)}
        />
      )}

      {diceResult && (
        <DiceModal
          result={diceResult}
          territories={pub.territories}
          players={pub.players}
          turnPlayer={pub.turnPlayer}
          onConquer={(armies) => handleConquer(diceResult.from, diceResult.to, armies)}
          onClose={() => setDiceResult(null)}
        />
      )}

      {moveModal && (
        <MoveModal
          from={moveModal.from}
          to={moveModal.to}
          maxArmies={(pub.territories[moveModal.from]?.armies ?? 1) - 1}
          onMove={(count) => handleMove(moveModal.from, moveModal.to, count)}
          onClose={() => setMoveModal(null)}
        />
      )}
    </div>
  )
}
