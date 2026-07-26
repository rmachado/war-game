import { useState, useEffect, useRef } from "react";
import {
  COLOR_MAP,
  COLOR_NAMES,
  type GamePublic,
  type GameSecret,
} from "../types";
import { useTerritoryName } from "../hooks/useGameData";
import { Menu, X, Skull } from "lucide-react";

interface SidebarProps {
  pub: GamePublic;
  secret: GameSecret;
  isMyTurn: boolean;
  selectedTerritory: string | null;
  placementMap: Record<string, number>;
  error: string;
  loading: boolean;
  onAddArmy: (territory: string) => void;
  onRemoveArmy: (territory: string) => void;
  onPlaceArmies: () => void;
  onExchange: (cardIds: string[]) => void;
  onOpenAttack: () => void;
  onEndAttacks: () => void;
  onEndMoves: () => void;
  onShowCards: () => void;
  attackTarget: string | null;
}

export default function Sidebar({
  pub,
  secret,
  isMyTurn,
  selectedTerritory,
  placementMap,
  error,
  loading,
  onAddArmy,
  onRemoveArmy,
  onPlaceArmies,
  onOpenAttack,
  onEndAttacks,
  onEndMoves,
  onShowCards,
  attackTarget,
}: SidebarProps) {
  const tn = useTerritoryName();
  const [mobileOpen, setMobileOpen] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  const currentPlayer = pub.players[pub.turnPlayer];
  const myCardsCount = secret.cards.length;
  const myTerritoryCount = Object.values(pub.territories).filter(
    (t) => t.owner === pub.turnPlayer,
  ).length;
  const totalPlaced = Object.values(placementMap).reduce((a, b) => a + b, 0);
  const isFirstRound = pub.round === 1;

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [pub.log?.length]);

  const turnOrder: number[] = [];
  for (let i = 0; i < pub.players.length; i++) {
    turnOrder.push((pub.turnPlayer + i) % pub.players.length);
  }

  function renderPlayer(orderIdx: number, playerIdx: number) {
    const p = pub.players[playerIdx];
    const isMe = p.color === secret.color;
    const isCurrentTurn = playerIdx === pub.turnPlayer;
    return (
      <div
        key={playerIdx}
        className={`flex items-center gap-2 py-1.5 px-2 rounded ${isCurrentTurn ? "bg-amber-600/20 border border-amber-600/30" : ""} ${!p.alive ? "opacity-40" : ""}`}
      >
        <span className="text-xs text-stone-500 w-4">{orderIdx + 1}.</span>
        <div
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: COLOR_MAP[p.color] }}
        />
        <span className="truncate text-sm flex-1">
          {p.name}
          {isMe ? " (tú)" : ""}
        </span>
        <span className="text-xs text-stone-400">{p.cardCount} cartas</span>
        {!p.alive && <Skull size={14} className="text-red-400" />}
      </div>
    );
  }

  return (
    <>
      <button
        className="lg:hidden fixed bottom-4 right-4 z-50 bg-amber-600 w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-lg"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <div
        className={`${mobileOpen ? "fixed inset-0 z-40 bg-black/80 p-4 pt-16 overflow-auto" : "hidden"} lg:relative lg:flex lg:w-80 lg:min-w-[320px] flex-col bg-stone-800 border-l border-stone-700 p-4 gap-2 overflow-auto`}
      >
        <h2 className="text-lg font-bold truncate">
          Ronda {pub.round}
          {isFirstRound && " — Solo colocación"}
        </h2>

        <div className="text-sm text-stone-400">
          Turno de{" "}
          <span className="text-white font-medium">{currentPlayer?.name}</span>
          {isMyTurn && <span className="text-amber-400 ml-1">(tú)</span>}
        </div>

        {!isMyTurn && (
          <div className="bg-stone-700/50 rounded-lg p-3 text-center text-stone-400 text-sm">
            Esperando a que {currentPlayer?.name} juegue...
          </div>
        )}

        <div className="border-t border-stone-700 pt-2">
          <h3 className="text-sm font-semibold text-stone-400 mb-1">
            Siguientes turnos
          </h3>
          <div className="space-y-0.5">
            {turnOrder.map((playerIdx, orderIdx) =>
              renderPlayer(orderIdx, playerIdx),
            )}
          </div>
        </div>

        <div className="border-t border-stone-700 pt-2 text-sm text-stone-400 space-y-1">
          <p>
            Tus territorios:{" "}
            <span className="text-white">{myTerritoryCount}</span>
          </p>
          <p>
            Tus cartas: <span className="text-white">{myCardsCount}</span>
          </p>
          <p>
            Canjes realizados:{" "}
            <span className="text-white">{pub.exchangeCounter}</span>
          </p>
        </div>

        {isMyTurn &&
          (pub.phase === "receive" ||
            pub.phase === "place" ||
            pub.phase === "first_round") && (
            <div className="border-t border-stone-700 pt-2 space-y-2">
              <h3 className="font-bold text-amber-400">Colocar ejércitos</h3>
              <p className="text-sm">
                Pendientes:{" "}
                <span className="text-amber-400 font-bold">
                  {secret.pendingArmies - totalPlaced}
                </span>
              </p>
              {Object.keys(secret.continentBonuses).length > 0 && (
                <div className="text-xs text-stone-400">
                  {Object.entries(secret.continentBonuses).map(([k, v]) => (
                    <p key={k}>
                      +{v} en {k.replace(/-/g, " ")}
                    </p>
                  ))}
                </div>
              )}
              {secret.cards.length >= 3 && (
                <button
                  onClick={onShowCards}
                  className="w-full py-1.5 bg-purple-700 hover:bg-purple-600 rounded text-sm font-medium transition"
                >
                  {secret.forcedExchange
                    ? "⚠ Debes canjear cartas (5+)"
                    : `Canjear cartas (${secret.cards.length})`}
                </button>
              )}

              {Object.keys(placementMap).length > 0 && (
                <div className="bg-stone-700 rounded p-2 text-sm space-y-1">
                  {Object.entries(placementMap).map(([id, count]) => (
                    <div key={id} className="flex items-center justify-between">
                      <span>{tn(id)}</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onRemoveArmy(id)}
                          className="w-6 h-6 bg-stone-600 rounded flex items-center justify-center text-xs hover:bg-stone-500"
                        >
                          −
                        </button>
                        <span className="w-6 text-center font-bold">
                          {count}
                        </span>
                        <button
                          onClick={() => onAddArmy(id)}
                          className="w-6 h-6 bg-stone-600 rounded flex items-center justify-center text-xs hover:bg-stone-500"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={onPlaceArmies}
                disabled={loading || totalPlaced !== secret.pendingArmies}
                className="w-full py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 rounded font-bold transition"
              >
                {isFirstRound ? "Finalizar colocación" : "Iniciar ataques"}
              </button>
              {isFirstRound && (
                <p className="text-xs text-amber-400/70 text-center">
                  Ronda 1: solo colocación. Los ataques empiezan en la ronda 2.
                </p>
              )}
            </div>
          )}

        {isMyTurn && pub.phase === "attack" && (
          <div className="border-t border-stone-700 pt-2 space-y-2">
            <h3 className="font-bold text-red-400">Ataque</h3>
            <p className="text-xs text-stone-400">
              {selectedTerritory
                ? attackTarget
                  ? `Atacar ${tn(attackTarget)} desde ${tn(selectedTerritory)}`
                  : `Origen: ${tn(selectedTerritory)}. Elige un blanco enemigo adyacente.`
                : "Elige tu territorio para atacar (mín. 2 ejércitos)"}
            </p>

            {selectedTerritory && attackTarget && (
              <button
                onClick={onOpenAttack}
                disabled={loading}
                className="w-full py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 rounded font-bold transition"
              >
                Iniciar ataque
              </button>
            )}

            <button
              onClick={onEndAttacks}
              disabled={loading}
              className="w-full py-1.5 bg-stone-700 hover:bg-stone-600 rounded text-sm transition"
            >
              Finalizar ataques
            </button>
          </div>
        )}

        {isMyTurn && pub.phase === "move" && (
          <div className="border-t border-stone-700 pt-2 space-y-2">
            <h3 className="font-bold text-blue-400">Movimiento</h3>
            <p className="text-xs text-stone-400">
              Haz clic en un territorio tuyo con al menos 2 ejércitos y luego en
              un territorio adyacente para mover 1 ejército.
            </p>
            <button
              onClick={onEndMoves}
              disabled={loading}
              className="w-full py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 rounded font-bold transition"
            >
              {secret.conqueredThisTurn
                ? "Finalizar turno (recibir carta)"
                : "Finalizar turno"}
            </button>
          </div>
        )}

        {error && (
          <div className="bg-red-900/50 border border-red-700 rounded p-2 text-sm text-red-300">
            {error}
          </div>
        )}

        {loading && (
          <div className="text-center text-stone-400 text-sm animate-pulse">
            Procesando...
          </div>
        )}

        <div className="border-t border-stone-700 pt-2 flex-1 min-h-0">
          <h3 className="text-sm font-semibold text-stone-400 mb-1">
            Registro
          </h3>
          <div
            ref={logRef}
            className="flex-1 min-h-[120px] max-h-[50vh] overflow-y-auto bg-stone-900 rounded p-2 text-xs space-y-1"
          >
            {(!pub.log || pub.log.length === 0) && (
              <p className="text-stone-500">Esperando eventos...</p>
            )}
            {pub.log?.map((entry, i) => (
              <div key={i} className="flex flex-col gap-2">
                <span className="text-stone-500">{entry.time}</span>
                <span className="text-stone-300">{entry.message}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
