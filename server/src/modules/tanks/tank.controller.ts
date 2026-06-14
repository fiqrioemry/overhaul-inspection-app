import { Context } from "hono";
import { responseOK, responseCreated } from "@/utils/response";
import { TankService } from "./tank.service";
import { createTankRequest, updateTankRequest, listTanksQuery } from "./tank.schema";

export class TankController {
  static async createTank(c: Context) {
    const body = await c.req.json();
    const data = createTankRequest.parse(body);
    const user = c.get("user");
    const tank = await TankService.createTank(data, user.id);
    return responseCreated(c, "Tank created successfully", tank);
  }

  static async listTanks(c: Context) {
    const query = listTanksQuery.parse(c.req.query());
    const result = await TankService.listTanks(query);
    return responseOK(c, "Tanks retrieved successfully", result);
  }

  static async getTankById(c: Context) {
    const id = c.req.param("id");
    const tank = await TankService.getTankById(id);
    return responseOK(c, "Tank retrieved successfully", tank);
  }

  static async getTankProcesses(c: Context) {
    const id = c.req.param("id");
    const processes = await TankService.getTankProcesses(id);
    return responseOK(c, "Processes retrieved successfully", processes);
  }

  static async updateTank(c: Context) {
    const id = c.req.param("id");
    const body = await c.req.json();
    const data = updateTankRequest.parse(body);
    const tank = await TankService.updateTank(id, data);
    return responseOK(c, "Tank updated successfully", tank);
  }

  static async deleteTank(c: Context) {
    const id = c.req.param("id");
    await TankService.deleteTank(id);
    return responseOK(c, "Tank deleted successfully", null);
  }
}
