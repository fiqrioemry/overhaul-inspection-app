// src/types/users.type.ts
export type GenderOption = "MALE" | "FEMALE";
export type MuteType = "posts" | "stories" | "all";

export interface UserProfile {
  id: string;
  name: string;
  username: string;
  avatar: string | null;
  bio: string | null;
  website: string | null;
  email: string;
  lastLogin: Date;
  joinedAt: Date;
  isPublic: boolean;
  isOwner: boolean;
  totalFollowers: number;
  totalFollowings: number;
  totalPosts: number;
  followStatus: "ACCEPTED" | "PENDING" | "NONE";
}

export interface BlockData {
  id: string;
  blockedId: string;
  createdAt: Date;
}

export interface BlockedUser {
  id: string;
  blockedId: string;
  createdAt: Date;
  user: {
    id: string;
    name: string;
    username: string;
    avatar: string | null;
  };
}

export interface MuteData {
  id: string;
  mutedId: string;
  muteType: MuteType;
  createdAt: Date;
}

export interface MutedUser {
  id: string;
  mutedId: string;
  muteType: MuteType;
  createdAt: Date;
  user: {
    id: string;
    name: string;
    username: string;
    avatar: string | null;
  };
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
  username: string;
  name: string;
  bio: string | null;
  gender: GenderOption | null;
  avatar: string | null;
  email: string;
  followStatus: "ACCEPTED" | "PENDING" | "NONE";
  isPublic: boolean;
  hasPassword: boolean;
  lastLogin: Date;
  createdAt: Date;
  lastChangePasswordAt: Date;
  follower: followerInfo;
}

export interface followerInfo {
  id: string;
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

export interface UserAccount {
  id: string;
  name: string;
  username: string;
  avatar: string | null;
  bio: string | null;
  website: string | null;
  email: string;
  lastLogin: Date;
  joinedAt: Date;
  createdAt: Date;
  gender: GenderOption | null;
  lastChangePasswordAt: Date;
  isPublic: boolean;
  isOwner: boolean;
  hasPassword: boolean;
  twoFactorEnabled: boolean;
  totalFollowers: number;
  totalFollowings: number;
  totalPosts: number;
  followStatus: "ACCEPTED" | "PENDING" | "NONE";
  follower: followerInfo;
}

export interface Sessions {
  id: string;
  userId: string;
  userAgent: string;
  expiresAt: Date;
  loginAt: Date;
}

export interface UpdatePrivacyRequest {
  isPublic: boolean;
}
