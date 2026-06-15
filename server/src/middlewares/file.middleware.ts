import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { fileErrorCode, fileErrorMessage } from "@/config/constant/file.constant";

type FileValidationOptions = {
  maxSize?: number;
  allowedTypes: string[];
  field?: string;
};

/**
 * Middleware factory for validating uploaded files.
 *
 * @param options.maxSize - Max file size in bytes (default: 5 MiB)
 * @param options.allowedTypes - Allowed MIME types, e.g. ["image/jpeg", "image/webp"]
 * @param options.field - Specific form field name to validate (validates all files if omitted)
 */

export function singleFile(options: FileValidationOptions, name: string) {
  const { maxSize = 5 * 1024 * 1024, allowedTypes, field } = options;

  return async (c: Context, next: () => Promise<void>) => {
    const body = await c.req.parseBody({ all: true });
    const file = field ? body[field] : Object.values(body).find((v) => v instanceof File);

    if (!file || !(file instanceof File)) {
      throw new HTTPException(404, {
        message: fileErrorMessage.FILE_NOT_FOUND,
        cause: fileErrorCode.FILE_NOT_FOUND,
      });
    }

    if (file.size > maxSize) {
      throw new HTTPException(413, {
        message: fileErrorMessage.FILE_TOO_LARGE,
        cause: fileErrorCode.FILE_TOO_LARGE,
      });
    }

    if (!allowedTypes.includes(file.type)) {
      throw new HTTPException(415, {
        message: fileErrorMessage.FILE_TYPE_NOT_ALLOWED,
        cause: fileErrorCode.FILE_TYPE_NOT_ALLOWED,
      });
    }

    c.set(name, file);
    await next();
  };
}

export function optionalFile(options: FileValidationOptions, name: string) {
  const { maxSize = 5 * 1024 * 1024, allowedTypes, field } = options;

  return async (c: Context, next: () => Promise<void>) => {
    const body = await c.req.parseBody({ all: true });
    const file = field ? body[field] : Object.values(body).find((v) => v instanceof File);

    if (!file || !(file instanceof File) || file.size === 0) {
      await next();
      return;
    }

    if (file.size > maxSize) {
      throw new HTTPException(413, {
        message: fileErrorMessage.FILE_TOO_LARGE,
        cause: fileErrorCode.FILE_TOO_LARGE,
      });
    }

    if (!allowedTypes.includes(file.type)) {
      throw new HTTPException(415, {
        message: fileErrorMessage.FILE_TYPE_NOT_ALLOWED,
        cause: fileErrorCode.FILE_TYPE_NOT_ALLOWED,
      });
    }

    c.set(name, file);
    await next();
  };
}

export function multipleFile(options: FileValidationOptions, name: string = "files") {
  const { maxSize = 5 * 1024 * 1024, allowedTypes, field } = options;

  return async (c: Context, next: () => Promise<void>) => {
    const body = await c.req.parseBody({ all: true });

    const raw = field ? body[field] : Object.values(body).flat();
    const files = (Array.isArray(raw) ? raw : [raw]).filter((v) => v instanceof File) as File[];

    if (files.length === 0) {
      await next();
      return;
    }

    for (const file of files) {
      if (file.size > maxSize) {
        throw new HTTPException(413, {
          message: fileErrorMessage.FILE_TOO_LARGE,
          cause: fileErrorCode.FILE_TOO_LARGE,
        });
      }

      if (!allowedTypes.includes(file.type)) {
        throw new HTTPException(415, {
          message: fileErrorMessage.FILE_TYPE_NOT_ALLOWED,
          cause: fileErrorCode.FILE_TYPE_NOT_ALLOWED,
        });
      }
    }

    c.set(name, files);
    await next();
  };
}
