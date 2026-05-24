import { Prisma } from "generated/prisma/edge";
import { pgsql as database } from "@/lib/database";
import { CreateCommentRequest, EditCommentRequest, GetCommentsRequest } from "@/modules/comments/comment.schema";

export class CommentRepository {
  static async createComment(tx: Prisma.TransactionClient | null, request: CreateCommentRequest) {
    const db = tx ?? database;
    return await db.comment.create({
      data: {
        userId: request.userId!,
        parentId: request.commentId!,
        postId: request.postId!,
        content: request.content,
      },
      select: {
        id: true,
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            likes: true,
            children: true,
          },
        },
      },
    });
  }

  static async getCommentsByPostId(query: GetCommentsRequest) {
    const { postId, page, limit, orderBy, sortBy } = query;
    const where = { postId, parentId: null };

    const [comments, totalItems] = await Promise.all([
      await database.comment.findMany({
        where,
        select: {
          id: true,
          userId: true,
          content: true,
          createdAt: true,
          updatedAt: true,
          children: {
            take: 2,
            orderBy: { createdAt: "asc" },
            select: {
              id: true,
              userId: true,
              content: true,
              createdAt: true,
              _count: {
                select: {
                  likes: true,
                },
              },
              likes: {
                where: { userId: query.userId },
              },
              user: {
                select: {
                  id: true,
                  username: true,
                  avatar: true,
                  name: true,
                },
              },
            },
          },
          _count: {
            select: {
              children: true,
              likes: true,
            },
          },
          likes: {
            where: {
              userId: query.userId,
            },
            select: {
              id: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              avatar: true,
            },
          },
        },
        orderBy: orderBy ? { [orderBy]: sortBy } : { createdAt: "desc" },
        skip: (parseInt(page!) - 1) * parseInt(limit!),
        take: parseInt(limit!),
      }),
      await database.comment.count({ where }),
    ]);
    return { comments, totalItems };
  }

  static async getCommentsByParentCommentId(query: GetCommentsRequest) {
    const { commentId, postId, page, limit, orderBy, sortBy } = query;
    const where = { parentId: commentId, postId };

    const [comments, totalItems] = await Promise.all([
      await database.comment.findMany({
        where,
        select: {
          id: true,
          parentId: true,
          userId: true,
          content: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              likes: true,
            },
          },
          likes: {
            where: {
              userId: query.userId,
            },
            select: {
              id: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              avatar: true,
            },
          },
        },
        orderBy: orderBy ? { [orderBy]: sortBy } : { createdAt: "asc" },
        skip: (parseInt(page!) - 1) * parseInt(limit!),
        take: parseInt(limit!),
      }),
      await database.comment.count({ where }),
    ]);
    return { comments, totalItems };
  }

  static async getCommentById(commentId: string, userId?: string) {
    let where = { id: commentId, userId };

    return await database.comment.findFirst({
      where,
      select: {
        id: true,
        postId: true,
        parentId: true,
        userId: true,
        user: {
          select: {
            username: true,
          },
        },
      },
    });
  }

  static async editComment(tx: Prisma.TransactionClient, request: EditCommentRequest) {
    const db = tx ?? database;

    return await db.comment.update({
      where: { id: request.commentId, userId: request.userId },
      data: { content: request.content },
    });
  }

  static async getChildCommentById(commentId: string) {
    return await database.comment.findFirst({
      where: { id: commentId, parentId: { not: null } },
    });
  }

  static async getLikeByUserId(commentId: string, userId: string) {
    return await database.like.findUnique({
      where: { userId_commentId: { userId, commentId } },
    });
  }

  static async likeComment(commentId: string, userId: string, tx?: Prisma.TransactionClient) {
    const db = tx ?? database;
    return await db.like.create({
      data: {
        userId,
        commentId,
      },
    });
  }

  static async unlikeComment(commentId: string, userId: string) {
    await database.like.delete({
      where: { userId_commentId: { userId, commentId } },
    });
  }

  static async deleteComment(tx: Prisma.TransactionClient, commentId: string) {
    const db = tx ?? database;
    return await db.comment.delete({
      where: { id: commentId },
    });
  }
}
