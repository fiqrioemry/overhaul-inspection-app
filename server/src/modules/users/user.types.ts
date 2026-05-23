import { OAuthProvider } from "generated/prisma";

type verificationType = "EMAIL_VERIFICATION" | "PASSWORD_RESET";
type userStatus = "ACTIVE" | "INACTIVE" | "BANNED";

// Represents the current relationship state from viewer's perspective
type FollowStatus = "NONE" | "PENDING" | "ACCEPTED";

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
  followStatus: FollowStatus;
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

type userVerificationData = createVerificationData & { id: string };

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
  followStatus: FollowStatus; // replaces isFollowing boolean
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
  followers?: { id: string }[];
};

type followingResponse = {
  id: string;
  name: string;
  username: string;
  avatar?: string | null;
  followStatus: FollowStatus;
};

// For GET /follow/requests — incoming pending requests
type followRequestResponse = {
  id: string; // Following record id
  follower: {
    id: string;
    name: string;
    username: string;
    avatar: string | null;
  };
  createdAt: Date;
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
  FollowStatus,
  metaResponse,
  paginationMeta,
  filterMeta,
  followingResponse,
  followRequestResponse,
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
