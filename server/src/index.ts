// src/index.ts
import "@/lib/redis";
import { Hono } from "hono";
import router from "@/routes";
import { eventBus } from "./lib/socket";
import { prettyJSON } from "hono/pretty-json";
import { databaseConfig } from "./config/env";
import corsMiddleware from "./middlewares/cors.middleware";
import { startFileCleanupWorker } from "@/workers/file-cleanup.worker";
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware";

type WebSocketData = {
  url: string;
};

const app = new Hono();
app.use(prettyJSON());
app.use("*", corsMiddleware);
app.route("/", router);
app.onError(errorHandler);
app.notFound(notFoundHandler);

const server = Bun.serve<WebSocketData>({
  port: databaseConfig.PORT || 5000,

  fetch(req, server) {
    const url = new URL(req.url);
    if (url.pathname === "/ws") {
      const ok = server.upgrade(req, { data: { url: req.url } });
      return ok ? undefined : new Response("WS upgrade failed", { status: 400 });
    }
    return app.fetch(req);
  },

  websocket: {
    open(ws) {
      const url = new URL(ws.data?.url ?? "http://localhost/ws");
      const chatId = url.searchParams.get("chatId");

      ws.subscribe("notifications");

      if (chatId) {
        ws.subscribe(`chat:${chatId}`);
      }

      console.log(`WS connected — chatId: ${chatId ?? "none"}`);
    },

    close(ws) {
      const url = new URL(ws.data.url ?? "http://localhost/ws");
      const chatId = url.searchParams.get("chatId");

      ws.unsubscribe("notifications");

      if (chatId) {
        ws.unsubscribe(`chat:${chatId}`);
      }

      console.log("WS disconnected");
    },

    message(ws, message) {
      console.log("WS message received:", message);
    },
  },
});

console.log(`✅ Server running on ${databaseConfig.SERVER_URL || "http://localhost:5000"}`);

eventBus.setServer(server);

startFileCleanupWorker();
