import { createServer } from "http";
import app from "./app";
import { registerRoutes } from "./register-routes";
import { logger } from "./lib/logger";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

(async () => {
  const httpServer = await registerRoutes(app);

  httpServer.listen(port, () => {
    logger.info({ port }, "Server listening");
  });
})();
