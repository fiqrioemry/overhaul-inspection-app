import { HTTPException } from "hono/http-exception";
import { MasterDataStatus } from "generated/prisma";
import { AcceptanceCriteriaRepository } from "@/modules/acceptance-criteria/acceptance-criteria.repository";
import { ReferenceDocumentRepository } from "@/modules/reference-documents/reference-document.repository";
import { AddCriteriaReferenceRequest, CreateAcceptanceCriteriaRequest, ListAcceptanceCriteriaQuery, UpdateAcceptanceCriteriaRequest } from "@/modules/acceptance-criteria/acceptance-criteria.schema";
import type { AcceptanceCriteriaItem, AcceptanceCriteriaListResult } from "./acceptance-criteria.types";

export class AcceptanceCriteriaService {
  static async createCriteria(request: CreateAcceptanceCriteriaRequest) {
    const existing = await AcceptanceCriteriaRepository.findByCode(request.code);
    if (existing) {
      throw new HTTPException(409, { message: "Acceptance criteria with this code already exists", cause: "CRITERIA_CODE_EXISTS" });
    }
    return AcceptanceCriteriaRepository.create(request);
  }

  static async listCriteria(query: ListAcceptanceCriteriaQuery): Promise<AcceptanceCriteriaListResult> {
    const { criteria, total } = await AcceptanceCriteriaRepository.findMany(query);
    const totalPages = total > 0 ? Math.ceil(total / query.limit) : 0;

    const data: AcceptanceCriteriaItem[] = criteria.map((c) => ({
      id: c.id,
      code: c.code,
      name: c.name,
      description: c.description,
      acceptanceType: c.acceptanceType,
      operator: c.operator,
      minValue: c.minValue,
      maxValue: c.maxValue,
      unit: c.unit,
      acceptanceText: c.acceptanceText,
      method: c.method,
      tools: c.tools,
      isRequired: c.isRequired,
      severity: c.severity,
      status: c.status,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));

    return {
      data,
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages,
        hasNextPage: query.page < totalPages,
        hasPreviousPage: query.page > 1,
      },
    };
  }

  static async getCriteriaById(id: string) {
    const criteria = await AcceptanceCriteriaRepository.findById(id);
    if (!criteria) {
      throw new HTTPException(404, { message: "Acceptance criteria not found", cause: "CRITERIA_NOT_FOUND" });
    }
    return criteria;
  }

  static async updateCriteria(id: string, request: UpdateAcceptanceCriteriaRequest) {
    const criteria = await AcceptanceCriteriaRepository.findById(id);
    if (!criteria) {
      throw new HTTPException(404, { message: "Acceptance criteria not found", cause: "CRITERIA_NOT_FOUND" });
    }
    if (request.code && request.code !== criteria.code) {
      const existing = await AcceptanceCriteriaRepository.findByCode(request.code);
      if (existing) {
        throw new HTTPException(409, { message: "Acceptance criteria with this code already exists", cause: "CRITERIA_CODE_EXISTS" });
      }
    }
    // Prevent activating criteria without reference documents
    if (request.status === MasterDataStatus.ACTIVE) {
      const refCount = await AcceptanceCriteriaRepository.countReferences(id);
      if (refCount === 0) {
        throw new HTTPException(422, { message: "Cannot activate criteria without at least one reference document", cause: "CRITERIA_NO_REFERENCE" });
      }
    }
    return AcceptanceCriteriaRepository.update(id, request);
  }

  static async deleteCriteria(id: string) {
    const criteria = await AcceptanceCriteriaRepository.findById(id);
    if (!criteria) {
      throw new HTTPException(404, { message: "Acceptance criteria not found", cause: "CRITERIA_NOT_FOUND" });
    }
    const usage = await AcceptanceCriteriaRepository.countProcessUsage(id);
    if (usage > 0) {
      throw new HTTPException(409, { message: "Cannot delete criteria that is used in process templates", cause: "CRITERIA_IN_USE" });
    }
    await AcceptanceCriteriaRepository.softDelete(id);
  }

  // Reference management
  static async addReference(criteriaId: string, request: AddCriteriaReferenceRequest) {
    const criteria = await AcceptanceCriteriaRepository.findById(criteriaId);
    if (!criteria) {
      throw new HTTPException(404, { message: "Acceptance criteria not found", cause: "CRITERIA_NOT_FOUND" });
    }
    const refDoc = await ReferenceDocumentRepository.findById(request.referenceDocumentId);
    if (!refDoc) {
      throw new HTTPException(404, { message: "Reference document not found", cause: "REF_DOC_NOT_FOUND" });
    }
    const existing = await AcceptanceCriteriaRepository.findReferenceByUnique(criteriaId, request.referenceDocumentId);
    if (existing) {
      throw new HTTPException(409, { message: "This reference document is already linked to this criteria", cause: "CRITERIA_REF_EXISTS" });
    }
    return AcceptanceCriteriaRepository.addReference(criteriaId, request);
  }

  static async listReferences(criteriaId: string) {
    const criteria = await AcceptanceCriteriaRepository.findById(criteriaId);
    if (!criteria) {
      throw new HTTPException(404, { message: "Acceptance criteria not found", cause: "CRITERIA_NOT_FOUND" });
    }
    return AcceptanceCriteriaRepository.listReferences(criteriaId);
  }

  static async removeReference(criteriaId: string, referenceId: string) {
    const ref = await AcceptanceCriteriaRepository.findReferenceById(referenceId);
    if (!ref || ref.criteriaId !== criteriaId) {
      throw new HTTPException(404, { message: "Criteria reference not found", cause: "CRITERIA_REF_NOT_FOUND" });
    }
    await AcceptanceCriteriaRepository.deleteReference(referenceId);
  }
}
