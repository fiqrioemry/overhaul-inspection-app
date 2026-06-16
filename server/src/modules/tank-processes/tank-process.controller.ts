import { Context } from "hono";
import { responseOK } from "@/utils/response";
import { EligibilityService } from "@/services/eligibility.service";
import { ChecklistResultService } from "@/modules/checklist-results/checklist-result.service";
import { TankProcessService } from "./tank-process.service";
import { updateProcessStatusRequest } from "./tank-process.schema";
import { tankProcessSuccessMessage } from "@/config/constant/tank-process.constant";

export class TankProcessController {
  static async getProcessById(c: Context) {
    const id = c.req.param("id");
    const process = await TankProcessService.getProcessById(id);
    return responseOK(c, tankProcessSuccessMessage.GET_PROCESS, process);
  }

  static async updateStatus(c: Context) {
    const id = c.req.param("id");
    const body = await c.req.json();
    const data = updateProcessStatusRequest.parse(body);
    const updated = await TankProcessService.updateStatus(id, data);
    return responseOK(c, tankProcessSuccessMessage.UPDATE_PROCESS_STATUS, updated);
  }

  static async getEligibility(c: Context) {
    const id = c.req.param("id");
    const result = await EligibilityService.checkEligibility(id);
    return responseOK(c, tankProcessSuccessMessage.GET_ELIGIBILITY, result);
  }

  static async getChecklist(c: Context) {
    const id = c.req.param("id");
    const items = await ChecklistResultService.getChecklistByProcess(id);
    return responseOK(c, tankProcessSuccessMessage.GET_CHECKLIST, items);
  }
}
