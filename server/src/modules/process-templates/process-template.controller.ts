import { Context } from "hono";
import { responseCreated, responseOK } from "@/utils/response";
import { ProcessTemplateService } from "@/modules/process-templates/process-template.service";
import {
  addProcessCriteriaRequest,
  addProcessDependencyRequest,
  createProcessTemplateRequest,
  listProcessTemplatesQuery,
  updateProcessCriteriaRequest,
  updateProcessDependencyRequest,
  updateProcessTemplateRequest,
} from "@/modules/process-templates/process-template.schema";
import { processTemplateSuccessMessage } from "@/config/constant/process-template.constant";

export class ProcessTemplateController {
  static async createTemplate(c: Context) {
    const request = createProcessTemplateRequest.parse(await c.req.json());
    const template = await ProcessTemplateService.createTemplate(request);
    return responseCreated(c, processTemplateSuccessMessage.CREATE_TEMPLATE, template);
  }

  static async listTemplates(c: Context) {
    const query = listProcessTemplatesQuery.parse(c.req.query());
    const result = await ProcessTemplateService.listTemplates(query);
    return responseOK(c, processTemplateSuccessMessage.GET_TEMPLATES, result.data, result.meta);
  }

  static async getTemplateById(c: Context) {
    const id = c.req.param("id");
    const template = await ProcessTemplateService.getTemplateById(id);
    return responseOK(c, processTemplateSuccessMessage.GET_TEMPLATE, template);
  }

  static async updateTemplate(c: Context) {
    const id = c.req.param("id");
    const request = updateProcessTemplateRequest.parse(await c.req.json());
    const template = await ProcessTemplateService.updateTemplate(id, request);
    return responseOK(c, processTemplateSuccessMessage.UPDATE_TEMPLATE, template);
  }

  static async deleteTemplate(c: Context) {
    const id = c.req.param("id");
    await ProcessTemplateService.deleteTemplate(id);
    return responseOK(c, processTemplateSuccessMessage.DELETE_TEMPLATE);
  }

  // Criteria
  static async addCriteria(c: Context) {
    const processTemplateId = c.req.param("id");
    const request = addProcessCriteriaRequest.parse(await c.req.json());
    const mapping = await ProcessTemplateService.addCriteria(processTemplateId, request);
    return responseCreated(c, processTemplateSuccessMessage.ADD_CRITERIA, mapping);
  }

  static async listCriteria(c: Context) {
    const processTemplateId = c.req.param("id");
    const criteria = await ProcessTemplateService.listCriteria(processTemplateId);
    return responseOK(c, processTemplateSuccessMessage.GET_CRITERIA, criteria);
  }

  // Dependencies
  static async addDependency(c: Context) {
    const processTemplateId = c.req.param("id");
    const request = addProcessDependencyRequest.parse(await c.req.json());
    const dep = await ProcessTemplateService.addDependency(processTemplateId, request);
    return responseCreated(c, processTemplateSuccessMessage.ADD_DEPENDENCY, dep);
  }

  static async listDependencies(c: Context) {
    const processTemplateId = c.req.param("id");
    const deps = await ProcessTemplateService.listDependencies(processTemplateId);
    return responseOK(c, processTemplateSuccessMessage.GET_DEPENDENCIES, deps);
  }

  // Flat update/delete for process criteria mappings
  static async updateCriteriaMapping(c: Context) {
    const id = c.req.param("id");
    const request = updateProcessCriteriaRequest.parse(await c.req.json());
    const mapping = await ProcessTemplateService.updateCriteriaMapping(id, request);
    return responseOK(c, processTemplateSuccessMessage.UPDATE_CRITERIA_MAPPING, mapping);
  }

  static async removeCriteriaMapping(c: Context) {
    const id = c.req.param("id");
    await ProcessTemplateService.removeCriteriaMapping(id);
    return responseOK(c, processTemplateSuccessMessage.REMOVE_CRITERIA_MAPPING);
  }

  // Flat update/delete for dependencies
  static async updateDependency(c: Context) {
    const id = c.req.param("id");
    const request = updateProcessDependencyRequest.parse(await c.req.json());
    const dep = await ProcessTemplateService.updateDependency(id, request);
    return responseOK(c, processTemplateSuccessMessage.UPDATE_DEPENDENCY, dep);
  }

  static async removeDependency(c: Context) {
    const id = c.req.param("id");
    await ProcessTemplateService.removeDependency(id);
    return responseOK(c, processTemplateSuccessMessage.REMOVE_DEPENDENCY);
  }
}
