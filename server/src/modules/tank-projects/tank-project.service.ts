import { HTTPException } from "hono/http-exception";
import { pgsql } from "@/lib/database";
import { TankProjectStatusEnum, TankProjectTypeEnum, ProcessStatusEnum } from "generated/prisma";
import { ProcessGenerationService } from "@/services/process-generation.service";
import { recalculateTankAssetStatus } from "@/services/tank-asset-status.service";
import { TankProjectRepository } from "./tank-project.repository";
import { CreateTankProjectRequest, ListTankProjectsQuery, UpdateTankProjectRequest } from "./tank-project.schema";
import { TANK_PROJECT_NO_PREFIX, DEFAULT_GENERATE_PROCESS_TYPES } from "@/config/constant/tank-project.constant";
import type { TankProjectListItem, TankProjectListResult, TankProjectProgress } from "./tank-project.types";

function toDate(value?: string | null): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  return new Date(value);
}

function computeProgress(
  processes: { id: string; name: string; status: string; sequenceOrder: number }[],
): TankProjectProgress {
  const totalProcesses = processes.length;
  const completedProcesses = processes.filter((p) => p.status === ProcessStatusEnum.COMPLETED).length;
  const progress = totalProcesses > 0 ? Math.round((completedProcesses / totalProcesses) * 100) : 0;
  const inProgressStatuses: ProcessStatusEnum[] = [
    ProcessStatusEnum.IN_PROGRESS,
    ProcessStatusEnum.WAITING_REVIEW,
    ProcessStatusEnum.REVIEWED,
  ];
  const current =
    processes.find((p) => inProgressStatuses.includes(p.status as ProcessStatusEnum)) ??
    processes.find((p) => p.status === ProcessStatusEnum.NOT_STARTED) ??
    null;
  return {
    totalProcesses,
    completedProcesses,
    progress,
    currentProcess: current ? { id: current.id, name: current.name, status: current.status } : null,
  };
}

export class TankProjectService {
  static async generateProjectNo(tankNo: string, type: TankProjectTypeEnum, startDate?: Date | null): Promise<string> {
    const prefix = TANK_PROJECT_NO_PREFIX[type] ?? "PRJ";
    const year = (startDate ?? new Date()).getFullYear();
    const base = `${prefix}-${tankNo}-${year}`;
    let candidate = base;
    let suffix = 1;
    while (await TankProjectRepository.findByProjectNo(candidate)) {
      candidate = `${base}-${String(suffix).padStart(2, "0")}`;
      suffix++;
    }
    return candidate;
  }

  static async createProject(data: CreateTankProjectRequest, createdBy: string) {
    const tank = await pgsql.tank.findFirst({
      where: { id: data.tankId, deletedAt: null },
      select: { id: true, tankNo: true, hasSteamCoil: true },
    });
    if (!tank) {
      throw new HTTPException(404, { message: "Tank not found", cause: "TANK_NOT_FOUND" });
    }

    if (data.projectNo) {
      const existing = await TankProjectRepository.findByProjectNo(data.projectNo);
      if (existing) {
        throw new HTTPException(409, { message: "Project number already exists", cause: "PROJECT_NO_EXISTS" });
      }
    }

    const projectNo = data.projectNo ?? (await this.generateProjectNo(tank.tankNo, data.type, toDate(data.startDate)));
    const status = data.status ?? TankProjectStatusEnum.PLANNED;
    const generateProcesses = data.generateProcesses ?? DEFAULT_GENERATE_PROCESS_TYPES.has(data.type);

    const project = await pgsql.$transaction(async (tx) => {
      const created = await tx.tankProject.create({
        data: {
          tankId: data.tankId,
          projectNo,
          type: data.type,
          status,
          contractorCompanyId: data.contractorCompanyId,
          inspectionCompanyId: data.inspectionCompanyId,
          startDate: toDate(data.startDate) ?? undefined,
          estimatedFinishDate: toDate(data.estimatedFinishDate) ?? undefined,
          actualFinishDate: toDate(data.actualFinishDate) ?? undefined,
          description: data.description,
          remarks: data.remarks,
          createdBy,
        },
      });

      if (generateProcesses) {
        await ProcessGenerationService.generateProcessesForProject(tx, created.id, tank.hasSteamCoil);
      }

      await recalculateTankAssetStatus(data.tankId, tx);
      return created;
    });

    return TankProjectRepository.findById(project.id);
  }

  static async listProjects(query: ListTankProjectsQuery): Promise<TankProjectListResult> {
    const { projects, total } = await TankProjectRepository.findMany(query);
    const totalPages = total > 0 ? Math.ceil(total / query.limit) : 0;

    const data: TankProjectListItem[] = projects.map((p) => ({
      id: p.id,
      projectNo: p.projectNo,
      tankId: p.tankId,
      type: p.type,
      status: p.status,
      startDate: p.startDate,
      estimatedFinishDate: p.estimatedFinishDate,
      actualFinishDate: p.actualFinishDate,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      tank: p.tank,
      contractorCompany: p.contractorCompany,
      inspectionCompany: p.inspectionCompany,
      progress: computeProgress(p.processes),
      _count: p._count,
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

  static async getProjectById(id: string) {
    const project = await TankProjectRepository.findById(id);
    if (!project) {
      throw new HTTPException(404, { message: "Tank project not found", cause: "PROJECT_NOT_FOUND" });
    }
    return project;
  }

  static async getProjectProcesses(id: string) {
    await this.getProjectById(id);
    return TankProjectRepository.findProcesses(id);
  }

  static async getProgressSummary(id: string): Promise<TankProjectProgress> {
    await this.getProjectById(id);
    const processes = await pgsql.tankProcess.findMany({
      where: { projectId: id },
      orderBy: { sequenceOrder: "asc" },
      select: { id: true, name: true, status: true, sequenceOrder: true },
    });
    return computeProgress(processes);
  }

  static async generateProcesses(id: string) {
    const project = await TankProjectRepository.findById(id);
    if (!project) {
      throw new HTTPException(404, { message: "Tank project not found", cause: "PROJECT_NOT_FOUND" });
    }
    const created = await pgsql.$transaction((tx) =>
      ProcessGenerationService.generateProcessesForProject(tx, id, project.tank?.hasSteamCoil ?? false),
    );
    return { generated: created };
  }

  static async updateProject(id: string, data: UpdateTankProjectRequest) {
    const project = await TankProjectRepository.findById(id);
    if (!project) {
      throw new HTTPException(404, { message: "Tank project not found", cause: "PROJECT_NOT_FOUND" });
    }

    if (data.projectNo && data.projectNo !== project.projectNo) {
      const existing = await TankProjectRepository.findByProjectNo(data.projectNo);
      if (existing) {
        throw new HTTPException(409, { message: "Project number already exists", cause: "PROJECT_NO_EXISTS" });
      }
    }

    const statusChanged = data.status !== undefined && data.status !== project.status;

    await TankProjectRepository.update(id, {
      projectNo: data.projectNo,
      type: data.type,
      status: data.status,
      contractorCompanyId: data.contractorCompanyId,
      inspectionCompanyId: data.inspectionCompanyId,
      startDate: toDate(data.startDate),
      estimatedFinishDate: toDate(data.estimatedFinishDate),
      actualFinishDate: toDate(data.actualFinishDate),
      description: data.description,
      remarks: data.remarks,
    });

    if (statusChanged) {
      await recalculateTankAssetStatus(project.tankId);
    }

    return TankProjectRepository.findById(id);
  }

  static async deleteProject(id: string) {
    const project = await TankProjectRepository.findById(id);
    if (!project) {
      throw new HTTPException(404, { message: "Tank project not found", cause: "PROJECT_NOT_FOUND" });
    }
    await TankProjectRepository.softDelete(id);
    await recalculateTankAssetStatus(project.tankId);
  }
}
