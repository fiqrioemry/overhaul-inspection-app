import { Context } from "hono";
import { responseOK, responseCreated } from "@/utils/response";
import { TestRecordService } from "./test-record.service";
import { createTestRecordRequest, completeTestRecordRequest, updateTestRecordRequest } from "./test-record.schema";

export class TestRecordController {
  static async createRecord(c: Context) {
    const tankProcessId = c.req.param("tankProcessId");
    const body = await c.req.json();
    const data = createTestRecordRequest.parse(body);
    const user = c.get("user");
    const record = await TestRecordService.createRecord(tankProcessId, data, user.id);
    return responseCreated(c, "Test record created successfully", record);
  }

  static async listByTankProcess(c: Context) {
    const tankProcessId = c.req.param("tankProcessId");
    const records = await TestRecordService.listByTankProcess(tankProcessId);
    return responseOK(c, "Test records retrieved successfully", records);
  }

  static async getById(c: Context) {
    const id = c.req.param("id");
    const record = await TestRecordService.getById(id);
    return responseOK(c, "Test record retrieved successfully", record);
  }

  static async updateRecord(c: Context) {
    const id = c.req.param("id");
    const body = await c.req.json();
    const data = updateTestRecordRequest.parse(body);
    const record = await TestRecordService.updateRecord(id, data);
    return responseOK(c, "Test record updated successfully", record);
  }

  static async completeRecord(c: Context) {
    const id = c.req.param("id");
    const body = await c.req.json();
    const data = completeTestRecordRequest.parse(body);
    const user = c.get("user");
    const record = await TestRecordService.completeRecord(id, data, user.id);
    return responseOK(c, "Test record completed successfully", record);
  }

  static async deleteRecord(c: Context) {
    const id = c.req.param("id");
    await TestRecordService.deleteRecord(id);
    return responseOK(c, "Test record deleted successfully", null);
  }
}
