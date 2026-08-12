import { HTTPException } from "hono/http-exception";
import { pgsql } from "@/lib/database";
import { ProcessStatusEnum, TankProjectStatusEnum, FindingStatusEnum, ChecklistStatusEnum, ChecklistSourceEnum } from "generated/prisma";
import { TankProcessRepository } from "./tank-process.repository";
import { ChecklistResultRepository } from "@/modules/checklist-results/checklist-result.repository";
import { UpdateProcessStatusRequest, UpdateProcessDatesRequest } from "./tank-process.schema";

const ALLOWED_STATUS_TRANSITIONS: Partial<Record<ProcessStatusEnum, ProcessStatusEnum[]>> = {
  [ProcessStatusEnum.NOT_STARTED]: [ProcessStatusEnum.IN_PROGRESS],
  [ProcessStatusEnum.IN_PROGRESS]: [ProcessStatusEnum.WAITING_REVIEW, ProcessStatusEnum.NOT_STARTED],
  [ProcessStatusEnum.WAITING_REVIEW]: [ProcessStatusEnum.REVIEWED, ProcessStatusEnum.IN_PROGRESS],
  [ProcessStatusEnum.REVIEWED]: [ProcessStatusEnum.IN_PROGRESS, ProcessStatusEnum.COMPLETED],
  [ProcessStatusEnum.COMPLETED]: [],
};

// Findings with these statuses + isBlocking=true block review/completion
const BLOCKING_FINDING_STATUSES = [FindingStatusEnum.OPEN, FindingStatusEnum.IN_REPAIR];

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

  static async getProcessesByProject(projectId: string) {
    return TankProcessRepository.findByProjectId(projectId);
  }

  static async updateStatus(id: string, data: UpdateProcessStatusRequest) {
    const process = await TankProcessRepository.findById(id);
    if (!process) {
      throw new HTTPException(404, { message: "Process not found", cause: "PROCESS_NOT_FOUND" });
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
          message: `Cannot submit for review: ${blocking} blocking finding(s) are unresolved (OPEN or IN_REPAIR).`,
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
      const now = new Date();
      const updated = await tx.tankProcess.update({
        where: { id },
        data: {
          status: data.status,
          ...(data.status === ProcessStatusEnum.IN_PROGRESS &&
            !process.startDate && { startDate: data.startDate ? new Date(data.startDate) : now }),
          ...(data.finishDate !== undefined
            ? { finishDate: data.finishDate ? new Date(data.finishDate) : null }
            : data.status === ProcessStatusEnum.COMPLETED && { finishDate: now }),
          ...(data.remarks && { remarks: data.remarks }),
        },
      });

      // When the first process starts, move the owning project PLANNED → IN_PROGRESS.
      if (data.status === ProcessStatusEnum.IN_PROGRESS && process.project?.status === TankProjectStatusEnum.PLANNED) {
        await tx.tankProject.update({
          where: { id: process.projectId },
          data: { status: TankProjectStatusEnum.IN_PROGRESS },
        });
      }

      return updated;
    });
  }

  static async updateDates(id: string, data: UpdateProcessDatesRequest) {
    const process = await TankProcessRepository.findById(id);
    if (!process) {
      throw new HTTPException(404, { message: "Process not found", cause: "PROCESS_NOT_FOUND" });
    }
    if (!process.startDate) {
      throw new HTTPException(422, {
        message: "Cannot set dates before the process has started. Use the Start Process action first.",
        cause: "PROCESS_NOT_STARTED",
      });
    }

    return TankProcessRepository.updateDates(id, {
      startDate: new Date(data.startDate),
      finishDate: data.finishDate ? new Date(data.finishDate) : null,
    });
  }

  // Removes a mistakenly-added process from a project's workflow. Only allowed while the
  // process is still NOT_STARTED — checklist items can only be checked once IN_PROGRESS
  // (see ChecklistResultService), so NOT_STARTED guarantees no checklist work exists yet.
  // Findings/inspection requests/test records/daily reports are additionally checked
  // directly since those only SetNull on delete (they would otherwise be silently orphaned).
  static async deleteProcess(id: string) {
    const process = await TankProcessRepository.findById(id);
    if (!process) {
      throw new HTTPException(404, { message: "Process not found", cause: "PROCESS_NOT_FOUND" });
    }

    if (process.status !== ProcessStatusEnum.NOT_STARTED) {
      throw new HTTPException(422, {
        message: `Cannot remove process: status is ${process.status}. Only a process that has not started can be removed.`,
        cause: "PROCESS_ALREADY_STARTED",
      });
    }

    const [findingsCount, inspectionRequestsCount, testRecordsCount, dailyReportsCount] = await Promise.all([
      pgsql.finding.count({ where: { tankProcessId: id, deletedAt: null } }),
      pgsql.inspectionRequest.count({ where: { tankProcessId: id, deletedAt: null } }),
      pgsql.testRecord.count({ where: { tankProcessId: id } }),
      pgsql.dailyReport.count({ where: { tankProcessId: id, deletedAt: null } }),
    ]);
    const linkedRecords = findingsCount + inspectionRequestsCount + testRecordsCount + dailyReportsCount;
    if (linkedRecords > 0) {
      throw new HTTPException(422, {
        message: "Cannot remove process: it already has findings, inspection requests, test records, or daily reports linked to it.",
        cause: "PROCESS_HAS_LINKED_RECORDS",
      });
    }

    await TankProcessRepository.delete(id);
  }
}
