import { RedisClient } from "bun";
import { redisConfig } from "@/config/env";

export const redisClient = new RedisClient(redisConfig.REDIS_URL);

redisClient
  .send("PING", [])
  .then(() => console.log("✅ Redis connected successfully"))
  .catch((err) => console.error("❌ Redis connection failed:", err));
