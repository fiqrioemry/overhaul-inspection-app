// Integration tests for daily-report attachment availability metadata (list endpoint) and
// the authenticated ZIP download endpoint.
//
// Run with the local dev database (see server/CLAUDE.md — bun auto-loads .env.local, which
// points at the wrong DB host; use .env.development instead):
//
//   bun --env-file=.env.development test tests/integration/daily-report-attachments.test.ts
//
// Object storage is faked through the AttachmentObjectStorage seam, so these tests never
// read from or write to the real MinIO bucket. Fixtures use unique cuid-based identifiers
// and are removed in afterAll.

import { describe, test, expect, beforeAll, afterAll, spyOn } from "bun:test";
import { Hono, Context } from "hono";
import { unzipSync } from "fflate";
import { pgsql } from "@/lib/database";
import { DailyActivityTypeEnum, RoleEnum } from "generated/prisma";
import { DailyReportService } from "@/modules/daily-reports/daily-report.service";
import { DailyReportRepository } from "@/modules/daily-reports/daily-report.repository";
import { DailyReportController } from "@/modules/daily-reports/daily-report.controller";
import { minioAttachmentStorage, type AttachmentObjectStorage } from "@/modules/daily-reports/daily-report-attachment-archive";
import { requirePermission } from "@/middlewares/permission.middleware";
import { PERMISSIONS, getPermissionsForRole } from "@/config/constant/permission.constant";
import { errorHandler } from "@/middlewares/error.middleware";

// Mirrors src/routes/v1/daily-reports.route.ts, with a stub identity middleware standing in
// for `protect` so the real `requirePermission` check still runs without a login round trip.
function buildTestApp(role: RoleEnum) {
  const app = new Hono();
  app.use("*", async (c: Context, next: () => Promise<void>) => {
    c.set("user", { id: "test-user", role, permissions: getPermissionsForRole(role) });
    await next();
  });
  app.get("/daily-reports/:id/attachments/download", requirePermission(PERMISSIONS.DAILY_REPORT_READ), DailyReportController.downloadAttachments);
  app.onError(errorHandler);
  return app;
}

/** Records every key it is asked for, so tests can assert exactly what was fetched. */
function createFakeStorage(contents: Record<string, string>) {
  const readKeys: string[] = [];
  const statKeys: string[] = [];
  const storage: AttachmentObjectStorage = {
    async stat(key) {
      statKeys.push(key);
      if (!(key in contents)) throw new Error(`missing object: ${key}`);
    },
    async read(key) {
      readKeys.push(key);
      const body = contents[key];
      if (body === undefined) throw new Error(`missing object: ${key}`);
      return (async function* () {
        yield new TextEncoder().encode(body);
      })();
    },
  };
  return { storage, readKeys, statKeys };
}

/** Stats fine, then dies partway through the read — the mid-flight failure case. */
function createFailingReadStorage(contents: Record<string, string>): AttachmentObjectStorage {
  return {
    async stat(key) {
      if (!(key in contents)) throw new Error(`missing object: ${key}`);
    },
    async read() {
      return (async function* () {
        yield new TextEncoder().encode("partial");
        throw new Error("connection reset mid-object");
      })();
    },
  };
}

const TANK_NO = `TEST-DR-${crypto.randomUUID().slice(0, 8)}`;
const storageContents: Record<string, string> = {};

let tankId: string;
/** Three attachments, deliberately stored out of sortOrder, two sharing an original filename. */
let reportWithAttachmentsId: string;
let reportWithoutAttachmentsId: string;
let reportSingleAttachmentId: string;
let reportUnsafeFilenameId: string;
let reportSoftDeletedId: string;
/** Belongs to another report; must never appear in the first report's archive. */
let foreignAttachmentKey: string;

async function createReport(title: string, reportDate = "2026-08-13", deleted = false) {
  const report = await pgsql.dailyReport.create({
    data: {
      tankId,
      reportDate: new Date(reportDate),
      activityType: DailyActivityTypeEnum.MONITORING,
      title,
      description: "<p>test</p>",
      deletedAt: deleted ? new Date() : null,
    },
  });
  return report.id;
}

async function attach(
  dailyReportId: string,
  options: { key: string; originalName?: string | null; mimeType?: string; sortOrder: number; body: string; deleted?: boolean },
) {
  const file = await pgsql.fileStorage.create({
    data: {
      url: `https://storage.example.invalid/overhaul/${options.key}`,
      path: options.key,
      module: "DAILY_REPORT",
      mimeType: options.mimeType ?? "image/webp",
      size: options.body.length,
      isUsed: true,
      meta: options.originalName === null ? {} : { originalName: options.originalName ?? "photo.jpg" },
    },
  });
  await pgsql.dailyReportAttachment.create({
    data: {
      dailyReportId,
      fileStorageId: file.id,
      attachmentUrl: file.url,
      sortOrder: options.sortOrder,
      deletedAt: options.deleted ? new Date() : null,
    },
  });
  storageContents[options.key] = options.body;
  return file.id;
}

beforeAll(async () => {
  const tank = await pgsql.tank.create({ data: { tankNo: TANK_NO } });
  tankId = tank.id;

  reportWithAttachmentsId = await createReport("Report with attachments");
  // Inserted out of order on purpose so the archive has to sort rather than rely on insertion.
  await attach(reportWithAttachmentsId, { key: `DAILY_REPORT/${crypto.randomUUID()}.webp`, originalName: "site.jpg", sortOrder: 2, body: "third" });
  await attach(reportWithAttachmentsId, { key: `DAILY_REPORT/${crypto.randomUUID()}.webp`, originalName: "weld.jpg", sortOrder: 0, body: "first" });
  // Same original filename as the sortOrder 0 entry — must not collide inside the archive.
  await attach(reportWithAttachmentsId, { key: `DAILY_REPORT/${crypto.randomUUID()}.webp`, originalName: "weld.jpg", sortOrder: 1, body: "second" });
  // Soft-deleted attachment — excluded everywhere.
  await attach(reportWithAttachmentsId, { key: `DAILY_REPORT/${crypto.randomUUID()}.webp`, originalName: "removed.jpg", sortOrder: 3, body: "removed", deleted: true });

  reportWithoutAttachmentsId = await createReport("Report without attachments");

  reportSingleAttachmentId = await createReport("Report with one attachment");
  await attach(reportSingleAttachmentId, { key: `DAILY_REPORT/${crypto.randomUUID()}.webp`, originalName: "solo.jpg", sortOrder: 0, body: "solo" });

  reportUnsafeFilenameId = await createReport("Report with hostile filenames");
  await attach(reportUnsafeFilenameId, {
    key: `DAILY_REPORT/${crypto.randomUUID()}.webp`,
    originalName: "../../etc/passwd.jpg",
    sortOrder: 0,
    body: "traversal",
  });
  await attach(reportUnsafeFilenameId, {
    key: `DAILY_REPORT/${crypto.randomUUID()}.webp`,
    originalName: null, // no originalName recorded — falls back to the attachment id
    sortOrder: 1,
    body: "no-name",
  });

  reportSoftDeletedId = await createReport("Soft-deleted report", "2026-08-13", true);
  await attach(reportSoftDeletedId, { key: `DAILY_REPORT/${crypto.randomUUID()}.webp`, originalName: "ghost.jpg", sortOrder: 0, body: "ghost" });

  const foreignReportId = await createReport("Another report");
  foreignAttachmentKey = `DAILY_REPORT/${crypto.randomUUID()}.webp`;
  await attach(foreignReportId, { key: foreignAttachmentKey, originalName: "foreign.jpg", sortOrder: 0, body: "foreign" });
});

afterAll(async () => {
  // DailyReportAttachment cascades from DailyReport; FileStorage is restricted, so clear the
  // attachments first, then the orphaned file rows, then the reports and the tank.
  const reports = await pgsql.dailyReport.findMany({ where: { tankId }, select: { id: true } });
  const reportIds = reports.map((r) => r.id);
  const attachments = await pgsql.dailyReportAttachment.findMany({
    where: { dailyReportId: { in: reportIds } },
    select: { fileStorageId: true },
  });
  await pgsql.dailyReportAttachment.deleteMany({ where: { dailyReportId: { in: reportIds } } });
  await pgsql.fileStorage.deleteMany({ where: { id: { in: attachments.map((a) => a.fileStorageId) } } });
  await pgsql.dailyReport.deleteMany({ where: { id: { in: reportIds } } });
  await pgsql.tank.delete({ where: { id: tankId } });
  await pgsql.$disconnect();
});

describe("GET /daily-reports — attachment availability metadata", () => {
  test("returns the correct attachmentCount per item, counting only active attachments (cases 1, 3)", async () => {
    const result = await DailyReportService.listReports({ tankId, page: 1, limit: 50, orderBy: "reportDate", sortBy: "desc" });

    const byId = new Map(result.data.map((item) => [item.id, item]));
    expect(byId.get(reportWithAttachmentsId)!.attachmentCount).toBe(3); // the 4th is soft-deleted
    expect(byId.get(reportSingleAttachmentId)!.attachmentCount).toBe(1);
    expect(byId.get(reportUnsafeFilenameId)!.attachmentCount).toBe(2);
    expect(byId.get(reportWithoutAttachmentsId)!.attachmentCount).toBe(0);
  });

  test("hasAttachments is true exactly when attachmentCount > 0 (cases 2, 3)", async () => {
    const result = await DailyReportService.listReports({ tankId, page: 1, limit: 50, orderBy: "reportDate", sortBy: "desc" });

    expect(result.data.length).toBeGreaterThan(0);
    for (const item of result.data) {
      expect(item.hasAttachments).toBe(item.attachmentCount > 0);
    }

    const empty = result.data.find((item) => item.id === reportWithoutAttachmentsId)!;
    expect(empty.attachmentCount).toBe(0);
    expect(empty.hasAttachments).toBe(false);
  });

  test("pagination and filtering still work and still carry the metadata (case 4)", async () => {
    const firstPage = await DailyReportService.listReports({ tankId, page: 1, limit: 2, orderBy: "reportDate", sortBy: "desc" });
    expect(firstPage.data).toHaveLength(2);
    expect(firstPage.meta.limit).toBe(2);
    expect(firstPage.meta.total).toBeGreaterThanOrEqual(5);
    expect(firstPage.meta.hasNextPage).toBe(true);
    expect(firstPage.meta.hasPreviousPage).toBe(false);
    for (const item of firstPage.data) {
      expect(typeof item.attachmentCount).toBe("number");
      expect(typeof item.hasAttachments).toBe("boolean");
    }

    const secondPage = await DailyReportService.listReports({ tankId, page: 2, limit: 2, orderBy: "reportDate", sortBy: "desc" });
    expect(secondPage.meta.page).toBe(2);
    expect(secondPage.meta.hasPreviousPage).toBe(true);
    expect(secondPage.data.map((i) => i.id)).not.toEqual(firstPage.data.map((i) => i.id));

    // A search filter narrows the result set without losing the metadata.
    const filtered = await DailyReportService.listReports({
      tankId,
      search: "Report with one attachment",
      page: 1,
      limit: 20,
      orderBy: "reportDate",
      sortBy: "desc",
    });
    expect(filtered.data).toHaveLength(1);
    expect(filtered.data[0]!.id).toBe(reportSingleAttachmentId);
    expect(filtered.data[0]!.hasAttachments).toBe(true);
  });

  test("metadata comes from the list query — no per-row detail lookup (case 5)", async () => {
    const findById = spyOn(DailyReportRepository, "findById");
    const findMany = spyOn(DailyReportRepository, "findMany");
    try {
      const result = await DailyReportService.listReports({ tankId, page: 1, limit: 50, orderBy: "reportDate", sortBy: "desc" });
      expect(result.data.length).toBeGreaterThan(1);
      expect(findMany).toHaveBeenCalledTimes(1);
      expect(findById).not.toHaveBeenCalled();
    } finally {
      findById.mockRestore();
      findMany.mockRestore();
    }
  });
});

describe("DailyReportService.buildAttachmentsArchive", () => {
  test("archives every active attachment, ordered by sortOrder (cases 3, 4)", async () => {
    const { storage } = createFakeStorage(storageContents);
    const { bytes } = await DailyReportService.buildAttachmentsArchive(reportWithAttachmentsId, storage);
    const files = unzipSync(bytes);
    const names = Object.keys(files);

    expect(names).toEqual(["01-weld.webp", "02-weld.webp", "03-site.webp"]);
    expect(new TextDecoder().decode(files["01-weld.webp"])).toBe("first");
    expect(new TextDecoder().decode(files["02-weld.webp"])).toBe("second");
    expect(new TextDecoder().decode(files["03-site.webp"])).toBe("third");
    // The soft-deleted attachment is absent.
    expect(names).toHaveLength(3);
  });

  test("duplicate original filenames stay separate entries (case 5)", async () => {
    const { storage } = createFakeStorage(storageContents);
    const { bytes } = await DailyReportService.buildAttachmentsArchive(reportWithAttachmentsId, storage);
    const files = unzipSync(bytes);

    // Two attachments were both uploaded as "weld.jpg"; neither overwrote the other.
    expect(Object.keys(files).filter((n) => n.includes("weld"))).toHaveLength(2);
    expect(new TextDecoder().decode(files["01-weld.webp"])).not.toBe(new TextDecoder().decode(files["02-weld.webp"]));
  });

  test("unsafe original filenames are sanitised and the real extension is preserved (case 6)", async () => {
    const { storage } = createFakeStorage(storageContents);
    const { bytes } = await DailyReportService.buildAttachmentsArchive(reportUnsafeFilenameId, storage);
    const names = Object.keys(unzipSync(bytes));

    expect(names).toHaveLength(2);
    for (const name of names) {
      expect(name).not.toContain("..");
      expect(name).not.toContain("/");
      expect(name).not.toContain("\\");
      expect(name.startsWith("/")).toBe(false);
      expect(name).toMatch(/^[A-Za-z0-9._-]+$/);
    }
    // "../../etc/passwd.jpg" flattens to a single safe segment; the stored object is webp.
    expect(names[0]).toBe("01-etc-passwd.webp");
    // No originalName recorded — falls back to the attachment id, extension still preserved.
    expect(names[1]).toMatch(/^02-[A-Za-z0-9]+\.webp$/);
  });

  test("a report with a single attachment still yields a ZIP (case 7)", async () => {
    const { storage } = createFakeStorage(storageContents);
    const { bytes, filename } = await DailyReportService.buildAttachmentsArchive(reportSingleAttachmentId, storage);
    const files = unzipSync(bytes);

    expect(Object.keys(files)).toEqual(["01-solo.webp"]);
    expect(filename).toBe(`daily-report-${TANK_NO}-2026-08-13-attachments.zip`);
  });

  test("a report with no attachments is rejected rather than returning an empty ZIP (case 8)", async () => {
    const { storage } = createFakeStorage(storageContents);
    await expect(DailyReportService.buildAttachmentsArchive(reportWithoutAttachmentsId, storage)).rejects.toMatchObject({ status: 422 });
  });

  test("a missing report cannot be downloaded (case 10)", async () => {
    const { storage } = createFakeStorage(storageContents);
    await expect(DailyReportService.buildAttachmentsArchive("does-not-exist", storage)).rejects.toMatchObject({ status: 404 });
  });

  test("a soft-deleted report cannot be downloaded (case 10)", async () => {
    const { storage } = createFakeStorage(storageContents);
    await expect(DailyReportService.buildAttachmentsArchive(reportSoftDeletedId, storage)).rejects.toMatchObject({ status: 404 });
  });

  test("attachments belonging to another report are never included (case 11)", async () => {
    const { storage, readKeys, statKeys } = createFakeStorage(storageContents);
    const { bytes } = await DailyReportService.buildAttachmentsArchive(reportWithAttachmentsId, storage);

    expect(readKeys).not.toContain(foreignAttachmentKey);
    expect(statKeys).not.toContain(foreignAttachmentKey);
    expect(readKeys).toHaveLength(3);
  });

  test("a storage failure surfaces as an upstream-storage error before any bytes are sent (case 12)", async () => {
    // Every object is missing from the fake bucket, so the pre-flight stat fails.
    const { storage } = createFakeStorage({});
    await expect(DailyReportService.buildAttachmentsArchive(reportWithAttachmentsId, storage)).rejects.toMatchObject({ status: 502 });
  });

  test("a read that dies partway through is still a reportable error, not a truncated archive (case 12)", async () => {
    // The object exists (stat passes) but the transfer breaks mid-body. Because the archive is
    // assembled before the handler responds, this stays a 502 the client can act on instead of
    // an aborted download the browser reports as a bare CORS/network failure.
    await expect(
      DailyReportService.buildAttachmentsArchive(reportWithAttachmentsId, createFailingReadStorage(storageContents)),
    ).rejects.toMatchObject({ status: 502 });
  });

  test("objects are read by trusted storage key, never by the stored attachmentUrl (case 13)", async () => {
    // Tamper with attachmentUrl the way a compromised row would: point it somewhere else entirely.
    const attachment = await pgsql.dailyReportAttachment.findFirstOrThrow({
      where: { dailyReportId: reportSingleAttachmentId, deletedAt: null },
    });
    const originalUrl = attachment.attachmentUrl;
    await pgsql.dailyReportAttachment.update({
      where: { id: attachment.id },
      data: { attachmentUrl: "https://attacker.example.invalid/evil.webp" },
    });

    try {
      const { storage, readKeys, statKeys } = createFakeStorage(storageContents);
      const { bytes } = await DailyReportService.buildAttachmentsArchive(reportSingleAttachmentId, storage);
      const files = unzipSync(bytes);

      // Content still came from the FileStorage.path object, untouched by the tampered URL.
      expect(new TextDecoder().decode(files["01-solo.webp"])).toBe("solo");
      for (const key of [...readKeys, ...statKeys]) {
        expect(key).toMatch(/^DAILY_REPORT\//);
        expect(key).not.toContain("attacker.example.invalid");
      }
    } finally {
      await pgsql.dailyReportAttachment.update({ where: { id: attachment.id }, data: { attachmentUrl: originalUrl } });
    }
  });
});

describe("GET /daily-reports/:id/attachments/download (HTTP layer)", () => {
  test("an authorized user downloads a ZIP with the expected headers (cases 1, 2)", async () => {
    const { storage } = createFakeStorage(storageContents);
    const stat = spyOn(minioAttachmentStorage, "stat").mockImplementation(storage.stat);
    const read = spyOn(minioAttachmentStorage, "read").mockImplementation(storage.read);
    try {
      const app = buildTestApp(RoleEnum.INSPECTOR);
      const res = await app.request(`/daily-reports/${reportWithAttachmentsId}/attachments/download`);

      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toBe("application/zip");
      expect(res.headers.get("content-disposition")).toBe(`attachment; filename="daily-report-${TANK_NO}-2026-08-13-attachments.zip"`);

      const buffer = new Uint8Array(await res.arrayBuffer());
      // Length-delimited, not chunked: the deployment's Traefik + Cloudflare chain does not
      // pass a chunked body through intact, and it drops the CORS headers when it fails.
      expect(res.headers.get("content-length")).toBe(String(buffer.byteLength));
      expect(res.headers.get("transfer-encoding")).toBeNull();

      const files = unzipSync(buffer);
      expect(Object.keys(files)).toEqual(["01-weld.webp", "02-weld.webp", "03-site.webp"]);
    } finally {
      stat.mockRestore();
      read.mockRestore();
    }
  });

  test("a user without daily_report.read is refused (case 9)", async () => {
    const stat = spyOn(minioAttachmentStorage, "stat");
    try {
      const app = new Hono();
      app.use("*", async (c: Context, next: () => Promise<void>) => {
        c.set("user", { id: "test-user", role: RoleEnum.USER, permissions: [] });
        await next();
      });
      app.get("/daily-reports/:id/attachments/download", requirePermission(PERMISSIONS.DAILY_REPORT_READ), DailyReportController.downloadAttachments);
      app.onError(errorHandler);

      const res = await app.request(`/daily-reports/${reportWithAttachmentsId}/attachments/download`);
      const body = await res.json();

      expect(res.status).toBe(403);
      expect(body.success).toBe(false);
      // The request never reached storage.
      expect(stat).not.toHaveBeenCalled();
    } finally {
      stat.mockRestore();
    }
  });

  test("a missing report returns the standard JSON not-found envelope (case 10)", async () => {
    const app = buildTestApp(RoleEnum.INSPECTOR);
    const res = await app.request("/daily-reports/does-not-exist/attachments/download");
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.success).toBe(false);
    expect(res.headers.get("content-type")).toContain("application/json");
  });

  test("a report with no attachments returns a JSON error, not an empty archive (case 8)", async () => {
    const app = buildTestApp(RoleEnum.INSPECTOR);
    const res = await app.request(`/daily-reports/${reportWithoutAttachmentsId}/attachments/download`);
    const body = await res.json();

    expect(res.status).toBe(422);
    expect(body.success).toBe(false);
    expect(body.code).toBe("NO_DOWNLOADABLE_ATTACHMENTS");
  });
});
