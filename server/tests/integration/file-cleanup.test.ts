// Integration tests for the orphan-file cleanup selection and purge.
//
// Run with the local dev database (see server/CLAUDE.md — bun auto-loads .env.local, which
// points at the wrong DB host; use .env.development instead):
//
//   bun --env-file=.env.development test tests/integration/file-cleanup.test.ts
//
// These cover the P2003 regression: removing an attachment soft-deletes the attachment row
// while flagging the file isUsed=false, and that row keeps an onDelete: Restrict foreign key.
// The worker used to treat isUsed=false as "orphaned", delete the storage object first, then
// fail the whole batch's DB delete — leaving records pointing at objects that no longer exist.
//
// No MinIO access here: the repository layer under test is database-only.

import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { pgsql } from "@/lib/database";
import { DailyActivityTypeEnum } from "generated/prisma";
import { FileRepository } from "@/modules/files/file.repository";
import { fileLimit } from "@/config/constant/file.constant";

const ttlSeconds = fileLimit.UNUSED_AVATAR_EXP || 24 * 60 * 60;
/** Comfortably past the TTL so these rows are always "expired". */
const EXPIRED_AT = new Date(Date.now() - (ttlSeconds + 3600) * 1000);

const createdFileIds: string[] = [];
let tankId: string;
let reportId: string;

async function createFile(options: { isUsed: boolean; createdAt?: Date }) {
  const key = `DAILY_REPORT/${crypto.randomUUID()}.webp`;
  const file = await pgsql.fileStorage.create({
    data: {
      url: `https://storage.example.invalid/overhaul/${key}`,
      path: key,
      module: "DAILY_REPORT",
      mimeType: "image/webp",
      size: 10,
      isUsed: options.isUsed,
      createdAt: options.createdAt ?? EXPIRED_AT,
      meta: { originalName: "photo.jpg" },
    },
  });
  createdFileIds.push(file.id);
  return file;
}

async function attach(fileStorageId: string, url: string, deleted: boolean) {
  return pgsql.dailyReportAttachment.create({
    data: {
      dailyReportId: reportId,
      fileStorageId,
      attachmentUrl: url,
      sortOrder: 0,
      deletedAt: deleted ? new Date() : null,
    },
  });
}

/** Only our own fixtures — the dev database holds unrelated rows. */
async function expiredIdsAmongFixtures(): Promise<Set<string>> {
  const expired = await FileRepository.findExpiredUnusedFiles();
  return new Set(expired.filter((f) => createdFileIds.includes(f.id)).map((f) => f.id));
}

beforeAll(async () => {
  const tank = await pgsql.tank.create({ data: { tankNo: `TEST-CLEANUP-${crypto.randomUUID().slice(0, 8)}` } });
  tankId = tank.id;
  const report = await pgsql.dailyReport.create({
    data: {
      tankId,
      reportDate: new Date("2026-08-13"),
      activityType: DailyActivityTypeEnum.MONITORING,
      title: "Cleanup fixture",
      description: "<p>test</p>",
    },
  });
  reportId = report.id;
});

afterAll(async () => {
  await pgsql.dailyReportAttachment.deleteMany({ where: { dailyReportId: reportId } });
  await pgsql.fileStorage.deleteMany({ where: { id: { in: createdFileIds } } });
  await pgsql.dailyReport.deleteMany({ where: { id: reportId } });
  await pgsql.tank.delete({ where: { id: tankId } });
  await pgsql.$disconnect();
});

describe("FileRepository.findExpiredUnusedFiles", () => {
  test("selects a genuinely orphaned upload — unused, expired, never attached", async () => {
    const orphan = await createFile({ isUsed: false });
    expect(await expiredIdsAmongFixtures()).toContain(orphan.id);
  });

  test("skips a file still held by a live attachment, even when flagged unused", async () => {
    // The flag can go stale; a live attachment row is the authority.
    const file = await createFile({ isUsed: false });
    await attach(file.id, file.url, false);
    expect(await expiredIdsAmongFixtures()).not.toContain(file.id);
  });

  test("skips a file that is still in use", async () => {
    const file = await createFile({ isUsed: true });
    expect(await expiredIdsAmongFixtures()).not.toContain(file.id);
  });

  test("skips an unused file that has not reached the TTL yet", async () => {
    const file = await createFile({ isUsed: false, createdAt: new Date() });
    expect(await expiredIdsAmongFixtures()).not.toContain(file.id);
  });

  test("selects a file whose only attachment is soft-deleted — the P2003 case", async () => {
    // Exactly what "remove this photo" leaves behind: soft-deleted row + isUsed=false.
    const file = await createFile({ isUsed: false });
    await attach(file.id, file.url, true);
    expect(await expiredIdsAmongFixtures()).toContain(file.id);
  });

  test("skips a file with a live attachment even when another reference is soft-deleted", async () => {
    const file = await createFile({ isUsed: false });
    await attach(file.id, file.url, true);
    // A second report still uses the same file.
    const otherReport = await pgsql.dailyReport.create({
      data: {
        tankId,
        reportDate: new Date("2026-08-13"),
        activityType: DailyActivityTypeEnum.MONITORING,
        title: "Second report",
        description: "<p>test</p>",
      },
    });
    await pgsql.dailyReportAttachment.create({
      data: { dailyReportId: otherReport.id, fileStorageId: file.id, attachmentUrl: file.url, sortOrder: 0 },
    });

    try {
      expect(await expiredIdsAmongFixtures()).not.toContain(file.id);
    } finally {
      await pgsql.dailyReportAttachment.deleteMany({ where: { dailyReportId: otherReport.id } });
      await pgsql.dailyReport.delete({ where: { id: otherReport.id } });
    }
  });

  test("skips a file still used as a user avatar", async () => {
    // The avatar FK is SetNull, so deleting the file would silently blank the profile
    // instead of raising an error — it has to be excluded explicitly.
    const file = await createFile({ isUsed: false });
    const user = await pgsql.user.create({
      data: {
        name: "Cleanup Fixture",
        email: `cleanup-${crypto.randomUUID()}@example.invalid`,
        avatarFileStorageId: file.id,
      },
    });

    try {
      expect(await expiredIdsAmongFixtures()).not.toContain(file.id);
    } finally {
      await pgsql.user.delete({ where: { id: user.id } });
    }
  });
});

describe("FileRepository.deleteExpiredFile", () => {
  test("purges the soft-deleted attachment row together with the file", async () => {
    const file = await createFile({ isUsed: false });
    const attachment = await attach(file.id, file.url, true);

    await FileRepository.deleteExpiredFile(file.id);

    expect(await pgsql.fileStorage.findUnique({ where: { id: file.id } })).toBeNull();
    expect(await pgsql.dailyReportAttachment.findUnique({ where: { id: attachment.id } })).toBeNull();
  });

  test("deletes a plain orphan that has no attachment rows at all", async () => {
    const file = await createFile({ isUsed: false });
    await FileRepository.deleteExpiredFile(file.id);
    expect(await pgsql.fileStorage.findUnique({ where: { id: file.id } })).toBeNull();
  });

  test("refuses to detach a live attachment, leaving both rows intact", async () => {
    // Defence in depth: the selection query already excludes this, but a mistaken caller
    // must not be able to strip a live attachment off its file.
    const file = await createFile({ isUsed: false });
    const attachment = await attach(file.id, file.url, false);

    await expect(FileRepository.deleteExpiredFile(file.id)).rejects.toMatchObject({ code: "P2003" });

    // The failed transaction rolled back — the attachment is untouched.
    expect(await pgsql.dailyReportAttachment.findUnique({ where: { id: attachment.id } })).not.toBeNull();
    expect(await pgsql.fileStorage.findUnique({ where: { id: file.id } })).not.toBeNull();
  });

  test("one failing file does not prevent the rest of the batch from being purged", async () => {
    // The batched deleteMany this replaces failed the entire run on a single blocked row.
    const blocked = await createFile({ isUsed: false });
    await attach(blocked.id, blocked.url, false);
    const ok1 = await createFile({ isUsed: false });
    const ok2 = await createFile({ isUsed: false });

    let failed = 0;
    for (const file of [blocked, ok1, ok2]) {
      try {
        await FileRepository.deleteExpiredFile(file.id);
      } catch {
        failed++;
      }
    }

    expect(failed).toBe(1);
    expect(await pgsql.fileStorage.findUnique({ where: { id: ok1.id } })).toBeNull();
    expect(await pgsql.fileStorage.findUnique({ where: { id: ok2.id } })).toBeNull();
    expect(await pgsql.fileStorage.findUnique({ where: { id: blocked.id } })).not.toBeNull();
  });
});
