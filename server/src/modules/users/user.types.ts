import { OAuthProvider } from "generated/prisma";

type verificationType = "EMAIL_VERIFICATION" | "PASSWORD_RESET";

type userStatus = "ACTIVE" | "INACTIVE" | "BANNED";

type createVerificationData = {
  userId: string;
  token: string;
  type: verificationType;
  expiresAt: Date;
};

type userSearchResponse = {
  id: string;
  name: string;
  username: string;
  avatar: string | null;
  isFollowing: boolean | undefined;
  canFollow: boolean;
};

type userCredential = {
  id: string;
  email: string;
  name: string;
  username: string;
  avatar: string | null;
  passwordHash: string | null;
  status: userStatus;
  verifiedAt: Date | null;
};

type userVerificationData = createVerificationData & {
  id: string;
};

type updateUserActiveData = {
  userId: string;
  status: userStatus;
};

type loginResponse = {
  token: string;
  expiredAt: Date;
  user: {
    id: string;
    name: string;
    username: string;
    avatar: string | null;
    email: string;
  };
};

type userResponse = {
  id: string;
  name: string;
  username: string;
  avatar: string | null;
  lastLogin: Date | null;
  joinedAt: Date;
  lastChangePasswordAt: Date | null;
};

type profileResponse = {
  id: string;
  email: string;
  name: string;
  username: string;
  avatar: string | null;
  bio: string | null;
  lastLogin: Date | null;
  joinedAt: Date;
  isPublic: boolean;
  isOwner?: boolean;
  totalFollowers: number;
  totalFollowings: number;
  totalPosts: number;
  isFollowing: boolean;
};

type createUserData = {
  email: string;
  passwordHash: string;
  name: string;
  username: string;
  avatar: string;
};

type searchResponse = {
  id: string;
  name: string;
  username: string;
  avatar: string | null;
  followers?: {
    id: string;
  }[];
};

type followingResponse = {
  id: string;
  name: string;
  username: string;
  avatar?: string | null;
  isFollowing: boolean;
  canFollow: boolean;
};

type paginationMeta = {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
};

type filterMeta = {
  search?: string;
  orderBy?: string;
  sortBy?: string;
};

type metaResponse = {
  pagination?: paginationMeta;
  filter?: filterMeta;
};

export type CreateOAuthUserData = {
  email: string;
  name: string;
  username: string;
  avatar: string;
};

export type UpsertOAuthAccountData = {
  userId: string;
  provider: OAuthProvider;
  providerAccountId: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
};

export {
  metaResponse,
  paginationMeta,
  filterMeta,
  followingResponse,
  userSearchResponse,
  verificationType,
  searchResponse,
  loginResponse,
  createUserData,
  profileResponse,
  userCredential,
  createVerificationData,
  userVerificationData,
  userResponse,
  userStatus,
  updateUserActiveData,
};
