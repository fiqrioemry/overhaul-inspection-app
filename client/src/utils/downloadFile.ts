// src/utils/downloadFile.ts

/**
 * Hand a blob to the browser as a file download.
 *
 * The object URL is revoked on the next tick rather than synchronously: `click()` only
 * *queues* the download, and revoking in the same frame can cancel it in some browsers.
 * Nothing keeps a reference to the blob afterwards, so it is collectable immediately.
 */
export function triggerBrowserDownload(blob: Blob, filename: string): void {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.style.display = "none";

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
}

/**
 * Pull the filename out of a `Content-Disposition` header, preferring the RFC 5987
 * `filename*` form when present. Returns null when the header is absent or unparseable —
 * cross-origin responses only expose it when the server sets Access-Control-Expose-Headers.
 */
export function parseContentDispositionFilename(header: string | undefined | null): string | null {
  if (!header) return null;

  const encoded = /filename\*=(?:UTF-8'')?([^;]+)/i.exec(header)?.[1];
  if (encoded) {
    try {
      return decodeURIComponent(encoded.trim().replace(/^"|"$/g, ""));
    } catch {
      // fall through to the plain form
    }
  }

  const plain = /filename="?([^";]+)"?/i.exec(header)?.[1];
  return plain ? plain.trim() : null;
}
