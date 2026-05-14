import { Context } from "hono";
import { sign } from "hono/jwt";
import { verify } from "hono/jwt";
import { deleteCookie, setCookie } from "hono/cookie";
import redisConfig from "@/config/constant/redis";
import dbConfig from "@/config/constant/database";
import { authLimit } from "@/config/constant/auth.constant";

// types/jwt.ts
export type SessionTokenPayload = {
  sub: string;
  sid: string;
  exp: number;
};

export const generateTTL = (seconds: number) => {
  return Math.floor(Date.now() / 1000) + seconds;
};

export async function generateSessionToken(data: Object): Promise<string> {
  const payload = {
    ...data,
    exp: Math.floor(Date.now() / 1000) + redisConfig.sessionExpiresIn,
  };

  return sign(payload, dbConfig.sessionSecret, "HS256");
}

export async function verifySessionToken(token: string): Promise<SessionTokenPayload | null> {
  try {
    const payload = (await verify(token, dbConfig.sessionSecret, "HS256")) as SessionTokenPayload;
    return payload;
  } catch (err) {
    return null;
  }
}

export function setSessionToken(c: Context, token: string) {
  setCookie(c, redisConfig.tokenPrefixDefault, token, {
    path: "/",
    secure: dbConfig.mode ? true : false,
    httpOnly: true,
    maxAge: authLimit.SESSION_TOKEN_EXP,
    sameSite: dbConfig.mode ? "lax" : "strict",
  });
}

export function clearSessionToken(c: Context) {
  deleteCookie(c, redisConfig.tokenPrefixDefault, {
    path: "/",
    secure: dbConfig.mode ? true : false,
  });
}
