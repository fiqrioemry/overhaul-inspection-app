import { HTTPException } from "hono/http-exception";
import { pgsql } from "@/lib/database";
import { ProcessStatusEnum, ChecklistStatusEnum } from "generated/prisma";
import { TankRepository } from "./tank.repository";
import { CreateTankRequest, ListTanksQuery, UpdateTankRequest } from "./tank.schema";

function isApplicable(applicabilityRule: string | null, hasSteamCoil: boolean): boolean {
  if (!applicabilityRule) return true;
  if (applicabilityRule === "STEAM_COIL") return hasSteamCoil;
  return true;
}

export class TankService {
  static async createTank(data: CreateTankRequest, createdBy: string) {
    const existing = await TankRepository.findByTankNo(data.tankNo);
    if (existing) {
      throw new HTTPException(409, { message: "Tank number already exists", cause: "TANK_NO_EXISTS" });
    }

    const templates = await pgsql.processTemplate.findMany({
      where: { isActive: true, deletedAt: null },
      orderBy: { sequenceOrder: "asc" },
      include: { processCriteria: { include: { criteria: true } } },
    });

    const tank = await pgsql.$transaction(async (tx) => {
      const newTank = await tx.tank.create({
        data: {
          tankNo: data.tankNo,
          tankName: data.tankName,
          diameterMm: data.diameterMm,
          heightMm: data.heightMm,
          shellCourseCount: data.shellCourseCount,
          bottomPlateDimension: data.bottomPlateDimension,
          hasSteamCoil: data.hasSteamCoil,
          contractorCompanyId: data.contractorCompanyId,
          inspectionCompanyId: data.inspectionCompanyId,
          startDate: data.startDate ? new Date(data.startDate) : undefined,
          estimatedFinishDate: data.estimatedFinishDate ? new Date(data.estimatedFinishDate) : undefined,
          createdBy,
        },
      });

      if (data.shellCourses && data.shellCourses.length > 0) {
        await tx.tankShellCourse.createMany({
          data: data.shellCourses.map((sc) => ({
            tankId: newTank.id,
            courseNo: sc.courseNo,
            thicknessMm: sc.thicknessMm,
            plateDimension: sc.plateDimension,
            remarks: sc.remarks,
          })),
        });
      }

      const applicableTemplates = templates.filter((t) =>
        isApplicable(t.applicabilityRule, data.hasSteamCoil),
      );

      for (let i = 0; i < applicableTemplates.length; i++) {
        const template = applicableTemplates[i];
        const isFirst = i === 0;

        const tankProcess = await tx.tankProcess.create({
          data: {
            tankId: newTank.id,
            processTemplateId: template.id,
            name: template.name,
            type: template.type,
            sequenceOrder: template.sequenceOrder,
            status: isFirst ? ProcessStatusEnum.NOT_STARTED : ProcessStatusEnum.LOCKED,
          },
        });

        if (template.processCriteria.length > 0) {
          await tx.checklistResult.createMany({
            data: template.processCriteria.map((pc) => ({
              tankProcessId: tankProcess.id,
              criteriaId: pc.criteriaId,
              status: ChecklistStatusEnum.NOT_CHECKED,
            })),
          });
        }
      }

      return newTank;
    });

    return TankRepository.findById(tank.id);
  }

  static async listTanks(query: ListTanksQuery) {
    const { tanks, total } = await TankRepository.findMany(query);
    return {
      data: tanks,
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: total > 0 ? Math.ceil(total / query.limit) : 0,
      },
    };
  }

  static async getTankById(id: string) {
    const tank = await TankRepository.findById(id);
    if (!tank) {
      throw new HTTPException(404, { message: "Tank not found", cause: "TANK_NOT_FOUND" });
    }
    return tank;
  }

  static async getTankProcesses(id: string) {
    const tank = await TankRepository.findWithProcesses(id);
    if (!tank) {
      throw new HTTPException(404, { message: "Tank not found", cause: "TANK_NOT_FOUND" });
    }
    return tank.processes;
  }

  static async updateTank(id: string, data: UpdateTankRequest) {
    const tank = await TankRepository.findById(id);
    if (!tank) {
      throw new HTTPException(404, { message: "Tank not found", cause: "TANK_NOT_FOUND" });
    }

    if (data.tankNo && data.tankNo !== tank.tankNo) {
      const existing = await TankRepository.findByTankNo(data.tankNo);
      if (existing) {
        throw new HTTPException(409, { message: "Tank number already exists", cause: "TANK_NO_EXISTS" });
      }
    }

    return TankRepository.update(id, {
      ...data,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      estimatedFinishDate: data.estimatedFinishDate ? new Date(data.estimatedFinishDate) : undefined,
    });
  }

  static async deleteTank(id: string) {
    const tank = await TankRepository.findById(id);
    if (!tank) {
      throw new HTTPException(404, { message: "Tank not found", cause: "TANK_NOT_FOUND" });
    }
    await TankRepository.softDelete(id);
  }
}
