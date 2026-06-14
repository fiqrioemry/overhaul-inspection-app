import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { responseOK } from "@/utils/response";
import { pgsql } from "@/lib/database";
import { FileRepository } from "@/modules/files/file.repository";
import { DailyReportRepository } from "@/modules/daily-reports/daily-report.repository";

export class ReportController {
  static async getDailyReportPrintData(c: Context) {
    const id = c.req.param("id");
    const report = await pgsql.dailyReport.findFirst({
      where: { id, deletedAt: null },
      include: {
        tank: true,
        tankProcess: { include: { processTemplate: true } },
        inspector: { select: { id: true, name: true, email: true } },
      },
    });
    if (!report) throw new HTTPException(404, { message: "Daily report not found", cause: "REPORT_NOT_FOUND" });
    const attachments = await FileRepository.getFileRecordsByTargetId(id, "DAILY_REPORT");
    return responseOK(c, "Print data retrieved successfully", { report, attachments });
  }

  static async getDailyReportsByDatePrintData(c: Context) {
    const tankId = c.req.param("tankId");
    const date = c.req.query("date");
    if (!date) throw new HTTPException(400, { message: "date query parameter is required", cause: "MISSING_DATE" });
    const reports = await DailyReportRepository.findByTankAndDate(tankId, date);
    const tank = await pgsql.tank.findFirst({ where: { id: tankId, deletedAt: null } });
    if (!tank) throw new HTTPException(404, { message: "Tank not found", cause: "TANK_NOT_FOUND" });
    return responseOK(c, "Print data retrieved successfully", { tank, date, reports });
  }

  static async getInspectionRequestPrintData(c: Context) {
    const id = c.req.param("id");
    const request = await pgsql.inspectionRequest.findUnique({
      where: { id },
      include: {
        tankProcess: {
          include: {
            tank: true,
            processTemplate: true,
            checklistResults: {
              include: { criteria: true, checkedByUser: { select: { id: true, name: true } } },
            },
          },
        },
        requestedByUser: { select: { id: true, name: true, email: true } },
        reviewedByUser: { select: { id: true, name: true, email: true } },
      },
    });
    if (!request) throw new HTTPException(404, { message: "Inspection request not found", cause: "REQUEST_NOT_FOUND" });
    const attachments = await FileRepository.getFileRecordsByTargetId(id, "INSPECTION_REQUEST");
    return responseOK(c, "Print data retrieved successfully", { request, attachments });
  }

  static async getTestRecordPrintData(c: Context) {
    const id = c.req.param("id");
    const record = await pgsql.testRecord.findUnique({
      where: { id },
      include: {
        tankProcess: {
          include: {
            tank: true,
            processTemplate: true,
          },
        },
        createdByUser: { select: { id: true, name: true } },
      },
    });
    if (!record) throw new HTTPException(404, { message: "Test record not found", cause: "TEST_RECORD_NOT_FOUND" });
    const attachments = await FileRepository.getFileRecordsByTargetId(id, "TEST_RECORD");
    return responseOK(c, "Print data retrieved successfully", { record, attachments });
  }

  static async getRadiographyPrintData(c: Context) {
    const id = c.req.param("id");
    const test = await pgsql.radiographyTest.findUnique({
      where: { id },
      include: {
        tankProcess: {
          include: {
            tank: true,
            processTemplate: true,
          },
        },
        createdByUser: { select: { id: true, name: true } },
        jointResults: { orderBy: { jointNo: "asc" } },
      },
    });
    if (!test) throw new HTTPException(404, { message: "Radiography test not found", cause: "RADIOGRAPHY_NOT_FOUND" });
    const attachments = await FileRepository.getFileRecordsByTargetId(id, "RADIOGRAPHY_TEST");
    return responseOK(c, "Print data retrieved successfully", { test, attachments });
  }
}
