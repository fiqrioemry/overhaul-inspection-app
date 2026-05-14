import { Context } from "hono";
import { getCookie } from "hono/cookie";
import { verifySessionToken } from "@/utils/jwt";
import redisConfig from "@/config/constant/redis";
import { HTTPException } from "hono/http-exception";
import { SessionRepository } from "@/repositories/session.repository";
import { authErrorCode, authErrorMessage } from "@/config/constant/auth.constant";

const sessionRepo = SessionRepository;

export async function protect(c: Context, next: () => Promise<void>) {
  const token = getCookie(c, redisConfig.tokenPrefixDefault);

  if (!token) {
    throw new HTTPException(401, { message: authErrorMessage.UNAUTHORIZED, cause: authErrorMessage.UNAUTHORIZED });
  }

  const payload = await verifySessionToken(token);

  if (!payload) {
    throw new HTTPException(401, { message: authErrorMessage.INVALID_TOKEN, cause: authErrorMessage.INVALID_TOKEN });
  }

  const session = await sessionRepo.findSessionWithUser(payload.sid);
  if (!session || session.expiresAt < new Date()) {
    throw new HTTPException(401, {
      message: authErrorMessage.SESSION_REVOKED,
      cause: authErrorMessage.SESSION_REVOKED,
    });
  }

  if (!session || session.user.status === "BANNED") {
    throw new HTTPException(403, {
      message: authErrorMessage.ACCOUNT_BANNED,
      cause: authErrorMessage.ACCOUNT_BANNED,
    });
  }
  c.set("user", {
    ssid: session.id,
    username: session.user.username,
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
        message: authErrorMessage.FORBIDDEN,
        cause: { code: authErrorCode.FORBIDDEN },
      });
    }

    await next();
  };
}
