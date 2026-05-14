import { Context } from "hono";
import { NotificationType } from "generated/prisma";
import { HTTPException } from "hono/http-exception";
import { FileService } from "@/modules/files/file.service";
import { pgsql as db } from "@/config/database/pgsql";
import { PostRepository } from "@/modules/posts/post.repository";
import { UserRepository } from "@/modules/users/user.repository";
import { NotificationRepository } from "@/modules/notifications/notification.repository";
import { postAction, postErrorCode, postErrorMessage } from "@/config/constant/post.constant";
import { CreatePostRequest, GetFollowingPostsRequest, GetPublicPostsRequest, UpdatePostRequest } from "@/modules/posts/post.schema";

export class PostService {
  static async createPost(c: Context, userId: string, request: CreatePostRequest) {
    return await db.$transaction(async (tx) => {
      const post = await PostRepository.createPost(tx, userId, request);

      if (request.galleries && request.galleries.length > 0) {
        const uploadResults = await FileService.uploadMultipleFiles(c, userId, request.galleries, "posts", tx);

        const galleries = await PostRepository.bulkCreateGalleryRecords(tx, post.id, uploadResults);

        await UserRepository.createActivityLog(tx, {
          userId,
          action: postAction.CREATE_POST,
          metadata: { title: request.title, content: post.content, galleries: galleries },
        });
      }

      return post;
    });
  }

  static async getPublicPosts(c: Context, query: GetPublicPostsRequest) {
    const { posts, totalItems } = await PostRepository.getPublicPosts(query);
    const data = posts.map((post) => ({
      id: post.id,
      user: post.user,
      content: post.content,
      createdAt: post.createdAt,
      galleries: post.galleries,
      counts: {
        likes: post._count.likes,
        comments: post._count.comments,
        galleries: post._count.galleries,
      },
      isLiked: post.likes.length > 0,
      isEditable: post.userId === query.userId,
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

  static async getFollowingPosts(c: Context, query: GetFollowingPostsRequest) {
    const { posts, totalItems } = await PostRepository.getFollowingPosts(query);

    // transform response
    const data = posts.map((post) => ({
      id: post.id,
      user: post.user,
      content: post.content,
      createdAt: post.createdAt,
      galleries: post.galleries,
      counts: {
        likes: post._count.likes,
        comments: post._count.comments,
        galleries: post._count.galleries,
      },
      isLiked: post.likes.length > 0,
      isEditable: post.userId === query.userId,
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

    return await db.$transaction(async (tx) => {
      // update post from records
      await PostRepository.updatePost(tx, postId, request);

      const previousPost = {
        title: post.title,
        content: post.content,
      };

      const updatedPost = {
        id: post.id,
        title: request.title,
        content: request.content,
      };

      await UserRepository.createActivityLog(tx, {
        userId,
        action: postAction.UPDATE_POST,
        metadata: { previousPost, updatedPost },
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

    await db.$transaction(async (tx) => {
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

  static async getPostDetailById(c: Context, postId: string, userId?: string) {
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
      counts: {
        likes: post._count.likes,
        comments: post._count.comments,
        galleries: post._count.galleries,
      },
      isLiked: post.likes.length > 0,
      isEditable: post.userId === userId,
    };
  }

  static async getPostsByUserId(c: Context, query: GetPublicPostsRequest, userId?: string) {
    const { posts, totalItems } = await PostRepository.getPostsByUserId(query);

    const data = posts.map((post) => ({
      id: post.id,
      title: post.title,
      content: post.content,
      createdAt: post.createdAt,
      galleries: post.galleries,
      counts: {
        likes: post._count.likes,
        comments: post._count.comments,
        galleries: post._count.galleries,
      },
      isLiked: post.likes.length > 0,
      isEditable: post.userId === userId,
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

    await db.$transaction(async (tx) => {
      await PostRepository.deletePost(tx, postId);

      await UserRepository.createActivityLog(tx, {
        userId,
        action: postAction.DELETE_POST,
        metadata: { postId, title: post.title, content: post.content },
      });
    });
  }
}
