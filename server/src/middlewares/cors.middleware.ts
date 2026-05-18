import { cors } from "hono/cors";
import { databaseConfig } from "@/config/env";

const corsMiddleware = cors({
  origin: databaseConfig.CLIENT_URL,
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowHeaders: ["Content-Type", "Authorization"],
  maxAge: databaseConfig.CACHING_MAX_AGE,
  credentials: true,
});

export default corsMiddleware;
