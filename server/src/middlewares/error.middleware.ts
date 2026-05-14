import { Context } from "hono";
import { ZodError } from "zod";
import { responseError } from "@/utils/response";
import { HTTPException } from "hono/http-exception";
import { authErrorCode, authErrorMessage } from "@/config/constant/auth.constant";

export async function errorHandler(err: Error, c: Context) {
  const cause = err.cause as any;
  // if error is HTTPException
  if (err instanceof HTTPException) {
    console.log("HTTP error:", err.message);
    return responseError(c, err.message, err.status, cause || "HTTP_EXCEPTION");
  }

  //   if error is ZodError
  if (err instanceof ZodError) {
    const errors: Record<string, string> = {};
    for (const issue of err.issues) {
      const path = issue.path.join(".");
      errors[path] = issue.message;
    }
    console.error("Validation error:", errors);
    return responseError(c, authErrorMessage.BAD_REQUEST, 400, cause?.code || authErrorCode.BAD_REQUEST, errors);
  }

  //   other errors
  console.error("Unexpected error:", err);
  return responseError(c, authErrorMessage.INTERNAL_SERVER_ERROR, 500, cause?.code || authErrorCode.INTERNAL_SERVER_ERROR);
}

export async function notFoundHandler(c: Context) {
  console.warn(`Not found: ${c.req.method} ${c.req.url}`);
  return responseError(c, `${c.req.method} - ${c.req.url}`, 404, authErrorCode.ROUTE_NOT_FOUND);
}
