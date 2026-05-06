import { z } from "zod";

export const sessionUser = z.object({
  email: z.email(),
  role: z.string(),
  isActive: z.boolean(),
});

export type SessionUser = z.infer<typeof sessionUser>;

export const sessionResponse = z.object({
  id: z.cuid(),
  userId: z.cuid(),
  expiresAt: z.date(),
  user: sessionUser,
});

export type SessionResponse = z.infer<typeof sessionResponse>;
