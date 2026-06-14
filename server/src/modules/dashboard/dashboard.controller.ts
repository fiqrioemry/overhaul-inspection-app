import { Context } from "hono";
import { responseOK } from "@/utils/response";
import { DashboardService } from "./dashboard.service";

export class DashboardController {
  static async getSummary(c: Context) {
    const data = await DashboardService.getSummary();
    return responseOK(c, "Dashboard summary retrieved successfully", data);
  }

  static async getTankProgress(c: Context) {
    const data = await DashboardService.getTankProgress();
    return responseOK(c, "Tank progress retrieved successfully", data);
  }

  static async getFindings(c: Context) {
    const data = await DashboardService.getFindingSummary();
    return responseOK(c, "Finding summary retrieved successfully", data);
  }

  static async getTests(c: Context) {
    const data = await DashboardService.getTestSummary();
    return responseOK(c, "Test summary retrieved successfully", data);
  }
}
