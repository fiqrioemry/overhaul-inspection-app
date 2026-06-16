import { Context } from "hono";
import { responseOK } from "@/utils/response";
import { DashboardService } from "./dashboard.service";
import { dashboardSuccessMessage } from "@/config/constant/dashboard.constant";

export class DashboardController {
  static async getSummary(c: Context) {
    const data = await DashboardService.getSummary();
    return responseOK(c, dashboardSuccessMessage.GET_SUMMARY, data);
  }

  static async getTankProgress(c: Context) {
    const data = await DashboardService.getTankProgress();
    return responseOK(c, dashboardSuccessMessage.GET_TANK_PROGRESS, data);
  }

  static async getFindings(c: Context) {
    const data = await DashboardService.getFindingSummary();
    return responseOK(c, dashboardSuccessMessage.GET_FINDING_SUMMARY, data);
  }

  static async getTests(c: Context) {
    const data = await DashboardService.getTestSummary();
    return responseOK(c, dashboardSuccessMessage.GET_TEST_SUMMARY, data);
  }
}
