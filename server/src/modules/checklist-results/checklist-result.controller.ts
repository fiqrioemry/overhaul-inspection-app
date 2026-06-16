import { Context } from "hono";
import { responseOK } from "@/utils/response";
import { ChecklistResultService } from "./checklist-result.service";
import { checkChecklistRequest, bulkCheckRequest, addCustomChecklistRequest } from "./checklist-result.schema";
import { checklistResultSuccessMessage } from "@/config/constant/checklist-result.constant";

export class ChecklistResultController {
  static async checkOne(c: Context) {
    const tankProcessId = c.req.param("id");
    const checklistId = c.req.param("checklistId");
    const body = await c.req.json();
    const data = checkChecklistRequest.parse(body);
    const user = c.get("user");
    const result = await ChecklistResultService.checkOne(tankProcessId, checklistId, data, user.id);
    return responseOK(c, checklistResultSuccessMessage.CHECK_CHECKLIST, result);
  }

  static async bulkCheck(c: Context) {
    const tankProcessId = c.req.param("id");
    const body = await c.req.json();
    const data = bulkCheckRequest.parse(body);
    const user = c.get("user");
    const results = await ChecklistResultService.bulkCheck(tankProcessId, data, user.id);
    return responseOK(c, checklistResultSuccessMessage.BULK_CHECK, results);
  }

  static async resetOne(c: Context) {
    const tankProcessId = c.req.param("id");
    const checklistId = c.req.param("checklistId");
    const result = await ChecklistResultService.resetOne(tankProcessId, checklistId);
    return responseOK(c, checklistResultSuccessMessage.RESET_CHECKLIST, result);
  }

  static async addCustom(c: Context) {
    const tankProcessId = c.req.param("id");
    const body = await c.req.json();
    const data = addCustomChecklistRequest.parse(body);
    const result = await ChecklistResultService.addCustom(tankProcessId, data);
    return responseOK(c, checklistResultSuccessMessage.ADD_CUSTOM, result);
  }
}
