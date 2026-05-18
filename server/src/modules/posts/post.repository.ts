import { Prisma } from "generated/prisma/edge";
import { pgsql as database } from "@/config/database/pgsql";
import { CreatePostRequest, GetFollowingPostsRequest, GetPublicPostsRequest, GetSavedPostsRequest, UpdatePostRequest } from "@/modules/posts/post.schema";

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
              followers: {
                where: {
                  followerId: query.userId,
                },
                select: {
                  followerId: true,
                },
              },
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
        take: Number(limit!),
        skip: (Number(page!) - 1) * Number(limit!),
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
        userId: true,
        user: {
          select: {
            username: true,
          },
        },
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
            followers: {
              where: {
                followerId: userId,
              },
              select: {
                followerId: true,
              },
            },
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
              followers: {
                where: {
                  followerId: userId,
                },
                select: {
                  followerId: true,
                },
              },
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
        take: Number(limit!),
        skip: (Number(page!) - 1) * Number(limit!),
        orderBy: orderBy ? { [orderBy]: sortBy } : { createdAt: "desc" },
      }),

      await database.post.count({ where }),
    ]);

    return { posts, totalItems };
  }

  static async likePost(userId: string, postId: string, tx?: Prisma.TransactionClient) {
    const db = tx ?? database;
    await db.like.create({
      data: {
        userId,
        postId,
      },
    });
  }

  static async unlikePost(userId: string, postId: string, tx?: Prisma.TransactionClient) {
    const db = tx ?? database;
    await db.like.delete({
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
      userId: query.targetUserId!,
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
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              avatar: true,
              followers: {
                where: {
                  followerId: query.userId,
                },
                select: {
                  followerId: true,
                },
              },
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
        take: Number(query.limit!),
        skip: (Number(query.page!) - 1) * Number(query.limit!),
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

  static async getGalleryRecordsByPostId(postId: string) {
    return await database.postGallery.findMany({
      where: { postId },
      select: {
        id: true,
        postId: true,
        url: true,
      },
    });
  }

  static async deleteGalleryRecordsByPostId(tx: Prisma.TransactionClient, postId: string) {
    const db = tx ?? database;
    await db.postGallery.deleteMany({
      where: { postId },
    });
  }

  static async bulkCreateGalleryRecords(tx: Prisma.TransactionClient, postId: string, galleries: { url: string; sequence: number }[]) {
    const db = tx ?? database;
    return await db.postGallery.createMany({
      data: galleries.map((g) => ({
        postId,
        url: g.url,
        order: g.sequence,
      })),
    });
  }

  static async getSavedPosts(query: GetSavedPostsRequest) {
    const { userId, page, limit, orderBy, sortBy } = query;

    // First, get valid post IDs (not deleted, not archived)
    const validPostIds = await database.post.findMany({
      where: {
        deletedAt: null,
        isArchived: false,
        bookmarks: {
          some: {
            userId,
          },
        },
      },
      select: {
        id: true,
      },
    });

    const postIds = validPostIds.map((p) => p.id);

    if (postIds.length === 0) {
      return { bookmarks: [], totalItems: 0, likedPostIds: new Set() };
    }

    // Now get bookmarks for these valid posts
    const where = {
      userId,
      postId: { in: postIds },
    };

    const [bookmarks, totalItems] = await Promise.all([
      database.bookmark.findMany({
        where,
        select: {
          id: true,
          userId: true,
          createdAt: true,
          post: {
            select: {
              id: true,
              title: true,
              content: true,
              createdAt: true,
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
                orderBy: {
                  order: "asc",
                },
              },
              _count: {
                select: {
                  galleries: true,
                  likes: {
                    where: {
                      commentId: null,
                    },
                  },
                  comments: true,
                },
              },
            },
          },
        },
        take: Number(limit),
        skip: (Number(page) - 1) * Number(limit),
        orderBy: orderBy ? { [orderBy]: sortBy } : { createdAt: "desc" },
      }),
      database.bookmark.count({ where }),
    ]);

    // Get user likes
    const userLikes = await database.like.findMany({
      where: {
        userId,
        postId: { in: postIds },
        commentId: null,
      },
      select: {
        postId: true,
      },
    });

    const likedPostIds = new Set(userLikes.map((like) => like.postId).filter((id): id is string => id !== null));

    return { bookmarks, totalItems, likedPostIds };
  }

  static async getBookmarkByUserId(postId: string, userId: string) {
    return await database.bookmark.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });
  }

  static async bookmarkPost(userId: string, postId: string, tx?: Prisma.TransactionClient) {
    const db = tx ?? database;
    await db.bookmark.create({
      data: {
        userId,
        postId,
      },
    });
  }

  static async unbookmarkPost(userId: string, postId: string, tx?: Prisma.TransactionClient) {
    const db = tx ?? database;
    await db.bookmark.delete({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });
  }
}
