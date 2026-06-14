import { OAuthProvider, RoleEnum } from "generated/prisma";

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
  role: string;
  avatar: string | null;
};

type userCredential = {
  id: string;
  email: string;
  name: string;
  role: RoleEnum;
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
    role: string;
    avatar: string | null;
    email: string;
  };
};

type userResponse = {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  role: string;
  lastLogin: Date | null;
  joinedAt: Date;
  lastChangePasswordAt: Date | null;
  hasPassword: boolean;
};

type profileResponse = {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  role: string;
  lastLogin: Date | null;
  joinedAt: Date;
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
  role: string;
  avatar: string | null;
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
  [key: string]: string | undefined;
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
