const postLimit = {
  createPost: {
    limit: 20,
    windowSec: 60,
  },
  updatePost: {
    limit: 10,
    windowSec: 60,
  },

  getFollowingPosts: {
    limit: 30,
    windowSec: 60,
  },
};

export default postLimit;
