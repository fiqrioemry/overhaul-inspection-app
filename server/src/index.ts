import { Hono } from "hono";
import constant from "@/config/constant";
import "@/config/database/redis";
import router from "@/routes";
import { eventBus } from "./config/socket/socket";
import { prettyJSON } from "hono/pretty-json";
import { corsMiddleware } from "@/middlewares/cors";
import { errorHandler, notFoundHandler } from "./middlewares/error";

const app = new Hono();
app.use(prettyJSON());

// init cors configuration
app.use("*", corsMiddleware);

// init route config
app.route("/", router);
app.onError(errorHandler);
app.notFound(notFoundHandler);

const server = Bun.serve({
  port: constant.PORT,

  fetch(req, server) {
    // websocket endpoint
    const url = new URL(req.url);
    if (url.pathname === "/ws") {
      const ok = server.upgrade(req);
      return ok ? undefined : new Response("WS upgrade failed", { status: 400 });
    }

    return app.fetch(req);
  },

  websocket: {
    open(ws) {
      console.log("WS connected");
      ws.subscribe("notifications");
    },

    close(ws) {
      console.log("WS disconnected");
      ws.unsubscribe("notifications");
    },

    message(ws, message) {
      console.log("WS message received:", message);
    },
  },
});

console.log(`✅ Server running on ${constant.SERVER_URL || `http://localhost:8000`}`);

eventBus.setServer(server);
