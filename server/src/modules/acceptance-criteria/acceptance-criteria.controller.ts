import { Context } from "hono";
import { responseCreated, responseOK } from "@/utils/response";
import { AcceptanceCriteriaService } from "@/modules/acceptance-criteria/acceptance-criteria.service";
import { addCriteriaReferenceRequest, createAcceptanceCriteriaRequest, listAcceptanceCriteriaQuery, updateAcceptanceCriteriaRequest } from "@/modules/acceptance-criteria/acceptance-criteria.schema";
import { acceptanceCriteriaSuccessMessage } from "@/config/constant/acceptance-criteria.constant";

export class AcceptanceCriteriaController {
  static async createCriteria(c: Context) {
    const request = createAcceptanceCriteriaRequest.parse(await c.req.json());
    const criteria = await AcceptanceCriteriaService.createCriteria(request);
    return responseCreated(c, acceptanceCriteriaSuccessMessage.CREATE_CRITERIA, criteria);
  }

  static async listCriteria(c: Context) {
    const query = listAcceptanceCriteriaQuery.parse(c.req.query());
    const result = await AcceptanceCriteriaService.listCriteria(query);
    return responseOK(c, acceptanceCriteriaSuccessMessage.GET_CRITERIA_LIST, result.data, result.meta);
  }

  static async getCriteriaById(c: Context) {
    const id = c.req.param("id");
    const criteria = await AcceptanceCriteriaService.getCriteriaById(id);
    return responseOK(c, acceptanceCriteriaSuccessMessage.GET_CRITERIA, criteria);
  }

  static async updateCriteria(c: Context) {
    const id = c.req.param("id");
    const request = updateAcceptanceCriteriaRequest.parse(await c.req.json());
    const criteria = await AcceptanceCriteriaService.updateCriteria(id, request);
    return responseOK(c, acceptanceCriteriaSuccessMessage.UPDATE_CRITERIA, criteria);
  }

  static async deleteCriteria(c: Context) {
    const id = c.req.param("id");
    await AcceptanceCriteriaService.deleteCriteria(id);
    return responseOK(c, acceptanceCriteriaSuccessMessage.DELETE_CRITERIA);
  }

  static async addReference(c: Context) {
    const criteriaId = c.req.param("id");
    const request = addCriteriaReferenceRequest.parse(await c.req.json());
    const ref = await AcceptanceCriteriaService.addReference(criteriaId, request);
    return responseCreated(c, acceptanceCriteriaSuccessMessage.ADD_REFERENCE, ref);
  }

  static async listReferences(c: Context) {
    const criteriaId = c.req.param("id");
    const refs = await AcceptanceCriteriaService.listReferences(criteriaId);
    return responseOK(c, acceptanceCriteriaSuccessMessage.GET_REFERENCES, refs);
  }

  static async removeReference(c: Context) {
    const criteriaId = c.req.param("id");
    const referenceId = c.req.param("referenceId");
    await AcceptanceCriteriaService.removeReference(criteriaId, referenceId);
    return responseOK(c, acceptanceCriteriaSuccessMessage.REMOVE_REFERENCE);
  }
}
