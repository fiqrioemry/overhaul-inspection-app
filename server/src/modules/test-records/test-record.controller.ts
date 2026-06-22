import { Context } from "hono";
import { responseOK, responseCreated } from "@/utils/response";
import { TestRecordService } from "./test-record.service";
import { createTestRecordRequest, updateTestRecordRequest } from "./test-record.schema";
import { testRecordSuccessMessage } from "@/config/constant/test-record.constant";

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

export class TestRecordController {
  static async createByRequest(c: Context) {
    const inspectionRequestId = c.req.param("id");
    const body = (await c.req.parseBody({ all: true })) as Record<string, unknown>;
    const files = extractFiles(body);
    const data = createTestRecordRequest.parse({
      inspectionRequestItemId: str(body, "inspectionRequestItemId"),
      testDate: str(body, "testDate"),
      testPressure: str(body, "testPressure"),
      pressureUnit: str(body, "pressureUnit"),
      holdingTime: str(body, "holdingTime"),
      testMedium: str(body, "testMedium"),
      leakIndication: str(body, "leakIndication"),
      status: body["status"] ?? "NOT_STARTED",
      result: str(body, "result"),
      remarks: str(body, "remarks"),
      newFileCaptions: parseJson<string[]>(body["newFileCaptions"], []),
    });
    const user = c.get("user");
    const record = await TestRecordService.createByRequest(c, inspectionRequestId, data, files, user.id, user.role);
    return responseCreated(c, testRecordSuccessMessage.CREATE_RECORD, record);
  }

  static async listByRequest(c: Context) {
    const inspectionRequestId = c.req.param("id");
    const records = await TestRecordService.listByRequest(inspectionRequestId);
    return responseOK(c, testRecordSuccessMessage.GET_RECORDS, records);
  }

  static async listByTankProcess(c: Context) {
    const tankProcessId = c.req.param("tankProcessId");
    const records = await TestRecordService.listByTankProcess(tankProcessId);
    return responseOK(c, testRecordSuccessMessage.GET_RECORDS, records);
  }

  static async getById(c: Context) {
    const id = c.req.param("id");
    const record = await TestRecordService.getById(id);
    return responseOK(c, testRecordSuccessMessage.GET_RECORD, record);
  }

  static async updateRecord(c: Context) {
    const id = c.req.param("id");
    const body = (await c.req.parseBody({ all: true })) as Record<string, unknown>;
    const files = extractFiles(body);
    const data = updateTestRecordRequest.parse({
      inspectionRequestItemId: str(body, "inspectionRequestItemId"),
      testDate: str(body, "testDate"),
      testPressure: str(body, "testPressure"),
      pressureUnit: str(body, "pressureUnit"),
      holdingTime: str(body, "holdingTime"),
      testMedium: str(body, "testMedium"),
      leakIndication: str(body, "leakIndication"),
      status: str(body, "status"),
      result: str(body, "result"),
      remarks: str(body, "remarks"),
      removedAttachmentIds: parseJson<string[]>(body["removedAttachmentIds"], []),
      newFileCaptions: parseJson<string[]>(body["newFileCaptions"], []),
    });
    const user = c.get("user");
    const record = await TestRecordService.updateRecord(c, id, data, files, user.id, user.role);
    return responseOK(c, testRecordSuccessMessage.UPDATE_RECORD, record);
  }

  static async deleteRecord(c: Context) {
    const id = c.req.param("id");
    const user = c.get("user");
    await TestRecordService.deleteRecord(id, user.role);
    return responseOK(c, testRecordSuccessMessage.DELETE_RECORD, null);
  }
}
