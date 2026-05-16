const postSuccessMessage = {
  GET_POST_DETAIL_SUCCESS: "Post detail retrieved successfully",
  GET_FOLLOWING_POSTS_SUCCESS: "Following posts retrieved successfully",
  GET_PUBLIC_POSTS_SUCCESS: "Public posts retrieved successfully",
  CREATE_POST_SUCCESS: "Post created successfully",
  UPDATE_POST_SUCCESS: "Post updated successfully",
  DELETE_POST_SUCCESS: "Post deleted successfully",
  LIKE_POST_SUCCESS: "You liked the post",
  UNLIKE_POST_SUCCESS: "You unliked the post",
};

const postErrorMessage = {
  POST_NOT_FOUND: "Post not found",
  INVALID_POST_ID: "Invalid post ID",
  UNAUTHORIZED: "Unauthorized to perform this action",
  ALREADY_LIKED_POST: "Post already liked by the user",
  ALREADY_UNLIKED_POST: "Post already unliked by the user",
};

const postErrorCode = {
  POST_NOT_FOUND: "POST_NOT_FOUND",
  INVALID_POST_ID: "INVALID_POST_ID",
  UNAUTHORIZED: "UNAUTHORIZED",
  ALREADY_LIKED_POST: "ALREADY_LIKED_POST",
  ALREADY_UNLIKED_POST: "ALREADY_UNLIKED_POST",
};

const postAction = {
  CREATE_POST: "postCreate",
  UPDATE_POST: "postUpdate",
  DELETE_POST: "postDelete",
};

const postLimit = {
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
