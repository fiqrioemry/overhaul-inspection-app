import { HTTPException } from "hono/http-exception";
import { ProcessTemplateRepository } from "@/modules/process-templates/process-template.repository";
import { AcceptanceCriteriaRepository } from "@/modules/acceptance-criteria/acceptance-criteria.repository";
import {
  AddProcessCriteriaRequest,
  AddProcessDependencyRequest,
  CreateProcessTemplateRequest,
  ListProcessTemplatesQuery,
  UpdateProcessCriteriaRequest,
  UpdateProcessDependencyRequest,
  UpdateProcessTemplateRequest,
} from "@/modules/process-templates/process-template.schema";

export class ProcessTemplateService {
  static async createTemplate(request: CreateProcessTemplateRequest) {
    const existing = await ProcessTemplateRepository.findByCode(request.code);
    if (existing) {
      throw new HTTPException(409, { message: "Process template with this code already exists", cause: "PROCESS_CODE_EXISTS" });
    }
    return ProcessTemplateRepository.create(request);
  }

  static async listTemplates(query: ListProcessTemplatesQuery) {
    const { templates, total } = await ProcessTemplateRepository.findMany(query);
    return {
      data: templates,
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  static async getTemplateById(id: string) {
    const template = await ProcessTemplateRepository.findById(id);
    if (!template) {
      throw new HTTPException(404, { message: "Process template not found", cause: "PROCESS_TEMPLATE_NOT_FOUND" });
    }
    return template;
  }

  static async updateTemplate(id: string, request: UpdateProcessTemplateRequest) {
    const template = await ProcessTemplateRepository.findById(id);
    if (!template) {
      throw new HTTPException(404, { message: "Process template not found", cause: "PROCESS_TEMPLATE_NOT_FOUND" });
    }
    if (request.code && request.code !== template.code) {
      const existing = await ProcessTemplateRepository.findByCode(request.code);
      if (existing) {
        throw new HTTPException(409, { message: "Process template with this code already exists", cause: "PROCESS_CODE_EXISTS" });
      }
    }
    return ProcessTemplateRepository.update(id, request);
  }

  static async deleteTemplate(id: string) {
    const template = await ProcessTemplateRepository.findById(id);
    if (!template) {
      throw new HTTPException(404, { message: "Process template not found", cause: "PROCESS_TEMPLATE_NOT_FOUND" });
    }
    await ProcessTemplateRepository.softDelete(id);
  }

  // Process criteria management
  static async addCriteria(processTemplateId: string, request: AddProcessCriteriaRequest) {
    const template = await ProcessTemplateRepository.findById(processTemplateId);
    if (!template) {
      throw new HTTPException(404, { message: "Process template not found", cause: "PROCESS_TEMPLATE_NOT_FOUND" });
    }
    const criteria = await AcceptanceCriteriaRepository.findById(request.criteriaId);
    if (!criteria) {
      throw new HTTPException(404, { message: "Acceptance criteria not found", cause: "CRITERIA_NOT_FOUND" });
    }
    const existing = await ProcessTemplateRepository.findCriteriaMapping(processTemplateId, request.criteriaId);
    if (existing) {
      throw new HTTPException(409, { message: "This criteria is already mapped to the process template", cause: "CRITERIA_MAPPING_EXISTS" });
    }
    return ProcessTemplateRepository.addCriteria(processTemplateId, request);
  }

  static async listCriteria(processTemplateId: string) {
    const template = await ProcessTemplateRepository.findById(processTemplateId);
    if (!template) {
      throw new HTTPException(404, { message: "Process template not found", cause: "PROCESS_TEMPLATE_NOT_FOUND" });
    }
    return ProcessTemplateRepository.listCriteria(processTemplateId);
  }

  static async updateCriteriaMapping(id: string, request: UpdateProcessCriteriaRequest) {
    const mapping = await ProcessTemplateRepository.findCriteriaMappingById(id);
    if (!mapping) {
      throw new HTTPException(404, { message: "Process criteria mapping not found", cause: "CRITERIA_MAPPING_NOT_FOUND" });
    }
    return ProcessTemplateRepository.updateCriteriaMapping(id, request);
  }

  static async removeCriteriaMapping(id: string) {
    const mapping = await ProcessTemplateRepository.findCriteriaMappingById(id);
    if (!mapping) {
      throw new HTTPException(404, { message: "Process criteria mapping not found", cause: "CRITERIA_MAPPING_NOT_FOUND" });
    }
    await ProcessTemplateRepository.deleteCriteriaMapping(id);
  }

  // Process dependency management
  static async addDependency(processTemplateId: string, request: AddProcessDependencyRequest) {
    const template = await ProcessTemplateRepository.findById(processTemplateId);
    if (!template) {
      throw new HTTPException(404, { message: "Process template not found", cause: "PROCESS_TEMPLATE_NOT_FOUND" });
    }
    if (processTemplateId === request.requiredProcessTemplateId) {
      throw new HTTPException(422, { message: "A process template cannot depend on itself", cause: "SELF_DEPENDENCY" });
    }
    const requiredTemplate = await ProcessTemplateRepository.findById(request.requiredProcessTemplateId);
    if (!requiredTemplate) {
      throw new HTTPException(404, { message: "Required process template not found", cause: "PROCESS_TEMPLATE_NOT_FOUND" });
    }
    const existing = await ProcessTemplateRepository.findDependency(processTemplateId, request.requiredProcessTemplateId);
    if (existing) {
      throw new HTTPException(409, { message: "This dependency already exists", cause: "DEPENDENCY_EXISTS" });
    }
    return ProcessTemplateRepository.addDependency(processTemplateId, request);
  }

  static async listDependencies(processTemplateId: string) {
    const template = await ProcessTemplateRepository.findById(processTemplateId);
    if (!template) {
      throw new HTTPException(404, { message: "Process template not found", cause: "PROCESS_TEMPLATE_NOT_FOUND" });
    }
    return ProcessTemplateRepository.listDependencies(processTemplateId);
  }

  static async updateDependency(id: string, request: UpdateProcessDependencyRequest) {
    const dep = await ProcessTemplateRepository.findDependencyById(id);
    if (!dep) {
      throw new HTTPException(404, { message: "Process dependency not found", cause: "DEPENDENCY_NOT_FOUND" });
    }
    return ProcessTemplateRepository.updateDependency(id, request);
  }

  static async removeDependency(id: string) {
    const dep = await ProcessTemplateRepository.findDependencyById(id);
    if (!dep) {
      throw new HTTPException(404, { message: "Process dependency not found", cause: "DEPENDENCY_NOT_FOUND" });
    }
    await ProcessTemplateRepository.deleteDependency(id);
  }
}
