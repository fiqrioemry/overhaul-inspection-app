const TTL = {
  VERIFY_EMAIL: 15 * 60, // 15 minutes in seconds
  SESSION_TOKEN: 1000 * 60 * 60 * 24 * 7, // 7 days in milliseconds
};

const LIMIT = {
  DEFAULT: {
    limit: 100, // default limit for general endpoints
    windowSec: 60,
  },
  LOGIN: {
    limit: 5, // limit each IP to 5 login requests per windowSec
    windowSec: 60, // 60 seconds in seconds
  },

  SESSIONS: {
    limit: 100, // limit each user to 100 active sessions
    windowSec: 60, // Per 60 secs hit 100 times
  },

  REGISTER: {
    limit: 10, // limit each IP to 10 registration requests per windowSec
    windowSec: 60, // 60 seconds in seconds
  },

  PASSWORD_RESET: {
    limit: 3, // limit each IP to 3 password reset requests per windowSec
    windowSec: 60, // 60 seconds in seconds
  },

  VERIFY_EMAIL: {
    limit: 5, // limit each IP to 5 email verification requests per windowSec
    windowSec: 60, // 60 seconds in seconds
  },
};

export default {
  TTL,
  LIMIT,
};
