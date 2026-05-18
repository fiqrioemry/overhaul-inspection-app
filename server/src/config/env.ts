const mailConfig = {
  SMTP_USER: process.env.SMTP_USER || "user@example.com",
  SMTP_PASS: process.env.SMTP_PASS || "password",
  EMAIL_VERIFICATION_SUBJECT: "Verify your email address",
  PASSWORD_RESET_SUBJECT: "Reset your password",
};

const databaseConfig = {
  port: process.env.PORT,
  MODE: process.env.MODE || "development",
  host: process.env.HOSTNAME || "localhost",
  serverUrl: process.env.SERVER_URL || `http://${process.env.HOSTNAME || "localhost"}:${process.env.PORT}`,
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5173",
  CACHING_MAX_AGE: process.env.CACHING_MAX_AGE ? parseInt(process.env.CACHING_MAX_AGE) : 84600,
  SESSION_SECRET: process.env.SESSION_SECRET || "your-session-secret",
  DB_URL: process.env.DATABASE_URL || "mysql://root:password@localhost:3306/database_name?connection_limit=10&timezone=UTC",
  dbConnectionLimit: process.env.DB_CONNECTION_LIMIT ? parseInt(process.env.DB_CONNECTION_LIMIT) : 10,
  dbTimezone: process.env.DB_TIMEZONE || "+00:00",
};

const minioConfig = {
  HOST: process.env.MINIO_HOST || "minio_storage",
  PORT: process.env.MINIO_PORT ? parseInt(process.env.MINIO_PORT) : 9000,
  USE_SSL: process.env.MINIO_SSL === "true",
  ACCESS_KEY: process.env.MINIO_ACCESS_KEY || "minio_access_key",
  SECRET_KEY: process.env.MINIO_SECRET_KEY || "minio_secret_key",
  BUCKET: process.env.MINIO_BUCKET || "my-bucket",
  ENDPOINT: process.env.MINIO_ENDPOINT || "http://localhost:9000",
};

const REDIS_KEY_PREFIX = "social-media:";

const redisConfig = {
  TOKEN_PREFIX_DEFAULT: "sid-token",
  SESSION_EXP_IN: process.env.SESSION_EXPIRES_IN ? parseInt(process.env.SESSION_EXPIRES_IN) : 3600, // default 1 hour
  REDIS_URL: process.env.REDIS_URL!,
  REDIS_KEY_LIMITER: `${REDIS_KEY_PREFIX}limiter:`,
  REDIS_REGISTER: `${REDIS_KEY_PREFIX}verify:`,
};

export { mailConfig, databaseConfig, minioConfig, redisConfig };
