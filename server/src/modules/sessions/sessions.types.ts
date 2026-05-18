type sessionResponse = {
  id: string;
  userId: string;
  userAgent: string | null;
  expiresAt: Date;
  loginAt: Date;
};

type createSessionData = {
  id: string;
  userId: string;
  token: string;
  userAgent: string;
  expiresAt: Date;
};

export { sessionResponse, createSessionData };
