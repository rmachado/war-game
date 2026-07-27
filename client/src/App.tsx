import { Routes, Route, Navigate, useParams } from "react-router-dom";
import { useGameStore } from "./store/game";
import Home from "./components/Home";
import Lobby from "./components/Lobby";
import Rules from "./components/Rules";

function GameRoute() {
  const { code: urlCode } = useParams<{ code: string }>();
  const { code, token } = useGameStore();

  if (code && token && code === urlCode) {
    return <Lobby />;
  }

  return <Navigate to={`/?join=${urlCode}`} />;
}

export default function App() {
  return (
    <div className="min-h-screen bg-stone-900 text-white">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/rules" element={<Rules />} />
        <Route path="/game/:code" element={<GameRoute />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}
