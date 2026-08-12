// Builds the "download all attachments" ZIP for a single daily report.
//
// Object bytes are pulled out of MinIO one attachment at a time and pushed straight into the
// archive; the finished archive is then handed to the caller as one buffer, because this
// deployment cannot serve a chunked response (see buildAttachmentsArchiveBuffer).
//
// Entry and archive names are derived from database values, which means every one of them is
// sanitised here — a tank number or an uploaded filename must never be able to inject a path
// separator, a control character, or a header break.

import { Zip, ZipPassThrough } from "fflate";
import { minioClient, BUCKET } from "@/lib/minio";

/** Seam over object storage so the archive logic is testable without touching a live bucket. */
export interface AttachmentObjectStorage {
  /** Resolves when the object exists and is readable; rejects otherwise. */
  stat(storageKey: string): Promise<void>;
  read(storageKey: string): Promise<AsyncIterable<Uint8Array | Buffer>>;
}

export const minioAttachmentStorage: AttachmentObjectStorage = {
  async stat(storageKey) {
    await minioClient.statObject(BUCKET, storageKey);
  },
  async read(storageKey) {
    return (await minioClient.getObject(BUCKET, storageKey)) as unknown as AsyncIterable<Uint8Array | Buffer>;
  },
};

export interface ArchiveEntry {
  /** ZIP entry name — already sanitised and unique within the archive. */
  name: string;
  /** Trusted FileStorage.path (the object key), never a client-supplied URL. */
  storageKey: string;
}

/** Attachment shape the archive needs, mirroring the repository selection. */
export interface ArchivableAttachment {
  id: string;
  sortOrder: number;
  createdAt: Date;
  fileStorage: { path: string; mimeType: string | null; meta: unknown } | null;
}

const MAX_ENTRY_BASENAME_LENGTH = 80;
const MAX_ARCHIVE_SLUG_LENGTH = 60;

/** Fallback extensions when the storage key carries none. */
const MIME_EXTENSIONS: Record<string, string> = {
  "image/webp": "webp",
  "image/jpeg": "jpg",
  "image/png": "png",
  "application/pdf": "pdf",
};

const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f]+/g;

/**
 * Reduce an arbitrary database string to a single safe path segment.
 * Strips control characters (including the CR/LF that would break a response header) and
 * folds every separator into "-", so the result can never traverse (`../`) or escape into
 * an absolute path.
 */
export function sanitizeArchiveName(value: string, maxLength: number): string {
  const cleaned = value
    .replace(CONTROL_CHARACTERS, "")
    .replace(/[^A-Za-z0-9._-]+/g, "-") // slashes, backslashes, quotes, spaces — all collapse to "-"
    .replace(/\.{2,}/g, ".") // no ".." survives
    .replace(/-{2,}/g, "-")
    .replace(/^[.\-]+/, "") // no leading dot (hidden file) or dash
    .replace(/[.\-]+$/, "");
  return cleaned.slice(0, maxLength);
}

function extensionFrom(storageKey: string, mimeType: string | null): string | null {
  const objectName = storageKey.split("/").pop() ?? "";
  const dotIndex = objectName.lastIndexOf(".");
  const fromKey = dotIndex > 0 ? objectName.slice(dotIndex + 1) : "";
  if (/^[A-Za-z0-9]{1,8}$/.test(fromKey)) return fromKey.toLowerCase();
  if (mimeType && MIME_EXTENSIONS[mimeType]) return MIME_EXTENSIONS[mimeType];
  return null;
}

function originalNameFrom(meta: unknown): string | null {
  if (!meta || typeof meta !== "object") return null;
  const value = (meta as Record<string, unknown>).originalName;
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

/**
 * `01-photo.webp`, `02-photo.webp`, … — the ordinal prefix is what guarantees uniqueness,
 * so two attachments uploaded under the same original filename stay separate entries.
 *
 * The extension comes from the stored object, not from the original filename: uploads are
 * re-encoded to webp, so `IMG_0021.JPG` is really stored as a `.webp` object.
 */
export function buildArchiveEntryName(attachment: ArchivableAttachment, index: number): string {
  const storageKey = attachment.fileStorage?.path ?? "";
  const extension = extensionFrom(storageKey, attachment.fileStorage?.mimeType ?? null);

  const rawBase = originalNameFrom(attachment.fileStorage?.meta)?.replace(/\.[^.]*$/, "") ?? attachment.id;
  const safeBase =
    sanitizeArchiveName(rawBase, MAX_ENTRY_BASENAME_LENGTH) || sanitizeArchiveName(attachment.id, MAX_ENTRY_BASENAME_LENGTH) || "attachment";

  const ordinal = String(index + 1).padStart(2, "0");
  return extension ? `${ordinal}-${safeBase}.${extension}` : `${ordinal}-${safeBase}`;
}

/**
 * `daily-report-TK-170-2026-08-13-attachments.zip`, falling back to the report id when the
 * tank number or report date is unavailable.
 */
export function buildArchiveFileName(tankNo: string | null | undefined, reportDate: Date | null | undefined, reportId: string): string {
  const safeTankNo = tankNo ? sanitizeArchiveName(tankNo, MAX_ARCHIVE_SLUG_LENGTH) : "";
  const safeDate = reportDate && !Number.isNaN(reportDate.getTime()) ? reportDate.toISOString().slice(0, 10) : "";

  const slug = [safeTankNo, safeDate].filter(Boolean).join("-");
  const safeSlug = slug || sanitizeArchiveName(reportId, MAX_ARCHIVE_SLUG_LENGTH) || "report";
  return `daily-report-${safeSlug}-attachments.zip`;
}

/** Attachments in the order the report defines; createdAt breaks sortOrder ties, id makes it total. */
export function sortAttachmentsForArchive<T extends ArchivableAttachment>(attachments: T[]): T[] {
  return [...attachments].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.createdAt.getTime() - b.createdAt.getTime() || a.id.localeCompare(b.id),
  );
}

/**
 * Confirm every object is present before the caller commits to a `200 application/zip`,
 * since once the first byte is written a failure can no longer be reported as an error.
 */
export async function assertArchiveEntriesReadable(
  entries: ArchiveEntry[],
  storage: AttachmentObjectStorage = minioAttachmentStorage,
): Promise<void> {
  await Promise.all(entries.map((entry) => storage.stat(entry.storageKey)));
}

/**
 * Collect the archive into a single buffer.
 *
 * Deliberately *not* streamed to the client. This is the only binary response in the API and
 * it sits behind Traefik (which stamps `Upgrade: websocket` onto every request) and
 * Cloudflare; a chunked response through that chain never reached the browser intact. Just as
 * importantly, buffering keeps every possible failure — a missing object, a storage timeout —
 * *before* the first byte is written, so it can still surface as a normal JSON error with CORS
 * headers instead of a mid-flight connection abort that the browser reports as a bare CORS
 * failure.
 *
 * Memory is bounded by the per-report attachment cap (20) and the images are already
 * webp-compressed, so the whole archive is single-digit megabytes.
 */
export async function buildAttachmentsArchiveBuffer(
  entries: ArchiveEntry[],
  storage: AttachmentObjectStorage = minioAttachmentStorage,
): Promise<Uint8Array<ArrayBuffer>> {
  const stream = createAttachmentsArchiveStream(entries, storage);
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

export function createAttachmentsArchiveStream(
  entries: ArchiveEntry[],
  storage: AttachmentObjectStorage = minioAttachmentStorage,
): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;
      const fail = (err: unknown) => {
        if (closed) return;
        closed = true;
        controller.error(err instanceof Error ? err : new Error(String(err)));
      };

      // Attachments are already webp-compressed, so STORE (ZipPassThrough) saves the CPU
      // that deflate would spend for essentially no size gain.
      const zip = new Zip((err, chunk, final) => {
        if (closed) return;
        if (err) {
          fail(err);
          return;
        }
        controller.enqueue(chunk);
        if (final) {
          closed = true;
          controller.close();
        }
      });

      void (async () => {
        try {
          for (const entry of entries) {
            const file = new ZipPassThrough(entry.name);
            zip.add(file);
            for await (const chunk of await storage.read(entry.storageKey)) {
              if (closed) return;
              file.push(chunk instanceof Uint8Array ? chunk : new Uint8Array(chunk), false);
            }
            file.push(new Uint8Array(0), true);
          }
          zip.end();
        } catch (err) {
          fail(err);
        }
      })();
    },
  });
}
