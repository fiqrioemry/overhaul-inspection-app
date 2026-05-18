type verificationType = "EMAIL_VERIFICATION" | "PASSWORD_RESET";

type UserStatus = "ACTIVE" | "INACTIVE" | "BANNED";

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
  username: string;
  avatar: string | null;
  passwordHash: string;
  status: UserStatus;
  verifiedAt: Date | null;
};

type userVerificationData = createVerificationData & {
  id: string;
};

type updateUserActiveData = {
  userId: string;
  status: UserStatus;
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
  createdAt: Date;
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
  createdAt: Date;
  isPublic: boolean;
  isOwner?: boolean;
  _count?: {
    followers?: number;
    following?: number;
    posts?: number;
  };
  followers?: {
    id: string;
  }[];
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

export { verificationType, searchResponse, loginResponse, createUserData, profileResponse, userCredential, createVerificationData, userVerificationData, userResponse, UserStatus, updateUserActiveData };
