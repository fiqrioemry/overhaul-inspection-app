import { unlink } from "node:fs/promises";
import { redisClient } from "@/config/database/redis";
import { FileRepository } from "@/repositories/file.repository";

const LOCK_KEY = "worker:file-cleanup:lock";
const LOCK_TTL_SECONDS = 10 * 60; // 10 minutes — same as interval, prevents overlap
const INTERVAL_MS = 10 * 60 * 1000; // run every 10 minutes

async function acquireLock(): Promise<boolean> {
  const result = await redisClient.send("SET", [LOCK_KEY, "1", "NX", "EX", String(LOCK_TTL_SECONDS)]);
  return result === "OK";
}

async function releaseLock(): Promise<void> {
  await redisClient.send("DEL", [LOCK_KEY]);
}

async function runCleanup(): Promise<void> {
  const locked = await acquireLock();
  if (!locked) {
    console.log("[file-cleanup] Skipped — another instance is running.");
    return;
  }

  try {
    const expiredFiles = await FileRepository.findExpiredUnusedFiles();

    if (expiredFiles.length === 0) {
      console.log("[file-cleanup] No expired files found.");
      return;
    }

    console.log(`[file-cleanup] Found ${expiredFiles.length} expired file(s). Deleting...`);

    const deletedPaths: string[] = [];
    const failedIds: string[] = [];

    await Promise.allSettled(
      expiredFiles.map(async ({ id, path }) => {
        try {
          await unlink(`.${path}`);
          deletedPaths.push(path);
        } catch (err: any) {
          // File already missing from disk — still remove DB record
          if (err.code !== "ENOENT") {
            console.error(`[file-cleanup] Failed to delete file ${path}:`, err.message);
            failedIds.push(id);
            return;
          }
        }
      }),
    );

    const idsToDelete = expiredFiles.map((f) => f.id).filter((id) => !failedIds.includes(id));

    if (idsToDelete.length > 0) {
      const count = await FileRepository.deleteFileRecordsByIds(idsToDelete);
      console.log(`[file-cleanup] Deleted ${count} record(s) from DB.`);
    }

    if (failedIds.length > 0) {
      console.warn(`[file-cleanup] ${failedIds.length} file(s) skipped due to errors.`);
    }
  } finally {
    await releaseLock();
  }
}

export function startFileCleanupWorker(): void {
  console.log("[file-cleanup] Worker started. Interval: every 1 hour.");

  // Run once immediately on startup
  runCleanup().catch((err) => console.error("[file-cleanup] Error on startup run:", err));

  setInterval(() => {
    runCleanup().catch((err) => console.error("[file-cleanup] Error during scheduled run:", err));
  }, INTERVAL_MS);
}
