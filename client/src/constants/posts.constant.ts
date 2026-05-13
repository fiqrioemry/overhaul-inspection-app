// features/auth/auth.endpoints.ts
export const POST_ENDPOINTS = {
  publicPosts: "/post/public",
  followingPosts: "/post/following",
  createPost: "/post",
  updatePost: "/post/:postId",
  likePost: "/post/:postId/like",
  unlikePost: "/post/:postId/like",
  postById: "/post/:postId",
  postsByUserId: "/post/:userId/user",
} as const;
