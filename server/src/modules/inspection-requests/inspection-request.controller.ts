import { Context } from "hono";
import { InspectionRequestAttachmentTypeEnum } from "generated/prisma";
import { responseOK, responseCreated } from "@/utils/response";
import { InspectionRequestService } from "./inspection-request.service";
import {
  createInspectionRequestRequest,
  updateInspectionRequestRequest,
  updateStatusRequest,
  uploadAttachmentRequest,
  listInspectionRequestsQuery,
  tankProcessOptionsQuery,
  type InspectionRequestItemInput,
} from "./inspection-request.schema";
import { inspectionRequestSuccessMessage } from "@/config/constant/inspection-request.constant";

function extractFiles(body: Record<string, unknown>): File[] {
  const raw = body["attachments"];
  if (!raw) return [];
  const arr = Array.isArray(raw) ? raw : [raw];
  return arr.filter((f): f is File => f instanceof File);
}

function parseJson<T>(value: unknown, fallback: T): T {
  if (!value || typeof value !== "string") return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function str(body: Record<string, unknown>, key: string): string | undefined {
  const v = body[key];
  return v && typeof v === "string" && v.length > 0 ? v : undefined;
}
