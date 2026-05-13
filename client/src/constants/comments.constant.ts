// features/comments/comments.endpoints.ts
export const COMMENTS_ENDPOINTS = {
  getComments: "/comment/:postId/comments",
  getReplies: "/comment/:postId/comments/:commentId",
  createComment: "/comment",
  editCommentRequest: "/comment/:commentId",
  likeComment: "/comment/:commentId/like",
  unlikeComment: "/comment/:commentId/unlike",
} as const;
