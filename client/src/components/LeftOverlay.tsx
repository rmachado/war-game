import { type GamePublic, type GameSecret } from "../types";
import { ArrowRight, TriangleAlert } from "lucide-react";
import type { Card } from "../types";

interface LeftOverlayProps {
  turnStatus: string;
  isMyTurn: boolean;
  pub: GamePublic;
  secret: GameSecret;
  totalPlaced: number;
  placementMap: Record<string, number>;
  selectedTerritory: string | null;
  attackTarget: string | null;
  error?: string;
  tn: (id: string) => string;
  onShowCards: () => void;
  addArmy: (id: string) => void;
  removeArmy: (id: string) => void;
}

export default function LeftOverlay({
  turnStatus,
  isMyTurn,
  pub,
  secret,
  totalPlaced,
  placementMap,
  selectedTerritory,
  attackTarget,
  error,
  tn,
  onShowCards,
  addArmy,
  removeArmy,
}: LeftOverlayProps) {
  function canExchange(): boolean {
    if (secret.cards.length < 3) return false;
    if (secret.cards.length >= 5) return true;
    const nonJokers = secret.cards.filter((c) => c.symbol !== "joker");
    const jokers = secret.cards.filter((c) => c.symbol === "joker").length;
    if (nonJokers.length < 3) return nonJokers.length + jokers >= 3;
    const counts: Record<string, number> = {};
    for (const c of nonJokers) {
      counts[c.symbol] = (counts[c.symbol] || 0) + 1;
    }
    const symbols = Object.keys(counts);
    if (symbols.some((s) => counts[s] + jokers >= 3)) return true;
    return symbols.length >= 3 || symbols.length + jokers >= 3;
  }
  return (
    <div className="space-y-2 lg:space-y-4">
      <p className="text-amber-400 font-semibold text-xs lg:text-base xl:text-lg uppercase tracking-wide">
        {turnStatus}
      </p>
      {isMyTurn &&
        (pub.phase === "receive" ||
          pub.phase === "place" ||
          pub.phase === "first_round") && (
          <div className="border-t border-stone-700 pt-2 lg:pt-4 space-y-2 lg:space-y-4">
            <p className="text-sm lg:text-lg xl:text-xl">
              Pendientes:{" "}
              <span className="text-amber-400 font-bold">
                {secret.pendingArmies - totalPlaced}
              </span>
            </p>
            {Object.keys(secret.continentBonuses).length > 0 && (
              <div className="text-xs lg:text-base xl:text-lg text-stone-400">
                {Object.entries(secret.continentBonuses).map(([k, v]) => (
                  <p key={k}>
                    +{v} en {k.replace(/-/g, " ")}
                  </p>
                ))}
              </div>
            )}
            {canExchange() && (
              <button
                onClick={onShowCards}
                className="w-full p-2 lg:py-3 xl:py-4 bg-purple-700 hover:bg-purple-600 rounded text-sm lg:text-lg xl:text-xl font-medium transition flex items-center gap-2"
              >
                {secret.forcedExchange ? (
                  <>
                    <TriangleAlert /> Debes canjear cartas (5+)
                  </>
                ) : (
                  "Canjear cartas"
                )}
              </button>
            )}

            {Object.keys(placementMap).length > 0 && (
              <div className="rounded py-2 lg:py-4 xl:py-5 text-sm lg:text-lg xl:text-xl space-y-1 lg:space-y-2 xl:space-y-3">
                {Object.entries(placementMap).map(([id, count]) => (
                  <div
                    key={id}
                    className="flex items-center justify-between gap-2 lg:gap-4 xl:gap-5"
                  >
                    <span>{tn(id)}</span>
                    <div className="flex items-center gap-1 lg:gap-2 xl:gap-3">
                      <button
                        onClick={() => removeArmy(id)}
                        className="w-6 lg:w-10 xl:w-12 h-6 lg:h-10 xl:h-12 bg-stone-600 rounded flex items-center justify-center text-xs lg:text-base xl:text-lg hover:bg-stone-500"
                      >
                        −
                      </button>
                      <span className="w-6 lg:w-10 xl:w-12 text-center font-bold">
                        {count}
                      </span>
                      <button
                        onClick={() => addArmy(id)}
                        className="w-6 lg:w-10 xl:w-12 h-6 lg:h-10 xl:h-12 bg-stone-600 rounded flex items-center justify-center text-xs lg:text-base xl:text-lg hover:bg-stone-500"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      {isMyTurn && pub.phase === "attack" && (
        <div className="border-t border-stone-700 pt-2 lg:pt-5 xl:pt-6 space-y-2">
          <p className="text-xs lg:text-base xl:text-lg text-stone-400">
            {selectedTerritory
              ? attackTarget
                ? `Atacar ${tn(attackTarget)} desde ${tn(selectedTerritory)}`
                : `Elige un blanco enemigo adyacente.`
              : "Elige tu territorio para atacar"}
          </p>
        </div>
      )}
      {isMyTurn && pub.phase === "move" && (
        <div className="border-t border-stone-700 pt-2 lg:pt-5 xl:pt-6 space-y-2">
          <p className="text-xs lg:text-base xl:text-lg text-stone-400 flex items-center gap-1 lg:gap-2 xl:gap-3">
            Selecciona origen <ArrowRight className="w-2 lg:w-4 xl:w-5" />{" "}
            destino
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-900/50 border border-red-700 rounded p-2 text-red-300 text-xs lg:text-base xl:text-lg">
          {error}
        </div>
      )}
    </div>
  );
}
