import { Context } from "hono";
import errorCodes from "@/config/constant/errorCode";
import { HTTPException } from "hono/http-exception";
import errorMessages from "@/config/constant/errorMessage";

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

export function singleFile(options: FileValidationOptions) {
  const { maxSize = 5 * 1024 * 1024, allowedTypes, field } = options;

  return async (c: Context, next: () => Promise<void>) => {
    const body = await c.req.parseBody({ all: true });
    const file = field ? body[field] : Object.values(body).find((v) => v instanceof File);

    if (!file || !(file instanceof File)) {
      throw new HTTPException(404, {
        message: errorMessages.fileNotFound,
        cause: errorCodes.fileNotFound,
      });
    }

    if (file.size > maxSize) {
      throw new HTTPException(413, {
        message: errorMessages.errorFileTooLarge,
        cause: errorCodes.fileTooLarge,
      });
    }

    if (!allowedTypes.includes(file.type)) {
      throw new HTTPException(415, {
        message: errorMessages.invalidFileType,
        cause: errorCodes.invalidFileType,
      });
    }

    c.set("file", file);
    await next();
  };
}

export function multipleFile(options: FileValidationOptions) {
  const { maxSize = 5 * 1024 * 1024, allowedTypes, field } = options;

  return async (c: Context, next: () => Promise<void>) => {
    const body = await c.req.parseBody({ all: true });

    const entries = field ? { [field]: body[field] } : body;

    for (const [, value] of Object.entries(entries)) {
      const files = Array.isArray(value) ? value : [value];

      for (const file of files) {
        if (!(file instanceof File)) continue;

        if (file.size > maxSize) {
          throw new HTTPException(413, {
            message: errorMessages.errorFileTooLarge,
            cause: errorCodes.fileTooLarge,
          });
        }

        if (!allowedTypes.includes(file.type)) {
          throw new HTTPException(415, {
            message: errorMessages.invalidFileType,
            cause: errorCodes.invalidFileType,
          });
        }
      }
    }
    c.set("files", entries);
    await next();
  };
}
