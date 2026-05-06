import { Context } from "hono";
import { getCookie } from "hono/cookie";
import constant from "@/config/constant";
import { verifySessionToken } from "@/utils/jwt";
import { HTTPException } from "hono/http-exception";
import { SessionRepository } from "@/repositories/session.repository";

const sessionRepo = SessionRepository;

export async function protect(c: Context, next: () => Promise<void>) {
  const authHeader = getCookie(c, constant.TOKEN_PREFIX_DEFAULT);
  const token = authHeader?.split(" ")[1];

  if (!token) {
    throw new HTTPException(401, { message: constant.ERROR_MESSAGES.UNAUTHORIZED, cause: constant.ERROR_CODES.UNAUTHORIZED });
  }

  const payload = await verifySessionToken(token);

  if (!payload) {
    throw new HTTPException(401, { message: constant.ERROR_MESSAGES.INVALID_TOKEN, cause: constant.ERROR_CODES.INVALID_TOKEN });
  }

  const session = await sessionRepo.findSessionWithUser(payload.sid);
  if (!session || session.expiresAt < new Date()) {
    throw new HTTPException(401, {
      message: constant.ERROR_MESSAGES.SESSION_REVOKED,
      cause: { code: constant.ERROR_CODES.SESSION_REVOKED },
    });
  }

  if (!session || !session.user.isActive) {
    throw new HTTPException(403, {
      message: constant.ERROR_MESSAGES.ACCOUNT_DISABLED,
      cause: { code: constant.ERROR_CODES.ACCOUNT_DISABLED },
    });
  }
  c.set("user", {
    ssid: session.id,
    userId: session.userId,
    role: session.user.role,
    expiresAt: session.expiresAt,
  });

  await next();
}

export function permissions(requiredPermissions: string[]) {
  return async (c: Context, next: () => Promise<void>) => {
    const user = await c.get("user");

    const userPermissions: string[] = user.permissions || [];
    const hasPermissions = requiredPermissions.every((perm) => userPermissions.includes(perm));

    if (!hasPermissions) {
      throw new HTTPException(403, {
        message: constant.ERROR_MESSAGES.FORBIDDEN,
        cause: { code: constant.ERROR_CODES.FORBIDDEN },
      });
    }

    await next();
  };
}
