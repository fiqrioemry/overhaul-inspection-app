import { Context } from "hono";
import { responseOK } from "@/utils/response";
import { AdminService } from "@/modules/admin/admin.service";
import { adminSuccessMessage } from "@/config/constant/admin.constant";
import { getAdminUsersQuery, getReportsQuery, updateReportRequest, updateUserStatusRequest } from "@/modules/admin/admin.schema";

export class AdminController {
  static async getReports(c: Context) {
    const query = getReportsQuery.parse(c.req.query());
    const response = await AdminService.getReports(query);
    return responseOK(c, adminSuccessMessage.GET_REPORTS_SUCCESS, response.data, response.meta);
  }

  static async updateReport(c: Context) {
    const user = c.get("user");
    const reportId = c.req.param("reportId");
    const payload = updateReportRequest.parse(await c.req.json());
    const result = await AdminService.updateReport(reportId, user.userId, payload);
    return responseOK(c, adminSuccessMessage.UPDATE_REPORT_SUCCESS, result);
  }

  static async getUsers(c: Context) {
    const query = getAdminUsersQuery.parse(c.req.query());
    const response = await AdminService.getUsers(query);
    return responseOK(c, adminSuccessMessage.GET_USERS_SUCCESS, response.data, response.meta);
  }

  static async updateUserStatus(c: Context) {
    const user = c.get("user");
    const targetUserId = c.req.param("userId");
    const payload = updateUserStatusRequest.parse(await c.req.json());
    const result = await AdminService.updateUserStatus(user.userId, targetUserId, payload);
    return responseOK(c, adminSuccessMessage.UPDATE_USER_STATUS_SUCCESS, result);
  }

  static async getStats(c: Context) {
    const response = await AdminService.getStats();
    return responseOK(c, adminSuccessMessage.GET_STATS_SUCCESS, response);
  }
}
