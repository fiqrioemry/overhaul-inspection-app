import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { NotificationType } from "generated/prisma";
import { pgsql as db, pgsql } from "@/config/database/pgsql";
import { PostRepository } from "@/modules/posts/post.repository";
import { UserRepository } from "@/modules/users/user.repository";
import { CommentRepository } from "@/modules/comments/comment.repository";
import { NotificationRepository } from "@/modules/notifications/notification.repository";
import { postErrorCode, postErrorMessage } from "@/config/constant/post.constant";
import { commentAction, commentErrorCode, commentErrorMessage } from "@/config/constant/comment.constant";
import { notificationErrorCode, notificationErrorMessage } from "@/config/constant/notification.constant";
import { CreateCommentRequest, EditCommentRequest, GetCommentsRequest } from "@/modules/comments/comment.schema";

export class CommentService {
  static async createComment(c: Context, request: CreateCommentRequest) {
    const post = await PostRepository.getPostById(request.postId!);

    if (!post) {
      throw new HTTPException(404, {
        message: postErrorMessage.POST_NOT_FOUND,
        cause: postErrorCode.POST_NOT_FOUND,
      });
    }

    let notificationRecipientId: string | null = null;
    let notificationType = NotificationType.COMMENT;
    let notificationTitle = "";
    let notificationDescription = "";
    let notificationMetadata: Record<string, any> = {};

    if (request.commentId) {
      const parentComment = await CommentRepository.getCommentById(request.commentId);

      if (!parentComment) {
        throw new HTTPException(404, {
          message: commentErrorMessage.COMMENT_NOT_FOUND,
          cause: commentErrorCode.COMMENT_NOT_FOUND,
        });
      }

      if (parentComment.postId !== request.postId) {
        throw new HTTPException(400, {
          message: commentErrorMessage.COMMENT_NOT_FOUND,
          cause: commentErrorCode.COMMENT_NOT_FOUND,
        });
      }

      if (parentComment.parentId) {
        throw new HTTPException(400, {
          message: commentErrorMessage.CANNOT_REPLY_TO_REPLY,
          cause: commentErrorCode.CANNOT_REPLY_TO_REPLY,
        });
      }

      if (parentComment.userId !== request.userId) {
        notificationRecipientId = parentComment.userId;
        notificationType = NotificationType.COMMENT;
        notificationTitle = "New Reply to Your Comment";
        notificationDescription = `@${c.var.user.username} replied to your comment`;
        notificationMetadata = {
          postId: request.postId,
          commentId: request.commentId,
          replierId: request.userId,
          path: `/posts/${request.postId}`,
        };
      }
    } else {
      if (post.userId !== request.userId) {
        notificationRecipientId = post.userId;
        notificationType = NotificationType.COMMENT;
        notificationTitle = "New Comment on Your Post";
        notificationDescription = `@${c.var.user.username} commented on your post: ${post.title}`;
        notificationMetadata = {
          postId: request.postId,
          commenterId: request.userId,
          path: `/posts/${request.postId}`,
        };
      }
    }

    let notificationSettings = null;

    if (notificationRecipientId) {
      notificationSettings = await NotificationRepository.getNotificationByType(notificationRecipientId, notificationType);
    }

    await db.$transaction(async (tx) => {
      const comment = await CommentRepository.createComment(tx, request);

      if (notificationRecipientId && notificationSettings && notificationSettings.status === "ENABLED") {
        await NotificationRepository.createNotification(tx, {
          userId: notificationRecipientId,
          title: notificationTitle,
          description: notificationDescription,
          type: notificationType,
          metadata: notificationMetadata,
        });
      }

      await UserRepository.createActivityLog(tx, {
        userId: request.userId!,
        action: commentAction.CREATE_COMMENT,
        metadata: {
          commentId: comment.id,
          postId: request.postId,
          parentCommentId: request.commentId ?? null,
        },
      });
    });
  }

  static async getParentComments(c: Context, query: GetCommentsRequest) {
    const { comments, totalItems } = await CommentRepository.getCommentsByPostId(query);

    const data = comments.map((result) => ({
      id: result.id,
      content: result.content,
      createdAt: result.createdAt,
      user: {
        id: result.user.id,
        name: result.user.name,
        username: result.user.username,
        avatar: result.user.avatar,
      },
      isLiked: result.likes.length > 0,
      isEditable: result.userId === query.userId,
      replies: result.children.map((child) => ({
        id: child.id,
        content: child.content,
        createdAt: child.createdAt,
        user: {
          id: child.user.id,
          name: child.user.name,
          username: child.user.username,
          avatar: child.user.avatar,
        },
        totalLikes: child._count.likes,
        isLiked: child.likes.length > 0,
        isEditable: child.userId === query.userId,
      })),
      totalReplies: result._count.children,
      totalLikes: result._count.likes,
      lastEditedAt: result.updatedAt,
      isEdited: result.createdAt.getTime() !== result.updatedAt.getTime(),
    }));

    const meta = {
      pagination: {
        page: Number(query.page!),
        limit: Number(query.limit!),
        totalItems,
        totalPages: totalItems > 0 ? Math.ceil(totalItems / Number(query.limit!)) : 0,
      },
    };

    return { data, meta };
  }

  static async getChildComments(c: Context, query: GetCommentsRequest) {
    const { comments, totalItems } = await CommentRepository.getCommentsByParentCommentId(query);

    const data = comments.map((result) => ({
      id: result.id,
      parentId: result.parentId,
      content: result.content,
      createdAt: result.createdAt,
      user: {
        id: result.user.id,
        name: result.user.name,
        username: result.user.username,
        avatar: result.user.avatar,
      },
      totalLikes: result._count.likes,
      isLiked: result.likes.length > 0,
      isEditable: result.userId === query.userId,
      isEdited: result.createdAt.getTime() !== result.updatedAt.getTime(),
      lastEditedAt: result.updatedAt,
    }));

    const meta = {
      pagination: {
        page: Number(query.page!),
        limit: Number(query.limit!),
        totalItems,
        totalPages: totalItems > 0 ? Math.ceil(totalItems / Number(query.limit!)) : 0,
      },
    };

    return { data, meta };
  }

  static async editComment(c: Context, request: EditCommentRequest) {
    // get the post
    const post = await PostRepository.getPostById(request.postId!, request.userId);

    if (!post) {
      throw new HTTPException(404, { message: postErrorMessage.POST_NOT_FOUND, cause: postErrorCode.POST_NOT_FOUND });
    }

    // get the comment
    const comment = await CommentRepository.getCommentById(request.commentId!, request.userId!);

    if (!comment) {
      throw new HTTPException(404, { message: commentErrorMessage.COMMENT_NOT_FOUND, cause: commentErrorCode.COMMENT_NOT_FOUND });
    }

    await db.$transaction(async (tx) => {
      const updatedComment = await CommentRepository.editComment(tx, request);
      const logMetaData = {
        commentId: comment.id,
        postId: request.postId,
      };

      await UserRepository.createActivityLog(tx, {
        userId: request.userId!,
        action: commentAction.UPDATE_COMMENT,
        metadata: logMetaData,
      });

      return updatedComment;
    });
  }

  static async likeComment(c: Context, commentId: string, userId: string) {
    const comment = await CommentRepository.getCommentById(commentId);

    if (!comment) {
      throw new HTTPException(404, { message: commentErrorMessage.COMMENT_NOT_FOUND, cause: commentErrorCode.COMMENT_NOT_FOUND });
    }

    const existingLike = await CommentRepository.getLikeByUserId(commentId, userId);

    if (existingLike) {
      throw new HTTPException(400, { message: commentErrorMessage.ALREADY_LIKED_COMMENT, cause: commentErrorCode.ALREADY_LIKED_COMMENT });
    }

    // get notification settings
    const notificationSettings = await NotificationRepository.getNotificationByType(comment.userId, NotificationType.COMMENT);

    if (!notificationSettings) {
      throw new HTTPException(404, { message: notificationErrorMessage.NOTIFICATION_SETTINGS_NOT_FOUND, cause: notificationErrorCode.NOTIFICATION_SETTINGS_NOT_FOUND });
    }

    // create record in transaction
    await pgsql.$transaction(async (tx) => {
      // like comment
      await CommentRepository.likeComment(commentId, userId, tx);

      // create notification for comment like
      if (comment.userId !== userId && notificationSettings.status === "ENABLED") {
        await NotificationRepository.createNotification(tx, {
          userId: comment.userId,
          title: "New Like on Your Comment",
          description: `@${comment.user.username} liked your comment`,
          type: NotificationType.COMMENT,
          metadata: { commentId, likerId: userId, path: `/posts/${comment.postId}` },
        });
      }
    });
  }

  static async unlikeComment(c: Context, commentId: string, userId: string) {
    const comment = await CommentRepository.getCommentById(commentId);

    if (!comment) {
      throw new HTTPException(404, { message: commentErrorMessage.COMMENT_NOT_FOUND, cause: commentErrorCode.COMMENT_NOT_FOUND });
    }

    const existingLike = await CommentRepository.getLikeByUserId(commentId, userId);

    if (!existingLike) {
      throw new HTTPException(404, { message: commentErrorMessage.LIKE_NOT_FOUND, cause: commentErrorCode.LIKE_NOT_FOUND });
    }

    return await CommentRepository.unlikeComment(commentId, userId);
  }
}
