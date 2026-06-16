import { HTTPException } from "hono/http-exception";
import { pgsql } from "@/lib/database";
import { ProcessStatusEnum, FindingStatusEnum } from "generated/prisma";
import { TankProcessRepository } from "./tank-process.repository";
import { UpdateProcessStatusRequest } from "./tank-process.schema";

const ALLOWED_STATUS_TRANSITIONS: Partial<Record<ProcessStatusEnum, ProcessStatusEnum[]>> = {
  [ProcessStatusEnum.NOT_STARTED]: [ProcessStatusEnum.IN_PROGRESS],
  [ProcessStatusEnum.IN_PROGRESS]: [ProcessStatusEnum.WAITING_REVIEW, ProcessStatusEnum.NOT_STARTED],
  [ProcessStatusEnum.WAITING_REVIEW]: [ProcessStatusEnum.REVIEWED, ProcessStatusEnum.IN_PROGRESS],
  [ProcessStatusEnum.REVIEWED]: [ProcessStatusEnum.IN_PROGRESS, ProcessStatusEnum.COMPLETED],
  [ProcessStatusEnum.COMPLETED]: [],
  [ProcessStatusEnum.LOCKED]: [],
};

export class TankProcessService {
  static async getProcessById(id: string) {
    const process = await TankProcessRepository.findById(id);
    if (!process) {
      throw new HTTPException(404, { message: "Process not found", cause: "PROCESS_NOT_FOUND" });
    }
    return process;
  }

  static async getProcessesByTank(tankId: string) {
    return TankProcessRepository.findByTankId(tankId);
  }

  static async updateStatus(id: string, data: UpdateProcessStatusRequest) {
    const process = await TankProcessRepository.findById(id);
    if (!process) {
      throw new HTTPException(404, { message: "Process not found", cause: "PROCESS_NOT_FOUND" });
    }

    if (process.status === ProcessStatusEnum.LOCKED) {
      throw new HTTPException(422, {
        message: "Process is locked. Complete required dependencies first",
        cause: "PROCESS_LOCKED",
      });
    }

    const allowed = ALLOWED_STATUS_TRANSITIONS[process.status] ?? [];
    if (!allowed.includes(data.status)) {
      throw new HTTPException(422, {
        message: `Cannot transition from ${process.status} to ${data.status}`,
        cause: "INVALID_STATUS_TRANSITION",
      });
    }

    if (data.status === ProcessStatusEnum.WAITING_REVIEW) {
      const openFindingsCount = await pgsql.finding.count({
        where: { tankProcessId: id, status: FindingStatusEnum.OPEN, deletedAt: null },
      });
      if (openFindingsCount > 0) {
        throw new HTTPException(422, {
          message: `Cannot submit for review: ${openFindingsCount} finding(s) are still OPEN. Close or repair them first.`,
          cause: "OPEN_FINDINGS_EXIST",
        });
      }
    }

    return pgsql.$transaction(async (tx) => {
      const updated = await tx.tankProcess.update({
        where: { id },
        data: {
          status: data.status,
          ...(data.plannedStartDate && { plannedStartDate: new Date(data.plannedStartDate) }),
          ...(data.actualStartDate && { actualStartDate: new Date(data.actualStartDate) }),
          ...(data.remarks && { remarks: data.remarks }),
        },
      });

      if (data.status === ProcessStatusEnum.COMPLETED) {
        await TankProcessRepository.unlockEligibleProcesses(tx, process.tankId, process.processTemplateId);
      }

      return updated;
    });
  }
}
