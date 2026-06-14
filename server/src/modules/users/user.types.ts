import { OAuthProvider, RoleEnum, StatusEnum } from "generated/prisma";

type verificationType = "EMAIL_VERIFICATION" | "PASSWORD_RESET";
type userStatus = "ACTIVE" | "INACTIVE" | "BANNED";

type createVerificationData = {
  userId: string;
  token: string;
  type: verificationType;
  expiresAt: Date;
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
  status: string;
  verifiedAt: Date | null;
  lastLogin: Date | null;
  createdAt: Date;
};

type createUserData = {
  email: string;
  passwordHash?: string;
  name: string;
  role: RoleEnum;
  status: StatusEnum;
  isVerified: boolean;
};

type paginationMeta = {
  page: number;
  limit: number;
  total: number;
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
  verificationType,
  loginResponse,
  createUserData,
  userCredential,
  createVerificationData,
  userVerificationData,
  userResponse,
  userStatus,
  updateUserActiveData,
};
