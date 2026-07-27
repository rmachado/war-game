import { type GamePublic, type GameSecret } from "../types";
import { StepForward, SwordsIcon } from "lucide-react";

interface RightOverlayProps {
  isMyTurn: boolean;
  pub: GamePublic;
  secret: GameSecret;
  loading: boolean;
  totalPlaced: number;
  isFirstRound: boolean;
  selectedTerritory: string | null;
  attackTarget: string | null;
  handlePlaceArmies: () => Promise<void>;
  handleOpenAttack: () => Promise<void>;
  handleEndAttacks: () => Promise<void>;
  handleEndMoves: () => Promise<void>;
}

export default function RightOverlay({
  isMyTurn,
  pub,
  secret,
  loading,
  totalPlaced,
  isFirstRound,
  selectedTerritory,
  attackTarget,
  handlePlaceArmies,
  handleOpenAttack,
  handleEndAttacks,
  handleEndMoves,
}: RightOverlayProps) {
  if (!isMyTurn) return null;

  return (
    <div className="space-y-2 lg:space-y-5 xl:space-y-6 bg-black/80 backdrop-blur-lg rounded-md px-4 lg:px-8 xl:px-10 py-3 lg:py-6 xl:py-8 shadow-lg shadow-black/40">
      {(pub.phase === "receive" ||
        pub.phase === "place" ||
        pub.phase === "first_round") && (
        <>
          <button
            onClick={handlePlaceArmies}
            disabled={loading || totalPlaced !== secret.pendingArmies}
            className="w-full p-2 lg:p-4 xl:p-5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 rounded text-sm lg:text-lg xl:text-xl font-bold transition shadow-lg shadow-black/50 flex justify-center items-center gap-2 lg:gap-4 xl:gap-5"
          >
            <StepForward className="w-4 lg:w-6 xl:w-7" />
            {isFirstRound ? "Finalizar colocación" : "Iniciar ataques"}
          </button>
        </>
      )}
      {pub.phase === "attack" && (
        <>
          {selectedTerritory && attackTarget && (
            <button
              onClick={handleOpenAttack}
              disabled={loading}
            className="w-full p-2 lg:p-4 xl:p-5 bg-red-600 hover:bg-red-500 disabled:opacity-50 rounded text-sm lg:text-lg xl:text-xl font-bold transition shadow-lg shadow-black/50 flex justify-center items-center gap-2 lg:gap-4 xl:gap-5"
          >
            <SwordsIcon className="w-4 lg:w-6 xl:w-7" />
            Iniciar ataque
            </button>
          )}

          <button
            onClick={handleEndAttacks}
            disabled={loading}
            className="w-full p-2 lg:p-4 xl:p-5 bg-stone-700 hover:bg-stone-600 rounded text-sm lg:text-lg xl:text-xl transition shadow-lg shadow-black/50 border border-stone-600/50 flex justify-center items-center gap-2 lg:gap-4 xl:gap-5"
          >
            <StepForward className="w-4 lg:w-6 xl:w-7" />
            Finalizar ataques
          </button>
        </>
      )}
      {pub.phase === "move" && (
        <>
          <button
            onClick={handleEndMoves}
            disabled={loading}
            className="w-full p-2 lg:p-4 xl:p-5 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 rounded text-xs lg:text-base xl:text-lg font-bold transition shadow-lg shadow-black/50 flex justify-center items-center gap-2 lg:gap-4 xl:gap-5"
          >
            <StepForward className="w-4 lg:w-6 xl:w-7" />
            {secret.conqueredThisTurn
              ? "Finalizar turno (recibir carta)"
              : "Finalizar turno"}
          </button>
        </>
      )}
    </div>
  );
}
