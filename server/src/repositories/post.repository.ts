import { Prisma } from "generated/pgsql/edge";
import { pgsql as database } from "@/config/database/pgsql";
import { CreatePostRequest, GetFollowingPostsRequest, GetPublicPostsRequest, UpdatePostRequest } from "@/schema/post.validation";

export class PostRepository {
  static async createPost(tx: Prisma.TransactionClient, userId: string, request: CreatePostRequest) {
    const db = tx ?? database;
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

  static async getPublicPosts(query: GetPublicPostsRequest) {
    const { page, limit, orderBy, sortBy } = query;
    const where = { userId: { not: query.userId }, deletedAt: null };

    const [posts, totalItems] = await Promise.all([
      database.post.findMany({
        where,

        select: {
          id: true,
          title: true,
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
              order: true,
            },
          },

          likes: {
            where: {
              userId: query.userId!,
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
        take: parseInt(limit!),
        skip: (parseInt(page!) - 1) * parseInt(limit!),
        orderBy: orderBy ? { [orderBy]: sortBy } : { createdAt: "desc" },
      }),

      database.post.count({ where }),
    ]);

    return { posts, totalItems };
  }

  static async getPostById(postId: string, userId?: string) {
    return await database.post.findUnique({
      where: { id: postId, deletedAt: null },
      select: {
        id: true,
        title: true,
        content: true,
      },
    });
  }

  static async getPostDetailById(postId: string, userId: string) {
    return await database.post.findUnique({
      where: { id: postId, deletedAt: null },
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
        userId: true,
        comments: {
          select: {
            id: true,
            userId: true,
            content: true,
            createdAt: true,

            likes: {
              where: {
                userId,
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

            _count: {
              select: {
                children: true,
                likes: true,
              },
            },
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

        galleries: {
          select: {
            id: true,
            url: true,
          },
        },

        likes: {
          select: {
            id: true,
            userId: true,
            user: {
              select: {
                id: true,
                name: true,
                username: true,
                avatar: true,
              },
            },
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

  static async updatePost(tx: Prisma.TransactionClient, postId: string, request: UpdatePostRequest) {
    const db = tx ?? database;
    await db.post.update({
      where: { id: postId },
      data: {
        title: request.title,
        content: request.content,
      },
    });
  }

  static async getFollowingPosts(query: GetFollowingPostsRequest) {
    const { userId, page, limit, orderBy, sortBy } = query;
    const where = {
      deletedAt: null,
      user: {
        followers: {
          some: {
            followerId: userId,
          },
        },
      },
    };
    const [posts, totalItems] = await Promise.all([
      database.post.findMany({
        where,
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
        take: parseInt(limit!),
        skip: (parseInt(page!) - 1) * parseInt(limit!),
        orderBy: orderBy ? { [orderBy]: sortBy } : { createdAt: "desc" },
      }),

      await database.post.count({ where }),
    ]);

    return { posts, totalItems };
  }

  static async likePost(userId: string, postId: string) {
    await database.like.create({
      data: {
        userId,
        postId,
      },
    });
  }

  static async unlikePost(userId: string, postId: string) {
    await database.like.delete({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });
  }

  static async getPostsByUserId(query: GetPublicPostsRequest) {
    const where = {
      userId: query.userId!,
      deletedAt: null,
    };
    const [posts, totalItems] = await Promise.all([
      await database.post.findMany({
        where,
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
              userId: query.userId,
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
        take: parseInt(query.limit!),
        skip: (parseInt(query.page!) - 1) * parseInt(query.limit!),
        orderBy: query.orderBy ? { [query.orderBy]: query.sortBy } : { createdAt: "desc" },
      }),
      await database.post.count({ where }),
    ]);

    return { posts, totalItems };
  }

  static async deletePost(tx: Prisma.TransactionClient, postId: string) {
    const db = tx ?? database;
    await db.post.update({
      where: { id: postId },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  static async getLikeByUserId(postId: string, userId: string) {
    return await database.like.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });
  }
}
