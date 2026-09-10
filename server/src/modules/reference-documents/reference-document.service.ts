import { HTTPException } from "hono/http-exception";
import { ReferenceDocumentRepository } from "@/modules/reference-documents/reference-document.repository";
import { CreateReferenceDocumentRequest, ListReferenceDocumentsQuery, UpdateReferenceDocumentRequest } from "@/modules/reference-documents/reference-document.schema";
import type { ReferenceDocumentItem, ReferenceDocumentListResult } from "./reference-document.types";

export class ReferenceDocumentService {
  static async createDocument(request: CreateReferenceDocumentRequest) {
    const existing = await ReferenceDocumentRepository.findByCode(request.code);
    if (existing) {
      throw new HTTPException(409, { message: "Reference document with this code already exists", cause: "REF_DOC_CODE_EXISTS" });
    }
    return ReferenceDocumentRepository.create(request);
  }

  static async listDocuments(query: ListReferenceDocumentsQuery): Promise<ReferenceDocumentListResult> {
    const { documents, total } = await ReferenceDocumentRepository.findMany(query);
    const totalPages = total > 0 ? Math.ceil(total / query.limit) : 0;

    const data: ReferenceDocumentItem[] = documents.map((d) => ({
      id: d.id,
      code: d.code,
      title: d.title,
      documentType: d.documentType,
      revision: d.revision,
      issuer: d.issuer,
      fileUrl: d.fileUrl,
      status: d.status,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
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

  static async getDocumentById(id: string) {
    const doc = await ReferenceDocumentRepository.findById(id);
    if (!doc) {
      throw new HTTPException(404, { message: "Reference document not found", cause: "REF_DOC_NOT_FOUND" });
    }
    return doc;
  }

  static async updateDocument(id: string, request: UpdateReferenceDocumentRequest) {
    const doc = await ReferenceDocumentRepository.findById(id);
    if (!doc) {
      throw new HTTPException(404, { message: "Reference document not found", cause: "REF_DOC_NOT_FOUND" });
    }
    if (request.code && request.code !== doc.code) {
      const existing = await ReferenceDocumentRepository.findByCode(request.code);
      if (existing) {
        throw new HTTPException(409, { message: "Reference document with this code already exists", cause: "REF_DOC_CODE_EXISTS" });
      }
    }
    return ReferenceDocumentRepository.update(id, request);
  }

  static async deleteDocument(id: string) {
    const doc = await ReferenceDocumentRepository.findById(id);
    if (!doc) {
      throw new HTTPException(404, { message: "Reference document not found", cause: "REF_DOC_NOT_FOUND" });
    }
    const usageCount = await ReferenceDocumentRepository.countCriteriaUsing(id);
    if (usageCount > 0) {
      throw new HTTPException(409, { message: "Cannot delete document that is referenced by acceptance criteria", cause: "REF_DOC_IN_USE" });
    }
    await ReferenceDocumentRepository.softDelete(id);
  }
}
