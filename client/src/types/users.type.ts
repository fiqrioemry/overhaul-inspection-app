// src/types/users.type.ts

export interface Profile {
  id: string;
  name: string;
  role: "USER" | "ADMIN" | "SUPER_ADMIN" | "INSPECTOR";
  email: string;
  lastLogin: Date;
  joinedAt: Date;
}

export interface TwoFactorSetupData {
  otpauthUrl: string;
  secret: string;
}

export interface TwoFactorVerifyData {
  backupCodes: string[];
}

export interface User {
  id: string;
  name: string;
  avatar: string | null;
  email: string;
  role: "USER" | "ADMIN" | "SUPER_ADMIN" | "INSPECTOR";
  lastLogin: Date;
  createdAt: Date;
  lastChangePasswordAt: Date;
}

export interface LoginSuccess {
  token: string;
  expiredAt: Date;
  user: User;
}

export interface TwoFactorLoginChallenge {
  requiresTwoFactor: true;
  challengeToken: string;
}

export type LoginData = LoginSuccess | TwoFactorLoginChallenge;
