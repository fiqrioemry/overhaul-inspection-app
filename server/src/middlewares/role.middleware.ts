import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { authErrorCode, authErrorMessage } from "@/config/constant/auth.constant";

export function requireRole(...roles: string[]) {
  return async (c: Context, next: () => Promise<void>) => {
    const user = c.get("user");

    if (!roles.includes(user.role)) {
      throw new HTTPException(403, {
        message: authErrorMessage.FORBIDDEN,
        cause: authErrorCode.FORBIDDEN,
      });
    }

    await next();
  };
}
