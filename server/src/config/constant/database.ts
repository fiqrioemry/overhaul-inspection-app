const host = process.env.HOSTNAME || "localhost";
const port = process.env.PORT;

const dbConfig = {
  port: port,
  host: host,
  serverUrl: process.env.SERVER_URL || `http://${host}:${port}`,
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  cachingMaxAge: process.env.CACHING_MAX_AGE ? parseInt(process.env.CACHING_MAX_AGE) : 84600,
  sessionSecret: process.env.SESSION_SECRET || "your-session-secret",
  dbUrl: process.env.DATABASE_URL || "mysql://root:password@localhost:3306/database_name?connection_limit=10&timezone=UTC",
  mongoUrl: process.env.MONGO_DATABASE_URL || "mongodb://localhost:27017/social_media_chat",
  dbConnectionLimit: process.env.DB_CONNECTION_LIMIT ? parseInt(process.env.DB_CONNECTION_LIMIT) : 10,
  dbTimezone: process.env.DB_TIMEZONE || "+00:00",
  mode: process.env.NODE_ENV === "production",
};

export default dbConfig;
