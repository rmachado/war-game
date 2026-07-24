import { TERRITORY_NAMES, type Card, type CardSymbol } from "../types";

const SHAPE_SVGS: Record<string, string> = {
  triangulo: `<svg viewBox="0 0 24 24" width="48" height="48"><polygon points="12,2 22,20 2,20" fill="black"/></svg>`,
  cuadrado: `<svg viewBox="0 0 24 24" width="48" height="48"><rect x="3" y="3" width="18" height="18" rx="1" fill="black"/></svg>`,
  circulo: `<svg viewBox="0 0 24 24" width="48" height="48"><circle cx="12" cy="12" r="9" fill="black"/></svg>`,
};

interface SymbolIconProps {
  symbol: CardSymbol;
}

function SymbolIcon({ symbol }: SymbolIconProps) {
  return (
    <div className="mt-auto mb-2">
      <span dangerouslySetInnerHTML={{ __html: SHAPE_SVGS[symbol] }} />
    </div>
  );
}

interface TerritoryCardProps {
  card: Card;
  isSelected: boolean;
  canExchange: boolean;
  onToggle: (id: string) => void;
}

export default function TerritoryCard({
  card,
  isSelected,
  canExchange,
  onToggle,
}: TerritoryCardProps) {
  const isJoker = card.symbol === "joker";
  const territoryName = TERRITORY_NAMES[card.id];

  return (
    <button
      onClick={() => (canExchange ? onToggle(card.id) : undefined)}
      disabled={!canExchange && !isSelected}
      className={`relative aspect-[2.5/4.0] rounded-xl border-2 transition-all overflow-hidden ${
        isSelected
          ? "border-amber-400 shadow-lg shadow-amber-400/30 scale-[1.03]"
          : "border-stone-600 hover:border-stone-400"
      } ${!canExchange ? "cursor-default" : "cursor-pointer"}`}
      style={{
        backgroundImage: "url(/card-territory.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {isJoker ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-3">
          <div className="flex gap-1 mb-1">
            <SymbolIcon symbol="triangulo" />
          </div>
          <div className="flex gap-1 mb-1">
            <SymbolIcon symbol="cuadrado" />
            <SymbolIcon symbol="circulo" />
          </div>
        </div>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center px-2 py-4">
          <div className="absolute top-4 left-4 z-10">
            <SymbolIcon symbol={card.symbol} />
          </div>
          <div className="flex-1 flex p-4 items-center justify-center w-full overflow-hidden">
            <img
              src={`/territories/${card.id}.svg`}
              alt={territoryName || card.id}
              className="w-full h-full drop-shadow-sm"
              style={{ objectFit: "contain" }}
            />
          </div>
          <span className="text-black text-md font-semibold text-center leading-tight mt-1 drop-shadow-md px-1">
            {territoryName || card.id}
          </span>
        </div>
      )}
      {isSelected && (
        <div className="absolute top-2 right-2 w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center text-black text-xs font-bold shadow-lg">
          &#10003;
        </div>
      )}
    </button>
  );
}
