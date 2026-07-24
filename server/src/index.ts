import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import gameRouter from "./routes/game.js";
import { closeDb } from "./db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = parseInt(process.env.PORT || "3001", 10);

const isDev = process.env.NODE_ENV !== "production";

app.use(cors());
app.use(express.json());

app.use("/api", gameRouter);

if (!isDev) {
  const distPath = path.resolve(__dirname, "../../client/dist");
  app.use(express.static(distPath));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

const server = app.listen(PORT, () => {
  console.log(`war server running on http://localhost:${PORT}`);
});

function shutdown() {
  console.log("\nCerrando servidor...");
  server.close(() => {
    closeDb();
    console.log("Servidor cerrado.");
    process.exit(0);
  });
  setTimeout(() => {
    console.log("Forzando cierre...");
    closeDb();
    process.exit(0);
  }, 3000);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
