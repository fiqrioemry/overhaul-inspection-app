import { Context } from "hono";
import { responseCreated, responseOK } from "@/utils/response";
import { CommentService } from "@/modules/comments/comment.service";
import { commentSuccessMessage } from "@/config/constant/comment.constant";
import { createCommentRequest, editCommentRequest, getCommentsRequest } from "@/modules/comments/comment.schema";

export class CommentController {
  static async createComment(c: Context) {
    const user = await c.get("user");
    const postId = c.req.param("postId");
    const request = createCommentRequest.parse(await c.req.json());

    request.postId = postId;
    request.userId = user.userId;

    await CommentService.createComment(c, request);
    return responseCreated(c, commentSuccessMessage.CREATE_COMMENT_SUCCESS);
  }

  static async getParentComments(c: Context) {
    const user = await c.get("user");
    const postId = c.req.param("postId");
    const query = getCommentsRequest.parse(c.req.query());

    query.postId = postId;
    query.userId = user.userId;

    const response = await CommentService.getParentComments(c, query);
    return responseOK(c, commentSuccessMessage.GET_COMMENT_SUCCESS, response.data, response.meta);
  }

  static async getChildComments(c: Context) {
    const user = await c.get("user");
    const postId = c.req.param("postId");
    const commentId = c.req.param("commentId");
    const query = getCommentsRequest.parse(c.req.query());

    query.postId = postId;
    query.userId = user.userId;
    query.commentId = commentId;

    const response = await CommentService.getChildComments(c, query);
    return responseOK(c, commentSuccessMessage.GET_REPLIES_SUCCESS, response.data, response.meta);
  }

  static async editComment(c: Context) {
    const user = await c.get("user");
    const postId = c.req.param("postId");
    const request = editCommentRequest.parse(await c.req.json());

    request.postId = postId;
    request.userId = user.userId;

    const response = await CommentService.editComment(c, request);
    return responseOK(c, commentSuccessMessage.UPDATE_COMMENT_SUCCESS, response);
  }

  static async likeComment(c: Context) {
    const user = await c.get("user");
    const commentId = c.req.param("commentId");
    await CommentService.likeComment(c, commentId, user.userId);
    return responseOK(c, commentSuccessMessage.LIKE_COMMENT_SUCCESS);
  }

  static async unlikeComment(c: Context) {
    const user = await c.get("user");
    const commentId = c.req.param("commentId");
    await CommentService.unlikeComment(c, commentId, user.userId);
    return responseOK(c, commentSuccessMessage.UNLIKE_COMMENT_SUCCESS);
  }
}
