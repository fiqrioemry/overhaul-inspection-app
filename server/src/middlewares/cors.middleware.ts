import { cors } from "hono/cors";
import { databaseConfig } from "@/config/env";

const corsMiddleware = cors({
  origin: databaseConfig.CLIENT_URL,
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowHeaders: ["Content-Type", "Authorization"],
  // Binary download endpoints put the filename here; without this the cross-origin
  // client cannot read it and has to fall back to a generated name.
  exposeHeaders: ["Content-Disposition"],
  maxAge: databaseConfig.CACHING_MAX_AGE,
  credentials: true,
});

export default corsMiddleware;
