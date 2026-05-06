import { RedisClient } from "bun";
import dbConfig from "../constant/redis";

export const redisClient = new RedisClient(dbConfig.redisUrl);

redisClient
  .send("PING", [])
  .then(() => console.log("✅ Redis connected successfully"))
  .catch((err) => console.error("❌ Redis connection failed:", err));
