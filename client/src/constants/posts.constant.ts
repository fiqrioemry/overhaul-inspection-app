export const POST_ENDPOINTS = {
  followingPosts: "/posts/following",
  publicPosts: "/posts/public",
  getUserPosts: "/posts/:userId/user",
  getUserSavedPosts: "/posts/saved",
  getPostDetails: "/posts/:postId",
  createPost: "/posts",
  updatePost: "/posts/:postId",
  likePost: "/posts/:postId/like",
  unlikePost: "/posts/:postId/unlike",
} as const;
