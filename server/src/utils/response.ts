import { Context } from "hono";

export function successResponse(c: Context, message: string, data?: any, status: number = 200, meta?: any) {
  const res = { success: true, message, data, status, meta };
  return c.json(res, status as any);
}

export function errorResponse(c: Context, message: string, status: number = 500, code: string = "INTERNAL_SERVER_ERROR", errors?: Record<string, any>) {
  const res = { success: false, message, status, code, errors };
  return c.json(res, status as any);
}
