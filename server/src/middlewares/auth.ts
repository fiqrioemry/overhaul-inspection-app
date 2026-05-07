import { Context } from "hono";
import { getCookie } from "hono/cookie";
import { verifySessionToken } from "@/utils/jwt";
import { HTTPException } from "hono/http-exception";
import { SessionRepository } from "@/repositories/session.repository";
import redisConfig from "@/config/constant/redis";
import errorMessages from "@/config/constant/errorMessage";

const sessionRepo = SessionRepository;

export async function protect(c: Context, next: () => Promise<void>) {
  const token = getCookie(c, redisConfig.tokenPrefixDefault);

  if (!token) {
    throw new HTTPException(401, { message: errorMessages.unauthorized, cause: errorMessages.unauthorized });
  }

  const payload = await verifySessionToken(token);

  console.log("payload", payload);

  if (!payload) {
    throw new HTTPException(401, { message: errorMessages.invalidToken, cause: errorMessages.invalidToken });
  }

  const session = await sessionRepo.findSessionWithUser(payload.sid);
  if (!session || session.expiresAt < new Date()) {
    throw new HTTPException(401, {
      message: errorMessages.sessionRevoked,
      cause: { code: errorMessages.sessionRevoked },
    });
  }

  if (!session || session.user.status === "BANNED") {
    throw new HTTPException(403, {
      message: errorMessages.accountBanned,
      cause: { code: errorMessages.accountBanned },
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
        message: errorMessages.forbidden,
        cause: { code: errorMessages.forbidden },
      });
    }

    await next();
  };
}
