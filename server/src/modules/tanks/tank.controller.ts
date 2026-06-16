import { Context } from "hono";
import { responseOK, responseCreated } from "@/utils/response";
import { TankService } from "./tank.service";
import { createTankRequest, updateTankRequest, listTanksQuery } from "./tank.schema";
import { tankSuccessMessage } from "@/config/constant/tank.constant";

export class TankController {
  static async createTank(c: Context) {
    const body = await c.req.json();
    const data = createTankRequest.parse(body);
    const user = c.get("user");
    const tank = await TankService.createTank(data, user.id);
    return responseCreated(c, tankSuccessMessage.CREATE_TANK, tank);
  }

  static async listTanks(c: Context) {
    const query = listTanksQuery.parse(c.req.query());
    const result = await TankService.listTanks(query);
    return responseOK(c, tankSuccessMessage.GET_TANKS, result.data, result.meta);
  }

  static async getTankById(c: Context) {
    const id = c.req.param("id");
    const tank = await TankService.getTankById(id);
    return responseOK(c, tankSuccessMessage.GET_TANK, tank);
  }

  static async getTankProcesses(c: Context) {
    const id = c.req.param("id");
    const processes = await TankService.getTankProcesses(id);
    return responseOK(c, tankSuccessMessage.GET_TANK_PROCESSES, processes);
  }

  static async updateTank(c: Context) {
    const id = c.req.param("id");
    const body = await c.req.json();
    const data = updateTankRequest.parse(body);
    const tank = await TankService.updateTank(id, data);
    return responseOK(c, tankSuccessMessage.UPDATE_TANK, tank);
  }

  static async deleteTank(c: Context) {
    const id = c.req.param("id");
    await TankService.deleteTank(id);
    return responseOK(c, tankSuccessMessage.DELETE_TANK, null);
  }
}
