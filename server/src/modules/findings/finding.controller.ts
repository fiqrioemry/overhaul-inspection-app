import { Context } from "hono";
import { responseOK, responseCreated } from "@/utils/response";
import { FindingService } from "./finding.service";
import { createFindingRequest, listFindingsQuery, updateFindingRequest, updateFindingStatusRequest } from "./finding.schema";

export class FindingController {
  static async createFinding(c: Context) {
    const body = await c.req.json();
    const data = createFindingRequest.parse(body);
    const user = c.get("user");
    const finding = await FindingService.createFinding(data, user.id);
    return responseCreated(c, "Finding created successfully", finding);
  }

  static async listFindings(c: Context) {
    const query = listFindingsQuery.parse(c.req.query());
    const result = await FindingService.listFindings(query);
    return responseOK(c, "Findings retrieved successfully", result);
  }

  static async getFindingById(c: Context) {
    const id = c.req.param("id");
    const finding = await FindingService.getFindingById(id);
    return responseOK(c, "Finding retrieved successfully", finding);
  }

  static async updateFinding(c: Context) {
    const id = c.req.param("id");
    const body = await c.req.json();
    const data = updateFindingRequest.parse(body);
    const finding = await FindingService.updateFinding(id, data);
    return responseOK(c, "Finding updated successfully", finding);
  }

  static async updateFindingStatus(c: Context) {
    const id = c.req.param("id");
    const body = await c.req.json();
    const data = updateFindingStatusRequest.parse(body);
    const user = c.get("user");
    const finding = await FindingService.updateFindingStatus(id, data, user.id);
    return responseOK(c, "Finding status updated successfully", finding);
  }

  static async deleteFinding(c: Context) {
    const id = c.req.param("id");
    await FindingService.deleteFinding(id);
    return responseOK(c, "Finding deleted successfully", null);
  }
}
