const postSuccessMessage = {
  GET_POST_DETAIL_SUCCESS: "Post detail retrieved successfully",
  GET_FOLLOWING_POSTS_SUCCESS: "Following posts retrieved successfully",
  GET_PUBLIC_POSTS_SUCCESS: "Public posts retrieved successfully",
  GET_SAVED_POSTS_SUCCESS: "Saved posts retrieved successfully",
  CREATE_POST_SUCCESS: "Post created successfully",
  UPDATE_POST_SUCCESS: "Post updated successfully",
  DELETE_POST_SUCCESS: "Post deleted successfully",
  LIKE_POST_SUCCESS: "You liked the post",
  UNLIKE_POST_SUCCESS: "You unliked the post",
  BOOKMARK_POST_SUCCESS: "Post bookmarked successfully",
  UNBOOKMARK_POST_SUCCESS: "Post unbookmarked successfully",
  REPORT_POST_SUCCESS: "Post reported successfully",
};

const postErrorMessage = {
  ALREADY_SAVED_POST: "Post already saved by the user",
  ALREADY_UNSAVED_POST: "Post already unsaved by the user",
  POST_NOT_FOUND: "Post not found",
  INVALID_POST_ID: "Invalid post ID",
  UNAUTHORIZED: "Unauthorized to perform this action",
  ALREADY_LIKED_POST: "Post already liked by the user",
  ALREADY_UNLIKED_POST: "Post already unliked by the user",
  ALREADY_REPORTED_POST: "You have already reported this post.",
  DESCRIPTION_REQUIRED: "A description is required when reason is OTHER.",
};

const postErrorCode = {
  ALREADY_SAVED_POST: "ALREADY_SAVED_POST",
  ALREADY_UNSAVED_POST: "ALREADY_UNSAVED_POST",
  POST_NOT_FOUND: "POST_NOT_FOUND",
  INVALID_POST_ID: "INVALID_POST_ID",
  UNAUTHORIZED: "UNAUTHORIZED",
  ALREADY_LIKED_POST: "ALREADY_LIKED_POST",
  ALREADY_UNLIKED_POST: "ALREADY_UNLIKED_POST",
  ALREADY_REPORTED_POST: "ALREADY_REPORTED_POST",
  DESCRIPTION_REQUIRED: "DESCRIPTION_REQUIRED",
};

const postAction = {
  CREATE_POST: "postCreate",
  UPDATE_POST: "postUpdate",
  DELETE_POST: "postDelete",
};

export const postReportThreshold = 20;

const postLimit = {
  REPORT_POST: {
    limit: 30,
    windowSec: 60,
  },
  GET_SAVED_POSTS: {
    limit: 120,
    windowSec: 60,
  },
  SAVE_POST: {
    limit: 30,
    windowSec: 60,
  },
  UNSAVE_POST: {
    limit: 30,
    windowSec: 60,
  },
  CREATE_POST: {
    limit: 20,
    windowSec: 60,
  },
  UPDATE_POST: {
    limit: 10,
    windowSec: 60,
  },

  GET_FOLLOWING_POSTS: {
    limit: 120,
    windowSec: 60,
  },

  LIKE_POST: {
    limit: 60,
    windowSec: 60,
  },

  UNLIKE_POST: {
    limit: 60,
    windowSec: 60,
  },

  GET_POST_BY_USER_ID: {
    limit: 120,
    windowSec: 60,
  },
  GET_PUBLIC_POSTS: {
    limit: 120,
    windowSec: 60,
  },

  GET_POST_BY_ID: {
    limit: 60,
    windowSec: 60,
  },
  DELETE_POST: {
    limit: 10,
    windowSec: 60,
  },
};

export { postSuccessMessage, postErrorMessage, postErrorCode, postAction, postLimit };
