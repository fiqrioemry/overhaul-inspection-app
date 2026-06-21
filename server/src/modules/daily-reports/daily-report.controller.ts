import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { responseOK, responseCreated } from "@/utils/response";
import { DailyReportService } from "./daily-report.service";
import { DailyReportAIService } from "./daily-report-ai.service";
import { createDailyReportRequest, listDailyReportsQuery, updateDailyReportRequest, tankProcessOptionsQuery } from "./daily-report.schema";
import { dailyReportSuccessMessage } from "@/config/constant/daily-report.constant";

function extractFiles(body: Record<string, unknown>): File[] {
  const raw = body["attachments"];
  if (!raw) return [];
  const arr = Array.isArray(raw) ? raw : [raw];
  return arr.filter((f): f is File => f instanceof File);
}

function parseJsonField<T>(value: unknown, fallback: T): T {
  if (!value || typeof value !== "string") return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export class DailyReportController {
  static async createReport(c: Context) {
    const body = await c.req.parseBody({ all: true });
    const files = extractFiles(body as Record<string, unknown>);

    const data = createDailyReportRequest.parse({
      tankId: body["tankId"],
      tankProcessId: body["tankProcessId"] || undefined,
      reportDate: body["reportDate"],
      activityType: body["activityType"],
      description: body["description"],
      inspectorId: body["inspectorId"] || undefined,
      pertaminaPicId: body["pertaminaPicId"] || undefined,
      newFileCaptions: parseJsonField<string[]>(body["newFileCaptions"], []),
    });

    const user = c.get("user");
    const report = await DailyReportService.createReport(c, data, files, user.id);
    return responseCreated(c, dailyReportSuccessMessage.CREATE_REPORT, report);
  }

  static async listReports(c: Context) {
    const query = listDailyReportsQuery.parse(c.req.query());
    const result = await DailyReportService.listReports(query);
    return responseOK(c, dailyReportSuccessMessage.GET_REPORTS, result.data, result.meta);
  }

  static async getReportById(c: Context) {
    const id = c.req.param("id");
    const report = await DailyReportService.getReportById(id);
    return responseOK(c, dailyReportSuccessMessage.GET_REPORT, report);
  }

  static async updateReport(c: Context) {
    const id = c.req.param("id");
    const body = await c.req.parseBody({ all: true });
    const files = extractFiles(body as Record<string, unknown>);

    const data = updateDailyReportRequest.parse({
      reportDate: body["reportDate"] || undefined,
      activityType: body["activityType"] || undefined,
      description: body["description"] || undefined,
      inspectorId: body["inspectorId"] || undefined,
      pertaminaPicId: body["pertaminaPicId"] || undefined,
      removedAttachmentIds: parseJsonField<string[]>(body["removedAttachmentIds"], []),
      captions: parseJsonField<Array<{ attachmentId: string; caption: string }>>(body["captions"], []),
      sortOrders: parseJsonField<Array<{ attachmentId: string; sortOrder: number }>>(body["sortOrders"], []),
    });

    const user = c.get("user");
    const report = await DailyReportService.updateReport(c, id, data, files, user.id);
    return responseOK(c, dailyReportSuccessMessage.UPDATE_REPORT, report);
  }

  static async deleteReport(c: Context) {
    const id = c.req.param("id");
    await DailyReportService.deleteReport(id);
    return responseOK(c, dailyReportSuccessMessage.DELETE_REPORT, null);
  }

  static async generateAI(c: Context) {
    const body = await c.req.parseBody({ all: true });
    const files = extractFiles(body as Record<string, unknown>);
    const tankId = body["tankId"] ? String(body["tankId"]) : undefined;
    const activityType = String(body["activityType"] ?? "MONITORING");
    const processName = body["processName"] ? String(body["processName"]) : undefined;

    if (files.length === 0) throw new HTTPException(400, { message: "At least one photo file is required" });

    const result = await DailyReportAIService.generate(files, activityType, tankId, processName);
    return responseOK(c, "AI content generated successfully", result);
  }

  static async listTankOptions(c: Context) {
    const options = await DailyReportService.listTankOptions();
    return responseOK(c, dailyReportSuccessMessage.GET_TANK_OPTIONS, options);
  }

  static async listTankProcessOptions(c: Context) {
    const { tankId } = tankProcessOptionsQuery.parse(c.req.query());
    const options = await DailyReportService.listTankProcessOptions(tankId);
    return responseOK(c, dailyReportSuccessMessage.GET_TANK_PROCESS_OPTIONS, options);
  }
}
