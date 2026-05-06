import { Context } from "hono";
import { ZodError } from "zod";
import constant from "@/config/constant";
import { errorResponse } from "@/utils/response";
import { HTTPException } from "hono/http-exception";

export async function errorHandler(err: Error, c: Context) {
  const cause = err.cause as any;
  // if error is HTTPException
  if (err instanceof HTTPException) {
    console.log("HTTP error:", err.message);
    return errorResponse(c, err.message, err.status, cause || "HTTP_EXCEPTION");
  }

  //   if error is ZodError
  if (err instanceof ZodError) {
    const errors: Record<string, string> = {};
    for (const issue of err.issues) {
      const path = issue.path.join(".");
      errors[path] = issue.message;
    }
    console.error("Validation error:", errors);
    return errorResponse(c, constant.ERROR_MESSAGES.BAD_REQUEST, 400, cause?.code || "VALIDATION_ERROR", errors);
  }

  //   other errors
  console.error("Unexpected error:", err);
  return errorResponse(c, constant.ERROR_MESSAGES.INTERNAL_SERVER_ERROR, 500, cause?.code || "INTERNAL_SERVER_ERROR");
}

export async function notFoundHandler(c: Context) {
  console.warn(`Not found: ${c.req.method} ${c.req.url}`);
  return errorResponse(c, `${c.req.method} - ${c.req.url}`, 404, constant.AUTH_CODES.INVALID_URL);
}
