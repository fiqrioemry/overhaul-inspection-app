// Integration tests for the project-status invariant: a project is COMPLETED exactly while it
// has at least one process and every one of them is COMPLETED.
//
// Run with the local dev database (see server/CLAUDE.md — bun auto-loads .env.local, which
// points at the wrong DB host; use .env.development instead):
//
//   bun --env-file=.env.development test tests/integration/project-status-reconciliation.test.ts
//
// Fixtures are throwaway User/Tank/TankProject/TankProcess rows with cuid-based identifiers,
// deleted in afterAll.
//
// Note on "soft-deleted/inactive process": tank_processes has no deleted_at column (removal is
// a hard delete — see TankProcessRepository.delete), so every row on a project is active. The
// membership tests cover removal instead.

import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pgsql } from "@/lib/database";
import {
  ChecklistSourceEnum,
  ChecklistStatusEnum,
  ProcessStatusEnum,
  ProcessType,
  RoleEnum,
  TankAssetStatusEnum,
  TankProjectStatusEnum,
} from "generated/prisma";
import { TankProcessService } from "@/modules/tank-processes/tank-process.service";
import { TankProjectService } from "@/modules/tank-projects/tank-project.service";
import { reconcileProjectStatusFromProcesses } from "@/services/project-status.service";
import { tankProjectAction } from "@/config/constant/tank-project.constant";

const MIGRATION_SQL_PATH = join(
  import.meta.dir,
  "../../prisma/migrations/20260814000000_reconcile_project_status_from_processes/migration.sql",
);

let tankId: string;
let actorUserId: string;
const templateIds: string[] = [];

async function createTemplate(sequenceOrder: number) {
  const template = await pgsql.processTemplate.create({
    data: { code: `TEST-RECON-${crypto.randomUUID()}`, name: `Recon Template ${sequenceOrder}`, type: ProcessType.WORK, sequenceOrder },
  });
  templateIds.push(template.id);
  return template.id;
}

async function createProject(status: TankProjectStatusEnum = TankProjectStatusEnum.IN_PROGRESS, tank: string = tankId) {
  return pgsql.tankProject.create({ data: { projectNo: `TEST-RECON-PRJ-${crypto.randomUUID()}`, tankId: tank, status } });
}

async function createProcess(projectId: string, status: ProcessStatusEnum, sequenceOrder = 1, templateId?: string) {
  return pgsql.tankProcess.create({
    data: {
      projectId,
      processTemplateId: templateId ?? (await createTemplate(sequenceOrder)),
      name: `Recon Process ${sequenceOrder}`,
      type: ProcessType.WORK,
      sequenceOrder,
      status,
      startDate: status === ProcessStatusEnum.NOT_STARTED ? null : new Date("2026-01-05T08:00:00Z"),
      finishDate: status === ProcessStatusEnum.COMPLETED ? new Date("2026-02-05T08:00:00Z") : null,
    },
  });
}

function projectStatus(id: string) {
  return pgsql.tankProject.findUniqueOrThrow({ where: { id }, select: { status: true, actualFinishDate: true, startDate: true } });
}

/** Runs the shipped backfill migration verbatim, the way `prisma migrate deploy` does. */
async function runBackfillMigration() {
  const sql = readFileSync(MIGRATION_SQL_PATH, "utf8");
  // Strip comments, then split on statement terminators — the file holds plain UPDATEs.
  const statements = sql
    .split("\n")
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n")
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);
  for (const statement of statements) {
    await pgsql.$executeRawUnsafe(statement);
  }
}

beforeAll(async () => {
  const user = await pgsql.user.create({
    data: { email: `test-recon-${crypto.randomUUID()}@example.test`, name: "Reconciliation Tester", role: RoleEnum.ADMIN },
  });
  actorUserId = user.id;
  const tank = await pgsql.tank.create({ data: { tankNo: `TEST-TANK-RECON-${crypto.randomUUID()}` } });
  tankId = tank.id;
});

afterAll(async () => {
  await pgsql.tank.delete({ where: { id: tankId } }).catch(() => {}); // cascades project -> process -> checklist
  await pgsql.user.delete({ where: { id: actorUserId } }).catch(() => {}); // cascades activity logs
  await pgsql.processTemplate.deleteMany({ where: { id: { in: templateIds } } }).catch(() => {});
  await pgsql.$disconnect();
});

describe("reconcileProjectStatusFromProcesses — the invariant", () => {
  test("completing the final incomplete process completes the project (case 1)", async () => {
    const project = await createProject(TankProjectStatusEnum.IN_PROGRESS);
    const done = await createProcess(project.id, ProcessStatusEnum.COMPLETED, 1);
    const last = await createProcess(project.id, ProcessStatusEnum.REVIEWED, 2);

    await pgsql.tankProcess.update({ where: { id: last.id }, data: { status: ProcessStatusEnum.COMPLETED } });
    await pgsql.$transaction((tx) => reconcileProjectStatusFromProcesses(project.id, tx));

    const after = await projectStatus(project.id);
    expect(after.status).toBe(TankProjectStatusEnum.COMPLETED);
    expect(after.actualFinishDate).not.toBeNull();
    expect(done.status).toBe(ProcessStatusEnum.COMPLETED);
  });

  test("a project with one process still outstanding stays IN_PROGRESS (case 2)", async () => {
    const project = await createProject(TankProjectStatusEnum.IN_PROGRESS);
    await createProcess(project.id, ProcessStatusEnum.COMPLETED, 1);
    await createProcess(project.id, ProcessStatusEnum.IN_PROGRESS, 2);

    await pgsql.$transaction((tx) => reconcileProjectStatusFromProcesses(project.id, tx));

    expect((await projectStatus(project.id)).status).toBe(TankProjectStatusEnum.IN_PROGRESS);
  });

  test("a project with zero processes never completes — every([]) is not enough (case 3)", async () => {
    const project = await createProject(TankProjectStatusEnum.IN_PROGRESS);

    const result = await pgsql.$transaction((tx) => reconcileProjectStatusFromProcesses(project.id, tx));

    expect(result).toBeNull();
    expect((await projectStatus(project.id)).status).toBe(TankProjectStatusEnum.IN_PROGRESS);
  });

  test("a genuinely PLANNED project is not started merely because processes exist (case 4)", async () => {
    const project = await createProject(TankProjectStatusEnum.PLANNED);
    await createProcess(project.id, ProcessStatusEnum.NOT_STARTED, 1);
    await createProcess(project.id, ProcessStatusEnum.NOT_STARTED, 2);

    const result = await pgsql.$transaction((tx) => reconcileProjectStatusFromProcesses(project.id, tx));

    expect(result).toBeNull();
    expect((await projectStatus(project.id)).status).toBe(TankProjectStatusEnum.PLANNED);
  });

  test("a PLANNED project whose processes are all completed still completes", async () => {
    const project = await createProject(TankProjectStatusEnum.PLANNED);
    await createProcess(project.id, ProcessStatusEnum.COMPLETED, 1);

    await pgsql.$transaction((tx) => reconcileProjectStatusFromProcesses(project.id, tx));

    expect((await projectStatus(project.id)).status).toBe(TankProjectStatusEnum.COMPLETED);
  });

  test("a CANCELLED project is never overwritten (case 15)", async () => {
    const project = await createProject(TankProjectStatusEnum.CANCELLED);
    await createProcess(project.id, ProcessStatusEnum.COMPLETED, 1);

    const result = await pgsql.$transaction((tx) => reconcileProjectStatusFromProcesses(project.id, tx));

    expect(result).toBeNull();
    expect((await projectStatus(project.id)).status).toBe(TankProjectStatusEnum.CANCELLED);
  });

  test("no audit entry is written when the status is already correct (case 14)", async () => {
    const project = await createProject(TankProjectStatusEnum.COMPLETED);
    await createProcess(project.id, ProcessStatusEnum.COMPLETED, 1);
    const before = await pgsql.userActivityLog.count({ where: { userId: actorUserId, action: tankProjectAction.PROCESS_STATUS_RECONCILIATION } });

    const result = await pgsql.$transaction((tx) => reconcileProjectStatusFromProcesses(project.id, tx, { actorUserId }));

    expect(result).toBeNull();
    expect(await pgsql.userActivityLog.count({ where: { userId: actorUserId, action: tankProjectAction.PROCESS_STATUS_RECONCILIATION } })).toBe(before);
  });

  test("an automatic transition is recorded in the activity log (audit)", async () => {
    const project = await createProject(TankProjectStatusEnum.IN_PROGRESS);
    const process = await createProcess(project.id, ProcessStatusEnum.COMPLETED, 1);

    await pgsql.$transaction((tx) =>
      reconcileProjectStatusFromProcesses(project.id, tx, { actorUserId, triggerProcessId: process.id, triggerProcessStatus: ProcessStatusEnum.COMPLETED }),
    );

    const log = await pgsql.userActivityLog.findFirst({
      where: { userId: actorUserId, action: tankProjectAction.PROCESS_STATUS_RECONCILIATION },
      orderBy: { createdAt: "desc" },
    });
    expect(log!.metadata).toMatchObject({
      source: "PROCESS_STATUS_RECONCILIATION",
      projectId: project.id,
      tankId,
      previousStatus: TankProjectStatusEnum.IN_PROGRESS,
      newStatus: TankProjectStatusEnum.COMPLETED,
      triggerProcessId: process.id,
    });
  });
});

describe("reconciliation through every process-status mutation path", () => {
  test("the normal workflow REVIEWED -> COMPLETED completes the project (case 5)", async () => {
    const project = await createProject(TankProjectStatusEnum.IN_PROGRESS);
    const process = await createProcess(project.id, ProcessStatusEnum.REVIEWED, 1);

    await TankProcessService.updateStatus(process.id, { status: ProcessStatusEnum.COMPLETED }, actorUserId);

    expect((await projectStatus(project.id)).status).toBe(TankProjectStatusEnum.COMPLETED);
  });

  test("direct completion completes the project (case 6)", async () => {
    const project = await createProject(TankProjectStatusEnum.IN_PROGRESS);
    const process = await createProcess(project.id, ProcessStatusEnum.IN_PROGRESS, 1);

    await TankProcessService.completeDirect(process.id, actorUserId);

    expect((await projectStatus(project.id)).status).toBe(TankProjectStatusEnum.COMPLETED);
  });

  test("manual correction to COMPLETED completes the project (case 7)", async () => {
    const project = await createProject(TankProjectStatusEnum.IN_PROGRESS);
    const process = await createProcess(project.id, ProcessStatusEnum.NOT_STARTED, 1);

    await TankProcessService.correctStatusManually(
      tankId,
      process.id,
      { targetStatus: ProcessStatusEnum.COMPLETED, expectedCurrentStatus: ProcessStatusEnum.NOT_STARTED },
      actorUserId,
    );

    expect((await projectStatus(project.id)).status).toBe(TankProjectStatusEnum.COMPLETED);
  });

  test("manual correction COMPLETED -> IN_PROGRESS reopens the project and clears its finish date (case 8)", async () => {
    const project = await createProject(TankProjectStatusEnum.IN_PROGRESS);
    const process = await createProcess(project.id, ProcessStatusEnum.COMPLETED, 1);
    await pgsql.$transaction((tx) => reconcileProjectStatusFromProcesses(project.id, tx));
    const completed = await projectStatus(project.id);
    expect(completed.status).toBe(TankProjectStatusEnum.COMPLETED);
    expect(completed.actualFinishDate).not.toBeNull();

    await TankProcessService.correctStatusManually(
      tankId,
      process.id,
      { targetStatus: ProcessStatusEnum.IN_PROGRESS, expectedCurrentStatus: ProcessStatusEnum.COMPLETED },
      actorUserId,
    );

    const after = await projectStatus(project.id);
    expect(after.status).toBe(TankProjectStatusEnum.IN_PROGRESS);
    expect(after.actualFinishDate).toBeNull();
  });

  test("manual correction COMPLETED -> NOT_STARTED reopens to IN_PROGRESS, never PLANNED (case 9)", async () => {
    const project = await createProject(TankProjectStatusEnum.IN_PROGRESS);
    const process = await createProcess(project.id, ProcessStatusEnum.COMPLETED, 1);
    await pgsql.$transaction((tx) => reconcileProjectStatusFromProcesses(project.id, tx));

    await TankProcessService.correctStatusManually(
      tankId,
      process.id,
      { targetStatus: ProcessStatusEnum.NOT_STARTED, expectedCurrentStatus: ProcessStatusEnum.COMPLETED },
      actorUserId,
    );

    expect((await projectStatus(project.id)).status).toBe(TankProjectStatusEnum.IN_PROGRESS);
  });

  test("reopening one process changes no sibling process and no checklist result (cases 10, 11)", async () => {
    const project = await createProject(TankProjectStatusEnum.IN_PROGRESS);
    const first = await createProcess(project.id, ProcessStatusEnum.COMPLETED, 1);
    const sibling = await createProcess(project.id, ProcessStatusEnum.COMPLETED, 2);
    const checklist = await pgsql.checklistResult.create({
      data: {
        tankProcessId: first.id,
        source: ChecklistSourceEnum.CUSTOM,
        customName: "Passed item",
        isRequired: true,
        status: ChecklistStatusEnum.PASSED,
      },
    });
    await pgsql.$transaction((tx) => reconcileProjectStatusFromProcesses(project.id, tx));

    await TankProcessService.correctStatusManually(
      tankId,
      first.id,
      { targetStatus: ProcessStatusEnum.IN_PROGRESS, expectedCurrentStatus: ProcessStatusEnum.COMPLETED },
      actorUserId,
    );

    expect((await pgsql.tankProcess.findUniqueOrThrow({ where: { id: sibling.id } })).status).toBe(ProcessStatusEnum.COMPLETED);
    expect((await pgsql.checklistResult.findUniqueOrThrow({ where: { id: checklist.id } })).status).toBe(ChecklistStatusEnum.PASSED);
    expect((await projectStatus(project.id)).status).toBe(TankProjectStatusEnum.IN_PROGRESS);
  });

  test("a failed process update leaves the project status untouched — both writes are one transaction (case 12)", async () => {
    const project = await createProject(TankProjectStatusEnum.IN_PROGRESS);
    const process = await createProcess(project.id, ProcessStatusEnum.COMPLETED, 1);
    await pgsql.$transaction((tx) => reconcileProjectStatusFromProcesses(project.id, tx));
    expect((await projectStatus(project.id)).status).toBe(TankProjectStatusEnum.COMPLETED);

    // Rejected on the stale expectedCurrentStatus, after the guard but before any write.
    await expect(
      TankProcessService.correctStatusManually(
        tankId,
        process.id,
        { targetStatus: ProcessStatusEnum.IN_PROGRESS, expectedCurrentStatus: ProcessStatusEnum.REVIEWED },
        actorUserId,
      ),
    ).rejects.toMatchObject({ status: 409 });

    expect((await projectStatus(project.id)).status).toBe(TankProjectStatusEnum.COMPLETED);
    expect((await pgsql.tankProcess.findUniqueOrThrow({ where: { id: process.id } })).status).toBe(ProcessStatusEnum.COMPLETED);
  });

  test("two processes completed concurrently still complete the project (case 13)", async () => {
    const project = await createProject(TankProjectStatusEnum.IN_PROGRESS);
    const a = await createProcess(project.id, ProcessStatusEnum.IN_PROGRESS, 1);
    const b = await createProcess(project.id, ProcessStatusEnum.IN_PROGRESS, 2);

    // Both run at once: without the project row lock each would count the other's process as
    // still outstanding and leave the project IN_PROGRESS forever.
    await Promise.all([TankProcessService.completeDirect(a.id, actorUserId), TankProcessService.completeDirect(b.id, actorUserId)]);

    expect((await pgsql.tankProcess.findUniqueOrThrow({ where: { id: a.id } })).status).toBe(ProcessStatusEnum.COMPLETED);
    expect((await pgsql.tankProcess.findUniqueOrThrow({ where: { id: b.id } })).status).toBe(ProcessStatusEnum.COMPLETED);
    expect((await projectStatus(project.id)).status).toBe(TankProjectStatusEnum.COMPLETED);
  });

  test("the tank's asset status follows the project it derives from", async () => {
    const tank = await pgsql.tank.create({ data: { tankNo: `TEST-TANK-RECON-ASSET-${crypto.randomUUID()}`, assetStatus: TankAssetStatusEnum.UNDER_OVERHAUL } });
    const project = await createProject(TankProjectStatusEnum.IN_PROGRESS, tank.id);
    const process = await createProcess(project.id, ProcessStatusEnum.IN_PROGRESS, 1);

    await TankProcessService.completeDirect(process.id, actorUserId);

    expect((await projectStatus(project.id)).status).toBe(TankProjectStatusEnum.COMPLETED);
    expect((await pgsql.tank.findUniqueOrThrow({ where: { id: tank.id } })).assetStatus).toBe(TankAssetStatusEnum.OPERATIONAL);

    // Reopening puts the tank back under overhaul.
    await TankProcessService.correctStatusManually(
      tank.id,
      process.id,
      { targetStatus: ProcessStatusEnum.IN_PROGRESS, expectedCurrentStatus: ProcessStatusEnum.COMPLETED },
      actorUserId,
    );
    expect((await pgsql.tank.findUniqueOrThrow({ where: { id: tank.id } })).assetStatus).toBe(TankAssetStatusEnum.UNDER_OVERHAUL);

    await pgsql.tank.delete({ where: { id: tank.id } });
  });
});

describe("process membership changes", () => {
  test("removing the last incomplete process completes the project (case 17)", async () => {
    const project = await createProject(TankProjectStatusEnum.IN_PROGRESS);
    await createProcess(project.id, ProcessStatusEnum.COMPLETED, 1);
    const outstanding = await createProcess(project.id, ProcessStatusEnum.NOT_STARTED, 2);

    await TankProcessService.deleteProcess(outstanding.id, actorUserId);

    expect((await projectStatus(project.id)).status).toBe(TankProjectStatusEnum.COMPLETED);
  });

  test("removing every process does not complete the project (case 18)", async () => {
    const project = await createProject(TankProjectStatusEnum.IN_PROGRESS);
    const only = await createProcess(project.id, ProcessStatusEnum.NOT_STARTED, 1);

    await TankProcessService.deleteProcess(only.id, actorUserId);

    expect(await pgsql.tankProcess.count({ where: { projectId: project.id } })).toBe(0);
    expect((await projectStatus(project.id)).status).toBe(TankProjectStatusEnum.IN_PROGRESS);
  });

  test("adding a process to a COMPLETED project is refused by the existing guard (case 16)", async () => {
    const project = await createProject(TankProjectStatusEnum.IN_PROGRESS);
    await createProcess(project.id, ProcessStatusEnum.COMPLETED, 1);
    await pgsql.$transaction((tx) => reconcileProjectStatusFromProcesses(project.id, tx));
    expect((await projectStatus(project.id)).status).toBe(TankProjectStatusEnum.COMPLETED);

    // Pre-existing rule (TankProjectService.generateProcesses): a completed project takes no new
    // processes at all, so "adding reopens it" is unreachable rather than unhandled. Reopen the
    // process first, then add.
    await expect(TankProjectService.generateProcesses(project.id, [await createTemplate(9)], actorUserId)).rejects.toMatchObject({ status: 422 });
    expect((await projectStatus(project.id)).status).toBe(TankProjectStatusEnum.COMPLETED);
  });
});

describe("backfill migration", () => {
  test("corrects existing inconsistent records in both directions (case 19)", async () => {
    // IN_PROGRESS but everything is done.
    const staleOpen = await createProject(TankProjectStatusEnum.IN_PROGRESS);
    await createProcess(staleOpen.id, ProcessStatusEnum.COMPLETED, 1);
    await createProcess(staleOpen.id, ProcessStatusEnum.COMPLETED, 2);
    // COMPLETED but work remains.
    const staleClosed = await createProject(TankProjectStatusEnum.COMPLETED);
    await createProcess(staleClosed.id, ProcessStatusEnum.COMPLETED, 1);
    await createProcess(staleClosed.id, ProcessStatusEnum.IN_PROGRESS, 2);
    // COMPLETED with no processes at all — must not stay completed.
    const emptyClosed = await createProject(TankProjectStatusEnum.COMPLETED);
    // Correct already, and must not move.
    const healthy = await createProject(TankProjectStatusEnum.IN_PROGRESS);
    await createProcess(healthy.id, ProcessStatusEnum.IN_PROGRESS, 1);
    // Terminal status with all processes done — must not be overwritten.
    const cancelled = await createProject(TankProjectStatusEnum.CANCELLED);
    await createProcess(cancelled.id, ProcessStatusEnum.COMPLETED, 1);

    await runBackfillMigration();

    expect((await projectStatus(staleOpen.id)).status).toBe(TankProjectStatusEnum.COMPLETED);
    expect((await projectStatus(staleOpen.id)).actualFinishDate).not.toBeNull();
    expect((await projectStatus(staleClosed.id)).status).toBe(TankProjectStatusEnum.IN_PROGRESS);
    expect((await projectStatus(staleClosed.id)).actualFinishDate).toBeNull();
    expect((await projectStatus(emptyClosed.id)).status).toBe(TankProjectStatusEnum.IN_PROGRESS);
    expect((await projectStatus(healthy.id)).status).toBe(TankProjectStatusEnum.IN_PROGRESS);
    expect((await projectStatus(cancelled.id)).status).toBe(TankProjectStatusEnum.CANCELLED);

    // Process statuses and checklist results are never touched by the backfill.
    const processes = await pgsql.tankProcess.findMany({ where: { projectId: staleClosed.id }, orderBy: { sequenceOrder: "asc" } });
    expect(processes.map((p) => p.status)).toEqual([ProcessStatusEnum.COMPLETED, ProcessStatusEnum.IN_PROGRESS]);
  });

  test("is idempotent — a second run changes nothing (case 20)", async () => {
    const project = await createProject(TankProjectStatusEnum.IN_PROGRESS);
    await createProcess(project.id, ProcessStatusEnum.COMPLETED, 1);

    await runBackfillMigration();
    const first = await pgsql.tankProject.findUniqueOrThrow({ where: { id: project.id }, select: { status: true, actualFinishDate: true, updatedAt: true } });
    expect(first.status).toBe(TankProjectStatusEnum.COMPLETED);

    await new Promise((r) => setTimeout(r, 10));
    await runBackfillMigration();
    const second = await pgsql.tankProject.findUniqueOrThrow({ where: { id: project.id }, select: { status: true, actualFinishDate: true, updatedAt: true } });

    expect(second.status).toBe(first.status);
    expect(second.actualFinishDate!.getTime()).toBe(first.actualFinishDate!.getTime());
    // No write at all on the second pass, so updated_at is untouched.
    expect(second.updatedAt.getTime()).toBe(first.updatedAt.getTime());
  });
});
