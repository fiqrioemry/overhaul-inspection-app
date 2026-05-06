import { RedisClient } from "bun";
import constant from "@/config/constant";

export const redisClient = new RedisClient(constant.REDIS_URL);

redisClient
  .send("PING", [])
  .then(() => console.log("✅ Redis connected successfully"))
  .catch((err) => console.error("❌ Redis connection failed:", err));
