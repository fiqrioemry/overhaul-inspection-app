import { GoogleOAuthProvider, GitHubOAuthProvider, IOAuthProvider } from "@/utils/oauth";

export type OAuthProviderKey = "google" | "github";

const mailConfig = {
  SMTP_HOST: process.env.SMTP_HOST || "smtp.example.com",
  SMTP_PORT: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587,
  SMTP_USER: process.env.SMTP_USER || "",
  SMTP_PASS: process.env.SMTP_PASS || "",
  SMTP_FROM: process.env.SMTP_FROM || "Tank Progress <noreply@example.com>",
  EMAIL_VERIFICATION_SUBJECT: "Verify your email address",
  PASSWORD_RESET_SUBJECT: "Reset your password",
};

const databaseConfig = {
  PORT: process.env.PORT || "5001",
  MODE: process.env.NODE_ENV || "development",
  HOST: process.env.HOSTNAME || "localhost",
  SERVER_URL: process.env.SERVER_URL || `http://localhost:${process.env.PORT || 5001}`,
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5173",
  CACHING_MAX_AGE: process.env.CACHING_MAX_AGE ? parseInt(process.env.CACHING_MAX_AGE) : 86400,
  SESSION_SECRET: process.env.SESSION_SECRET || "change_me_in_production",
  DB_URL: process.env.DATABASE_URL || "",
};

const oauthProviders: Record<OAuthProviderKey, IOAuthProvider> = {
  google: new GoogleOAuthProvider(process.env.GOOGLE_CLIENT_ID!, process.env.GOOGLE_CLIENT_SECRET!, process.env.GOOGLE_REDIRECT_URI ?? "http://localhost:5001/api/v1/auth/google/callback"),
  github: new GitHubOAuthProvider(process.env.GITHUB_CLIENT_ID!, process.env.GITHUB_CLIENT_SECRET!, process.env.GITHUB_REDIRECT_URI ?? "http://localhost:5001/api/v1/auth/github/callback"),
};

export function getOAuthProvider(key: OAuthProviderKey): IOAuthProvider {
  const provider = oauthProviders[key];
  if (!provider) throw new Error(`OAuth provider "${key}" is not registered`);
  return provider;
}

const minioConfig = {
  HOST: process.env.MINIO_HOST || "localhost",
  PORT: process.env.MINIO_PORT ? parseInt(process.env.MINIO_PORT) : 9000,
  USE_SSL: process.env.MINIO_SSL === "true",
  ACCESS_KEY: process.env.MINIO_ACCESS_KEY || "minioadmin",
  SECRET_KEY: process.env.MINIO_SECRET_KEY || "minioadmin",
  BUCKET: process.env.MINIO_BUCKET || "tank-progress",
  ENDPOINT: process.env.MINIO_ENDPOINT || "http://localhost:9000",
  PUBLIC_URL: process.env.MINIO_PUBLIC_URL || "http://localhost:9000/tank-progress",
};

const REDIS_KEY_PREFIX = "tank-progress:";

const redisConfig = {
  TOKEN_PREFIX_DEFAULT: "sid-token",
  SESSION_EXP_IN: process.env.SESSION_EXPIRES_IN ? parseInt(process.env.SESSION_EXPIRES_IN) : 604800,
  REDIS_URL: process.env.REDIS_URL!,
  REDIS_KEY_LIMITER: `${REDIS_KEY_PREFIX}limiter:`,
  REDIS_REGISTER: `${REDIS_KEY_PREFIX}verify:`,
};

const appConfig = {
  UPLOAD_MAX_SIZE_MB: process.env.UPLOAD_MAX_SIZE_MB ? parseInt(process.env.UPLOAD_MAX_SIZE_MB) : 20,
  ORPHAN_FILE_TTL_MINUTES: process.env.ORPHAN_FILE_TTL_MINUTES ? parseInt(process.env.ORPHAN_FILE_TTL_MINUTES) : 60,
};

const openaiConfig = {
  API_KEY: process.env.OPENAI_API_KEY || "",
  MODEL: (process.env.OPENAI_MODEL || "gpt-4o") as string,
};

export { mailConfig, databaseConfig, minioConfig, redisConfig, oauthProviders, appConfig, openaiConfig };
