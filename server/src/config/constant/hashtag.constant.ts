const hashtagSuccessMessage = {
  GET_TRENDING_SUCCESS: "Trending hashtags fetched successfully",
  GET_HASHTAG_POSTS_SUCCESS: "Hashtag posts fetched successfully",
};

const hashtagErrorMessage = {
  HASHTAG_NOT_FOUND: "Hashtag not found",
};

const hashtagErrorCode = {
  HASHTAG_NOT_FOUND: "HASHTAG_NOT_FOUND",
};

const hashtagLimit = {
  GET_TRENDING: { limit: 120, windowSec: 60 },
  GET_HASHTAG_POSTS: { limit: 120, windowSec: 60 },
};

export { hashtagSuccessMessage, hashtagErrorMessage, hashtagErrorCode, hashtagLimit };
