import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { responseOK, responseCreated } from "@/utils/response";
import { TankService } from "./tank.service";
import { TankAIService } from "./tank-ai.service";
import { createTankRequest, updateTankRequest, listTanksQuery } from "./tank.schema";
import { tankSuccessMessage } from "@/config/constant/tank.constant";

function extractFiles(body: Record<string, unknown>): File[] {
  const raw = body["attachments"];
  if (!raw) return [];
  const arr = Array.isArray(raw) ? raw : [raw];
  return arr.filter((f): f is File => f instanceof File);
}

function parseJsonField<T>(value: unknown, fallback: T): T {
  if (!value || typeof value !== "string") return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function num(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function bool(value: unknown): boolean | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  return value === "true" || value === true;
}

function str(value: unknown): string | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  return String(value);
}

export class TankController {
  static async createTank(c: Context) {
    const contentType = c.req.header("content-type") ?? "";

    // Support both JSON (no attachments) and multipart/form-data (with document attachments).
    if (contentType.includes("multipart/form-data")) {
      const body = await c.req.parseBody({ all: true });
      const files = extractFiles(body as Record<string, unknown>);

      const data = createTankRequest.parse({
        tankNo: body["tankNo"],
        tankName: str(body["tankName"]),
        location: str(body["location"]),
        capacityM3: num(body["capacityM3"]),
        service: str(body["service"]),
        diameterMm: num(body["diameterMm"]),
        heightMm: num(body["heightMm"]),
        shellCourseCount: num(body["shellCourseCount"]),
        bottomPlateDimension: str(body["bottomPlateDimension"]),
        hasSteamCoil: bool(body["hasSteamCoil"]) ?? false,
        contractorCompanyId: str(body["contractorCompanyId"]),
        inspectionCompanyId: str(body["inspectionCompanyId"]),
        startDate: str(body["startDate"]),
        estimatedFinishDate: str(body["estimatedFinishDate"]),
        shellCourses: parseJsonField<unknown[]>(body["shellCourses"], []),
        newFileCaptions: parseJsonField<string[]>(body["newFileCaptions"], []),
      });

      const user = c.get("user");
      const tank = await TankService.createTank(data, user.id, c, files);
      return responseCreated(c, tankSuccessMessage.CREATE_TANK, tank);
    }

    const body = await c.req.json();
    const data = createTankRequest.parse(body);
    const user = c.get("user");
    const tank = await TankService.createTank(data, user.id);
    return responseCreated(c, tankSuccessMessage.CREATE_TANK, tank);
  }

  static async extractDocument(c: Context) {
    const body = await c.req.parseBody({ all: true });
    const files = extractFiles(body as Record<string, unknown>);
    if (files.length === 0) {
      throw new HTTPException(400, { message: "At least one document file is required", cause: "AI_NO_FILE" });
    }
    const result = await TankAIService.extract(files);
    return responseOK(c, "Tank data extracted successfully", result);
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
