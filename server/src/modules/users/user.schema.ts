import { z } from "zod";
import { RoleEnum, StatusEnum, CompanyType } from "generated/prisma";

const passwordValidation = z
  .string()
  .min(10, "Password must be at least 10 characters")
  .refine((p) => /[A-Z]/.test(p), { message: "Password must contain at least one uppercase letter" })
  .refine((p) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p), { message: "Password must contain at least one special character" });

export const createUserRequest = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(1, "Name is required").max(100),
  role: z.enum(RoleEnum).default(RoleEnum.USER),
  isVerified: z.boolean().default(false),
  password: passwordValidation.optional(),
});
export type CreateUserRequest = z.infer<typeof createUserRequest>;

export const updateUserRequest = z.object({
  name: z.string().min(1).max(100).optional(),
  role: z.enum(RoleEnum).optional(),
});
export type UpdateUserRequest = z.infer<typeof updateUserRequest>;

export const updateUserStatusRequest = z.object({
  status: z.enum(StatusEnum),
});
export type UpdateUserStatusRequest = z.infer<typeof updateUserStatusRequest>;

export const updateUserPasswordRequest = z
  .object({
    password: passwordValidation,
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type UpdateUserPasswordRequest = z.infer<typeof updateUserPasswordRequest>;

export const listUsersQuery = z.object({
  page: z.string().default("1").transform(Number),
  limit: z.string().default("20").transform(Number),
  search: z.string().optional(),
  role: z.enum(RoleEnum).optional(),
  status: z.enum(StatusEnum).optional(),
  orderBy: z.enum(["createdAt", "name", "email"]).default("createdAt"),
  sortBy: z.enum(["asc", "desc"]).default("desc"),
});
export type ListUsersQuery = z.infer<typeof listUsersQuery>;

export const userOptionsQuery = z.object({
  companyType: z.nativeEnum(CompanyType).optional(),
  role: z.enum(RoleEnum).optional(),
  search: z.string().optional(),
});
export type UserOptionsQuery = z.infer<typeof userOptionsQuery>;

export const updateProfileRequest = z.object({
  userId: z.string().optional(),
  name: z.string().min(1, "Name is required"),
});
export type UpdateProfileRequest = z.infer<typeof updateProfileRequest>;

export const createUserActivityLogRequest = z.object({
  userId: z.string(),
  action: z.string(),
  metadata: z.record(z.string(), z.any()).optional(),
});
export type CreateUserActivityLogRequest = z.infer<typeof createUserActivityLogRequest>;
