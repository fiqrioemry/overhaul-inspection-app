import { Context } from "hono";
import { responseCreated, responseOK } from "@/utils/response";
import { ReferenceDocumentService } from "@/modules/reference-documents/reference-document.service";
import { createReferenceDocumentRequest, updateReferenceDocumentRequest, listReferenceDocumentsQuery } from "@/modules/reference-documents/reference-document.schema";

export class ReferenceDocumentController {
  static async createDocument(c: Context) {
    const request = createReferenceDocumentRequest.parse(await c.req.json());
    const doc = await ReferenceDocumentService.createDocument(request);
    return responseCreated(c, "Reference document created successfully", doc);
  }

  static async listDocuments(c: Context) {
    const query = listReferenceDocumentsQuery.parse(c.req.query());
    const result = await ReferenceDocumentService.listDocuments(query);
    return responseOK(c, "Reference documents retrieved successfully", result.data, result.meta);
  }

  static async getDocumentById(c: Context) {
    const id = c.req.param("id");
    const doc = await ReferenceDocumentService.getDocumentById(id);
    return responseOK(c, "Reference document retrieved successfully", doc);
  }

  static async updateDocument(c: Context) {
    const id = c.req.param("id");
    const request = updateReferenceDocumentRequest.parse(await c.req.json());
    const doc = await ReferenceDocumentService.updateDocument(id, request);
    return responseOK(c, "Reference document updated successfully", doc);
  }

  static async deleteDocument(c: Context) {
    const id = c.req.param("id");
    await ReferenceDocumentService.deleteDocument(id);
    return responseOK(c, "Reference document deleted successfully");
  }
}
