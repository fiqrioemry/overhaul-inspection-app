const userLimit = {
  getProfile: {
    limit: 20,
    windowSec: 60,
  },
  updateProfile: {
    limit: 10,
    windowSec: 60,
  },
  updateAvatar: {
    limit: 5,
    windowSec: 60,
  },

  searchUsers: {
    limit: 30,
    windowSec: 60,
  },
};

export default userLimit;
