import "@/lib/redis";
import { Hono } from "hono";
import router from "@/routes";
import { databaseConfig } from "./config/env";
import corsMiddleware from "./middlewares/cors.middleware";
import { startFileCleanupWorker } from "@/workers/file-cleanup.worker";
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware";

const app = new Hono();
app.use("*", corsMiddleware);
app.route("/", router);
app.onError(errorHandler);
app.notFound(notFoundHandler);

const server = Bun.serve({
  port: Number(databaseConfig.PORT) || 5001,

  fetch(req) {
    return app.fetch(req);
  },
});

console.log(`✅ Server running on ${databaseConfig.SERVER_URL}`);

startFileCleanupWorker();
