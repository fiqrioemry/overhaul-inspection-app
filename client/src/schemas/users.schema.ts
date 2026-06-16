// src/schemas/users.schema.ts
import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  role: z.enum(["USER", "INSPECTOR", "ADMIN", "SUPER_ADMIN"], { error: "Role is required" }),
  status: z.enum(["ACTIVE", "INACTIVE", "BANNED"], { error: "Status is required" }),
  password: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal("")),
  isVerified: z.boolean().optional(),
});

export type CreateUserFormValues = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  role: z.enum(["USER", "INSPECTOR", "ADMIN", "SUPER_ADMIN"]).optional(),
});

export type UpdateUserFormValues = z.infer<typeof updateUserSchema>;

export const updateUserStatusSchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE", "BANNED"], { error: "Status is required" }),
});

export type UpdateUserStatusFormValues = z.infer<typeof updateUserStatusSchema>;
