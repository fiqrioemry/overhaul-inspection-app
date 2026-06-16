import { HTTPException } from "hono/http-exception";
import { pgsql } from "@/lib/database";
import { ProcessStatusEnum, FindingStatusEnum, ChecklistStatusEnum, ChecklistSourceEnum } from "generated/prisma";
import { TankProcessRepository } from "./tank-process.repository";
import { ChecklistResultRepository } from "@/modules/checklist-results/checklist-result.repository";
import { UpdateProcessStatusRequest } from "./tank-process.schema";

const ALLOWED_STATUS_TRANSITIONS: Partial<Record<ProcessStatusEnum, ProcessStatusEnum[]>> = {
  [ProcessStatusEnum.NOT_STARTED]: [ProcessStatusEnum.IN_PROGRESS],
  [ProcessStatusEnum.IN_PROGRESS]: [ProcessStatusEnum.WAITING_REVIEW, ProcessStatusEnum.NOT_STARTED],
  [ProcessStatusEnum.WAITING_REVIEW]: [ProcessStatusEnum.REVIEWED, ProcessStatusEnum.IN_PROGRESS],
  [ProcessStatusEnum.REVIEWED]: [ProcessStatusEnum.IN_PROGRESS, ProcessStatusEnum.COMPLETED],
  [ProcessStatusEnum.COMPLETED]: [],
  [ProcessStatusEnum.LOCKED]: [],
};

// Findings with these statuses + isBlocking=true block review/completion
const BLOCKING_FINDING_STATUSES = [
  FindingStatusEnum.OPEN,
  FindingStatusEnum.IN_REPAIR,
  FindingStatusEnum.REPAIRED,
];

async function countBlockingFindings(tankProcessId: string) {
  return pgsql.finding.count({
    where: {
      tankProcessId,
      isBlocking: true,
      status: { in: BLOCKING_FINDING_STATUSES },
      deletedAt: null,
    },
  });
}

async function countUncheckedRequired(tankProcessId: string) {
  return pgsql.checklistResult.count({
    where: {
      tankProcessId,
      status: ChecklistStatusEnum.NOT_CHECKED,
      OR: [
        { source: ChecklistSourceEnum.TEMPLATE, criteria: { isRequired: true } },
        { source: ChecklistSourceEnum.CUSTOM, isRequired: true },
      ],
    },
  });
}

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

    // Guards for WAITING_REVIEW: all required checklists passed + no blocking findings
    if (data.status === ProcessStatusEnum.WAITING_REVIEW) {
      const unchecked = await countUncheckedRequired(id);
      if (unchecked > 0) {
        throw new HTTPException(422, {
          message: `Cannot submit for review: ${unchecked} required checklist item(s) are still NOT_CHECKED.`,
          cause: "UNCHECKED_REQUIRED_CHECKLISTS",
        });
      }
      const blocking = await countBlockingFindings(id);
      if (blocking > 0) {
        throw new HTTPException(422, {
          message: `Cannot submit for review: ${blocking} blocking finding(s) are unresolved (OPEN, IN_REPAIR, or REPAIRED).`,
          cause: "BLOCKING_FINDINGS_EXIST",
        });
      }
    }

    // Guards for COMPLETED: re-validate checklists + blocking findings
    if (data.status === ProcessStatusEnum.COMPLETED) {
      const unchecked = await countUncheckedRequired(id);
      if (unchecked > 0) {
        throw new HTTPException(422, {
          message: `Cannot complete process: ${unchecked} required checklist item(s) are still NOT_CHECKED.`,
          cause: "UNCHECKED_REQUIRED_CHECKLISTS",
        });
      }
      const blocking = await countBlockingFindings(id);
      if (blocking > 0) {
        throw new HTTPException(422, {
          message: `Cannot complete process: ${blocking} blocking finding(s) are unresolved.`,
          cause: "BLOCKING_FINDINGS_EXIST",
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
