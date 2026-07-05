import { HTTPException } from "hono/http-exception";
import { InspectionRequestTypeEnum } from "generated/prisma";
import { InspectionFormTemplateRepository } from "./inspection-form-template.repository";

export class InspectionFormTemplateService {
  static async listTemplates(params: { testType?: InspectionRequestTypeEnum; isActive?: boolean }) {
    return InspectionFormTemplateRepository.findMany(params);
  }

  static async getTemplateById(id: string) {
    const template = await InspectionFormTemplateRepository.findById(id);
    if (!template) throw new HTTPException(404, { message: "Inspection form template not found", cause: "FORM_TEMPLATE_NOT_FOUND" });
    return template;
  }

  static async getActiveByTestType(testType: InspectionRequestTypeEnum) {
    const template = await InspectionFormTemplateRepository.findActiveByTestType(testType);
    if (!template) throw new HTTPException(404, { message: `No active form template for test type ${testType}`, cause: "FORM_TEMPLATE_NOT_FOUND" });
    return template;
  }
}
