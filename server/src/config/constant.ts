// server configuration
const PORT = process.env.PORT || 3000;
const HOSTNAME = process.env.HOSTNAME || "http://localhost";
const SERVER_URL = process.env.SERVER_URL || `${HOSTNAME}:${PORT}`;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
const CACHING_MAX_AGE = process.env.CACHING_MAX_AGE ? parseInt(process.env.CACHING_MAX_AGE) : 84600;
const SESSION_SECRET = process.env.SESSION_SECRET || "your_secret_key";

// database configuration
const DB_URL = process.env.DATABASE_URL || "mysql://root:password@localhost:3306/database_name?connection_limit=10&timezone=UTC";
const DB_HOST = process.env.DB_HOST || "localhost";
const DB_USER = process.env.DB_USER || "root";
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_NAME = process.env.DB_NAME || "database_name";
const DB_PORT = process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306;
const DB_CONNECTION_LIMIT = process.env.DB_CONNECTION_LIMIT ? parseInt(process.env.DB_CONNECTION_LIMIT) : 10;
const DB_TIMEZONE = process.env.DB_TIMEZONE || "+00:00";
const REDIS_URL = process.env.REDIS_URL || "redis://username:password@localhost:6379";

// token configuration
const TOKEN_PREFIX_DEFAULT = "uuid_session";
const SESSION_EXPIRES_IN = process.env.SESSION_EXPIRES_IN!;
const NODE_ENV = process.env.NODE_ENV;

// redis keys
const REDIS_KEY_PREFIX = "momments:";
const REDIS_KEY_LIMITTER = `${REDIS_KEY_PREFIX}limiter:`;
const REDIS_REGISTER = `${REDIS_KEY_PREFIX}verify:`;

//mailer config
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;

// error messages
const ERROR_MESSAGES = {
  USER_CREATION_FAILED: "Failed to create user",
  INTERNAL_SERVER_ERROR: "Internal Server Error",
  NOT_FOUND: "Resource Not Found",
  UNAUTHORIZED: "Unauthorized",
  FORBIDDEN: "Forbidden Access",
  BAD_REQUEST: "Bad Request",
  TOO_MANY_REQUESTS: "Too Many Requests",
  INVALID_TOKEN: "Invalid or Expired Token",
  ACCOUNT_DISABLED: "Account temporarily disabled",
  SESSION_REVOKED: "Session revoked",
  EMAIL_EXISTS: "Email already exists",
  INVALID_CREDENTIALS: "Invalid email or password",
};

// error codes use for frontend to handle specific error cases, make it easy to internationalize error messages in the future
const AUTH_CODES = {
  USER_CREATION_FAILED: "USER_CREATION_FAILED",
  INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR",
  NOT_FOUND: "NOT_FOUND",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  BAD_REQUEST: "BAD_REQUEST",
  TOO_MANY_REQUESTS: "TOO_MANY_REQUESTS",
  INVALID_TOKEN: "INVALID_TOKEN",
  INVALID_URL: "INVALID_URL",
  ACCOUNT_DISABLED: "ACCOUNT_DISABLED",
  SESSION_REVOKED: "SESSION_REVOKED",
  EMAIL_EXISTS: "EMAIL_EXISTS",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
};

export default {
  PORT,
  HOSTNAME,
  CLIENT_URL,
  CACHING_MAX_AGE,
  REDIS_URL,
  REDIS_KEY_PREFIX,
  REDIS_KEY_LIMITTER,
  ERROR_MESSAGES,
  TOKEN_PREFIX_DEFAULT,
  SESSION_EXPIRES_IN,
  NODE_ENV,
  DB_HOST,
  DB_USER,
  DB_PASSWORD,
  DB_NAME,
  DB_PORT,
  DB_CONNECTION_LIMIT,
  DB_TIMEZONE,
  REDIS_REGISTER,
  SMTP_USER,
  SMTP_PASS,
  DB_URL,
  SERVER_URL,
  AUTH_CODES,
  SESSION_SECRET,
};
