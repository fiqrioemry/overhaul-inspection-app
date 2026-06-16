import { Context } from "hono";
import { responseOK, responseCreated } from "@/utils/response";
import { RadiographyService } from "./radiography.service";
import {
  addJointResultRequest,
  createRadiographyRequest,
  updateJointResultRequest,
  updateRadiographyRequest,
} from "./radiography.schema";
import { radiographySuccessMessage } from "@/config/constant/radiography.constant";

export class RadiographyController {
  static async createRadiography(c: Context) {
    const tankProcessId = c.req.param("tankProcessId");
    const body = await c.req.json();
    const data = createRadiographyRequest.parse(body);
    const user = c.get("user");
    const test = await RadiographyService.createRadiography(tankProcessId, data, user.id);
    return responseCreated(c, radiographySuccessMessage.CREATE_RADIOGRAPHY, test);
  }

  static async listByTankProcess(c: Context) {
    const tankProcessId = c.req.param("tankProcessId");
    const tests = await RadiographyService.listByTankProcess(tankProcessId);
    return responseOK(c, radiographySuccessMessage.GET_RADIOGRAPHY_LIST, tests);
  }

  static async getById(c: Context) {
    const id = c.req.param("id");
    const test = await RadiographyService.getById(id);
    return responseOK(c, radiographySuccessMessage.GET_RADIOGRAPHY, test);
  }

  static async updateRadiography(c: Context) {
    const id = c.req.param("id");
    const body = await c.req.json();
    const data = updateRadiographyRequest.parse(body);
    const test = await RadiographyService.updateRadiography(id, data);
    return responseOK(c, radiographySuccessMessage.UPDATE_RADIOGRAPHY, test);
  }

  static async deleteRadiography(c: Context) {
    const id = c.req.param("id");
    await RadiographyService.deleteRadiography(id);
    return responseOK(c, radiographySuccessMessage.DELETE_RADIOGRAPHY, null);
  }

  static async addJoint(c: Context) {
    const radiographyTestId = c.req.param("radiographyTestId");
    const body = await c.req.json();
    const data = addJointResultRequest.parse(body);
    const test = await RadiographyService.addJoint(radiographyTestId, data);
    return responseCreated(c, radiographySuccessMessage.ADD_JOINT, test);
  }

  static async listJoints(c: Context) {
    const radiographyTestId = c.req.param("radiographyTestId");
    const test = await RadiographyService.getById(radiographyTestId);
    return responseOK(c, radiographySuccessMessage.GET_JOINTS, test.jointResults);
  }

  static async updateJoint(c: Context) {
    const id = c.req.param("id");
    const body = await c.req.json();
    const data = updateJointResultRequest.parse(body);
    const updated = await RadiographyService.updateJoint(id, data);
    return responseOK(c, radiographySuccessMessage.UPDATE_JOINT, updated);
  }

  static async deleteJoint(c: Context) {
    const id = c.req.param("id");
    await RadiographyService.deleteJoint(id);
    return responseOK(c, radiographySuccessMessage.DELETE_JOINT, null);
  }
}
