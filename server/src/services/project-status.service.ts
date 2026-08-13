import { Prisma, ProcessStatusEnum, TankProjectStatusEnum } from "generated/prisma";
import { UserRepository } from "@/modules/users/user.repository";
import { tankProjectAction } from "@/config/constant/tank-project.constant";
import { recalculateTankAssetStatus } from "./tank-asset-status.service";

/**
 * Statuses a reconciliation must never overwrite. CANCELLED is a deliberate operator decision
 * about the engagement as a whole; the state of its processes does not undo it.
 * (TankProjectStatusEnum has no ARCHIVED/DELETED member — removal is the deletedAt soft delete,
 * which is filtered out separately.)
 */
const TERMINAL_PROJECT_STATUSES: TankProjectStatusEnum[] = [TankProjectStatusEnum.CANCELLED];

export interface ProjectReconciliationResult {
  projectId: string;
  previousStatus: TankProjectStatusEnum;
  newStatus: TankProjectStatusEnum;
}

export interface ProjectReconciliationContext {
  /** Set when a user action triggered the reconciliation, for the audit entry. */
  actorUserId?: string | null;
  triggerProcessId?: string | null;
  triggerProcessStatus?: ProcessStatusEnum | null;
}

/**
 * Derive a project's status from its processes and persist it when it disagrees.
 *
 *   at least one process AND every process COMPLETED  -> COMPLETED
 *   currently COMPLETED AND any process not COMPLETED -> IN_PROGRESS
 *   anything else                                     -> left alone
 *
 * A project with zero processes is never completed — `completed === total` is true for an empty
 * set, so the count is guarded explicitly. Reopening always lands on IN_PROGRESS, never PLANNED:
 * a project that has already been completed has demonstrably started. Conversely a genuinely
 * PLANNED project is not started merely because process rows exist, so PLANNED with all-
 * NOT_STARTED processes stays PLANNED.
 *
 * TankProcess has no soft-delete column (see TankProcessRepository.delete — removal is a hard
 * delete), so every row on the project is an active process.
 *
 * Must be called inside the same transaction as the process mutation that triggered it, so the
 * counts see that mutation and the two statuses can never be committed out of step.
 */
export async function reconcileProjectStatusFromProcesses(
  projectId: string,
  tx: Prisma.TransactionClient,
  context: ProjectReconciliationContext = {},
): Promise<ProjectReconciliationResult | null> {
  // Serialize reconciliation per project. Two transactions each completing the last outstanding
  // process would otherwise both count under READ COMMITTED without seeing the other's
  // uncommitted row, each conclude "not all completed", and leave the project stuck IN_PROGRESS.
  // Taking the project row lock first makes the second transaction wait and then observe the
  // first one's committed process. Raw SQL because Prisma exposes no FOR UPDATE.
  await tx.$queryRaw`SELECT "id" FROM "tank_projects" WHERE "id" = ${projectId} FOR UPDATE`;

  const project = await tx.tankProject.findFirst({
    where: { id: projectId, deletedAt: null },
    select: { id: true, status: true, tankId: true },
  });
  if (!project) return null;
  if (TERMINAL_PROJECT_STATUSES.includes(project.status)) return null;

  // Two aggregates rather than loading the process rows — this runs on every status mutation.
  const [totalProcesses, completedProcesses] = await Promise.all([
    tx.tankProcess.count({ where: { projectId } }),
    tx.tankProcess.count({ where: { projectId, status: ProcessStatusEnum.COMPLETED } }),
  ]);

  const allCompleted = totalProcesses > 0 && completedProcesses === totalProcesses;
  let nextStatus: TankProjectStatusEnum | null = null;
  if (allCompleted) {
    nextStatus = TankProjectStatusEnum.COMPLETED;
  } else if (project.status === TankProjectStatusEnum.COMPLETED) {
    nextStatus = TankProjectStatusEnum.IN_PROGRESS;
  }

  // Already correct — no write, and no audit entry for a transition that did not happen.
  if (nextStatus === null || nextStatus === project.status) return null;

  await tx.tankProject.update({
    where: { id: projectId },
    data: {
      status: nextStatus,
      // actualFinishDate is the project's completion timestamp: stamped on completion, cleared
      // on reopen. startDate is never touched — the project started when it started, and there
      // is no existing convention that back-fills it at completion time.
      actualFinishDate: nextStatus === TankProjectStatusEnum.COMPLETED ? new Date() : null,
    },
  });

  // Tank.assetStatus is derived from whether the tank has an active project, and every existing
  // project-status write recalculates it (createProject/updateProject/deleteProject). An
  // automatic transition is no different: skipping it would leave a tank UNDER_OVERHAUL with no
  // active project.
  await recalculateTankAssetStatus(project.tankId, tx);

  if (context.actorUserId) {
    await UserRepository.createActivityLog(tx, {
      userId: context.actorUserId,
      action: tankProjectAction.PROCESS_STATUS_RECONCILIATION,
      metadata: {
        source: "PROCESS_STATUS_RECONCILIATION",
        projectId,
        tankId: project.tankId,
        previousStatus: project.status,
        newStatus: nextStatus,
        triggerProcessId: context.triggerProcessId ?? null,
        triggerProcessStatus: context.triggerProcessStatus ?? null,
        totalProcesses,
        completedProcesses,
        changedAt: new Date().toISOString(),
      },
    });
  }

  return { projectId, previousStatus: project.status, newStatus: nextStatus };
}
