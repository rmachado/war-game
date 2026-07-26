import { useState } from "react";
import type { Card, GamePhase } from "../types";
import TerritoryCard from "./TerritoryCard";
import ObjectiveCard from "./ObjectiveCard";
import { X } from "lucide-react";

interface CardHandProps {
  cards: Card[];
  objectiveDescription: string;
  forcedExchange: boolean;
  isMyTurn: boolean;
  phase: GamePhase;
  onExchange: (cardIds: string[]) => void;
  onClose: () => void;
}

export default function CardHand({
  cards,
  objectiveDescription,
  forcedExchange,
  isMyTurn,
  phase,
  onExchange,
  onClose,
}: CardHandProps) {
  const [selected, setSelected] = useState<string[]>([]);

  function toggleCard(id: string) {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((c) => c !== id)
        : prev.length < 3
          ? [...prev, id]
          : prev,
    );
  }

  const canExchange =
    isMyTurn && (phase === "receive" || phase === "place" || phase === "first_round");
  const isExchangeValid = selected.length === 3;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <div
        className="bg-stone-900 rounded-2xl max-w-5xl w-full max-h-[90vh] p-6 space-y-4 overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold">Tus cartas</h3>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-white text-2xl leading-none"
          >
            <X size={24} className="text-stone-400 hover:text-white" />
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          <div className="md:w-48 flex-shrink-0 flex flex-col items-center gap-3">
            <p className="text-xs text-stone-400 font-semibold uppercase tracking-wide">
              Objetivo
            </p>
            <ObjectiveCard description={objectiveDescription} />
          </div>

          <div className="flex-1 min-w-0 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-stone-400 font-semibold uppercase tracking-wide">
                Territorios ({cards.length})
              </p>
              {canExchange && (
                <p className="text-xs text-stone-400">
                  Seleccionadas:{" "}
                  <span className="text-amber-400 font-bold">
                    {selected.length}
                  </span>{" "}
                  / 3
                </p>
              )}
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {cards.length === 0 && (
                <div className="col-span-full text-center text-stone-500 py-8 text-sm">
                  No tienes cartas de territorio aún. Conquista territorios para
                  obtenerlas.
                </div>
              )}
              {cards.map((card) => (
                <TerritoryCard
                  key={card.id}
                  card={card}
                  isSelected={selected.includes(card.id)}
                  canExchange={canExchange}
                  onToggle={toggleCard}
                />
              ))}
            </div>

            {canExchange && (
              <div className="border-t border-stone-700 pt-3 space-y-2">
                <p className="text-xs text-stone-400">
                  Canje válido: 3 figuras iguales o 3 figuras diferentes.
                  {forcedExchange && (
                    <span className="text-red-400 font-bold block">
                      Debes canjear (tienes 5 o más cartas)
                    </span>
                  )}
                </p>
                <button
                  onClick={() => {
                    onExchange(selected);
                    setSelected([]);
                  }}
                  disabled={!isExchangeValid}
                  className="w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 rounded-xl font-bold text-lg transition"
                >
                  Canjear 3 cartas por ejércitos
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
