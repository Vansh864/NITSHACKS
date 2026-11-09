import "dotenv/config";
import express from "express";
import cors from "cors";
import { fileURLToPath } from "node:url";
import path from "node:path";
import apiRoutes from "./routes/apps.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { initDatabase, seedDatabase } from "./db/repository.js";
import { initialApps } from "./db/schema.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();
const port = Number(process.env.PORT || 5000);
initDatabase();

app.disable("x-powered-by");
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  next();
});
app.use(
  cors({
    origin: (origin, callback) => {
      const allowed =
        !origin || /https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
      callback(null, allowed);
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use(requestLogger);

app.get("/api/health", (req, res) =>
  res.json({ ok: true, timestamp: new Date().toISOString() }),
);
app.use("/api", apiRoutes);

app.use((req, res) => {
  res.status(404).json({
    error: {
      code: "ROUTE_NOT_FOUND",
      message: `Endpoint ${req.originalUrl} not found`,
    },
  });
});
app.use(errorHandler);

export function startServer() {
  const { sqlite } = initDatabase();
  if (sqlite) {
    seedDatabase(initialApps);
  }
  return app.listen(port, "0.0.0.0", () => {
    console.log(`E.D.I.T.H. backend listening on http://localhost:${port}`);
  });
}

const isDirectRun =
  process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isDirectRun) {
  startServer();
}
