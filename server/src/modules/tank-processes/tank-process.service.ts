import { HTTPException } from "hono/http-exception";
import { pgsql } from "@/lib/database";
import { Prisma, ProcessStatusEnum, TankProjectStatusEnum, FindingStatusEnum, ChecklistStatusEnum, ChecklistSourceEnum } from "generated/prisma";
import { TankProcessRepository } from "./tank-process.repository";
import { ChecklistResultRepository } from "@/modules/checklist-results/checklist-result.repository";
import { UserRepository } from "@/modules/users/user.repository";
import { reconcileProjectStatusFromProcesses } from "@/services/project-status.service";
import { tankProcessAction, tankProcessErrorMessage } from "@/config/constant/tank-process.constant";
import { UpdateProcessStatusRequest, UpdateProcessDatesRequest, CorrectProcessStatusRequest } from "./tank-process.schema";

const ALLOWED_STATUS_TRANSITIONS: Partial<Record<ProcessStatusEnum, ProcessStatusEnum[]>> = {
  [ProcessStatusEnum.NOT_STARTED]: [ProcessStatusEnum.IN_PROGRESS],
  [ProcessStatusEnum.IN_PROGRESS]: [ProcessStatusEnum.WAITING_REVIEW, ProcessStatusEnum.NOT_STARTED],
  [ProcessStatusEnum.WAITING_REVIEW]: [ProcessStatusEnum.REVIEWED, ProcessStatusEnum.IN_PROGRESS],
  [ProcessStatusEnum.REVIEWED]: [ProcessStatusEnum.IN_PROGRESS, ProcessStatusEnum.COMPLETED],
  [ProcessStatusEnum.COMPLETED]: [],
};

// Statuses that may skip the normal review workflow and complete a process directly.
// This is an intentional bypass (checklist/finding/review requirements are NOT re-validated
// here) — it exists only for the "Mark as Completed" shortcut and must never be widened to
// include a status the normal ALLOWED_STATUS_TRANSITIONS flow wouldn't eventually allow.
export const DIRECT_COMPLETE_ELIGIBLE_STATUSES: ProcessStatusEnum[] = [
  ProcessStatusEnum.NOT_STARTED,
  ProcessStatusEnum.IN_PROGRESS,
  ProcessStatusEnum.WAITING_REVIEW,
  ProcessStatusEnum.REVIEWED,
];

// Findings with these statuses + isBlocking=true block review/completion
const BLOCKING_FINDING_STATUSES = [FindingStatusEnum.OPEN, FindingStatusEnum.IN_REPAIR];

/**
 * Timestamps a manually corrected process must end up with, derived entirely on the server —
 * the correction endpoint accepts no dates from the client.
 *
 * TankProcess carries only startDate/finishDate; there are no separate submission/review
 * columns, so "clear the timestamps incompatible with this target" reduces to finishDate.
 *
 *   NOT_STARTED                            -> both cleared, the process never ran
 *   IN_PROGRESS / WAITING_REVIEW / REVIEWED -> keep startDate (or stamp it now), clear finishDate
 *   COMPLETED                              -> keep startDate (or stamp it now), finishDate = now
 *
 * `now` is passed in so one timestamp is shared by every field written in the same correction.
 */
export function resolveCorrectedTimestamps(
  targetStatus: ProcessStatusEnum,
  current: { startDate: Date | null; finishDate: Date | null },
  now: Date,
): { startDate: Date | null; finishDate: Date | null } {
  if (targetStatus === ProcessStatusEnum.NOT_STARTED) {
    return { startDate: null, finishDate: null };
  }
  const startDate = current.startDate ?? now;
  if (targetStatus === ProcessStatusEnum.COMPLETED) {
    return { startDate, finishDate: now };
  }
  return { startDate, finishDate: null };
}

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

  static async updateStatus(id: string, data: UpdateProcessStatusRequest, actorUserId?: string | null) {
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

      // Same transaction, after the process write: completing the last outstanding process
      // completes the project (and reopening one reopens it).
      await reconcileProjectStatusFromProcesses(process.projectId, tx, {
        actorUserId,
        triggerProcessId: id,
        triggerProcessStatus: data.status,
      });

      return updated;
    });
  }

  // Direct-completion shortcut: transitions NOT_STARTED / IN_PROGRESS / WAITING_REVIEW / REVIEWED
  // straight to COMPLETED in one operation, bypassing checklist and blocking-finding validation.
  // Unlike updateStatus, this intentionally does NOT call countUncheckedRequired/countBlockingFindings.
  static async completeDirect(id: string, actorUserId?: string | null) {
    const process = await TankProcessRepository.findById(id);
    if (!process) {
      throw new HTTPException(404, { message: "Process not found", cause: "PROCESS_NOT_FOUND" });
    }

    // Idempotent: retrying an already-completed process returns its current state unchanged
    // instead of erroring, so a duplicate/replayed request never overwrites the original completedAt.
    if (process.status === ProcessStatusEnum.COMPLETED) {
      return process;
    }

    if (!DIRECT_COMPLETE_ELIGIBLE_STATUSES.includes(process.status)) {
      throw new HTTPException(422, {
        message: `Cannot directly complete process: status is ${process.status}.`,
        cause: "INVALID_STATUS_TRANSITION",
      });
    }

    return pgsql.$transaction(async (tx) => {
      const now = new Date();
      const updated = await tx.tankProcess.update({
        where: { id },
        data: {
          status: ProcessStatusEnum.COMPLETED,
          startDate: process.startDate ?? now,
          finishDate: now,
        },
      });

      // Mirrors the same side effect updateStatus applies when a process starts, so a process
      // completed via this shortcut still leaves its owning project in a consistent state.
      if (process.project?.status === TankProjectStatusEnum.PLANNED) {
        await tx.tankProject.update({
          where: { id: process.projectId },
          data: { status: TankProjectStatusEnum.IN_PROGRESS },
        });
      }

      await reconcileProjectStatusFromProcesses(process.projectId, tx, {
        actorUserId,
        triggerProcessId: id,
        triggerProcessStatus: ProcessStatusEnum.COMPLETED,
      });

      return updated;
    });
  }

  /**
   * Manual status correction for one tank process — an administrative repair for a status that
   * was recorded wrongly, not a workflow step. It intentionally allows any transition between
   * the five workflow statuses, including backwards ones such as COMPLETED -> IN_PROGRESS, and
   * therefore skips the checklist / blocking-finding / dependency guards that updateStatus
   * enforces. Those guards remain in force for the normal workflow.
   *
   * Scope is deliberately narrow: this touches the selected process row and nothing else.
   * Checklist results, findings and sibling processes are all left as they are. The owning
   * project's status is the one derived value that follows, through the shared
   * reconcileProjectStatusFromProcesses — completing the last outstanding process completes the
   * project, and reopening a process reopens it. The PLANNED -> IN_PROGRESS nudge that
   * updateStatus/completeDirect apply is still NOT applied here: a correction on a process of a
   * project that never started must not start the project.
   */
  static async correctStatusManually(tankId: string, processId: string, data: CorrectProcessStatusRequest, actorUserId: string) {
    const process = await TankProcessRepository.findByIdWithOwner(processId);
    if (!process) {
      throw new HTTPException(404, { message: "Process not found", cause: "PROCESS_NOT_FOUND" });
    }
    // A process reached through the wrong tank, or one whose tank/project has been soft-deleted,
    // is treated as absent rather than as a different error — from this route it does not exist.
    if (process.project.tankId !== tankId) {
      throw new HTTPException(404, { message: "Process not found for this tank", cause: "PROCESS_TANK_MISMATCH" });
    }
    if (process.project.deletedAt || process.project.tank.deletedAt) {
      throw new HTTPException(404, { message: "Process not found for this tank", cause: "PROCESS_NOT_ACTIVE" });
    }

    // Stale read: the row moved on after the client rendered the dialog. Reject rather than
    // clobber the newer value; the client refreshes and the operator decides again.
    if (process.status !== data.expectedCurrentStatus) {
      throw new HTTPException(409, {
        message: tankProcessErrorMessage.STALE_PROCESS_STATUS,
        cause: "PROCESS_STATUS_CONFLICT",
      });
    }

    // Duplicate/retried submission of a correction that already landed. Return the row untouched
    // so a replay cannot re-stamp finishDate — same idempotency convention as completeDirect.
    if (process.status === data.targetStatus) {
      return TankProcessService.getProcessById(processId);
    }

    await pgsql.$transaction(async (tx: Prisma.TransactionClient) => {
      const now = new Date();
      const timestamps = resolveCorrectedTimestamps(data.targetStatus, process, now);

      // Compare-and-set: between the read above and this write another request may have changed
      // the status, and updateMany matching zero rows is how that race surfaces.
      const written = await TankProcessRepository.updateStatusIfCurrent(tx, processId, data.expectedCurrentStatus, {
        status: data.targetStatus,
        ...timestamps,
      });
      if (written === 0) {
        throw new HTTPException(409, {
          message: tankProcessErrorMessage.STALE_PROCESS_STATUS,
          cause: "PROCESS_STATUS_CONFLICT",
        });
      }

      await reconcileProjectStatusFromProcesses(process.projectId, tx, {
        actorUserId,
        triggerProcessId: processId,
        triggerProcessStatus: data.targetStatus,
      });

      // Same transaction as the write: a correction is never recorded without its audit entry,
      // and an audit entry never survives a rolled-back correction.
      await UserRepository.createActivityLog(tx, {
        userId: actorUserId,
        action: tankProcessAction.MANUAL_STATUS_CORRECTION,
        metadata: {
          source: "MANUAL_STATUS_CORRECTION",
          tankProcessId: processId,
          tankId,
          projectId: process.projectId,
          previousStatus: data.expectedCurrentStatus,
          newStatus: data.targetStatus,
          changedAt: now.toISOString(),
        },
      });
    });

    return TankProcessService.getProcessById(processId);
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
  static async deleteProcess(id: string, actorUserId?: string | null) {
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

    // Removing the last outstanding process changes whether every remaining process is
    // completed, so the same reconciliation runs — in one transaction with the delete.
    await pgsql.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.tankProcess.delete({ where: { id } });
      await reconcileProjectStatusFromProcesses(process.projectId, tx, { actorUserId, triggerProcessId: id });
    });
  }
}
