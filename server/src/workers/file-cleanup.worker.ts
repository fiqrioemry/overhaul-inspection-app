import { redisClient } from "@/lib/redis";
import { minioClient, BUCKET } from "@/lib/minio";
import { FileRepository } from "@/modules/files/file.repository";

const LOCK_KEY = "worker:file-cleanup:lock";
const LOCK_TTL_SECONDS = 15 * 60;
const INTERVAL_MS = 15 * 60 * 1000;

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

    // One file at a time, database before storage:
    // - per file, so a single problem row cannot abort the whole batch (a batched deleteMany
    //   previously meant one blocked file left every other file's record behind, after their
    //   objects had already been removed);
    // - database first, because it is the source of truth. If the object removal then fails we
    //   have leaked an object, which is recoverable; the reverse order left records pointing at
    //   objects that no longer existed, which is not.
    let deleted = 0;
    let failed = 0;

    for (const file of expiredFiles) {
      try {
        await FileRepository.deleteExpiredFile(file.id);
      } catch (err) {
        failed++;
        console.error(`[file-cleanup] Failed to delete record ${file.id} (${file.path}) — object left in place:`, err);
        continue;
      }

      try {
        // Idempotent: MinIO treats removing a missing object as success, so a retry after a
        // partial failure is safe.
        await minioClient.removeObject(BUCKET, file.path);
        deleted++;
      } catch (err) {
        // Record is gone, so this will not be retried; log the key so it can be swept manually.
        console.error(`[file-cleanup] Record ${file.id} deleted but object ${file.path} remains in storage:`, err);
      }
    }

    console.log(`[file-cleanup] Deleted ${deleted} file(s).${failed > 0 ? ` ${failed} failed — see errors above.` : ""}`);
  } finally {
    await releaseLock();
  }
}

export function startFileCleanupWorker(): void {
  console.log(`[file-cleanup] Worker started. Interval: every ${INTERVAL_MS / 1000 / 60} minute(s).`);

  runCleanup().catch((err) => console.error("[file-cleanup] Error on startup run:", err));

  setInterval(() => {
    runCleanup().catch((err) => console.error("[file-cleanup] Error during scheduled run:", err));
  }, INTERVAL_MS);
}
