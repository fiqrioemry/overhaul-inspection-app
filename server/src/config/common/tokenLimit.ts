const tokenLimit = {
  verifyEmail: 15 * 60, // 15 minutes in seconds
  sessionToken: 1000 * 60 * 60 * 24 * 7, // 7 days in milliseconds
};

export default tokenLimit;
