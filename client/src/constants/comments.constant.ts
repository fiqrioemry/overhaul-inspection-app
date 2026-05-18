// features/comments/comments.endpoints.ts
export const COMMENTS_ENDPOINTS = {
  getComments: "/comments/:postId/comments",
  getReplies: "/comments/:postId/comments/:commentId",
  createComment: "/comments",
  editComment: "/comments/:commentId",
  likeComment: "/comments/:commentId/like",
  unlikeComment: "/comments/:commentId/unlike",
} as const;
