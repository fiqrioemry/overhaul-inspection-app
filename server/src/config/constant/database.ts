const host = process.env.DB_HOST || "localhost";
const port = process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306;

const dbConfig = {
  port: port,
  host: host,
  serverUrl: process.env.SERVER_URL || `http://${host}:${port}`,
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  cachingMaxAge: process.env.CACHING_MAX_AGE ? parseInt(process.env.CACHING_MAX_AGE) : 84600,
  sessionSecret: process.env.SESSION_SECRET,
  dbUrl: process.env.DATABASE_URL || "mysql://root:password@localhost:3306/database_name?connection_limit=10&timezone=UTC",
  dbHost: process.env.DB_HOST || "localhost",
  dbUser: process.env.DB_USER || "root",
  dbPassword: process.env.DB_PASSWORD,
  dbName: process.env.DB_NAME || "database_name",
  dbPort: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
  dbConnectionLimit: process.env.DB_CONNECTION_LIMIT ? parseInt(process.env.DB_CONNECTION_LIMIT) : 10,
  dbTimezone: process.env.DB_TIMEZONE || "+00:00",
};

export default dbConfig;
