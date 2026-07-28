import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { createGame, joinGame, rejoinGame } from "../api/game";
import { useGameStore } from "../store/game";
import { ALL_COLORS, COLOR_NAMES, COLOR_MAP } from "../types";

export default function Home() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setSession } = useGameStore();
  const [mode, setMode] = useState<"create" | "join">("create");
  const [name, setName] = useState(
    () => localStorage.getItem("war_name") || "",
  );
  const [color, setColor] = useState("red");
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const joinParam = searchParams.get("join");
    if (joinParam) {
      setMode("join");
      setJoinCode(joinParam.toUpperCase());
    }
  }, [searchParams]);

  async function handleCreate() {
    if (!name.trim()) {
      setError("Ingresa tu nombre");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await createGame(name.trim(), color);
      localStorage.setItem("war_name", name.trim());
      setSession(data.code, data.token, name.trim());
      navigate(`/game/${data.code}`);
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  }

  async function handleJoin() {
    if (!joinCode.trim()) {
      setError("Ingresa el código del juego");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const cleanedCode = joinCode.trim().toUpperCase();
      try {
        const data = await joinGame(cleanedCode, name.trim() || "Jugador", color);
        localStorage.setItem("war_name", name.trim());
        setSession(data.code, data.token, name.trim() || "Jugador");
        navigate(`/game/${data.code}`);
      } catch (e: any) {
        if (e.message?.includes("ya comenzó") || e.message?.includes("comenzó")) {
          const data = await rejoinGame(cleanedCode, color, name.trim() || "Jugador");
          localStorage.setItem("war_name", data.name);
          setSession(data.code, data.token, data.name);
          navigate(`/game/${data.code}`);
        } else {
          throw e;
        }
      }
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  }

  return (
    <div className="relative flex items-center justify-center min-h-screen p-4 overflow-hidden">
      <div className="absolute inset-0 bg-stone-950">
        <img
          src="/board.png"
          alt=""
          className="w-full h-full object-cover opacity-20 select-none"
          draggable={false}
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-stone-950/80 via-stone-950/40 to-stone-950/80" />
      <div className="absolute inset-0 backdrop-blur-[6px]" />

      <div className="relative w-full max-w-md">
        <div className="bg-stone-900/80 backdrop-blur-xl border border-stone-700/50 rounded-2xl shadow-2xl shadow-black/50 p-8">
          <h1 className="text-7xl text-center tracking-[0.08em] mb-4 bg-gradient-to-b from-amber-300 via-amber-500 to-amber-700 bg-clip-text text-transparent" style={{ fontFamily: 'Clarendon, serif', textShadow: '0 0 40px rgba(245,158,11,0.3), 0 0 80px rgba(245,158,11,0.15)' }}>
            WAR
          </h1>
          <p className="text-stone-400 text-center mb-2">Juego de estrategia</p>
          <p className="text-center mb-8">
            <Link to="/rules" className="text-amber-400/70 hover:text-amber-300 text-xs underline underline-offset-2">
              Ver reglas del juego
            </Link>
          </p>

          <div className="flex gap-2 mb-6 p-1 bg-stone-800/60 rounded-lg">
            <button
              onClick={() => setMode("create")}
              className={`flex-1 py-2 rounded-lg font-medium transition ${mode === "create" ? "bg-amber-600 shadow-lg shadow-amber-600/30" : "hover:bg-stone-700/50"}`}
            >
            Crear juego
          </button>
          <button
            onClick={() => setMode("join")}
            className={`flex-1 py-2 rounded-lg font-medium transition ${mode === "join" ? "bg-amber-600" : "bg-stone-700 hover:bg-stone-600"}`}
          >
            Unirse
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-stone-400 mb-1">Nombre</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={20}
              className="w-full bg-stone-800 border border-stone-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-amber-500"
              placeholder="Tu nombre"
            />
          </div>

          <div>
            <label className="block text-sm text-stone-400 mb-1">
              Color de ejército
            </label>
            <div className="flex gap-2 flex-wrap">
              {ALL_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-10 h-10 rounded-full border-2 transition ${color === c ? "border-white scale-110" : "border-transparent"}`}
                  style={{ backgroundColor: COLOR_MAP[c] }}
                  title={COLOR_NAMES[c]}
                />
              ))}
            </div>
          </div>

          {mode === "join" && (
            <div>
              <label className="block text-sm text-stone-400 mb-1">
                Código de juego
              </label>
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                maxLength={6}
                className="w-full bg-stone-800 border border-stone-600 rounded-lg px-4 py-2 text-white text-center text-2xl tracking-widest focus:outline-none focus:border-amber-500"
                placeholder="ABC123"
              />
            </div>
          )}

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            onClick={mode === "create" ? handleCreate : handleJoin}
            disabled={loading}
            className="w-full py-3 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 rounded-lg font-bold text-lg transition"
          >
            {loading
              ? "Cargando..."
              : mode === "create"
                ? "Crear juego"
                : "Unirse al juego"}
          </button>
        </div>
      </div>
    </div>
  </div>
  );
}
