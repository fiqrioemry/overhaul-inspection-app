import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { NotificationType } from "generated/prisma";
import { pgsql as db, pgsql } from "@/lib/database";
import { metaResponse } from "@/modules/users/user.types";
import { PostRepository } from "@/modules/posts/post.repository";
import { UserRepository } from "@/modules/users/user.repository";
import { commentsResponse, repliesResponse } from "./comment.types";
import { CommentRepository } from "@/modules/comments/comment.repository";
import { postErrorCode, postErrorMessage } from "@/config/constant/post.constant";
import { NotificationRepository } from "@/modules/notifications/notification.repository";
import { commentAction, commentErrorCode, commentErrorMessage } from "@/config/constant/comment.constant";
import { notificationErrorCode, notificationErrorMessage } from "@/config/constant/notification.constant";
import { CreateCommentRequest, EditCommentRequest, GetCommentsRequest } from "@/modules/comments/comment.schema";
import { extractMentions } from "@/utils/content";

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
        notificationDescription = `@${c.var.user.username} commented on your post: ${request.content}`;
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

      // sync @mentions in comment content
      const mentionedUsernames = extractMentions(request.content);
      if (mentionedUsernames.length > 0) {
        const mentionedUsers = await Promise.all(mentionedUsernames.map((un) => UserRepository.getUserByUsername(un)));
        const validUsers = mentionedUsers.filter(Boolean) as { id: string }[];
        if (validUsers.length > 0) {
          await tx.postMention.createMany({ data: validUsers.map((u) => ({ commentId: comment.id, userId: u.id })), skipDuplicates: true });

          for (const mentionedUser of validUsers) {
            if (mentionedUser.id === request.userId) continue;
            const settings = await NotificationRepository.getNotificationByType(mentionedUser.id, NotificationType.MENTION);
            if (settings?.status === "ENABLED") {
              await NotificationRepository.createNotification(tx, {
                userId: mentionedUser.id,
                type: NotificationType.MENTION,
                title: "You were mentioned",
                description: `@${c.var.user.username} mentioned you in a comment`,
                metadata: { commentId: comment.id, postId: request.postId, mentionedBy: request.userId, path: `/p/${request.postId}` },
              });
            }
          }
        }
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

  static async getParentComments(c: Context, query: GetCommentsRequest): Promise<{ data: commentsResponse[]; meta: metaResponse }> {
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

  static async getChildComments(c: Context, query: GetCommentsRequest): Promise<{ data: repliesResponse[]; meta: metaResponse }> {
    const { comments, totalItems } = await CommentRepository.getCommentsByParentCommentId(query);

    const data = comments.map((result) => ({
      id: result.id,
      parentId: result.parentId!,
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

  static async deleteComment(c: Context, commentId: string, userId: string) {
    const comment = await CommentRepository.getCommentById(commentId);

    if (!comment) {
      throw new HTTPException(404, { message: commentErrorMessage.COMMENT_NOT_FOUND, cause: commentErrorCode.COMMENT_NOT_FOUND });
    }

    if (comment.userId !== userId) {
      throw new HTTPException(403, { message: commentErrorMessage.FORBIDDEN_DELETE_COMMENT, cause: commentErrorCode.FORBIDDEN_DELETE_COMMENT });
    }

    await db.$transaction(async (tx) => {
      await CommentRepository.deleteComment(tx, commentId);

      await UserRepository.createActivityLog(tx, {
        userId,
        action: commentAction.DELETE_COMMENT,
        metadata: {
          commentId,
          postId: comment.postId,
        },
      });
    });
  }
}
