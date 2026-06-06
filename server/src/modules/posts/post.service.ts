import { Context } from "hono";
import { pgsql as db } from "@/lib/database";
import { HTTPException } from "hono/http-exception";
import { metaResponse } from "@/modules/users/user.types";
import { FileService } from "@/modules/files/file.service";
import { NotificationType, Prisma } from "generated/prisma";
import { PostRepository } from "@/modules/posts/post.repository";
import { UserRepository } from "@/modules/users/user.repository";
import { postDetailResponse, postResponse, savedPostResponse } from "./post.types";
import { NotificationRepository } from "@/modules/notifications/notification.repository";
import { postAction, postErrorCode, postErrorMessage } from "@/config/constant/post.constant";
import { CreatePostRequest, GetFollowingPostsRequest, GetPublicPostsRequest, GetSavedPostsRequest, ReportPostRequest, UpdatePostRequest } from "@/modules/posts/post.schema";
import { FileRepository } from "../files/file.repository";
import { HashtagRepository } from "@/modules/hashtags/hashtag.repository";
import { extractHashtags, extractMentions } from "@/utils/content";

export class PostService {
  static async createPost(c: Context, userId: string, request: CreatePostRequest) {
    return await db.$transaction(async (tx: Prisma.TransactionClient) => {
      const post = await PostRepository.createPost(tx, userId, request);

      if (request.galleries && request.galleries.length > 0) {
        const fileRecords = await Promise.all(
          request.galleries.map(async (file, i) => {
            const cropRect = request.crops?.[i];
            return await FileService.generateFileRecord(file, "posts", request.aspectRatio, cropRect);
          }),
        );

        const fileRecordsWithTargetId = fileRecords.map((fr) => ({
          ...(fr ?? {}),
          targetId: post.id,
          isUsed: true,
        }));

        const galleries = await FileService.saveBulkRecordsToDatabase(fileRecordsWithTargetId, tx);
        await PostRepository.bulkCreateGalleryRecords(tx, post.id, galleries);

        await UserRepository.createActivityLog(tx, {
          userId,
          action: postAction.CREATE_POST,
          metadata: {
            title: request.title,
            content: post.content,
            aspectRatio: request.aspectRatio,
            galleries,
          },
        });

        for (const fileRecord of fileRecords) {
          await FileService.uploadFileToStorage(c, fileRecord);
        }
      }

      // sync hashtags
      const tagNames = extractHashtags(request.content);
      if (tagNames.length > 0) {
        const hashtags = await HashtagRepository.upsertHashtags(tx, tagNames);
        await HashtagRepository.syncPostHashtags(tx, post.id, hashtags.map((h) => h.id));
      }

      // sync mentions
      const mentionedUsernames = extractMentions(request.content);
      if (mentionedUsernames.length > 0) {
        const mentionedUsers = await Promise.all(mentionedUsernames.map((un) => UserRepository.getUserByUsername(un)));
        const validUsers = mentionedUsers.filter(Boolean) as { id: string }[];

        if (validUsers.length > 0) {
          await tx.postMention.createMany({ data: validUsers.map((u) => ({ postId: post.id, userId: u.id })), skipDuplicates: true });

          const notifSettings = await Promise.all(validUsers.map((u) => NotificationRepository.getNotificationByType(u.id, NotificationType.MENTION)));
          for (let i = 0; i < validUsers.length; i++) {
            if (validUsers[i].id !== userId && notifSettings[i]?.status === "ENABLED") {
              await NotificationRepository.createNotification(tx, {
                userId: validUsers[i].id,
                type: NotificationType.MENTION,
                title: "You were mentioned",
                description: `@${userId} mentioned you in a post`,
                metadata: { postId: post.id, mentionedBy: userId, path: `/p/${post.id}` },
              });
            }
          }
        }
      }

      return post;
    });
  }

  static async getPublicPosts(c: Context, query: GetPublicPostsRequest): Promise<{ data: postResponse[]; meta: metaResponse }> {
    const { posts, totalItems } = await PostRepository.getPublicPosts(query);
    const data = posts.map((post) => ({
      id: post.id,
      title: post.title,
      user: {
        id: post.user.id,
        name: post.user.name,
        username: post.user.username,
        avatar: post.user.avatar,
      },
      content: post.content,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      galleries: post.galleries,
      totalLikes: post._count.likes,
      totalComments: post._count.comments,
      isLiked: post.likes.length > 0,
      isEditable: post.userId === query.userId,
      isFollowing: post.user.followers.some((follower) => follower.followerId === query.userId),
      isSaved: post.bookmarks.length > 0,
      isReported: post.postReports.length > 0,
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

  static async getFollowingPosts(c: Context, query: GetFollowingPostsRequest): Promise<{ data: postResponse[]; meta: metaResponse }> {
    const { posts, totalItems } = await PostRepository.getFollowingPosts(query);

    // transform response
    const data = posts.map((post) => ({
      id: post.id,
      title: post.title,
      user: {
        id: post.user.id,
        name: post.user.name,
        username: post.user.username,
        avatar: post.user.avatar,
      },
      content: post.content,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      galleries: post.galleries,
      totalLikes: post._count.likes,
      totalComments: post._count.comments,
      isLiked: post.likes.length > 0,
      isEditable: post.userId === query.userId,
      isFollowing: post.user.followers.some((follower) => follower.followerId === query.userId),
      isSaved: post.bookmarks.length > 0,
      isReported: post.postReports.length > 0,
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

  static async updatePost(c: Context, userId: string, postId: string, request: UpdatePostRequest) {
    const post = await PostRepository.getPostById(postId, userId);

    if (!post) {
      throw new HTTPException(404, { message: postErrorMessage.POST_NOT_FOUND, cause: postErrorCode.POST_NOT_FOUND });
    }

    return await db.$transaction(async (tx: Prisma.TransactionClient) => {
      await PostRepository.updatePost(tx, postId, request);

      // re-sync hashtags
      const tagNames = extractHashtags(request.content);
      const hashtags = tagNames.length > 0 ? await HashtagRepository.upsertHashtags(tx, tagNames) : [];
      await HashtagRepository.syncPostHashtags(tx, postId, hashtags.map((h) => h.id));

      // re-sync mentions
      await tx.postMention.deleteMany({ where: { postId } });
      const mentionedUsernames = extractMentions(request.content);
      if (mentionedUsernames.length > 0) {
        const mentionedUsers = await Promise.all(mentionedUsernames.map((un) => UserRepository.getUserByUsername(un)));
        const validUsers = mentionedUsers.filter(Boolean) as { id: string }[];
        if (validUsers.length > 0) {
          await tx.postMention.createMany({ data: validUsers.map((u) => ({ postId, userId: u.id })), skipDuplicates: true });
        }
      }

      const updatedPost = { id: post.id, title: request.title, content: request.content };

      await UserRepository.createActivityLog(tx, {
        userId,
        action: postAction.UPDATE_POST,
        metadata: { previousPost: { title: post.title, content: post.content }, updatedPost },
      });

      return updatedPost;
    });
  }

  static async likePost(c: Context, userId: string, postId: string) {
    const post = await PostRepository.getPostById(postId);

    if (!post) {
      throw new HTTPException(404, { message: postErrorMessage.POST_NOT_FOUND, cause: postErrorCode.POST_NOT_FOUND });
    }

    const existingLike = await PostRepository.getLikeByUserId(postId, userId);

    if (existingLike) {
      throw new HTTPException(409, { message: postErrorMessage.ALREADY_LIKED_POST, cause: postErrorCode.ALREADY_LIKED_POST });
    }

    await db.$transaction(async (tx: Prisma.TransactionClient) => {
      await PostRepository.likePost(userId, postId, tx);
      // create notification record
      if (post.userId !== userId) {
        await NotificationRepository.createNotification(tx, {
          userId: post.userId,
          title: "New Like on Your Post",
          description: `@${post.user.username} liked your post: ${post.title}`,
          type: NotificationType.LIKE,
          metadata: { postId, likerId: userId, path: `/posts/${postId}` },
        });
      }
    });
  }

  static async unlikePost(c: Context, userId: string, postId: string) {
    const post = await PostRepository.getPostById(postId);

    if (!post) {
      throw new HTTPException(404, { message: postErrorMessage.POST_NOT_FOUND, cause: postErrorCode.POST_NOT_FOUND });
    }

    const existingLike = await PostRepository.getLikeByUserId(postId, userId);

    if (!existingLike) {
      throw new HTTPException(409, { message: postErrorMessage.ALREADY_UNLIKED_POST, cause: postErrorCode.ALREADY_UNLIKED_POST });
    }

    await PostRepository.unlikePost(userId, postId);
  }

  static async getPostDetailById(c: Context, postId: string, userId?: string): Promise<postDetailResponse> {
    const post = await PostRepository.getPostDetailById(postId, userId!);

    if (!post) {
      throw new HTTPException(404, { message: postErrorMessage.POST_NOT_FOUND, cause: postErrorCode.POST_NOT_FOUND });
    }

    return {
      id: post.id,
      user: post.user,
      title: post.title,
      content: post.content,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      galleries: post.galleries,
      comments: post.comments.map((comment) => ({
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt,
        user: comment.user,
        totalReplies: comment._count.children,
        totalLikes: comment._count.likes,
        isLiked: comment.likes.some((like) => like.userId === userId),
        isEditable: comment.userId === userId,
      })),
      totalLikes: post._count.likes,
      totalComments: post._count.comments,
      totalGalleries: post._count.galleries,
      isLiked: post.likes.length > 0,
      isEditable: post.userId === userId,
      isFollowing: post.user.followers.some((follower) => follower.followerId === userId),
      isSaved: post.bookmarks.length > 0,
      isReported: post.postReports.length > 0,
    };
  }

  static async getPostsByUserId(c: Context, query: GetPublicPostsRequest, userId?: string): Promise<{ data: postResponse[]; meta: metaResponse }> {
    const { posts, totalItems } = await PostRepository.getPostsByUserId(query);

    const data = posts.map((post) => ({
      id: post.id,
      title: post.title,
      content: post.content,
      user: {
        id: post.user.id,
        name: post.user.name,
        username: post.user.username,
        avatar: post.user.avatar,
      },
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      galleries: post.galleries,
      totalLikes: post._count.likes,
      totalComments: post._count.comments,
      isLiked: post.likes.length > 0,
      isEditable: post.userId === userId,
      isFollowing: post.user.followers.some((follower) => follower.followerId === userId),
      isSaved: post.bookmarks.length > 0,
      isReported: post.postReports.length > 0,
    }));

    const meta = {
      pagination: {
        page: Number(query.page!),
        totalItems,
        limit: Number(query.limit!),
        totalPages: totalItems > 0 ? Math.ceil(totalItems / Number(query.limit!)) : 0,
      },
    };

    return { data, meta };
  }

  static async deletePost(c: Context, userId: string, postId: string) {
    const post = await PostRepository.getPostById(postId, userId);

    if (!post) {
      throw new HTTPException(404, { message: postErrorMessage.POST_NOT_FOUND, cause: postErrorCode.POST_NOT_FOUND });
    }

    await db.$transaction(async (tx: Prisma.TransactionClient) => {
      await PostRepository.deletePost(tx, postId);

      await FileRepository.markFileRecordsAsUnused(tx, postId);

      await UserRepository.createActivityLog(tx, {
        userId,
        action: postAction.DELETE_POST,
        metadata: { postId, title: post.title, content: post.content },
      });
    });
  }

  static async getSavedPosts(c: Context, query: GetSavedPostsRequest): Promise<{ data: savedPostResponse[]; meta: metaResponse }> {
    const { bookmarks, totalItems, likedPostIds } = await PostRepository.getSavedPosts(query);

    const data = bookmarks.map((bm) => ({
      id: bm.post.id,
      bookmarkId: bm.id,
      title: bm.post.title,
      content: bm.post.content,
      user: {
        id: bm.post.user.id,
        name: bm.post.user.name,
        username: bm.post.user.username,
        avatar: bm.post.user.avatar,
      },
      createdAt: bm.post.createdAt,
      updatedAt: bm.post.updatedAt,
      galleries: bm.post.galleries,
      totalLikes: bm.post._count.likes,
      totalComments: bm.post._count.comments,
      isLiked: likedPostIds.has(bm.post.id),
      isEditable: bm.post.user.id === query.userId,
      isFollowing: bm.post.user.followers.some((follower) => follower.followerId === query.userId),
      isSaved: true,
      isReported: bm.post.postReports.length > 0,
    }));

    const meta = {
      pagination: {
        page: Number(query.page),
        totalItems,
        limit: Number(query.limit),
        totalPages: totalItems > 0 ? Math.ceil(totalItems / Number(query.limit)) : 0,
      },
    };

    return { data, meta };
  }

  static async savePostAsBookmark(c: Context, userId: string, postId: string) {
    const post = await PostRepository.getPostById(postId);

    if (!post) {
      throw new HTTPException(404, { message: postErrorMessage.POST_NOT_FOUND, cause: postErrorCode.POST_NOT_FOUND });
    }

    const existingBookmark = await PostRepository.getBookmarkByUserId(postId, userId);

    if (existingBookmark) {
      throw new HTTPException(409, { message: postErrorMessage.ALREADY_SAVED_POST, cause: postErrorCode.ALREADY_SAVED_POST });
    }

    await PostRepository.bookmarkPost(userId, postId);
  }

  static async unsavePostFromBookmark(c: Context, userId: string, postId: string) {
    const post = await PostRepository.getPostById(postId);

    if (!post) {
      throw new HTTPException(404, { message: postErrorMessage.POST_NOT_FOUND, cause: postErrorCode.POST_NOT_FOUND });
    }

    const existingBookmark = await PostRepository.getBookmarkByUserId(postId, userId);

    if (!existingBookmark) {
      throw new HTTPException(409, { message: postErrorMessage.ALREADY_UNSAVED_POST, cause: postErrorCode.ALREADY_UNSAVED_POST });
    }

    await PostRepository.unbookmarkPost(userId, postId);
  }
  static async reportPost(c: Context, userId: string, postId: string, request: ReportPostRequest) {
    const post = await PostRepository.getPostById(postId);
    if (!post) {
      throw new HTTPException(404, {
        message: postErrorMessage.POST_NOT_FOUND,
        cause: postErrorCode.POST_NOT_FOUND,
      });
    }

    const existing = await PostRepository.getReportByUserId(postId, userId);
    if (existing) {
      throw new HTTPException(409, {
        message: postErrorMessage.ALREADY_REPORTED_POST,
        cause: postErrorCode.ALREADY_REPORTED_POST,
      });
    }

    await db.$transaction(async (tx: Prisma.TransactionClient) => {
      await PostRepository.createReport(tx, userId, postId, request);
    });
  }
}
