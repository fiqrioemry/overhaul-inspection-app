import { Context } from "hono";
import { ZodError } from "zod";
import { errorResponse } from "@/utils/response";
import { HTTPException } from "hono/http-exception";
import errorMessages from "@/config/constant/errorMessage";
import errorCodes from "@/config/constant/errorCode";

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
    return errorResponse(c, errorMessages.badRequest, 400, cause?.code || errorCodes.badRequest, { errors });
  }

  //   other errors
  console.error("Unexpected error:", err);
  return errorResponse(c, errorMessages.internalServerError, 500, cause?.code || errorCodes.internalServerError);
}

export async function notFoundHandler(c: Context) {
  console.warn(`Not found: ${c.req.method} ${c.req.url}`);
  return errorResponse(c, `${c.req.method} - ${c.req.url}`, 404, errorCodes.notFound);
}
