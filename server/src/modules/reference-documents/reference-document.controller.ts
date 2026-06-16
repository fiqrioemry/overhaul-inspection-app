import { Context } from "hono";
import { responseCreated, responseOK } from "@/utils/response";
import { ReferenceDocumentService } from "@/modules/reference-documents/reference-document.service";
import { createReferenceDocumentRequest, updateReferenceDocumentRequest, listReferenceDocumentsQuery } from "@/modules/reference-documents/reference-document.schema";
import { referenceDocumentSuccessMessage } from "@/config/constant/reference-document.constant";

export class ReferenceDocumentController {
  static async createDocument(c: Context) {
    const request = createReferenceDocumentRequest.parse(await c.req.json());
    const doc = await ReferenceDocumentService.createDocument(request);
    return responseCreated(c, referenceDocumentSuccessMessage.CREATE_DOCUMENT, doc);
  }

  static async listDocuments(c: Context) {
    const query = listReferenceDocumentsQuery.parse(c.req.query());
    const result = await ReferenceDocumentService.listDocuments(query);
    return responseOK(c, referenceDocumentSuccessMessage.GET_DOCUMENTS, result.data, result.meta);
  }

  static async getDocumentById(c: Context) {
    const id = c.req.param("id");
    const doc = await ReferenceDocumentService.getDocumentById(id);
    return responseOK(c, referenceDocumentSuccessMessage.GET_DOCUMENT, doc);
  }

  static async updateDocument(c: Context) {
    const id = c.req.param("id");
    const request = updateReferenceDocumentRequest.parse(await c.req.json());
    const doc = await ReferenceDocumentService.updateDocument(id, request);
    return responseOK(c, referenceDocumentSuccessMessage.UPDATE_DOCUMENT, doc);
  }

  static async deleteDocument(c: Context) {
    const id = c.req.param("id");
    await ReferenceDocumentService.deleteDocument(id);
    return responseOK(c, referenceDocumentSuccessMessage.DELETE_DOCUMENT);
  }
}
