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

  // Retry on EADDRINUSE: after task merges / workflow restarts, the previous
  // process can briefly keep the port. Retry for up to ~15s before giving up
  // instead of crashing on the first attempt.
  const MAX_RETRIES = 15;
  const RETRY_DELAY_MS = 1000;
  let attempts = 0;

  const tryListen = () => {
    httpServer.listen(port, () => {
      logger.info({ port }, "Server listening");
    });
  };

  httpServer.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE" && attempts < MAX_RETRIES) {
      attempts++;
      logger.warn(
        { port, attempt: attempts },
        "Port in use, retrying in 1s (stale process may still be releasing it)",
      );
      setTimeout(tryListen, RETRY_DELAY_MS);
    } else {
      throw err;
    }
  });

  tryListen();
})();
