import { Context } from "hono";
import { PostService } from "@/modules/posts/post.service";
import { responseCreated, responseOK } from "@/utils/response";
import { postSuccessMessage } from "@/config/constant/post.constant";
import { createPostRequest, getFollowingPostsRequest, getPublicPostsRequest, getSavedPostsRequest, reportPostRequest, updatePostRequest } from "@/modules/posts/post.schema";

export class PostController {
  static async createPost(c: Context) {
    const user = c.get("user");
    const body = await c.req.parseBody({ all: true });
    const galleries = c.get("posts") as File[] | undefined;

    let crops: unknown[] = [];
    try {
      if (typeof body.crops === "string") {
        crops = JSON.parse(body.crops);
      }
    } catch {
      crops = [];
    }

    const request = createPostRequest.parse({
      title: body.title,
      content: body.content,
      aspectRatio: body.aspectRatio ?? "1:1",
      crops,
      galleries,
    });

    const response = await PostService.createPost(c, user.userId, request);
    return responseCreated(c, postSuccessMessage.CREATE_POST_SUCCESS, response);
  }

  static async getFollowingPosts(c: Context) {
    const user = await c.get("user");
    const query = getFollowingPostsRequest.parse(c.req.query());
    query.userId = user?.userId;
    const response = await PostService.getFollowingPosts(c, query);
    return responseOK(c, postSuccessMessage.GET_FOLLOWING_POSTS_SUCCESS, response.data, response.meta);
  }

  static async getPublicPosts(c: Context) {
    const user = await c.get("user");
    const query = getPublicPostsRequest.parse(c.req.query());
    query.userId = user?.userId;
    const response = await PostService.getPublicPosts(c, query);
    return responseOK(c, postSuccessMessage.GET_PUBLIC_POSTS_SUCCESS, response.data, response.meta);
  }

  static async getPostsByUserId(c: Context) {
    const user = await c.get("user");
    const targetId = c.req.param("targetId");
    const query = getPublicPostsRequest.parse(c.req.query());
    query.targetUserId = targetId;
    query.userId = user?.userId;
    const response = await PostService.getPostsByUserId(c, query, user?.userId);
    return responseOK(c, postSuccessMessage.GET_PUBLIC_POSTS_SUCCESS, response.data, response.meta);
  }

  static async getPostById(c: Context) {
    const user = await c.get("user");
    const postId = c.req.param("postId");
    const response = await PostService.getPostDetailById(c, postId, user?.userId);
    return responseOK(c, postSuccessMessage.GET_POST_DETAIL_SUCCESS, response);
  }

  static async updatePost(c: Context) {
    const user = await c.get("user");
    const postId = c.req.param("postId");
    const request = updatePostRequest.parse(await c.req.json());
    const response = await PostService.updatePost(c, user.userId, postId, request);
    return responseOK(c, postSuccessMessage.UPDATE_POST_SUCCESS, response);
  }

  static async deletePost(c: Context) {
    const user = await c.get("user");
    const postId = c.req.param("postId");
    await PostService.deletePost(c, user.userId, postId);
    return responseOK(c, postSuccessMessage.DELETE_POST_SUCCESS);
  }

  static async likePost(c: Context) {
    const user = await c.get("user");
    const postId = c.req.param("postId");
    await PostService.likePost(c, user.userId, postId);
    return responseOK(c, postSuccessMessage.LIKE_POST_SUCCESS);
  }

  static async unlikePost(c: Context) {
    const user = await c.get("user");
    const postId = c.req.param("postId");
    await PostService.unlikePost(c, user.userId, postId);
    return responseOK(c, postSuccessMessage.UNLIKE_POST_SUCCESS);
  }

  static async getAllSavedPosts(c: Context) {
    const user = await c.get("user");
    const query = getSavedPostsRequest.parse(c.req.query());
    query.userId = user?.userId;
    console.log("userId in controller:", query);
    const response = await PostService.getSavedPosts(c, query);
    return responseOK(c, postSuccessMessage.GET_SAVED_POSTS_SUCCESS, response.data, response.meta);
  }

  static async savePost(c: Context) {
    const user = await c.get("user");
    const postId = c.req.param("postId");
    await PostService.savePostAsBookmark(c, user.userId, postId);
    return responseOK(c, postSuccessMessage.BOOKMARK_POST_SUCCESS);
  }

  static async unsavePost(c: Context) {
    const user = await c.get("user");
    const postId = c.req.param("postId");
    await PostService.unsavePostFromBookmark(c, user.userId, postId);
    return responseOK(c, postSuccessMessage.UNBOOKMARK_POST_SUCCESS);
  }

  static async reportPost(c: Context) {
    const user = c.get("user");
    const postId = c.req.param("postId");
    const request = reportPostRequest.parse(await c.req.json());
    await PostService.reportPost(c, user.userId, postId, request);
    return responseOK(c, postSuccessMessage.REPORT_POST_SUCCESS);
  }
}
