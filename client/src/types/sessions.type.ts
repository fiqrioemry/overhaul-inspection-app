// src/types/sessions.type.ts

export interface Session {
  id: string;
  userId: string;
  userAgent: string;
  expiresAt: Date;
  loginAt: Date;
}

export interface SessionWithCurrent extends Session {
  isCurrent: boolean;
  deviceInfo: {
    browser: string;
    os: string;
    device: string;
  };
}
