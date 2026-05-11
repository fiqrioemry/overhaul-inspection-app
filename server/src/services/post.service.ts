import { Context } from "hono";
import { FileService } from "./file.service";
import { pgsql as db } from "@/config/database/pgsql";
import userAction from "@/config/constant/action";
import { HTTPException } from "hono/http-exception";
import errorCodes from "@/config/constant/errorCode";
import errorMessages from "@/config/constant/errorMessage";
import { UserRepository } from "@/repositories/user.repository";
import { PostRepository } from "@/repositories/post.repository";
import { GalleryRepository } from "@/repositories/gallery.repository";
import { CreatePostRequest, GetFollowingPostsRequest, GetPublicPostsRequest, UpdatePostRequest } from "@/schema/post.validation";

export class PostService {
  static async createPost(c: Context, userId: string, request: CreatePostRequest) {
    return await db.$transaction(async (tx) => {
      const post = await PostRepository.createPost(tx, userId, request);

      if (request.galleries && request.galleries.length > 0) {
        const uploadResults = await FileService.uploadMultipleFiles(c, userId, request.galleries, "posts", tx);

        const galleries = await GalleryRepository.bulkCreateGalleryRecords(tx, post.id, uploadResults);

        await UserRepository.createActivityLog(tx, {
          userId,
          action: userAction.createPost,
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
        page: parseInt(query.page!, 10),
        limit: parseInt(query.limit!, 10),
        totalItems,
        hasPrevPage: parseInt(query.page!, 10) > 1,
        hasNextPage: parseInt(query.page!, 10) * parseInt(query.limit!, 10) < totalItems,
        totalPages: totalItems > 0 ? Math.ceil(totalItems / parseInt(query.limit!, 10)) : 0,
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
        page: parseInt(query.page!, 10),
        limit: parseInt(query.limit!, 10),
        totalItems,
        hasPrevPage: parseInt(query.page!, 10) > 1,
        hasNextPage: parseInt(query.page!, 10) * parseInt(query.limit!, 10) < totalItems,
        totalPages: totalItems > 0 ? Math.ceil(totalItems / parseInt(query.limit!, 10)) : 0,
      },
    };

    return { data, meta };
  }

  static async updatePost(c: Context, userId: string, postId: string, request: UpdatePostRequest) {
    const post = await PostRepository.getPostById(postId, userId);

    if (!post) {
      throw new HTTPException(404, { message: errorMessages.postNotFound, cause: errorCodes.postNotFound });
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
        action: userAction.updatePost,
        metadata: { previousPost, updatedPost },
      });

      return updatedPost;
    });
  }

  static async likePost(c: Context, userId: string, postId: string) {
    const post = await PostRepository.getPostById(postId);

    if (!post) {
      throw new HTTPException(404, { message: errorMessages.postNotFound, cause: errorCodes.postNotFound });
    }

    const existingLike = await PostRepository.getLikeByUserId(postId, userId);

    if (existingLike) {
      throw new HTTPException(400, { message: errorMessages.alreadyLikedPost, cause: errorCodes.alreadyLikedPost });
    }
    console.log("liking post", { userId, postId });

    await PostRepository.likePost(userId, postId);
  }

  static async unlikePost(c: Context, userId: string, postId: string) {
    const post = await PostRepository.getPostById(postId);

    if (!post) {
      throw new HTTPException(404, { message: errorMessages.postNotFound, cause: errorCodes.postNotFound });
    }

    const existingLike = await PostRepository.getLikeByUserId(postId, userId);

    if (!existingLike) {
      throw new HTTPException(404, { message: errorMessages.likeNotFound, cause: errorCodes.likeNotFound });
    }

    await PostRepository.unlikePost(userId, postId);
  }

  static async getPostDetailById(c: Context, postId: string, userId?: string) {
    const post = await PostRepository.getPostDetailById(postId, userId!);

    if (!post) {
      throw new HTTPException(404, { message: errorMessages.postNotFound, cause: errorCodes.postNotFound });
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

    console.log("fetched posts by user id", { userId: query.userId, totalItems });

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
        page: parseInt(query.page!, 10),
        totalItems,
        limit: parseInt(query.limit!, 10),
        hasPrevPage: parseInt(query.page!, 10) > 1,
        hasNextPage: parseInt(query.page!, 10) * parseInt(query.limit!, 10) < totalItems,
        totalPages: totalItems > 0 ? Math.ceil(totalItems / parseInt(query.limit!, 10)) : 0,
      },
    };

    return { data, meta };
  }

  static async deletePost(c: Context, userId: string, postId: string) {
    const post = await PostRepository.getPostById(postId, userId);

    if (!post) {
      throw new HTTPException(404, { message: errorMessages.postNotFound, cause: errorCodes.postNotFound });
    }

    await db.$transaction(async (tx) => {
      await PostRepository.deletePost(tx, postId);

      await UserRepository.createActivityLog(tx, {
        userId,
        action: userAction.deletePost,
        metadata: { postId, title: post.title, content: post.content },
      });
    });
  }
}
