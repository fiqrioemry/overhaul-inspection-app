import { Context } from "hono";
import { cache } from "@/utils/cache";
import constant from "@/config/constant";
import { getCookie, setCookie } from "hono/cookie";
import { HTTPException } from "hono/http-exception";

export function limitter({ limit, windowSec }: { limit: number; windowSec: number }) {
  return async (c: Context, next: () => Promise<void>) => {
    const userId = c.get("user")?.userId || getCookie(c, "guest_id");

    if (!userId) {
      const guest_id = crypto.randomUUID();
      setCookie(c, "guest_id", guest_id, { path: "/", httpOnly: true });
      await next();
      return;
    }

    const key = `${constant.REDIS_KEY_LIMITTER}${userId}:${c.req.path}`;

    const current = await cache.incr(key);

    if (current === 1) {
      await cache.expire(key, windowSec);
    }

    if (current > limit) {
      throw new HTTPException(429, { message: constant.ERROR_MESSAGES.TOO_MANY_REQUESTS });
    }
    await next();
  };
}
