export interface UserProfile {
  id: string;
  name: string;
  username: string;
  avatar: string | null;
  bio: string | null;
  email: string;
  lastLogin: Date;
  joinedAt: Date;
  isPublic: boolean;
  isOwner: boolean;
  followers: number;
  followings: number;
  posts: number;
  isFollowing: boolean;
}

export interface User {
  id: string;
  username: string;
  name: string;
  bio: string | null;
  avatar: string | null;
  email: string;
  isFollowing?: boolean;
  isPublic: boolean;
  lastLogin: Date;
  createdAt: Date;
  lastPasswordChangeAt: Date;
}

export interface LoginData {
  token: string;
  expiredAt: Date;
  user: User;
}

export interface UserAccount {
  id: string;
  name: string;
  username: string;
  avatar: string | null;
  bio: string | null;
  email: string;
  lastLogin: Date;
  joinedAt: Date;
  createdAt: Date;
  lastPasswordChangeAt: Date;
  isPublic: boolean;
  isOwner: boolean;
  followers: number;
  following: number;
  posts: number;
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
