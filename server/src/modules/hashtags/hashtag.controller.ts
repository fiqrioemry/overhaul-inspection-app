import { Context } from "hono";
import { responseOK } from "@/utils/response";
import { HashtagService } from "@/modules/hashtags/hashtag.service";
import { hashtagSuccessMessage } from "@/config/constant/hashtag.constant";
import { getHashtagPostsQuery, getTrendingQuery } from "@/modules/hashtags/hashtag.schema";

export class HashtagController {
  static async getTrending(c: Context) {
    const query = getTrendingQuery.parse(c.req.query());
    const response = await HashtagService.getTrending(query);
    return responseOK(c, hashtagSuccessMessage.GET_TRENDING_SUCCESS, response);
  }

  static async getPostsByHashtag(c: Context) {
    const user = c.get("user");
    const name = c.req.param("name");
    const query = getHashtagPostsQuery.parse(c.req.query());
    query.userId = user.userId;
    const response = await HashtagService.getPostsByHashtag(name, query);
    return responseOK(c, hashtagSuccessMessage.GET_HASHTAG_POSTS_SUCCESS, response.data, response.meta);
  }
}
