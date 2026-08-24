import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import healthRouter from "./routes/health";
import { logger } from "./lib/logger";
import { requestTelemetry } from "./lib/request-telemetry";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    autoLogging: false,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(requestTelemetry);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check route (scaffold default)
app.use("/api", healthRouter);

// NOTE: registerRoutes(app) is called in index.ts — it mounts all legacy routes
// directly on the app (with their own /api/ and other prefixes built in).

export default app;
