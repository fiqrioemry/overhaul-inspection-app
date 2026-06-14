import { Context } from "hono";
import { responseOK, responseCreated } from "@/utils/response";
import { InspectionRequestService } from "./inspection-request.service";
import {
  createInspectionRequestRequest,
  listInspectionRequestsQuery,
  reviewInspectionRequestRequest,
} from "./inspection-request.schema";

export class InspectionRequestController {
  static async createRequest(c: Context) {
    const body = await c.req.json();
    const data = createInspectionRequestRequest.parse(body);
    const user = c.get("user");
    const request = await InspectionRequestService.createRequest(data, user.id);
    return responseCreated(c, "Inspection request created successfully", request);
  }

  static async listRequests(c: Context) {
    const query = listInspectionRequestsQuery.parse(c.req.query());
    const result = await InspectionRequestService.listRequests(query);
    return responseOK(c, "Inspection requests retrieved successfully", result);
  }

  static async getRequestById(c: Context) {
    const id = c.req.param("id");
    const request = await InspectionRequestService.getRequestById(id);
    return responseOK(c, "Inspection request retrieved successfully", request);
  }

  static async cancelRequest(c: Context) {
    const id = c.req.param("id");
    const user = c.get("user");
    await InspectionRequestService.cancelRequest(id, user.id);
    return responseOK(c, "Inspection request cancelled successfully", null);
  }

  static async reviewRequest(c: Context) {
    const id = c.req.param("id");
    const body = await c.req.json();
    const data = reviewInspectionRequestRequest.parse(body);
    const user = c.get("user");
    const request = await InspectionRequestService.reviewRequest(id, data, user.id);
    return responseOK(c, "Inspection request reviewed successfully", request);
  }
}
