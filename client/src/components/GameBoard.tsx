import { useState } from "react";
import { useGameStore, useGameState } from "../store/game";
import MapView from "./MapView";
import Sidebar from "./Sidebar";
import AttackModal from "./AttackModal";
import CardHand from "./CardHand";
import MoveModal from "./MoveModal";
import { COLOR_MAP, type GamePublic, type GameSecret } from "../types";
import { useTerritoryName, useNeighbors } from "../hooks/useGameData";
import LeftOverlay from "./LeftOverlay";
import RightOverlay from "./RightOverlay";
import ObjectiveCard from "./ObjectiveCard";
import OrientationGuard from "./OrientationGuard";

export default function GameBoard() {
  const { token } = useGameStore();
  const {
    public: pub,
    secret,
    isConnected,
    sendAction: _sendAction,
    spectatorIntent,
    spectatorResult,
  } = useGameState();
  const sendAction = _sendAction ?? ((() => {}) as any);

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
  const [showCards, setShowCards] = useState(false);
  const [moveFrom, setMoveFrom] = useState<string | null>(null);
  const [moveModal, setMoveModal] = useState<{
    from: string;
    to: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const onShowCards = () => setShowCards(true);

  const tn = useTerritoryName();
  const neighborsOf = useNeighbors();

  if (!isConnected || !pub || !secret)
    return (
      <div className="flex items-center justify-center min-h-screen text-stone-400">
        Cargando...
      </div>
    );

  const _pub: GamePublic = pub
  const _secret: GameSecret = secret
  const isMyTurn = _secret.color === _pub.players[_pub.turnPlayer]?.color;
  const isFirstRound = _pub.round === 1;
  const [showObjective, setShowObjective] = useState(false);

  let turnStatus = "";
  if (_pub.phase === "game_over") {
    turnStatus =
      _pub.winner !== null
        ? `Juego terminado — ${_pub.players[_pub.winner]?.name} ganó`
        : "Juego terminado";
  } else if (!isMyTurn) {
    turnStatus = `Esperando que ${_pub.players[_pub.turnPlayer]?.name || "?"} juegue...`;
  } else if (
    _pub.phase === "first_round" ||
    _pub.phase === "receive" ||
    _pub.phase === "place"
  ) {
    turnStatus = "Colocar ejércitos";
  } else if (_pub.phase === "attack") {
    turnStatus = "Atacar territorios";
  } else if (_pub.phase === "move") {
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
    sendAction("exchange", { cardIds });
    setLoading(false);
  }

  async function handlePlaceArmies() {
    const total = Object.values(placementMap).reduce((a, b) => a + b, 0);
    if (total !== _secret.pendingArmies) {
      setError(
        `Debes colocar exactamente ${_secret.pendingArmies} ejércitos (colocados: ${total})`,
      );
      return;
    }
    setLoading(true);
    setError("");
    sendAction("place-armies", { placements: placementMap });
    setPlacementMap({});
    setLoading(false);
  }

  function addArmy(territory: string) {
    const current = Object.values(placementMap).reduce((a, b) => a + b, 0);
    if (current >= _secret.pendingArmies) return;
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

    const terr = _pub.territories[territoryId];
    const isMine = terr?.owner === _pub.turnPlayer;

    if (
      _pub.phase === "receive" ||
      _pub.phase === "place" ||
      _pub.phase === "first_round"
    ) {
      if (isMine) {
        setSelectedTerritory((select) =>
          select === territoryId ? null : territoryId,
        );
        addArmy(territoryId);
      }
      return;
    }

    if (_pub.phase === "attack") {
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

    if (_pub.phase === "move") {
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

  function handleAttack(from: string, to: string, armies: number): Promise<any> {
    setLoading(true);
    setError("");
    sendAction("attack", { from, to, armies });
    setLoading(false);
    return Promise.resolve({ phony: true });
  }

  function handleMove(from: string, to: string, count: number = 1) {
    setLoading(true);
    setError("");
    sendAction("move", { from, to, count });
    setMoveModal(null);
    setLoading(false);
  }

  function handleConquer(armies: number): Promise<any> {
    setLoading(true);
    setError("");
    sendAction("conquer", { armies });
    sendAction("attack:intent", { from: null, to: null });
    setAttackIntent(null);
    setSelectedTerritory(null);
    setAttackTarget(null);
    setLoading(false);
    return Promise.resolve({ phony: true });
  }

  function handleOpenAttack() {
    if (selectedTerritory && attackTarget) {
      sendAction("attack:intent", {
        from: selectedTerritory,
        to: attackTarget,
      });
      setAttackIntent({ from: selectedTerritory, to: attackTarget });
    }
  }

  function handleEndAttacks() {
    setLoading(true);
    sendAction("end-attacks");
    setSelectedTerritory(null);
    setAttackTarget(null);
    setLoading(false);
  }

  function handleEndMoves() {
    setLoading(true);
    sendAction("end-moves");
    setLoading(false);
  }

  const winnerName = _pub.winner !== null ? _pub.players[_pub.winner]?.name : null;
  const winnerColor =
    _pub.winner !== null ? _pub.players[_pub.winner]?.color : null;

  return (
    <OrientationGuard>
      <div className="h-screen">
        <div className="flex flex-col lg:flex-row h-full">
          <div className="flex-1 relative min-h-0">
            <MapView
              territories={_pub.territories}
              players={_pub.players}
              phase={_pub.phase}
              turnPlayer={_pub.turnPlayer}
              selectedTerritory={selectedTerritory}
              attackTarget={attackTarget}
              moveFrom={moveFrom}
              placementMap={placementMap}
              onTerritoryClick={handleTerritoryClick}
              onShowCards={onShowCards}
              cardCount={_secret.cards.length}
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
              exchangeCounter={_pub.exchangeCounter}
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
              cards={_secret.cards}
              objectiveDescription={_secret.objectiveDescription}
              forcedExchange={_secret.forcedExchange}
              isMyTurn={isMyTurn}
              phase={_pub.phase}
              onExchange={handleExchange}
              onClose={() => setShowCards(false)}
            />
          )}

          {attackIntent && (
            <AttackModal
              from={attackIntent.from}
              to={attackIntent.to}
              fromArmies={_pub.territories[attackIntent.from]?.armies ?? 0}
              toArmies={_pub.territories[attackIntent.to]?.armies ?? 0}
              attackerName={_secret.name}
              attackerColor={
                COLOR_MAP[_pub.players[_pub.turnPlayer]?.color] || "#dc2626"
              }
              defenderName={
                _pub.players[_pub.territories[attackIntent.to]?.owner]?.name ||
                "?"
              }
              defenderColor={
                COLOR_MAP[
                  _pub.players[_pub.territories[attackIntent.to]?.owner]?.color
                ] || "#eab308"
              }
              readonly={false}
              onAttack={handleAttack}
              onConquer={handleConquer}
              onClose={() => {
                sendAction("attack:intent", { from: null, to: null });
                setAttackIntent(null);
              }}
            />
          )}

          {!attackIntent && _pub.pendingConquest && isMyTurn && (
            <AttackModal
              from={_pub.pendingConquest.from}
              to={_pub.pendingConquest.to}
              fromArmies={
                _pub.territories[_pub.pendingConquest.from]?.armies ?? 0
              }
              toArmies={_pub.territories[_pub.pendingConquest.to]?.armies ?? 0}
              attackerName={_secret.name}
              attackerColor={
                COLOR_MAP[_pub.players[_pub.turnPlayer]?.color] || "#dc2626"
              }
              defenderName={
                _pub.players[_pub.territories[_pub.pendingConquest.to]?.owner]
                  ?.name || "?"
              }
              defenderColor={
                COLOR_MAP[
                  _pub.players[_pub.territories[_pub.pendingConquest.to]?.owner]
                    ?.color
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
                fromArmies={_pub.territories[spectatorIntent.from]?.armies ?? 0}
                toArmies={_pub.territories[spectatorIntent.to]?.armies ?? 0}
                attackerName={
                  _pub.players.find((p) => p.color === spectatorIntent.color)
                    ?.name || "?"
                }
                attackerColor={
                  COLOR_MAP[spectatorIntent.color as keyof typeof COLOR_MAP] ||
                  "#dc2626"
                }
                defenderName={
                  _pub.players[_pub.territories[spectatorIntent.to]?.owner]
                    ?.name || "?"
                }
                defenderColor={
                  COLOR_MAP[
                    _pub.players[_pub.territories[spectatorIntent.to]?.owner]
                      ?.color
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
              maxArmies={(_pub.territories[moveModal.from]?.armies ?? 1) - 1}
              onMove={(count) =>
                handleMove(moveModal.from, moveModal.to, count)
              }
              onClose={() => setMoveModal(null)}
            />
          )}
        </div>

        {_pub.phase === "game_over" && winnerName ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-stone-900/60 rounded-2xl border border-amber-500/30 p-10 flex flex-col items-center gap-6 shadow-2xl max-w-md">
              <h1 className="text-4xl font-bold text-center">
                ¡
                <span
                  style={{
                    color:
                      COLOR_MAP[winnerColor as keyof typeof COLOR_MAP] ||
                      "#fbbf24",
                  }}
                >
                  {winnerName}
                </span>{" "}
                ha ganado!
              </h1>
              <ObjectiveCard
                description={_pub.winnerObjective || ""}
                className="w-48"
              />
              <button
                onClick={() => (window.location.href = "/")}
                className="mt-2 px-8 py-3 bg-amber-600 hover:bg-amber-500 rounded-xl font-bold text-lg transition"
              >
                Volver al inicio
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </OrientationGuard>
  );
}
