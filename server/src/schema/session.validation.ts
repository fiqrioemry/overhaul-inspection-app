import { z } from "zod";

export const sessionUser = z.object({
  email: z.string().email(),
  role: z.string(),
  status: z.enum(["ACTIVE", "INACTIVE", "BANNED"]),
});

export type SessionUser = z.infer<typeof sessionUser>;

export const sessionResponse = z.object({
  id: z.cuid(),
  userId: z.cuid(),
  expiresAt: z.date(),
  createdAt: z.date(),
  userAgent: z.string().nullable(),
  user: sessionUser,
});

export type SessionResponse = z.infer<typeof sessionResponse>;
