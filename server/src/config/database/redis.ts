import { RedisClient } from "bun";
import redisConfig from "../constant/redis";

export const redisClient = new RedisClient(redisConfig.redisUrl);

redisClient
  .send("PING", [])
  .then(() => console.log("✅ Redis connected successfully"))
  .catch((err) => console.error("❌ Redis connection failed:", err));
