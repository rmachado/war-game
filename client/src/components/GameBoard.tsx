import { useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useGame, useGameStore } from "../store/game";
import { useGameSocket } from "../hooks/useGameSocket";
import {
  placeArmies,
  exchangeCards,
  attack as apiAttack,
  conquer as apiConquer,
  endAttacks,
  endMoves,
  moveArmies,
} from "../api/game";
import MapView from "./MapView";
import Sidebar from "./Sidebar";
import AttackModal from "./AttackModal";
import CardHand from "./CardHand";
import MoveModal from "./MoveModal";
import {
  COLOR_MAP,
  type GamePublic,
  type GameSecret,
  type TerritoryState,
} from "../types";
import { useTerritoryName, useNeighbors } from "../hooks/useGameData";
import LeftOverlay from "./LeftOverlay";
import RightOverlay from "./RightOverlay";

export default function GameBoard() {
  const { code } = useParams<{ code: string }>();
  const { token } = useGameStore();
  const { data, refetch } = useGame(code!, token);

  const [selectedTerritory, setSelectedTerritory] = useState<string | null>(
    null,
  );
  const [attackTarget, setAttackTarget] = useState<string | null>(null);
  const [placementMap, setPlacementMap] = useState<Record<string, number>>({});
  const [error, setError] = useState("");
  const [attackIntent, setAttackIntent] = useState<{
    from: string;
    to: string;
  } | null>(null);
  const [spectatorIntent, setSpectatorIntent] = useState<{
    from: string;
    to: string;
    color: string;
  } | null>(null);
  const [spectatorResult, setSpectatorResult] = useState<any>(null);
  const [showCards, setShowCards] = useState(false);
  const [moveFrom, setMoveFrom] = useState<string | null>(null);
  const [moveModal, setMoveModal] = useState<{
    from: string;
    to: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const onShowCards = () => setShowCards(true);

  const handleAttackIntent = useCallback(
    (from: string | null, to: string | null, color?: string) => {
      if (from && to) {
        setSpectatorIntent({ from, to, color: color || "" });
        setSpectatorResult(null);
      } else {
        setSpectatorIntent(null);
        setSpectatorResult(null);
      }
    },
    [],
  );

  const handleAttackResult = useCallback((result: any) => {
    setSpectatorResult(result);
  }, []);

  const { sendAttackIntent } = useGameSocket(
    code!,
    token,
    handleAttackIntent,
    handleAttackResult,
  );

  const tn = useTerritoryName();
  const neighborsOf = useNeighbors();

  if (!data)
    return (
      <div className="flex items-center justify-center min-h-screen text-stone-400">
        Cargando...
      </div>
    );

  const { public: pub, secret } = data;
  const isMyTurn = secret.color === pub.players[pub.turnPlayer]?.color;
  const isFirstRound = pub.round === 1;
  const [showObjective, setShowObjective] = useState(false);

  let turnStatus = "";
  if (pub.phase === "game_over") {
    turnStatus =
      pub.winner !== null
        ? `Juego terminado — ${pub.players[pub.winner]?.name} ganó`
        : "Juego terminado";
  } else if (!isMyTurn) {
    turnStatus = `Esperando que ${pub.players[pub.turnPlayer]?.name || "?"} juegue...`;
  } else if (
    pub.phase === "first_round" ||
    pub.phase === "receive" ||
    pub.phase === "place"
  ) {
    turnStatus = "Colocar ejércitos";
  } else if (pub.phase === "attack") {
    turnStatus = "Atacar territorios";
  } else if (pub.phase === "move") {
    turnStatus = "Mover ejércitos";
  }

  const totalPlaced = Object.values(placementMap).reduce((a, b) => a + b, 0);

  const leftOverlay = (
    <LeftOverlay
      turnStatus={turnStatus}
      isMyTurn={isMyTurn}
      pub={pub}
      secret={secret}
      totalPlaced={totalPlaced}
      placementMap={placementMap}
      selectedTerritory={selectedTerritory}
      attackTarget={attackTarget}
      error={error}
      tn={tn}
      onShowCards={onShowCards}
      addArmy={addArmy}
      removeArmy={removeArmy}
    />
  );

  const rightOverlay = (
    <RightOverlay
      isMyTurn={isMyTurn}
      pub={pub}
      secret={secret}
      loading={loading}
      totalPlaced={totalPlaced}
      isFirstRound={isFirstRound}
      selectedTerritory={selectedTerritory}
      attackTarget={attackTarget}
      handlePlaceArmies={handlePlaceArmies}
      handleOpenAttack={handleOpenAttack}
      handleEndAttacks={handleEndAttacks}
      handleEndMoves={handleEndMoves}
    />
  );

  async function handleExchange(cardIds: string[]) {
    setLoading(true);
    setError("");
    try {
      await exchangeCards(code!, token!, cardIds);
      refetch();
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  }

  async function handlePlaceArmies() {
    const total = Object.values(placementMap).reduce((a, b) => a + b, 0);
    if (total !== secret.pendingArmies) {
      setError(
        `Debes colocar exactamente ${secret.pendingArmies} ejércitos (colocados: ${total})`,
      );
      return;
    }
    setLoading(true);
    setError("");
    try {
      await placeArmies(code!, token!, placementMap);
      setPlacementMap({});
      refetch();
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  }

  function addArmy(territory: string) {
    const current = Object.values(placementMap).reduce((a, b) => a + b, 0);
    if (current >= secret.pendingArmies) return;
    setPlacementMap((prev) => ({
      ...prev,
      [territory]: (prev[territory] || 0) + 1,
    }));
  }

  function removeArmy(territory: string) {
    setPlacementMap((prev) => {
      const next = { ...prev };
      if (next[territory] <= 1) {
        delete next[territory];
      } else {
        next[territory]--;
      }
      return next;
    });
  }

  function handleTerritoryClick(territoryId: string) {
    if (!isMyTurn) return;

    const terr = pub.territories[territoryId];
    const isMine = terr?.owner === pub.turnPlayer;

    if (
      pub.phase === "receive" ||
      pub.phase === "place" ||
      pub.phase === "first_round"
    ) {
      if (isMine) {
        setSelectedTerritory((select) =>
          select === territoryId ? null : territoryId,
        );
        addArmy(territoryId);
      }
      return;
    }

    if (pub.phase === "attack") {
      if (isMine && terr.armies >= 2) {
        setSelectedTerritory((select) =>
          select === territoryId ? null : territoryId,
        );
        setAttackTarget(null);
      } else if (!isMine && selectedTerritory) {
        const neighbors = neighborsOf(selectedTerritory);
        if (!neighbors.includes(territoryId)) {
          setError(
            `${tn(territoryId)} no es adyacente a ${tn(selectedTerritory)}`,
          );
          return;
        }
        setAttackTarget(territoryId);
      }
      return;
    }

    if (pub.phase === "move") {
      if (isMine && terr.armies >= 2 && !moveFrom) {
        setMoveFrom(territoryId);
        setSelectedTerritory(territoryId);
      } else if (moveFrom && isMine && territoryId !== moveFrom) {
        const neighbors = neighborsOf(moveFrom);
        if (!neighbors.includes(territoryId)) {
          setError(`${tn(territoryId)} no es adyacente a ${tn(moveFrom)}`);
          setMoveFrom(null);
          setSelectedTerritory(null);
          return;
        }
        setMoveFrom(null);
        setSelectedTerritory(null);
        setMoveModal({ from: moveFrom, to: territoryId });
      } else if (moveFrom === territoryId) {
        setMoveFrom(null);
        setSelectedTerritory(null);
      }
      return;
    }
  }

  async function handleAttack(from: string, to: string, armies: number) {
    setLoading(true);
    setError("");
    try {
      const result = await apiAttack(code!, token!, from, to, armies);
      refetch();
      return result;
    } catch (e: any) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function handleMove(from: string, to: string, count: number = 1) {
    setLoading(true);
    setError("");
    try {
      await moveArmies(code!, token!, from, to, count);
      setMoveModal(null);
      refetch();
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  }

  async function handleConquer(armies: number) {
    setLoading(true);
    setError("");
    try {
      await apiConquer(code!, token!, armies);
      sendAttackIntent(null, null);
      setAttackIntent(null);
      setSelectedTerritory(null);
      setAttackTarget(null);
      refetch();
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  }

  async function handleOpenAttack() {
    if (selectedTerritory && attackTarget) {
      sendAttackIntent(selectedTerritory, attackTarget);
      setAttackIntent({ from: selectedTerritory, to: attackTarget });
    }
  }

  async function handleEndAttacks() {
    setLoading(true);
    try {
      await endAttacks(code!, token!);
      setSelectedTerritory(null);
      setAttackTarget(null);
      refetch();
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  }

  async function handleEndMoves() {
    setLoading(true);
    try {
      await endMoves(code!, token!);
      refetch();
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  }

  if (pub.phase === "game_over") {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">
            {pub.winner !== null ? "¡Juego terminado!" : "Juego terminado"}
          </h1>
          {pub.winner !== null && (
            <p className="text-2xl text-amber-400">
              {pub.players[pub.winner]?.name} ha ganado
            </p>
          )}
          <button
            onClick={() => (window.location.href = "/")}
            className="mt-6 px-6 py-3 bg-stone-700 hover:bg-stone-600 rounded-lg transition"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
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
          onShowCards={onShowCards}
          cardCount={secret.cards.length}
          attackIntent={attackIntent}
          attackArrow={
            spectatorIntent?.from && spectatorIntent?.to
              ? { from: spectatorIntent.from, to: spectatorIntent.to }
              : isMyTurn && selectedTerritory && attackTarget
                ? { from: selectedTerritory, to: attackTarget }
                : null
          }
          turnStatus={turnStatus}
          leftOverlay={leftOverlay}
          rightOverlay={rightOverlay}
        />
      </div>

      <Sidebar
        pub={pub}
        secret={secret}
        isMyTurn={isMyTurn}
        loading={loading}
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

      {attackIntent && (
        <AttackModal
          from={attackIntent.from}
          to={attackIntent.to}
          fromArmies={pub.territories[attackIntent.from]?.armies ?? 0}
          toArmies={pub.territories[attackIntent.to]?.armies ?? 0}
          attackerName={secret.name}
          attackerColor={
            COLOR_MAP[pub.players[pub.turnPlayer]?.color] || "#dc2626"
          }
          defenderName={
            pub.players[pub.territories[attackIntent.to]?.owner]?.name || "?"
          }
          defenderColor={
            COLOR_MAP[
              pub.players[pub.territories[attackIntent.to]?.owner]?.color
            ] || "#eab308"
          }
          readonly={false}
          onAttack={handleAttack}
          onConquer={handleConquer}
          onClose={() => {
            sendAttackIntent(null, null);
            setAttackIntent(null);
          }}
        />
      )}

      {!attackIntent && pub.pendingConquest && isMyTurn && (
        <AttackModal
          from={pub.pendingConquest.from}
          to={pub.pendingConquest.to}
          fromArmies={pub.territories[pub.pendingConquest.from]?.armies ?? 0}
          toArmies={pub.territories[pub.pendingConquest.to]?.armies ?? 0}
          attackerName={secret.name}
          attackerColor={
            COLOR_MAP[pub.players[pub.turnPlayer]?.color] || "#dc2626"
          }
          defenderName={
            pub.players[pub.territories[pub.pendingConquest.to]?.owner]?.name ||
            "?"
          }
          defenderColor={
            COLOR_MAP[
              pub.players[pub.territories[pub.pendingConquest.to]?.owner]?.color
            ] || "#eab308"
          }
          readonly={false}
          onConquer={handleConquer}
          onClose={() => {}}
        />
      )}

      {!attackIntent &&
        spectatorIntent &&
        spectatorIntent.color !== token?.split(":")[1] && (
          <AttackModal
            from={spectatorIntent.from}
            to={spectatorIntent.to}
            fromArmies={pub.territories[spectatorIntent.from]?.armies ?? 0}
            toArmies={pub.territories[spectatorIntent.to]?.armies ?? 0}
            attackerName={
              pub.players.find((p) => p.color === spectatorIntent.color)
                ?.name || "?"
            }
            attackerColor={
              COLOR_MAP[spectatorIntent.color as keyof typeof COLOR_MAP] ||
              "#dc2626"
            }
            defenderName={
              pub.players[pub.territories[spectatorIntent.to]?.owner]?.name ||
              "?"
            }
            defenderColor={
              COLOR_MAP[
                pub.players[pub.territories[spectatorIntent.to]?.owner]?.color
              ] || "#eab308"
            }
            readonly={true}
            spectatorResult={spectatorResult}
            onClose={() => {}}
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
  );
}
