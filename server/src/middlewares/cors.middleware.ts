import { cors } from "hono/cors";
import dbConfig from "@/config/constant/database";

const corsMiddleware = cors({
  origin: dbConfig.clientUrl,
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowHeaders: ["Content-Type", "Authorization"],
  maxAge: dbConfig.cachingMaxAge,
  credentials: true,
});

export default corsMiddleware;
