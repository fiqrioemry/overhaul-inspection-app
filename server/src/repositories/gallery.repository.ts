import { Prisma } from "generated/prisma/edge";
import { prisma } from "@/config/database/prisma";

export class GalleryRepository {
  static async getGalleryRecordsByPostId(postId: string) {
    return await prisma.postGallery.findMany({
      where: { postId },
      select: {
        id: true,
        postId: true,
        url: true,
      },
    });
  }

  static async deleteGalleryRecordsByPostId(tx: Prisma.TransactionClient, postId: string) {
    const db = tx ?? prisma;
    await db.postGallery.deleteMany({
      where: { postId },
    });
  }

  static async bulkCreateGalleryRecords(tx: Prisma.TransactionClient, postId: string, galleries: { url: string; sequence: number }[]) {
    const db = tx ?? prisma;
    return await db.postGallery.createMany({
      data: galleries.map((g) => ({
        postId,
        url: g.url,
        order: g.sequence,
      })),
    });
  }
}
