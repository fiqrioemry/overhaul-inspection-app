export const POST_ENDPOINTS = {
  followingPosts: "/posts/following",
  publicPosts: "/posts/public",
  getUserPosts: "/posts/:userId/user",
  getUserSavedPosts: "/posts/saved",
  getPostDetails: "/posts/:postId",
  reportPost: "/posts/:postId/report",
  createPost: "/posts",
  updatePost: "/posts/:postId",
  likePost: "/posts/:postId/like",
  unlikePost: "/posts/:postId/unlike",
  savePost: "/posts/:postId/save",
  unsavePost: "/posts/:postId/unsave",
} as const;
