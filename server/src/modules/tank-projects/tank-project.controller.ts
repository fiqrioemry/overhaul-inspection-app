import { Context } from "hono";
import { responseOK, responseCreated } from "@/utils/response";
import { TankProjectService } from "./tank-project.service";
import { createTankProjectRequest, updateTankProjectRequest, listTankProjectsQuery } from "./tank-project.schema";
import { tankProjectSuccessMessage } from "@/config/constant/tank-project.constant";

export class TankProjectController {
  static async createProject(c: Context) {
    const body = await c.req.json();
    const data = createTankProjectRequest.parse(body);
    const user = c.get("user");
    const project = await TankProjectService.createProject(data, user.id);
    return responseCreated(c, tankProjectSuccessMessage.CREATE_PROJECT, project);
  }

  static async listProjects(c: Context) {
    const query = listTankProjectsQuery.parse(c.req.query());
    const result = await TankProjectService.listProjects(query);
    return responseOK(c, tankProjectSuccessMessage.GET_PROJECTS, result.data, result.meta);
  }

  static async getProjectById(c: Context) {
    const id = c.req.param("id");
    const project = await TankProjectService.getProjectById(id);
    return responseOK(c, tankProjectSuccessMessage.GET_PROJECT, project);
  }

  static async getProjectProcesses(c: Context) {
    const id = c.req.param("id");
    const processes = await TankProjectService.getProjectProcesses(id);
    return responseOK(c, tankProjectSuccessMessage.GET_PROJECT_PROCESSES, processes);
  }

  static async getProgressSummary(c: Context) {
    const id = c.req.param("id");
    const summary = await TankProjectService.getProgressSummary(id);
    return responseOK(c, tankProjectSuccessMessage.GET_PROGRESS_SUMMARY, summary);
  }

  static async generateProcesses(c: Context) {
    const id = c.req.param("id");
    const result = await TankProjectService.generateProcesses(id);
    return responseOK(c, tankProjectSuccessMessage.GENERATE_PROCESSES, result);
  }

  static async updateProject(c: Context) {
    const id = c.req.param("id");
    const body = await c.req.json();
    const data = updateTankProjectRequest.parse(body);
    const project = await TankProjectService.updateProject(id, data);
    return responseOK(c, tankProjectSuccessMessage.UPDATE_PROJECT, project);
  }

  static async deleteProject(c: Context) {
    const id = c.req.param("id");
    await TankProjectService.deleteProject(id);
    return responseOK(c, tankProjectSuccessMessage.DELETE_PROJECT, null);
  }
}
