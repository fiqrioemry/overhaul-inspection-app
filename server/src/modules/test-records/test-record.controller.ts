import { Context } from "hono";
import { responseOK, responseCreated } from "@/utils/response";
import { TestRecordService } from "./test-record.service";
import { createTestRecordRequest, completeTestRecordRequest, updateTestRecordRequest } from "./test-record.schema";
import { testRecordSuccessMessage } from "@/config/constant/test-record.constant";

export class TestRecordController {
  static async createRecord(c: Context) {
    const tankProcessId = c.req.param("tankProcessId");
    const body = await c.req.json();
    const data = createTestRecordRequest.parse(body);
    const user = c.get("user");
    const record = await TestRecordService.createRecord(tankProcessId, data, user.id);
    return responseCreated(c, testRecordSuccessMessage.CREATE_RECORD, record);
  }

  static async listByTankProcess(c: Context) {
    const tankProcessId = c.req.param("tankProcessId");
    const records = await TestRecordService.listByTankProcess(tankProcessId);
    return responseOK(c, testRecordSuccessMessage.GET_RECORDS, records);
  }

  static async getById(c: Context) {
    const id = c.req.param("id");
    const record = await TestRecordService.getById(id);
    return responseOK(c, testRecordSuccessMessage.GET_RECORD, record);
  }

  static async updateRecord(c: Context) {
    const id = c.req.param("id");
    const body = await c.req.json();
    const data = updateTestRecordRequest.parse(body);
    const record = await TestRecordService.updateRecord(id, data);
    return responseOK(c, testRecordSuccessMessage.UPDATE_RECORD, record);
  }

  static async completeRecord(c: Context) {
    const id = c.req.param("id");
    const body = await c.req.json();
    const data = completeTestRecordRequest.parse(body);
    const user = c.get("user");
    const record = await TestRecordService.completeRecord(id, data, user.id);
    return responseOK(c, testRecordSuccessMessage.COMPLETE_RECORD, record);
  }

  static async deleteRecord(c: Context) {
    const id = c.req.param("id");
    await TestRecordService.deleteRecord(id);
    return responseOK(c, testRecordSuccessMessage.DELETE_RECORD, null);
  }
}
