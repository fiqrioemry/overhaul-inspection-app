import { Prisma } from "generated/prisma/edge";
import { prisma } from "@/config/database/prisma";
import { CreatePostRequest, UpdatePostRequest } from "@/schema/post.validation";

export class PostRepository {
  static async createPost(tx: Prisma.TransactionClient, userId: string, request: CreatePostRequest) {
    const db = tx ?? prisma;
    const post = await db.post.create({
      data: {
        userId,
        title: request.title,
        content: request.content,
      },
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
      },
    });

    return post;
  }

  static async getPostById(postId: string, userId?: string) {
    return await prisma.post.findUnique({
      where: { id: postId, userId },
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
        userId: true,
        likes: {
          where: {
            userId,
          },
          select: {
            id: true,
          },
        },
      },
    });
  }

  static async updatePost(tx: Prisma.TransactionClient, postId: string, request: UpdatePostRequest) {
    const db = tx ?? prisma;
    await db.post.update({
      where: { id: postId },
      data: {
        title: request.title,
        content: request.content,
      },
    });
  }

  static async getFollowingPosts(userId: string) {
    return await prisma.post.findMany({
      where: {
        user: {
          followers: {
            some: {
              followerId: userId,
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        userId: true,
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
          },
        },

        galleries: {
          select: {
            id: true,
            url: true,
          },
        },

        likes: {
          where: {
            userId,
          },
          select: {
            id: true,
          },
        },

        _count: {
          select: {
            galleries: true,
            likes: true,
            comments: true,
          },
        },
      },
    });
  }

  static async likePost(userId: string, postId: string) {
    await prisma.like.create({
      data: {
        userId,
        postId,
      },
    });
  }

  static async unlikePost(userId: string, postId: string) {
    await prisma.like.delete({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });
  }

  static async getPostsByUserId(targetId: string) {
    return await prisma.post.findMany({
      where: { userId: targetId },
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
        userId: true,

        galleries: {
          select: {
            id: true,
            url: true,
          },
        },

        likes: {
          where: {
            userId: targetId,
          },
          select: {
            id: true,
          },
        },

        _count: {
          select: {
            galleries: true,
            likes: true,
            comments: true,
          },
        },
      },
    });
  }
}
