import { Context } from "hono";
import { responseOK } from "@/utils/response";
import { EligibilityService } from "@/services/eligibility.service";
import { ChecklistResultService } from "@/modules/checklist-results/checklist-result.service";
import { TankProcessService } from "./tank-process.service";
import { updateProcessStatusRequest, updateProcessResultRequest } from "./tank-process.schema";

export class TankProcessController {
  static async getProcessById(c: Context) {
    const id = c.req.param("id");
    const process = await TankProcessService.getProcessById(id);
    return responseOK(c, "Process retrieved successfully", process);
  }

  static async updateStatus(c: Context) {
    const id = c.req.param("id");
    const body = await c.req.json();
    const data = updateProcessStatusRequest.parse(body);
    const updated = await TankProcessService.updateStatus(id, data);
    return responseOK(c, "Process status updated successfully", updated);
  }

  static async updateResult(c: Context) {
    const id = c.req.param("id");
    const body = await c.req.json();
    const data = updateProcessResultRequest.parse(body);
    const updated = await TankProcessService.updateResult(id, data);
    return responseOK(c, "Process result updated successfully", updated);
  }

  static async getEligibility(c: Context) {
    const id = c.req.param("id");
    const result = await EligibilityService.checkEligibility(id);
    return responseOK(c, "Eligibility checked successfully", result);
  }

  static async getChecklist(c: Context) {
    const id = c.req.param("id");
    const items = await ChecklistResultService.getChecklistByProcess(id);
    return responseOK(c, "Checklist retrieved successfully", items);
  }
}
