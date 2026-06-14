// src/types/users.type.ts

export type RoleEnum = "USER" | "INSPECTOR" | "ADMIN" | "SUPER_ADMIN";
export type StatusEnum = "ACTIVE" | "INACTIVE" | "BANNED";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: RoleEnum;
  status: StatusEnum;
  avatar: string | null;
  verifiedAt: string | null;
  createdAt: string;
  lastLogin: string | null;
}

export interface MeResponse {
  user: AuthUser;
  permissions: string[];
}

export interface User {
  id: string;
  name: string;
  avatar: string | null;
  email: string;
  role: RoleEnum;
  status: StatusEnum;
  verifiedAt: string | null;
  lastLogin: string | null;
  createdAt: string;
  updatedAt: string;
}
