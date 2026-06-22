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

export class InspectionRequestController {
  static async createRequest(c: Context) {
    const body = (await c.req.parseBody({ all: true })) as Record<string, unknown>;
    const files = extractFiles(body);

    const data = createInspectionRequestRequest.parse({
      testType: body["testType"],
      tankId: str(body, "tankId"),
      tankProcessId: str(body, "tankProcessId"),
      requestDate: body["requestDate"],
      requestedBy: str(body, "requestedBy"),
      assetHolder: str(body, "assetHolder"),
      executionParty: str(body, "executionParty"),
      standardAndCode: str(body, "standardAndCode"),
      requestLocation: str(body, "requestLocation"),
      description: str(body, "description"),
      remarks: str(body, "remarks"),
      items: parseJson<InspectionRequestItemInput[]>(body["items"], []),
    });

    const user = c.get("user");
    const request = await InspectionRequestService.createRequest(c, data, files, user.id);
    return responseCreated(c, inspectionRequestSuccessMessage.CREATE_REQUEST, request);
  }

  static async listRequests(c: Context) {
    const query = listInspectionRequestsQuery.parse(c.req.query());
    const result = await InspectionRequestService.listRequests(query);
    return responseOK(c, inspectionRequestSuccessMessage.GET_REQUESTS, result.data, result.meta);
  }

  static async getRequestById(c: Context) {
    const id = c.req.param("id");
    const request = await InspectionRequestService.getRequestById(id);
    return responseOK(c, inspectionRequestSuccessMessage.GET_REQUEST, request);
  }

  static async updateRequest(c: Context) {
    const id = c.req.param("id");
    const body = await c.req.json();
    const data = updateInspectionRequestRequest.parse(body);
    const request = await InspectionRequestService.updateRequest(id, data);
    return responseOK(c, inspectionRequestSuccessMessage.UPDATE_REQUEST, request);
  }

  static async submitConfirm(c: Context) {
    const id = c.req.param("id");
    const request = await InspectionRequestService.submitConfirm(id);
    return responseOK(c, inspectionRequestSuccessMessage.SUBMIT_CONFIRM, request);
  }

  static async updateStatus(c: Context) {
    const id = c.req.param("id");
    const body = await c.req.json();
    const data = updateStatusRequest.parse(body);
    const request = await InspectionRequestService.updateStatus(id, data);
    return responseOK(c, inspectionRequestSuccessMessage.UPDATE_STATUS, request);
  }

  static async uploadAttachment(c: Context) {
    const id = c.req.param("id");
    const body = (await c.req.parseBody({ all: true })) as Record<string, unknown>;
    const files = extractFiles(body);
    const { attachmentType, caption } = uploadAttachmentRequest.parse({
      attachmentType: body["attachmentType"] ?? "SUPPORTING_DOCUMENT",
      caption: str(body, "caption"),
    });
    const user = c.get("user");
    const request = await InspectionRequestService.uploadAttachment(
      c,
      id,
      attachmentType as InspectionRequestAttachmentTypeEnum,
      caption,
      files,
      user.id,
    );
    return responseOK(c, inspectionRequestSuccessMessage.UPLOAD_ATTACHMENT, request);
  }

  static async removeAttachment(c: Context) {
    const id = c.req.param("id");
    const attachmentId = c.req.param("attachmentId");
    const request = await InspectionRequestService.removeAttachment(id, attachmentId);
    return responseOK(c, inspectionRequestSuccessMessage.REMOVE_ATTACHMENT, request);
  }

  static async deleteRequest(c: Context) {
    const id = c.req.param("id");
    await InspectionRequestService.deleteRequest(id);
    return responseOK(c, inspectionRequestSuccessMessage.DELETE_REQUEST, null);
  }

  static async listTankOptions(c: Context) {
    const options = await InspectionRequestService.listTankOptions();
    return responseOK(c, inspectionRequestSuccessMessage.GET_TANK_OPTIONS, options);
  }

  static async listTankProcessOptions(c: Context) {
    const { tankId } = tankProcessOptionsQuery.parse(c.req.query());
    const options = await InspectionRequestService.listTankProcessOptions(tankId);
    return responseOK(c, inspectionRequestSuccessMessage.GET_TANK_PROCESS_OPTIONS, options);
  }
}
