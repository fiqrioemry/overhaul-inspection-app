import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Permission } from "@/config/constant/permission.constant";
import { authErrorCode, authErrorMessage } from "@/config/constant/auth.constant";

export function requirePermission(permission: Permission) {
  return async (c: Context, next: () => Promise<void>) => {
    const user = c.get("user");

    if (!user) {
      throw new HTTPException(401, {
        message: authErrorMessage.UNAUTHORIZED,
        cause: authErrorCode.UNAUTHORIZED,
      });
    }

    const permissions: string[] | ["*"] = user.permissions ?? [];

    if (permissions[0] === "*") {
      await next();
      return;
    }

    if (!(permissions as string[]).includes(permission)) {
      throw new HTTPException(403, {
        message: authErrorMessage.FORBIDDEN,
        cause: authErrorCode.FORBIDDEN,
      });
    }

    await next();
  };
}
