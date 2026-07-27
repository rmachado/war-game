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
  loading: boolean;
}

export default function Sidebar({
  pub,
  secret,
  isMyTurn,
  loading,
}: SidebarProps) {
  const tn = useTerritoryName();
  const [mobileOpen, setMobileOpen] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  const currentPlayer = pub.players[pub.turnPlayer];
  const myTerritoryCount = Object.values(pub.territories).filter(
    (t) => t.owner === pub.turnPlayer,
  ).length;
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

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <div
        className={`${mobileOpen ? "fixed top-0 right-0 z-50 w-1/2 h-full p-4 overflow-auto" : "hidden"} lg:relative lg:flex lg:w-80 lg:min-w-[320px] flex-col bg-stone-800 border-l border-stone-700 p-4 gap-2 overflow-auto`}
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
            Tus cartas:{" "}
            <span className="text-white">{secret.cards.length}</span>
          </p>
          <p>
            Canjes realizados:{" "}
            <span className="text-white">{pub.exchangeCounter}</span>
          </p>
        </div>

        <div className="border-t border-stone-700 pt-2 flex-1 min-h-0">
          <h3 className="text-sm font-semibold text-stone-400 mb-1">
            Registro
          </h3>
          <div
            ref={logRef}
            className="flex-1 min-h-20 max-h-[60vh] overflow-y-auto bg-stone-900 rounded p-2 text-xs space-y-1"
          >
            {(!pub.log || pub.log.length === 0) && (
              <p className="text-stone-500">Esperando eventos...</p>
            )}
            {pub.log?.map((entry, i) => (
              <div key={i} className="flex flex-col gap-1">
                <span className="text-stone-500 flex-shrink-0">
                  {entry.time}
                </span>
                <span className="text-stone-300">{entry.message}</span>
              </div>
            ))}
          </div>
        </div>

        {loading && (
          <div className="text-center text-stone-400 text-sm animate-pulse">
            Procesando...
          </div>
        )}
      </div>
    </>
  );
}
