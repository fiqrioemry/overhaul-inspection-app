import { Context } from "hono";
import { getCookie } from "hono/cookie";
import { redisConfig } from "@/config/env";
import { RoleEnum } from "generated/prisma";
import { verifySessionToken } from "@/utils/jwt";
import { HTTPException } from "hono/http-exception";
import { getPermissionsForRole } from "@/config/constant/permission.constant";
import { SessionRepository } from "@/modules/sessions/sessions.repository";
import { authErrorCode, authErrorMessage } from "@/config/constant/auth.constant";

const sessionRepo = SessionRepository;

export async function protect(c: Context, next: () => Promise<void>) {
  const token = getCookie(c, redisConfig.TOKEN_PREFIX_DEFAULT);

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

  if (session.user.status === "BANNED") {
    throw new HTTPException(403, {
      message: authErrorMessage.ACCOUNT_BANNED,
      cause: authErrorMessage.ACCOUNT_BANNED,
    });
  }

  if (session.user.status === "INACTIVE") {
    throw new HTTPException(403, {
      message: authErrorMessage.EMAIL_NOT_VERIFIED,
      cause: authErrorMessage.EMAIL_NOT_VERIFIED,
    });
  }

  const permissions = getPermissionsForRole(session.user.role as RoleEnum);

  c.set("user", {
    ssid: session.id,
    userId: session.userId,
    role: session.user.role,
    status: session.user.status,
    expiresAt: session.expiresAt,
    permissions,
  });

  await next();
}
