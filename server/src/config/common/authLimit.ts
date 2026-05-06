const authLimiter = {
  login: {
    limit: 5, // limit each IP to 5 login requests per windowSec
    windowSec: 60, // 60 seconds in seconds
  },

  sessions: {
    limit: 100, // limit each user to 100 active sessions
    windowSec: 60, // Per 60 secs hit 100 times
  },

  register: {
    limit: 10, // limit each IP to 10 registration requests per windowSec
    windowSec: 60, // 60 seconds in seconds
  },

  passwordReset: {
    limit: 3, // limit each IP to 3 password reset requests per windowSec
    windowSec: 60, // 60 seconds in seconds
  },

  verifyEmail: {
    limit: 5, // limit each IP to 5 email verification requests per windowSec
    windowSec: 60, // 60 seconds in seconds
  },
};

export default authLimiter;
