import { cors } from "hono/cors";
import constant from "@/config/constant";

export const corsMiddleware = cors({
  origin: constant.CLIENT_URL,
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowHeaders: ["Content-Type", "Authorization"],
  maxAge: constant.CACHING_MAX_AGE,
  credentials: true,
});

export default corsMiddleware;
