import { HTTPException } from "hono/http-exception";
import { ChecklistResultRepository } from "./checklist-result.repository";
import { UpdateChecklistResultRequest } from "./checklist-result.schema";

export class ChecklistResultService {
  static async getChecklistByProcess(tankProcessId: string) {
    return ChecklistResultRepository.findByTankProcess(tankProcessId);
  }

  static async updateChecklistResult(id: string, data: UpdateChecklistResultRequest, userId: string) {
    const existing = await ChecklistResultRepository.findById(id);
    if (!existing) {
      throw new HTTPException(404, { message: "Checklist result not found", cause: "CHECKLIST_NOT_FOUND" });
    }

    return ChecklistResultRepository.update(id, {
      status: data.status,
      actualValue: data.actualValue,
      actualText: data.actualText,
      remarks: data.remarks,
      checkedByUser: userId ? { connect: { id: userId } } : undefined,
      checkedAt: new Date(),
    });
  }
}
