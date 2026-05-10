import { Context } from "hono";
import { FileService } from "./file.service";
import { prisma } from "@/config/database/prisma";
import userAction from "@/config/constant/action";
import { HTTPException } from "hono/http-exception";
import errorCodes from "@/config/constant/errorCode";
import errorMessages from "@/config/constant/errorMessage";
import { UserRepository } from "@/repositories/user.repository";
import { PostRepository } from "@/repositories/post.repository";
import { GalleryRepository } from "@/repositories/gallery.repository";
import { CreatePostRequest, UpdatePostRequest } from "@/schema/post.validation";

export class PostService {
  static async createPost(c: Context, userId: string, request: CreatePostRequest) {
    return await prisma.$transaction(async (tx) => {
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

  static async getFollowingPosts(c: Context, userId: string) {
    const posts = await PostRepository.getFollowingPosts(userId);

    // transform response
    return posts.map((post) => ({
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
      isEditable: post.userId === userId,
    }));
  }

  static async updatePost(c: Context, userId: string, postId: string, request: UpdatePostRequest) {
    const post = await PostRepository.getPostById(postId, userId);

    if (!post) {
      throw new HTTPException(404, { message: errorMessages.postNotFound, cause: errorCodes.postNotFound });
    }

    return await prisma.$transaction(async (tx) => {
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
        createdAt: post.createdAt,
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
    const post = await PostRepository.getPostById(postId, userId);

    if (!post) {
      throw new HTTPException(404, { message: errorMessages.postNotFound, cause: errorCodes.postNotFound });
    }

    if (post.likes.length > 0) {
      throw new HTTPException(400, { message: errorMessages.alreadyLikedPost, cause: errorCodes.alreadyLikedPost });
    }

    await PostRepository.likePost(userId, postId);
  }

  static async unlikePost(c: Context, userId: string, postId: string) {
    const post = await PostRepository.getPostById(postId, userId);

    if (!post) {
      throw new HTTPException(404, { message: errorMessages.postNotFound, cause: errorCodes.postNotFound });
    }

    if (!(post.likes.length > 0)) {
      throw new HTTPException(400, { message: errorMessages.alreadyUnlikedPost, cause: errorCodes.alreadyUnlikedPost });
    }

    await PostRepository.unlikePost(userId, postId);
  }

  static async getPostsByUserId(c: Context, targetId: string, userId?: string) {
    const posts = await PostRepository.getPostsByUserId(targetId);

    return posts.map((post) => ({
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
  }
}
