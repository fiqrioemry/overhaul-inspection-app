import { Context } from "hono";
import { responseOK } from "@/utils/response";
import { ChecklistResultService } from "./checklist-result.service";
import { updateChecklistResultRequest } from "./checklist-result.schema";

export class ChecklistResultController {
  static async updateChecklistResult(c: Context) {
    const id = c.req.param("id");
    const body = await c.req.json();
    const data = updateChecklistResultRequest.parse(body);
    const user = c.get("user");
    const result = await ChecklistResultService.updateChecklistResult(id, data, user.id);
    return responseOK(c, "Checklist result updated successfully", result);
  }
}
