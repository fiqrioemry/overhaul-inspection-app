import { Context } from "hono";
import { cache } from "@/utils/cache";
import redisConfig from "@/config/constant/redis";
import { getCookie, setCookie } from "hono/cookie";
import { HTTPException } from "hono/http-exception";
import { authErrorMessage, authErrorCode } from "@/config/constant/auth.constant";

export function limitter({ limit, windowSec }: { limit: number; windowSec: number }) {
  return async (c: Context, next: () => Promise<void>) => {
    const userId = c.get("user")?.userId || getCookie(c, "guest_id");

    if (!userId) {
      const guest_id = crypto.randomUUID();
      setCookie(c, "guest_id", guest_id, { path: "/", httpOnly: true });
      await next();
      return;
    }

    const key = `${redisConfig.redisKeyLimiter}${userId}:${c.req.path}`;

    const current = await cache.incr(key);

    if (current === 1) {
      await cache.expire(key, windowSec);
    }

    if (current > limit) {
      throw new HTTPException(429, { message: authErrorMessage.TOO_MANY_REQUESTS, cause: authErrorCode.TOO_MANY_REQUESTS });
    }
    await next();
  };
}
