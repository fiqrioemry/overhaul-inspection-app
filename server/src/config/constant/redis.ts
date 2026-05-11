const redisKeyPrefix = "social-media:";

const redisConfig = {
  tokenPrefixDefault: "sid-token",
  sessionExpiresIn: process.env.SESSION_EXPIRES_IN ? parseInt(process.env.SESSION_EXPIRES_IN) : 3600, // default 1 hour
  redisUrl: process.env.REDIS_URL!,
  redisKeyLimiter: `${redisKeyPrefix}limiter:`,
  redisRegister: `${redisKeyPrefix}verify:`,
};

export default redisConfig;
