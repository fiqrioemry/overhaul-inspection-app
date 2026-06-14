import { Context } from "hono";
import { responseOK, responseCreated } from "@/utils/response";
import { DailyReportService } from "./daily-report.service";
import { createDailyReportRequest, listDailyReportsQuery, updateDailyReportRequest } from "./daily-report.schema";

export class DailyReportController {
  static async createReport(c: Context) {
    const body = await c.req.json();
    const data = createDailyReportRequest.parse(body);
    const user = c.get("user");
    const report = await DailyReportService.createReport(data, user.id);
    return responseCreated(c, "Daily report created successfully", report);
  }

  static async listReports(c: Context) {
    const query = listDailyReportsQuery.parse(c.req.query());
    const result = await DailyReportService.listReports(query);
    return responseOK(c, "Daily reports retrieved successfully", result);
  }

  static async getReportById(c: Context) {
    const id = c.req.param("id");
    const report = await DailyReportService.getReportById(id);
    return responseOK(c, "Daily report retrieved successfully", report);
  }

  static async updateReport(c: Context) {
    const id = c.req.param("id");
    const body = await c.req.json();
    const data = updateDailyReportRequest.parse(body);
    const report = await DailyReportService.updateReport(id, data);
    return responseOK(c, "Daily report updated successfully", report);
  }

  static async deleteReport(c: Context) {
    const id = c.req.param("id");
    await DailyReportService.deleteReport(id);
    return responseOK(c, "Daily report deleted successfully", null);
  }
}
