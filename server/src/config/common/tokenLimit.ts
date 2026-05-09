const tokenLimit = {
  verifyEmail: 60 * 60 * 1000, // 60 minutes in milliseconds
  sessionToken: 1000 * 60 * 60 * 24 * 7, // 7 days in milliseconds
  passwordReset: 60 * 60 * 1000, // 60 minutes in milliseconds
};

export default tokenLimit;
