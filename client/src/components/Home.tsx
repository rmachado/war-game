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
  const [playerCount, setPlayerCount] = useState(3);
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
      const data = await createGame(name.trim(), color, playerCount);
      localStorage.setItem("war_name", name.trim());
      setSession(data.code, data.token);
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
        localStorage.setItem("war2_name", name.trim());
        setSession(data.code, data.token);
        navigate(`/game/${data.code}`);
      } catch (e: any) {
        if (e.message?.includes("ya comenzó") || e.message?.includes("comenzó")) {
          const data = await rejoinGame(cleanedCode, color);
          localStorage.setItem("war2_name", data.name);
          setSession(data.code, data.token);
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
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md">
        <h1 className="text-4xl font-bold text-center mb-2 tracking-wider">
          WAR
        </h1>
        <p className="text-stone-400 text-center mb-2">Juego de estrategia</p>
        <p className="text-center mb-8">
          <Link to="/rules" className="text-amber-400 hover:text-amber-300 text-sm underline underline-offset-2">
            Ver reglas del juego
          </Link>
        </p>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setMode("create")}
            className={`flex-1 py-2 rounded-lg font-medium transition ${mode === "create" ? "bg-amber-600" : "bg-stone-700 hover:bg-stone-600"}`}
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

          {mode === "create" && (
            <div>
              <label className="block text-sm text-stone-400 mb-1">
                Jugadores
              </label>
              <div className="flex gap-2">
                {[3, 4, 5, 6].map((n) => (
                  <button
                    key={n}
                    onClick={() => setPlayerCount(n)}
                    className={`w-12 h-12 rounded-lg font-medium transition ${playerCount === n ? "bg-amber-600" : "bg-stone-700 hover:bg-stone-600"}`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          )}

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
  );
}
