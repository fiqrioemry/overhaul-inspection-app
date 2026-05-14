import { redisClient } from "@/config/database/redis";
import { minioClient, BUCKET } from "@/config/storage/minio";
import { FileRepository } from "@/repositories/file.repository";

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

    for (const file of expiredFiles) {
      await minioClient.removeObject(BUCKET, file.path);
    }

    if (expiredFiles.length > 0) {
      const count = await FileRepository.deleteFileRecordsByIds(expiredFiles.map((f) => f.id));
      console.log(`[file-cleanup] Deleted ${count} record(s) from DB.`);
    }
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
