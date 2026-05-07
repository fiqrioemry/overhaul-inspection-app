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
  id: string;
  token: string;
  expiredAt: Date;
};

type userResponse = {
  id: string;
  email: string;
  name: string;
  username: string;
  avatar: string | null;
  bio: string | null;
  status: UserStatus;
  lastLogin: Date | null;
  createdAt: Date;
  verifiedAt: Date | null;
};

type createUserData = {
  email: string;
  passwordHash: string;
  name: string;
  username: string;
  avatar: string;
};

export { verificationType, loginResponse, createUserData, userCredential, createVerificationData, userVerificationData, userResponse, UserStatus, updateUserActiveData };
