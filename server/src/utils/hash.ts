import * as crypto from "crypto";

export async function hashPassword(password: string, algorithm: "argon2id" | "bcrypt" | "argon2d" | "argon2i" = "argon2id") {
  const result = await Bun.password.hash(password, {
    algorithm: algorithm,
  });
  return result;
}

export async function verifyPassword(data: { password: string; hash: string }) {
  const { password, hash } = data;
  const result = await Bun.password.verify(password, hash);
  return result;
}

export function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}
