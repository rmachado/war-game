import {
  useRef,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import {
  COLOR_MAP,
  type PlayerPublic,
  type TerritoryState,
  type GamePhase,
} from "../types";
import {
  useTerritoryNames,
  useContinents,
  useExchangeTable,
} from "../hooks/useGameData";

import { ZoomIn, ZoomOut, Maximize } from "lucide-react";

const BOARD_W = 1920;
const BOARD_H = 1281;
const MIN_SCALE = 0.4;
const MAX_SCALE = 2.5;

const TERRITORY_POSITIONS: Record<string, { x: number; y: number }> = {
  alaska: { x: 13.5, y: 17.9 },
  california: { x: 14.2, y: 32.1 },
  groenlandia: { x: 37.8, y: 16.7 },
  labrador: { x: 28.9, y: 27.9 },
  mackenzie: { x: 21.1, y: 19.9 },
  mexico: { x: 13.9, y: 44.2 },
  nuevayork: { x: 20.3, y: 37.2 },
  ottawa: { x: 23.2, y: 27.0 },
  vancouver: { x: 17.0, y: 25.0 },
  argentina: { x: 26.0, y: 76.0 },
  brasil: { x: 29.1, y: 63.3 },
  peru: { x: 23.3, y: 66.1 },
  colombia: { x: 23.0, y: 53.7 },
  alemania: { x: 49.9, y: 30.1 },
  inglaterra: { x: 42.7, y: 30.5 },
  islandia: { x: 43.8, y: 23.4 },
  moscu: { x: 58.8, y: 27.9 },
  yugoslavia: { x: 53.6, y: 34.7 },
  francia: { x: 47.3, y: 35.4 },
  suecia: { x: 51.5, y: 19.7 },
  sudafrica: { x: 53.9, y: 74.1 },
  argelia: { x: 46.5, y: 48.6 },
  congo: { x: 53.3, y: 63.2 },
  egipto: { x: 54.1, y: 44.8 },
  madagascar: { x: 61.4, y: 71.4 },
  sudan: { x: 57.3, y: 54.0 },
  aral: { x: 66.6, y: 35.0 },
  china: { x: 79.3, y: 41.6 },
  chita: { x: 76.3, y: 29.7 },
  dudinka: { x: 68.3, y: 18.0 },
  india: { x: 72.0, y: 47.9 },
  japon: { x: 93.8, y: 40.7 },
  mediooriente: { x: 61.1, y: 43.5 },
  mongolia: { x: 77.8, y: 35.5 },
  omsk: { x: 66.3, y: 27.0 },
  siberia: { x: 74.7, y: 21.6 },
  vietnam: { x: 80.9, y: 52.7 },
  vladivostok: { x: 84.0, y: 24.7 },
  australia: { x: 83.4, y: 78.1 },
  borneo: { x: 84.2, y: 62.8 },
  nuevaguinea: { x: 92.0, y: 69.8 },
  sumatra: { x: 78.5, y: 63.7 },
};

interface MapViewProps {
  territories: Record<string, TerritoryState>;
  players: PlayerPublic[];
  phase: GamePhase;
  turnPlayer: number;
  selectedTerritory: string | null;
  attackTarget: string | null;
  moveFrom: string | null;
  placementMap: Record<string, number>;
  onTerritoryClick: (territoryId: string) => void;
  onShowCards: () => void;
  cardCount: number;
  attackIntent: { from: string; to: string } | null;
  attackArrow: { from: string; to: string } | null;
  turnStatus: string;
  leftOverlay: ReactNode;
  rightOverlay: ReactNode;
  exchangeCounter: number;
}

export default function MapView({
  territories,
  players,
  phase,
  turnPlayer,
  selectedTerritory,
  attackTarget,
  moveFrom,
  placementMap,
  onTerritoryClick,
  onShowCards,
  cardCount,
  attackIntent,
  attackArrow,
  turnStatus,
  leftOverlay,
  rightOverlay,
  exchangeCounter,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const territoryNames = useTerritoryNames();
  const continents = useContinents();
  const exchangeTable = useExchangeTable();
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [debugCoords, setDebugCoords] = useState<{ pct: string } | null>(null);
  const [showDebug, setShowDebug] = useState(false);

  const fitBoard = useCallback(() => {
    if (!containerRef.current) return;
    const w = containerRef.current.clientWidth;
    const h = containerRef.current.clientHeight;
    const s = Math.min(w / BOARD_W, h / BOARD_H) * 0.95;
    setScale(s);
    setOffset({ x: (w - BOARD_W * s) / 2, y: (h - BOARD_H * s) / 2 });
  }, []);

  useEffect(() => {
    fitBoard();
    window.addEventListener("resize", fitBoard);
    return () => window.removeEventListener("resize", fitBoard);
  }, [fitBoard]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "d" && e.ctrlKey) {
        e.preventDefault();
        setShowDebug((d) => !d);
      }
      if (e.key === "0" && e.ctrlKey) {
        e.preventDefault();
        fitBoard();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [fitBoard]);

  const lastPinchDist = useRef(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    function onWheel(e: WheelEvent) {
      e.preventDefault();
      const rect = el!.getBoundingClientRect();
      zoom(e.deltaY > 0 ? -1 : 1, e.clientX - rect.left, e.clientY - rect.top);
    }
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  function zoom(delta: number, cx?: number, cy?: number) {
    setScale((prev) => {
      const next = Math.max(
        MIN_SCALE,
        Math.min(MAX_SCALE, prev * (1 + delta * 0.1)),
      );
      if (cx !== undefined && cy !== undefined) {
        const ratio = next / prev;
        setOffset((o) => ({
          x: cx - (cx - o.x) * ratio,
          y: cy - (cy - o.y) * ratio,
        }));
      }
      return next;
    });
  }

  function handleMouseDown(e: React.MouseEvent) {
    if (e.button !== 0) return;
    setDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (dragging) {
      setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
    if (showDebug && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const boardX = (e.clientX - rect.left - offset.x) / scale;
      const boardY = (e.clientY - rect.top - offset.y) / scale;
      const pctX = ((boardX / BOARD_W) * 100).toFixed(1);
      const pctY = ((boardY / BOARD_H) * 100).toFixed(1);
      setDebugCoords({ pct: `x: ${pctX}, y: ${pctY}` });
    }
  }

  function handleMouseUp() {
    setDragging(false);
  }

  function handleMapClick(e: React.MouseEvent) {
    if (!showDebug || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const boardX = (e.clientX - rect.left - offset.x) / scale;
    const boardY = (e.clientY - rect.top - offset.y) / scale;
    const pctX = ((boardX / BOARD_W) * 100).toFixed(1);
    const pctY = ((boardY / BOARD_H) * 100).toFixed(1);
    navigator.clipboard.writeText(`{ x: ${pctX}, y: ${pctY} }`);
  }

  function getOwnerColor(territoryId: string): string {
    const t = territories[territoryId];
    if (!t || t.owner < 0) return "transparent";
    const color = players[t.owner]?.color;
    return color && COLOR_MAP[color] ? COLOR_MAP[color] + "99" : "transparent";
  }

  function getBorderColor(territoryId: string): string {
    const t = territories[territoryId];
    if (!t || t.owner < 0) return "#666";
    const color = players[t.owner]?.color;
    return color && COLOR_MAP[color] ? COLOR_MAP[color] : "#666";
  }

  function getGlow(territoryId: string): string {
    if (territoryId === selectedTerritory) return "0 0 8px 2px #fbbf24";
    if (territoryId === attackTarget) return "0 0 8px 2px #ef4444";
    if (territoryId === moveFrom) return "0 0 8px 2px #3b82f6";
    return "none";
  }

  function getRingColor(territoryId: string): string {
    if (territoryId === selectedTerritory) return "#fbbf24";
    if (territoryId === attackTarget) return "#ef4444";
    if (territoryId === moveFrom) return "#3b82f6";
    return getBorderColor(territoryId);
  }

  return (
    <div
      ref={containerRef}
      className="w-full h-full bg-stone-950 overflow-hidden relative select-none touch-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={(e) => {
        if (e.touches.length === 1) {
          setDragging(true);
          setDragStart({
            x: e.touches[0].clientX - offset.x,
            y: e.touches[0].clientY - offset.y,
          });
        } else if (e.touches.length === 2) {
          const dx = e.touches[0].clientX - e.touches[1].clientX;
          const dy = e.touches[0].clientY - e.touches[1].clientY;
          lastPinchDist.current = Math.hypot(dx, dy);
        }
      }}
      onTouchMove={(e) => {
        if (e.touches.length === 2 && lastPinchDist.current > 0) {
          const dx = e.touches[0].clientX - e.touches[1].clientX;
          const dy = e.touches[0].clientY - e.touches[1].clientY;
          const dist = Math.hypot(dx, dy);
          const delta = (dist - lastPinchDist.current) / 20;
          lastPinchDist.current = dist;
          const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
          const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
          const rect = containerRef.current?.getBoundingClientRect();
          if (rect) zoom(delta > 0 ? 1 : -1, midX - rect.left, midY - rect.top);
        } else if (e.touches.length === 1 && dragging) {
          setOffset({
            x: e.touches[0].clientX - dragStart.x,
            y: e.touches[0].clientY - dragStart.y,
          });
        }
      }}
      onTouchEnd={() => {
        setDragging(false);
        lastPinchDist.current = 0;
      }}
      onTouchCancel={() => {
        setDragging(false);
        lastPinchDist.current = 0;
      }}
    >
      <div
        className="absolute"
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
          transformOrigin: "0 0",
          width: BOARD_W,
          height: BOARD_H,
        }}
      >
        <img
          src="/board.png"
          alt="Mapa WAR"
          width={BOARD_W}
          height={BOARD_H}
          className="absolute inset-0 pointer-events-none select-none"
          draggable={false}
        />

        {Object.keys(territoryNames).map((id) => {
          const pos = TERRITORY_POSITIONS[id];
          if (!pos) return null;

          const t = territories[id];
          const placement = placementMap[id] || 0;
          const ownerColor = getOwnerColor(id);
          const ringColor = getRingColor(id);
          const glow = getGlow(id);
          const isSelected = id === selectedTerritory;
          const showPlaced = placement > 0;

          const cx = (pos.x / 100) * BOARD_W;
          const cy = (pos.y / 100) * BOARD_H;
          const radius = 28;

          return (
            <div
              key={id}
              onClick={(e) => {
                e.stopPropagation();
                if (showDebug && containerRef.current) {
                  const rect = containerRef.current.getBoundingClientRect();
                  const bx = (e.clientX - rect.left - offset.x) / scale;
                  const by = (e.clientY - rect.top - offset.y) / scale;
                  const px = ((bx / BOARD_W) * 100).toFixed(1);
                  const py = ((by / BOARD_H) * 100).toFixed(1);
                  navigator.clipboard.writeText(`{ x: ${px}, y: ${py} }`);
                }
                onTerritoryClick(id);
              }}
              className="absolute cursor-pointer group"
              style={{
                left: cx - radius,
                top: cy - radius,
                width: radius * 2,
                height: radius * 2,
              }}
            >
              <svg
                width={radius * 2}
                height={radius * 2}
                viewBox={`0 0 ${radius * 2} ${radius * 2}`}
              >
                <circle
                  cx={radius}
                  cy={radius}
                  r={radius - 2}
                  fill={ownerColor}
                  stroke={ringColor}
                  strokeWidth={2}
                  style={{
                    filter: glow
                      ? `${glow} drop-shadow(0 2px 3px rgba(0,0,0,0.8))`
                      : "drop-shadow(0 2px 3px rgba(0,0,0,0.8))",
                    transition: "filter 0.15s, stroke 0.15s",
                  }}
                />
                {ownerColor === "transparent" && (
                  <circle
                    cx={radius}
                    cy={radius}
                    r={radius - 2}
                    fill="none"
                    stroke="#444"
                    strokeWidth={1}
                    strokeDasharray="3 2"
                  />
                )}
                <text
                  x={radius}
                  y={radius + 1}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="pointer-events-none select-none"
                  style={{
                    fontSize: "13px",
                    fontWeight: "bold",
                    fill: "white",
                    textShadow: "0 0 3px black",
                  }}
                >
                  {(t?.armies ?? 0) + placement}
                </text>
              </svg>

              <div
                className="absolute pointer-events-none text-center select-none"
                style={{
                  top: radius * 2 + 2,
                  left: "50%",
                  transform: "translateX(-50%)",
                  whiteSpace: "nowrap",
                  fontSize: "12px",
                  fontWeight: 700,
                  color: isSelected ? "#fbbf24" : "#f5f5f5",
                  textShadow: "0 1px 2px black",
                  lineHeight: 1.2,
                  background: "rgba(0,0,0,0.75)",
                  borderRadius: "3px",
                  padding: "2px 4px",
                }}
              >
                {territoryNames[id].name}
              </div>

              {showPlaced && (
                <div className="absolute -top-1 -right-1 bg-amber-400 text-black rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold z-10 shadow-lg">
                  +{placement}
                </div>
              )}
            </div>
          );
        })}

        {attackArrow &&
          (() => {
            const fromPos = TERRITORY_POSITIONS[attackArrow.from];
            const toPos = TERRITORY_POSITIONS[attackArrow.to];
            if (!fromPos || !toPos) return null;
            const x1 = (fromPos.x / 100) * BOARD_W;
            const y1 = (fromPos.y / 100) * BOARD_H;
            const x2 = (toPos.x / 100) * BOARD_W;
            const y2 = (toPos.y / 100) * BOARD_H;
            return (
              <svg
                className="absolute inset-0 pointer-events-none"
                width={BOARD_W}
                height={BOARD_H}
              >
                <defs>
                  <marker
                    id="arrowhead"
                    markerWidth="10"
                    markerHeight="7"
                    refX="10"
                    refY="3.5"
                    orient="auto"
                  >
                    <polygon points="0 0, 10 3.5, 0 7" fill="#ef4444" />
                  </marker>
                </defs>
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="#ef4444"
                  strokeWidth="5"
                  markerEnd="url(#arrowhead)"
                  opacity="0.8"
                />
              </svg>
            );
          })()}

        <div className="absolute bottom-4 left-4 bg-black/60 rounded-lg px-3 py-2 text-xs text-stone-300 pointer-events-none leading-relaxed">
          <p className="font-bold text-lg text-center text-amber-400 mb-1">
            TABLA I
          </p>
          <table
            style={{ borderSpacing: "8px 4px", borderCollapse: "separate" }}
          >
            <tbody>
              {Object.keys(exchangeTable.values).length > 0 && (
                <>
                  {Object.entries(exchangeTable.values)
                    .sort(([a], [b]) => Number(a) - Number(b))
                    .map(([k, v]) => {
                      const labels: Record<string, string> = {
                        "1": "er",
                        "2": "do",
                        "3": "er",
                        "4": "to",
                        "5": "to",
                        "6": "to",
                        "7": "mo",
                      };
                      const suffix = labels[k] || "to";
                      return (
                        <tr key={k} style={Number(k) <= exchangeCounter ? { textDecoration: 'line-through', textDecorationColor: '#ef4444', textDecorationThickness: '2px', opacity: 0.5 } : {}}>
                          <td>
                            {k}
                            {suffix} Canje
                          </td>
                          <td>{v} ejércitos</td>
                        </tr>
                      );
                    })}
                  <tr>
                    <td>Sucesivamente</td>
                    <td>+{exchangeTable.increment} ejércitos</td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>

        <div className="absolute bottom-4 right-4 bg-black/60 rounded-lg px-3 py-2 text-xs text-stone-300 pointer-events-none leading-relaxed">
          <p className="font-bold text-lg text-center text-amber-400 mb-1">
            TABLA II
          </p>
          <table
            style={{ borderSpacing: "8px 4px", borderCollapse: "separate" }}
          >
            <tbody>
              {Object.entries(continents).map(([, c]) => (
                <tr key={c.name}>
                  <td>{c.name}</td>
                  <td>+{c.bonus} ejércitos</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        <button
          onClick={() => zoom(-1)}
          className="w-8 h-8 bg-stone-800/80 hover:bg-stone-700 rounded-full flex items-center justify-center"
        >
          <ZoomOut size={18} />
        </button>
        <button
          onClick={fitBoard}
          className="px-3 h-8 bg-stone-800/80 hover:bg-stone-700 rounded-full flex items-center gap-1 text-xs font-medium"
        >
          <Maximize size={14} /> Ajustar
        </button>
        <button
          onClick={() => zoom(1)}
          className="w-8 h-8 bg-stone-800/80 hover:bg-stone-700 rounded-full flex items-center justify-center"
        >
          <ZoomIn size={18} />
        </button>
      </div>

      <div className="absolute top-4 left-4 z-10 max-w-[20vw] max-h-[80vh] overflow-y-auto bg-black/80 backdrop-blur-lg  rounded-md px-4 py-3 text-xs lg:text-sm leading-relaxed pointer-events-auto select-none shadow-lg shadow-black/40 space-y-2">
        {leftOverlay}
      </div>

      {rightOverlay && (
        <div className="absolute top-4 right-4 z-10 max-w-[45vw]">
          {rightOverlay}
        </div>
      )}

      <button
        onClick={onShowCards}
        className="absolute bottom-4 left-4 flex items-end gap-1 z-10 hover:scale-105 transition-transform"
      >
        {Array.from({ length: Math.min(cardCount + 1, 7) }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-stone-600 shadow-lg"
            style={{
              backgroundImage: "url(/card-back.png)",
              backgroundSize: "cover",
              backgroundPosition: "center",
              height: "min(20vh, 160px)",
              aspectRatio: "2.5 / 4",
              marginLeft: i > 0 ? "-3vw" : "0",
              zIndex: i,
              boxShadow:
                "0 4px 12px rgba(0,0,0,0.6), 0 1px 3px rgba(0,0,0,0.3)",
            }}
          />
        ))}
      </button>

      {showDebug && (
        <div className="absolute top-2 left-2 bg-black/80 text-amber-400 text-xs px-2 py-1 rounded pointer-events-none z-10">
          Ctrl+D: debug | Ctrl+0: ajustar | Rueda: zoom | Arrastrar: mover |
          Click: copiar
        </div>
      )}

      {showDebug && debugCoords && (
        <div className="absolute top-2 right-2 bg-black/80 text-green-400 text-sm px-3 py-1.5 rounded font-mono pointer-events-none z-10">
          {debugCoords.pct}
        </div>
      )}
    </div>
  );
}
