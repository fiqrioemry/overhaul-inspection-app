import { redisClient } from "@/lib/redis";

export const cache = {
  async get(key: string): Promise<string | null> {
    return redisClient.get(key);
  },

  async set(key: string, value: string, ttlSec?: number): Promise<void> {
    if (ttlSec) {
      await redisClient.set(key, value, "EX", ttlSec);
    } else {
      await redisClient.set(key, value);
    }
  },

  async incr(key: string): Promise<number> {
    return redisClient.incr(key);
  },

  async expire(key: string, seconds: number): Promise<void> {
    await redisClient.expire(key, seconds);
  },

  async del(key: string): Promise<void> {
    await redisClient.del(key);
  },

  async exists(key: string): Promise<boolean> {
    const result = await redisClient.exists(key);
    return !!result;
  },

  async ttl(key: string): Promise<number> {
    return redisClient.ttl(key);
  },
};
