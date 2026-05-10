import { Context } from "hono";
import { PostService } from "@/services/post.service";
import { createPostRequest, updatePostRequest } from "@/schema/post.validation";
import successMessages from "@/config/constant/successMessage";
import { responseCreated, responseOK } from "@/utils/response";

export class PostController {
  static async createPost(c: Context) {
    const user = c.get("user");
    const body = await c.req.parseBody({ all: true });
    const galleries = c.get("posts") as File[] | undefined;

    const request = createPostRequest.parse({
      title: body.title,
      content: body.content,
      galleries,
    });

    const response = await PostService.createPost(c, user.userId, request);
    return responseCreated(c, successMessages.createPost, response);
  }

  static async getFollowingPosts(c: Context) {
    const user = await c.get("user");
    const response = await PostService.getFollowingPosts(c, user?.userId);
    return responseOK(c, successMessages.getPosts, response);
  }

  static async getPublicPosts(c: Context) {}

  static async getPostsByUserId(c: Context) {
    const user = await c.get("user");
    const targetId = c.req.param("targetId");
    const response = await PostService.getPostsByUserId(c, targetId, user?.userId);
    return responseOK(c, successMessages.getPosts, response);
  }

  static async getPostById(c: Context) {}

  static async updatePost(c: Context) {
    const user = await c.get("user");
    const postId = c.req.param("postId");
    const request = updatePostRequest.parse(await c.req.json());
    const response = await PostService.updatePost(c, user.userId, postId, request);
    return responseOK(c, successMessages.updatePost, response);
  }

  static async deletePost() {}

  static async likePost(c: Context) {
    const user = await c.get("user");
    const postId = c.req.param("postId");
    await PostService.likePost(c, user.userId, postId);
    return responseOK(c, successMessages.likePost);
  }

  static async unlikePost(c: Context) {
    const user = await c.get("user");
    const postId = c.req.param("postId");
    await PostService.unlikePost(c, user.userId, postId);
    return responseOK(c, successMessages.unlikePost);
  }
}
