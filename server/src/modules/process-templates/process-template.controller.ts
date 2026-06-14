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

export class ProcessTemplateController {
  static async createTemplate(c: Context) {
    const request = createProcessTemplateRequest.parse(await c.req.json());
    const template = await ProcessTemplateService.createTemplate(request);
    return responseCreated(c, "Process template created successfully", template);
  }

  static async listTemplates(c: Context) {
    const query = listProcessTemplatesQuery.parse(c.req.query());
    const result = await ProcessTemplateService.listTemplates(query);
    return responseOK(c, "Process templates retrieved successfully", result.data, result.meta);
  }

  static async getTemplateById(c: Context) {
    const id = c.req.param("id");
    const template = await ProcessTemplateService.getTemplateById(id);
    return responseOK(c, "Process template retrieved successfully", template);
  }

  static async updateTemplate(c: Context) {
    const id = c.req.param("id");
    const request = updateProcessTemplateRequest.parse(await c.req.json());
    const template = await ProcessTemplateService.updateTemplate(id, request);
    return responseOK(c, "Process template updated successfully", template);
  }

  static async deleteTemplate(c: Context) {
    const id = c.req.param("id");
    await ProcessTemplateService.deleteTemplate(id);
    return responseOK(c, "Process template deleted successfully");
  }

  // Criteria
  static async addCriteria(c: Context) {
    const processTemplateId = c.req.param("id");
    const request = addProcessCriteriaRequest.parse(await c.req.json());
    const mapping = await ProcessTemplateService.addCriteria(processTemplateId, request);
    return responseCreated(c, "Criteria mapped to process template successfully", mapping);
  }

  static async listCriteria(c: Context) {
    const processTemplateId = c.req.param("id");
    const criteria = await ProcessTemplateService.listCriteria(processTemplateId);
    return responseOK(c, "Process criteria retrieved successfully", criteria);
  }

  // Dependencies
  static async addDependency(c: Context) {
    const processTemplateId = c.req.param("id");
    const request = addProcessDependencyRequest.parse(await c.req.json());
    const dep = await ProcessTemplateService.addDependency(processTemplateId, request);
    return responseCreated(c, "Process dependency added successfully", dep);
  }

  static async listDependencies(c: Context) {
    const processTemplateId = c.req.param("id");
    const deps = await ProcessTemplateService.listDependencies(processTemplateId);
    return responseOK(c, "Process dependencies retrieved successfully", deps);
  }

  // Flat update/delete for process criteria mappings
  static async updateCriteriaMapping(c: Context) {
    const id = c.req.param("id");
    const request = updateProcessCriteriaRequest.parse(await c.req.json());
    const mapping = await ProcessTemplateService.updateCriteriaMapping(id, request);
    return responseOK(c, "Process criteria mapping updated successfully", mapping);
  }

  static async removeCriteriaMapping(c: Context) {
    const id = c.req.param("id");
    await ProcessTemplateService.removeCriteriaMapping(id);
    return responseOK(c, "Process criteria mapping removed successfully");
  }

  // Flat update/delete for dependencies
  static async updateDependency(c: Context) {
    const id = c.req.param("id");
    const request = updateProcessDependencyRequest.parse(await c.req.json());
    const dep = await ProcessTemplateService.updateDependency(id, request);
    return responseOK(c, "Process dependency updated successfully", dep);
  }

  static async removeDependency(c: Context) {
    const id = c.req.param("id");
    await ProcessTemplateService.removeDependency(id);
    return responseOK(c, "Process dependency removed successfully");
  }
}
