import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { createServer } from "http";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import { initSocket } from "./config/socket.js";
import { errorHandler } from "./middleware/error.middleware.js";
import { startPoller } from "./jobs/poller.job.js";
import authRoutes from "./routes/auth.routes.js";
import endpointRoutes from "./routes/endpoint.routes.js";
import collectionRoutes from "./routes/collection.routes.js";
import driftRoutes from "./routes/drift.routes.js";
import proxyRoutes from "./routes/proxy.routes.js";
import testRoutes from "./routes/test.routes.js";
import environmentRoutes from "./routes/environment.routes.js";

dotenv.config();

const app = express();
const httpServer = createServer(app);

connectDB();
initSocket(httpServer);
startPoller();

app.use(helmet());

// CORS: explicit allow-list from CLIENT_URL (comma-separated), plus —
// in non-production — any localhost/127.0.0.1 port. This avoids having to
// keep editing .env every time the frontend dev server picks a new port
// (Vite/TanStack Start can land on 3000, 5173, 8080, etc).
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:3000")
  .split(",")
  .map((o) => o.trim());

app.use(
  cors({
    origin(origin, callback) {
      // No Origin header (curl, server-to-server, Postman) — allow.
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) return callback(null, true);

      if (
        process.env.NODE_ENV !== "production" &&
        /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)
      ) {
        return callback(null, true);
      }

      callback(new Error(`Not allowed by CORS: ${origin}`));
    },
    credentials: true,
  }),
);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: "Too many requests from this IP, please try again after 15 minutes",
});
app.use("/api", limiter);

app.use(express.json({ limit: "1mb" }));

app.use("/api/auth", authRoutes);
app.use("/api/endpoints", endpointRoutes);
app.use("/api/collections", collectionRoutes);
app.use("/api/drift", driftRoutes);
app.use("/api/proxy", proxyRoutes);

// Dev-only schema simulator — lets you trigger drift on demand for testing.
// Remove this line (and routes/test.routes.js + controllers/test.controller.js)
// before deploying anywhere real.
app.use("/api/test", testRoutes);

app.get("/health", (req, res) => res.status(200).json({ status: "OK" }));

// Global error handler — must be registered last, after all routes.
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`SchemaGuard server running on port ${PORT}`);

  app.use("/api/environments", environmentRoutes);
});
