// Integration tests for the "Mark as Completed" direct-completion shortcut on TankProcess.
//
// Run with the local dev database (see server/CLAUDE.md — bun auto-loads .env.local, which
// points at the wrong DB host; use .env.development instead):
//
//   bun --env-file=.env.development test tests/integration/tank-process-complete-direct.test.ts
//
// These tests create their own throwaway Tank/TankProject/TankProcess fixtures (unique cuid-based
// identifiers) and delete them in afterAll, so they do not disturb existing seeded/dev data.

import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { Hono, Context } from "hono";
import { pgsql } from "@/lib/database";
import { ProcessStatusEnum, ProcessType, ChecklistSourceEnum, TankProjectStatusEnum, RoleEnum } from "generated/prisma";
import { TankProcessService, DIRECT_COMPLETE_ELIGIBLE_STATUSES } from "@/modules/tank-processes/tank-process.service";
import { TankProcessController } from "@/modules/tank-processes/tank-process.controller";
import { requirePermission } from "@/middlewares/permission.middleware";
import { PERMISSIONS, getPermissionsForRole } from "@/config/constant/permission.constant";
import { errorHandler } from "@/middlewares/error.middleware";

// Builds a minimal Hono app mounting the real route wiring for the direct-complete action
// (the same `requirePermission` + controller used by src/routes/v1/tank-processes.route.ts),
// with a stub identity middleware standing in for `protect` so tests don't need a real
// login/session/Redis round trip while still exercising the actual permission check.
function buildTestApp(role: RoleEnum) {
  const app = new Hono();
  app.use("*", async (c: Context, next: () => Promise<void>) => {
    // A real user row: completing a process can reconcile its project, and that transition is
    // written to user_activity_logs, which carries a foreign key to users.
    c.set("user", { id: actorUserId, role, permissions: getPermissionsForRole(role) });
    await next();
  });
  app.patch("/processes/:id/complete", requirePermission(PERMISSIONS.PROCESS_UPDATE), TankProcessController.completeDirect);
  app.onError(errorHandler);
  return app;
}

const TEST_TEMPLATE_CODE = "TEST-DIRECT-COMPLETE";
const TEST_TEMPLATE_CODE_2 = "TEST-DIRECT-COMPLETE-2";

let tankId: string;
let templateId: string;
let secondTemplateId: string;
let actorUserId: string;

async function createProject(status: TankProjectStatusEnum = TankProjectStatusEnum.PLANNED) {
  return pgsql.tankProject.create({
    data: { projectNo: `TEST-PRJ-${crypto.randomUUID()}`, tankId, status },
  });
}

async function createProcess(projectId: string, status: ProcessStatusEnum, startDate: Date | null = null) {
  return pgsql.tankProcess.create({
    data: {
      projectId,
      processTemplateId: templateId,
      name: "Direct Complete Test Process",
      type: ProcessType.WORK,
      sequenceOrder: 1,
      status,
      startDate,
    },
  });
}

beforeAll(async () => {
  const user = await pgsql.user.create({
    data: { email: `test-direct-complete-${crypto.randomUUID()}@example.test`, name: "Direct Complete Tester", role: RoleEnum.ADMIN },
  });
  actorUserId = user.id;

  const tank = await pgsql.tank.create({ data: { tankNo: `TEST-TANK-${crypto.randomUUID()}` } });
  tankId = tank.id;

  const template = await pgsql.processTemplate.upsert({
    where: { code: TEST_TEMPLATE_CODE },
    update: {},
    create: { code: TEST_TEMPLATE_CODE, name: "Direct Complete Test Template", type: ProcessType.WORK, sequenceOrder: 999 },
  });
  templateId = template.id;

  // Second template so a project can hold two processes (@@unique([projectId, processTemplateId])).
  const template2 = await pgsql.processTemplate.upsert({
    where: { code: TEST_TEMPLATE_CODE_2 },
    update: {},
    create: { code: TEST_TEMPLATE_CODE_2, name: "Direct Complete Test Template 2", type: ProcessType.WORK, sequenceOrder: 1000 },
  });
  secondTemplateId = template2.id;
});

afterAll(async () => {
  await pgsql.tank.delete({ where: { id: tankId } }); // cascades TankProject -> TankProcess -> ChecklistResult
  await pgsql.user.delete({ where: { id: actorUserId } }).catch(() => {}); // cascades activity logs
  await pgsql.processTemplate.delete({ where: { id: templateId } }).catch(() => {});
  await pgsql.processTemplate.delete({ where: { id: secondTemplateId } }).catch(() => {});
  await pgsql.$disconnect();
});

describe("DIRECT_COMPLETE_ELIGIBLE_STATUSES", () => {
  test("permits exactly NOT_STARTED, IN_PROGRESS, WAITING_REVIEW, REVIEWED (case 12)", () => {
    expect(new Set(DIRECT_COMPLETE_ELIGIBLE_STATUSES)).toEqual(
      new Set([ProcessStatusEnum.NOT_STARTED, ProcessStatusEnum.IN_PROGRESS, ProcessStatusEnum.WAITING_REVIEW, ProcessStatusEnum.REVIEWED]),
    );
    expect(DIRECT_COMPLETE_ELIGIBLE_STATUSES).not.toContain(ProcessStatusEnum.COMPLETED);
  });
});

describe("TankProcessService.completeDirect", () => {
  test("NOT_STARTED -> COMPLETED succeeds and sets startDate = finishDate (cases 1, 7)", async () => {
    const project = await createProject(TankProjectStatusEnum.PLANNED);
    const process = await createProcess(project.id, ProcessStatusEnum.NOT_STARTED, null);

    const updated = await TankProcessService.completeDirect(process.id);

    expect(updated.status).toBe(ProcessStatusEnum.COMPLETED);
    expect(updated.startDate).not.toBeNull();
    expect(updated.finishDate).not.toBeNull();
    expect(updated.startDate!.getTime()).toBe(updated.finishDate!.getTime());

    // The project moves PLANNED -> IN_PROGRESS as the process starts, then straight on to
    // COMPLETED: this was its only process, and reconcileProjectStatusFromProcesses runs in the
    // same transaction (src/services/project-status.service.ts).
    const refreshedProject = await pgsql.tankProject.findUniqueOrThrow({ where: { id: project.id } });
    expect(refreshedProject.status).toBe(TankProjectStatusEnum.COMPLETED);
    expect(refreshedProject.actualFinishDate).not.toBeNull();
  });

  test("a project keeps running while another process is still outstanding", async () => {
    const project = await createProject(TankProjectStatusEnum.PLANNED);
    const first = await createProcess(project.id, ProcessStatusEnum.NOT_STARTED, null);
    await pgsql.tankProcess.create({
      data: {
        projectId: project.id,
        processTemplateId: secondTemplateId,
        name: "Outstanding Process",
        type: ProcessType.WORK,
        sequenceOrder: 2,
        status: ProcessStatusEnum.NOT_STARTED,
      },
    });

    await TankProcessService.completeDirect(first.id);

    const refreshedProject = await pgsql.tankProject.findUniqueOrThrow({ where: { id: project.id } });
    expect(refreshedProject.status).toBe(TankProjectStatusEnum.IN_PROGRESS);
    expect(refreshedProject.actualFinishDate).toBeNull();
  });

  test("IN_PROGRESS -> COMPLETED succeeds and preserves existing startDate (cases 2, 8)", async () => {
    const project = await createProject();
    const existingStart = new Date("2026-01-05T08:00:00Z");
    const process = await createProcess(project.id, ProcessStatusEnum.IN_PROGRESS, existingStart);

    const updated = await TankProcessService.completeDirect(process.id);

    expect(updated.status).toBe(ProcessStatusEnum.COMPLETED);
    expect(updated.startDate!.getTime()).toBe(existingStart.getTime());
    expect(updated.finishDate).not.toBeNull();
    expect(updated.finishDate!.getTime()).not.toBe(existingStart.getTime());
  });

  test("WAITING_REVIEW -> COMPLETED succeeds (case 3)", async () => {
    const project = await createProject();
    const process = await createProcess(project.id, ProcessStatusEnum.WAITING_REVIEW, new Date());

    const updated = await TankProcessService.completeDirect(process.id);
    expect(updated.status).toBe(ProcessStatusEnum.COMPLETED);
  });

  test("REVIEWED -> COMPLETED succeeds (case 4)", async () => {
    const project = await createProject();
    const process = await createProcess(project.id, ProcessStatusEnum.REVIEWED, new Date());

    const updated = await TankProcessService.completeDirect(process.id);
    expect(updated.status).toBe(ProcessStatusEnum.COMPLETED);
  });

  test("succeeds with incomplete required checklist items, which remain unchanged (cases 5, 6)", async () => {
    const project = await createProject();
    const process = await createProcess(project.id, ProcessStatusEnum.WAITING_REVIEW, new Date());
    const checklist = await pgsql.checklistResult.create({
      data: {
        tankProcessId: process.id,
        source: ChecklistSourceEnum.CUSTOM,
        customName: "Incomplete custom item",
        isRequired: true,
        // status defaults to NOT_CHECKED
      },
    });

    const updated = await TankProcessService.completeDirect(process.id);
    expect(updated.status).toBe(ProcessStatusEnum.COMPLETED);

    const refreshedChecklist = await pgsql.checklistResult.findUniqueOrThrow({ where: { id: checklist.id } });
    expect(refreshedChecklist.status).toBe("NOT_CHECKED");
  });

  test("retrying an already-COMPLETED process is idempotent and does not overwrite completedAt (case 11)", async () => {
    const project = await createProject();
    const process = await createProcess(project.id, ProcessStatusEnum.REVIEWED, new Date());

    const first = await TankProcessService.completeDirect(process.id);
    const originalFinishDate = first.finishDate!.getTime();

    // Small delay so a bug that re-stamps finishDate would be detectable.
    await new Promise((r) => setTimeout(r, 10));

    const second = await TankProcessService.completeDirect(process.id);
    expect(second.status).toBe(ProcessStatusEnum.COMPLETED);
    expect(second.finishDate!.getTime()).toBe(originalFinishDate);
  });

  test("missing process throws a 404-style HTTPException (case 10)", async () => {
    await expect(TankProcessService.completeDirect("does-not-exist")).rejects.toMatchObject({ status: 404 });
  });
});

describe("PATCH /processes/:id/complete (HTTP layer)", () => {
  test("authorized role (INSPECTOR, has process.update) succeeds end-to-end", async () => {
    const project = await createProject();
    const process = await createProcess(project.id, ProcessStatusEnum.NOT_STARTED, null);

    const app = buildTestApp(RoleEnum.INSPECTOR);
    const res = await app.request(`/processes/${process.id}/complete`, { method: "PATCH" });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.status).toBe(ProcessStatusEnum.COMPLETED);
  });

  test("unauthorized role (USER, lacks process.update) receives 403 (case 9)", async () => {
    const project = await createProject();
    const process = await createProcess(project.id, ProcessStatusEnum.NOT_STARTED, null);

    const app = buildTestApp(RoleEnum.USER);
    const res = await app.request(`/processes/${process.id}/complete`, { method: "PATCH" });
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.success).toBe(false);

    // Bypass must not have leaked through despite the rejection.
    const refreshed = await pgsql.tankProcess.findUniqueOrThrow({ where: { id: process.id } });
    expect(refreshed.status).toBe(ProcessStatusEnum.NOT_STARTED);
  });

  test("missing process returns the standard not-found envelope (case 10)", async () => {
    const app = buildTestApp(RoleEnum.INSPECTOR);
    const res = await app.request(`/processes/does-not-exist/complete`, { method: "PATCH" });
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.success).toBe(false);
  });
});
