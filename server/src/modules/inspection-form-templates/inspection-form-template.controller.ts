import { Context } from "hono";
import { responseOK } from "@/utils/response";
import { InspectionFormTemplateService } from "./inspection-form-template.service";
import { listFormTemplatesQuery, formTemplateTestTypeParam } from "./inspection-form-template.schema";
import { inspectionFormTemplateSuccessMessage } from "@/config/constant/inspection-form-template.constant";

export class InspectionFormTemplateController {
  static async listTemplates(c: Context) {
    const query = listFormTemplatesQuery.parse(c.req.query());
    const templates = await InspectionFormTemplateService.listTemplates(query);
    return responseOK(c, inspectionFormTemplateSuccessMessage.GET_TEMPLATES, templates);
  }

  static async getTemplateById(c: Context) {
    const id = c.req.param("id");
    const template = await InspectionFormTemplateService.getTemplateById(id);
    return responseOK(c, inspectionFormTemplateSuccessMessage.GET_TEMPLATE, template);
  }

  static async getActiveByTestType(c: Context) {
    const { testType } = formTemplateTestTypeParam.parse({ testType: c.req.param("testType") });
    const template = await InspectionFormTemplateService.getActiveByTestType(testType);
    return responseOK(c, inspectionFormTemplateSuccessMessage.GET_TEMPLATE, template);
  }
}
