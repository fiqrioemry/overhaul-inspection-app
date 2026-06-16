import { Context } from "hono";
import { responseOK, responseCreated } from "@/utils/response";
import { InspectionRequestService } from "./inspection-request.service";
import {
  createInspectionRequestRequest,
  listInspectionRequestsQuery,
  reviewInspectionRequestRequest,
} from "./inspection-request.schema";
import { inspectionRequestSuccessMessage } from "@/config/constant/inspection-request.constant";

export class InspectionRequestController {
  static async createRequest(c: Context) {
    const body = await c.req.json();
    const data = createInspectionRequestRequest.parse(body);
    const user = c.get("user");
    const request = await InspectionRequestService.createRequest(data, user.id);
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

  static async cancelRequest(c: Context) {
    const id = c.req.param("id");
    const user = c.get("user");
    await InspectionRequestService.cancelRequest(id, user.id);
    return responseOK(c, inspectionRequestSuccessMessage.CANCEL_REQUEST, null);
  }

  static async reviewRequest(c: Context) {
    const id = c.req.param("id");
    const body = await c.req.json();
    const data = reviewInspectionRequestRequest.parse(body);
    const user = c.get("user");
    const request = await InspectionRequestService.reviewRequest(id, data, user.id);
    return responseOK(c, inspectionRequestSuccessMessage.REVIEW_REQUEST, request);
  }
}
