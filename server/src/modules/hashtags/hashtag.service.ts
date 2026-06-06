import { HTTPException } from "hono/http-exception";
import { HashtagRepository } from "@/modules/hashtags/hashtag.repository";
import { GetHashtagPostsQuery, GetTrendingQuery } from "@/modules/hashtags/hashtag.schema";
import { HashtagItem } from "@/modules/hashtags/hashtag.types";
import { hashtagErrorCode, hashtagErrorMessage } from "@/config/constant/hashtag.constant";
import { metaResponse } from "@/modules/users/user.types";

export class HashtagService {
  static async getTrending(query: GetTrendingQuery): Promise<HashtagItem[]> {
    const limit = Math.min(Number(query.limit ?? 20), 50);
    const results = await HashtagRepository.getTrending(limit);
    return results.map((h: any) => ({ id: h.id, name: h.name, postCount: h._count.posts }));
  }

  static async getPostsByHashtag(name: string, query: GetHashtagPostsQuery): Promise<{ data: any[]; meta: metaResponse }> {
    const hashtag = await HashtagRepository.findByName(name.toLowerCase());
    if (!hashtag) throw new HTTPException(404, { message: hashtagErrorMessage.HASHTAG_NOT_FOUND, cause: hashtagErrorCode.HASHTAG_NOT_FOUND });

    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 10);
    const { posts, totalItems } = await HashtagRepository.getPostsByHashtag(hashtag.id, query.userId!, page, limit);

    const data = posts.map((p: any) => ({
      id: p.id,
      title: p.title,
      content: p.content,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      galleries: p.galleries,
      totalLikes: p._count.likes,
      totalComments: p._count.comments,
      isLiked: p.likes.length > 0,
      isSaved: p.bookmarks.length > 0,
      user: p.user,
    }));

    return {
      data,
      meta: { pagination: { page, limit, totalItems, totalPages: Math.ceil(totalItems / limit) } },
    };
  }
}
