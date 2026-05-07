type sessionResponse = {
  id: string;
  userId: string;
  userAgent: string | null;
  expiresAt: Date;
  createdAt: Date;
  user: {
    email: string;
    role: string;
    status: string;
  };
};

type createSessionData = {
  id: string;
  userId: string;
  token: string;
  userAgent: string;
  expiresAt: Date;
};

export { sessionResponse, createSessionData };
