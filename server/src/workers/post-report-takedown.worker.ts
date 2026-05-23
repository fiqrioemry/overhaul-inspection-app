// src/workers/post-report-takedown.worker.ts

import { redisClient } from "@/lib/redis";
import { pgsql as db } from "@/lib/database";
import { Prisma } from "generated/prisma";
import { PostRepository } from "@/modules/posts/post.repository";
import { FileRepository } from "@/modules/files/file.repository";

const LOCK_KEY = "worker:post-report-takedown:lock";
const LOCK_TTL_SECONDS = 60 * 60; // 1 hour — matches the interval
const INTERVAL_MS = 60 * 60 * 1000; // 1 hour

async function acquireLock(): Promise<boolean> {
  const result = await redisClient.send("SET", [LOCK_KEY, "1", "NX", "EX", String(LOCK_TTL_SECONDS)]);
  return result === "OK";
}

async function releaseLock(): Promise<void> {
  await redisClient.send("DEL", [LOCK_KEY]);
}

async function runTakedown(): Promise<void> {
  const locked = await acquireLock();
  if (!locked) {
    console.log("[post-report-takedown] Skipped — another instance is running.");
    return;
  }

  try {
    const eligiblePostIds = await PostRepository.findPostsEligibleForTakedown();

    if (eligiblePostIds.length === 0) {
      console.log("[post-report-takedown] No posts eligible for takedown.");
      return;
    }

    console.log(`[post-report-takedown] Taking down ${eligiblePostIds.length} post(s): ${eligiblePostIds.join(", ")}`);

    for (const postId of eligiblePostIds) {
      await db.$transaction(async (tx: Prisma.TransactionClient) => {
        // Soft-delete the post
        await tx.post.update({
          where: { id: postId },
          data: { deletedAt: new Date() },
        });

        // Mark associated files as unused so the file-cleanup worker
        // will remove them from cloud storage on its next run.
        await FileRepository.markFileRecordsAsUnused(tx, postId);
      });

      console.log(`[post-report-takedown] Post ${postId} taken down and files marked unused.`);
    }
  } finally {
    await releaseLock();
  }
}

export function startPostReportTakedownWorker(): void {
  console.log(`[post-report-takedown] Worker started. Interval: every ${INTERVAL_MS / 1000 / 60} minute(s).`);

  runTakedown().catch((err) => console.error("[post-report-takedown] Error on startup run:", err));

  setInterval(() => {
    runTakedown().catch((err) => console.error("[post-report-takedown] Error during scheduled run:", err));
  }, INTERVAL_MS);
}
