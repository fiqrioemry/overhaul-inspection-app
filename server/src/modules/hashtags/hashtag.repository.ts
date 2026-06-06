import { Prisma } from "generated/prisma/edge";
import { pgsql as database } from "@/lib/database";

export class HashtagRepository {
  static async upsertHashtags(tx: Prisma.TransactionClient, names: string[]): Promise<{ id: string; name: string }[]> {
    return Promise.all(
      names.map((name) =>
        tx.hashtag.upsert({
          where: { name },
          create: { name },
          update: {},
          select: { id: true, name: true },
        }),
      ),
    );
  }

  static async syncPostHashtags(tx: Prisma.TransactionClient, postId: string, hashtagIds: string[]): Promise<void> {
    await tx.postHashtag.deleteMany({ where: { postId } });

    if (hashtagIds.length > 0) {
      await tx.postHashtag.createMany({
        data: hashtagIds.map((hashtagId) => ({ postId, hashtagId })),
        skipDuplicates: true,
      });
    }
  }

  static async getTrending(limit: number) {
    return database.hashtag.findMany({
      select: {
        id: true,
        name: true,
        _count: { select: { posts: true } },
      },
      orderBy: { posts: { _count: "desc" } },
      take: limit,
    });
  }

  static async findByName(name: string) {
    return database.hashtag.findUnique({
      where: { name },
      select: { id: true, name: true },
    });
  }

  static async getPostsByHashtag(hashtagId: string, userId: string, page: number, limit: number) {
    const where = { hashtags: { some: { hashtagId } }, deletedAt: null };

    const [posts, totalItems] = await Promise.all([
      database.post.findMany({
        where,
        select: {
          id: true,
          title: true,
          content: true,
          createdAt: true,
          updatedAt: true,
          userId: true,
          galleries: { select: { id: true, url: true, order: true } },
          likes: { where: { userId }, select: { id: true } },
          bookmarks: { where: { userId }, select: { id: true } },
          user: { select: { id: true, name: true, username: true, avatar: true } },
          _count: { select: { likes: true, comments: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      database.post.count({ where }),
    ]);

    return { posts, totalItems };
  }
}
