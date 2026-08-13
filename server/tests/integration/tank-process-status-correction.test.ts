// Integration tests for the manual tank-process status correction:
// PATCH /tanks/:id/processes/:processId/status.
//
// Run with the local dev database (see server/CLAUDE.md — bun auto-loads .env.local, which
// points at the wrong DB host; use .env.development instead):
//
//   bun --env-file=.env.development test tests/integration/tank-process-status-correction.test.ts
//
// These tests create their own throwaway User/Tank/TankProject/TankProcess fixtures (unique
// cuid-based identifiers) and delete them in afterAll, so they do not disturb seeded/dev data.
//
// Note on "soft-deleted process": TankProcess has no deletedAt column (see
// TankProcessRepository.delete). The reachable equivalents — a soft-deleted owning project and
// a soft-deleted tank — are covered instead.

import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { Hono, Context } from "hono";
import { pgsql } from "@/lib/database";
import { ProcessStatusEnum, ProcessType, ChecklistSourceEnum, ChecklistStatusEnum, TankProjectStatusEnum, RoleEnum } from "generated/prisma";
import { TankProcessService, resolveCorrectedTimestamps } from "@/modules/tank-processes/tank-process.service";
import { TankProcessController } from "@/modules/tank-processes/tank-process.controller";
import { requirePermission } from "@/middlewares/permission.middleware";
import { PERMISSIONS, getPermissionsForRole } from "@/config/constant/permission.constant";
import { tankProcessAction } from "@/config/constant/tank-process.constant";
import { errorHandler } from "@/middlewares/error.middleware";

// Mirrors the real route wiring from src/routes/v1/tanks.route.ts (same requirePermission +
// controller), with a stub identity middleware standing in for `protect` so the tests exercise
// the actual permission check without a login/session/Redis round trip.
function buildTestApp(role: RoleEnum, userId: string) {
  const app = new Hono();
  app.use("*", async (c: Context, next: () => Promise<void>) => {
    c.set("user", { id: userId, role, permissions: getPermissionsForRole(role) });
    await next();
  });
  app.patch("/tanks/:id/processes/:processId/status", requirePermission(PERMISSIONS.PROCESS_UPDATE), TankProcessController.correctStatus);
  app.onError(errorHandler);
  return app;
}

const TEST_TEMPLATE_CODE = "TEST-STATUS-CORRECTION";
const TEST_TEMPLATE_CODE_2 = "TEST-STATUS-CORRECTION-2";

let tankId: string;
let templateId: string;
let templateId2: string;
let actorUserId: string;

async function createProject(status: TankProjectStatusEnum = TankProjectStatusEnum.IN_PROGRESS, tank: string = tankId) {
  return pgsql.tankProject.create({
    data: { projectNo: `TEST-PRJ-${crypto.randomUUID()}`, tankId: tank, status },
  });
}

async function createProcess(
  projectId: string,
  status: ProcessStatusEnum,
  options: { startDate?: Date | null; finishDate?: Date | null; templateId?: string; sequenceOrder?: number } = {},
) {
  return pgsql.tankProcess.create({
    data: {
      projectId,
      processTemplateId: options.templateId ?? templateId,
      name: "Status Correction Test Process",
      type: ProcessType.WORK,
      sequenceOrder: options.sequenceOrder ?? 1,
      status,
      startDate: options.startDate ?? null,
      finishDate: options.finishDate ?? null,
    },
  });
}

// Every correction goes through the service the controller calls, with the real actor id.
function correct(processId: string, targetStatus: ProcessStatusEnum, expectedCurrentStatus: ProcessStatusEnum, tank: string = tankId) {
  return TankProcessService.correctStatusManually(tank, processId, { targetStatus, expectedCurrentStatus }, actorUserId);
}

beforeAll(async () => {
  const user = await pgsql.user.create({
    data: { email: `test-correction-${crypto.randomUUID()}@example.test`, name: "Status Correction Tester", role: RoleEnum.ADMIN },
  });
  actorUserId = user.id;

  const tank = await pgsql.tank.create({ data: { tankNo: `TEST-TANK-${crypto.randomUUID()}` } });
  tankId = tank.id;

  const template = await pgsql.processTemplate.upsert({
    where: { code: TEST_TEMPLATE_CODE },
    update: {},
    create: { code: TEST_TEMPLATE_CODE, name: "Status Correction Test Template", type: ProcessType.WORK, sequenceOrder: 998 },
  });
  templateId = template.id;

  // Second template so a project can hold two processes (@@unique([projectId, processTemplateId])).
  const template2 = await pgsql.processTemplate.upsert({
    where: { code: TEST_TEMPLATE_CODE_2 },
    update: {},
    create: { code: TEST_TEMPLATE_CODE_2, name: "Status Correction Test Template 2", type: ProcessType.WORK, sequenceOrder: 999 },
  });
  templateId2 = template2.id;
});

afterAll(async () => {
  await pgsql.tank.deleteMany({ where: { tankNo: { startsWith: "TEST-TANK-" }, id: tankId } }); // cascades project -> process -> checklist
  await pgsql.user.delete({ where: { id: actorUserId } }).catch(() => {}); // cascades activity logs
  await pgsql.processTemplate.delete({ where: { id: templateId } }).catch(() => {});
  await pgsql.processTemplate.delete({ where: { id: templateId2 } }).catch(() => {});
  await pgsql.$disconnect();
});

describe("resolveCorrectedTimestamps", () => {
  const now = new Date("2026-08-14T10:00:00Z");
  const existingStart = new Date("2026-01-05T08:00:00Z");
  const existingFinish = new Date("2026-02-05T08:00:00Z");

  test("NOT_STARTED clears both timestamps (case 5)", () => {
    expect(resolveCorrectedTimestamps(ProcessStatusEnum.NOT_STARTED, { startDate: existingStart, finishDate: existingFinish }, now)).toEqual({
      startDate: null,
      finishDate: null,
    });
  });

  test("IN_PROGRESS / WAITING_REVIEW / REVIEWED keep startDate and clear finishDate (cases 2, 3)", () => {
    for (const target of [ProcessStatusEnum.IN_PROGRESS, ProcessStatusEnum.WAITING_REVIEW, ProcessStatusEnum.REVIEWED]) {
      expect(resolveCorrectedTimestamps(target, { startDate: existingStart, finishDate: existingFinish }, now)).toEqual({
        startDate: existingStart,
        finishDate: null,
      });
    }
  });

  test("a null startDate is stamped with the shared `now`, never left null except for NOT_STARTED (case 6)", () => {
    for (const target of [ProcessStatusEnum.IN_PROGRESS, ProcessStatusEnum.WAITING_REVIEW, ProcessStatusEnum.REVIEWED]) {
      expect(resolveCorrectedTimestamps(target, { startDate: null, finishDate: null }, now).startDate).toBe(now);
    }
  });

  test("COMPLETED keeps startDate and stamps finishDate; a missing startDate shares the same `now` (case 9)", () => {
    expect(resolveCorrectedTimestamps(ProcessStatusEnum.COMPLETED, { startDate: existingStart, finishDate: null }, now)).toEqual({
      startDate: existingStart,
      finishDate: now,
    });
    expect(resolveCorrectedTimestamps(ProcessStatusEnum.COMPLETED, { startDate: null, finishDate: null }, now)).toEqual({
      startDate: now,
      finishDate: now,
    });
  });
});

describe("TankProcessService.correctStatusManually — transitions", () => {
  test("COMPLETED -> IN_PROGRESS preserves startDate and clears finishDate (cases 1, 2, 3)", async () => {
    const project = await createProject();
    const existingStart = new Date("2026-01-05T08:00:00Z");
    const process = await createProcess(project.id, ProcessStatusEnum.COMPLETED, { startDate: existingStart, finishDate: new Date("2026-02-05T08:00:00Z") });

    const updated = await correct(process.id, ProcessStatusEnum.IN_PROGRESS, ProcessStatusEnum.COMPLETED);

    expect(updated.status).toBe(ProcessStatusEnum.IN_PROGRESS);
    expect(updated.startDate!.getTime()).toBe(existingStart.getTime());
    expect(updated.finishDate).toBeNull();
  });

  test("reopening a completed process leaves its checklist results untouched (case 4)", async () => {
    const project = await createProject();
    const process = await createProcess(project.id, ProcessStatusEnum.COMPLETED, { startDate: new Date(), finishDate: new Date() });
    const passed = await pgsql.checklistResult.create({
      data: {
        tankProcessId: process.id,
        source: ChecklistSourceEnum.CUSTOM,
        customName: "Already passed item",
        isRequired: true,
        status: ChecklistStatusEnum.PASSED,
        checkedAt: new Date("2026-03-01T08:00:00Z"),
      },
    });
    const unchecked = await pgsql.checklistResult.create({
      data: { tankProcessId: process.id, source: ChecklistSourceEnum.CUSTOM, customName: "Never checked item", isRequired: true },
    });

    await correct(process.id, ProcessStatusEnum.IN_PROGRESS, ProcessStatusEnum.COMPLETED);

    const refreshedPassed = await pgsql.checklistResult.findUniqueOrThrow({ where: { id: passed.id } });
    const refreshedUnchecked = await pgsql.checklistResult.findUniqueOrThrow({ where: { id: unchecked.id } });
    expect(refreshedPassed.status).toBe(ChecklistStatusEnum.PASSED);
    expect(refreshedPassed.checkedAt!.getTime()).toBe(new Date("2026-03-01T08:00:00Z").getTime());
    expect(refreshedUnchecked.status).toBe(ChecklistStatusEnum.NOT_CHECKED);
    expect(await pgsql.checklistResult.count({ where: { tankProcessId: process.id } })).toBe(2);
  });

  test("IN_PROGRESS -> NOT_STARTED clears startDate and finishDate (case 5)", async () => {
    const project = await createProject();
    const process = await createProcess(project.id, ProcessStatusEnum.IN_PROGRESS, { startDate: new Date("2026-01-05T08:00:00Z") });

    const updated = await correct(process.id, ProcessStatusEnum.NOT_STARTED, ProcessStatusEnum.IN_PROGRESS);

    expect(updated.status).toBe(ProcessStatusEnum.NOT_STARTED);
    expect(updated.startDate).toBeNull();
    expect(updated.finishDate).toBeNull();
  });

  test("NOT_STARTED -> IN_PROGRESS sets startDate (case 6)", async () => {
    const project = await createProject();
    const process = await createProcess(project.id, ProcessStatusEnum.NOT_STARTED);

    const updated = await correct(process.id, ProcessStatusEnum.IN_PROGRESS, ProcessStatusEnum.NOT_STARTED);

    expect(updated.status).toBe(ProcessStatusEnum.IN_PROGRESS);
    expect(updated.startDate).not.toBeNull();
    expect(updated.finishDate).toBeNull();
  });

  test("NOT_STARTED -> WAITING_REVIEW succeeds without any checklist item passing (cases 7, 11)", async () => {
    const project = await createProject();
    const process = await createProcess(project.id, ProcessStatusEnum.NOT_STARTED);
    const item = await pgsql.checklistResult.create({
      data: { tankProcessId: process.id, source: ChecklistSourceEnum.CUSTOM, customName: "Required, never checked", isRequired: true },
    });

    const updated = await correct(process.id, ProcessStatusEnum.WAITING_REVIEW, ProcessStatusEnum.NOT_STARTED);

    expect(updated.status).toBe(ProcessStatusEnum.WAITING_REVIEW);
    expect(updated.startDate).not.toBeNull();
    // The normal workflow refuses this transition while a required item is NOT_CHECKED; the
    // correction path skips that guard and still must not touch the item.
    expect((await pgsql.checklistResult.findUniqueOrThrow({ where: { id: item.id } })).status).toBe(ChecklistStatusEnum.NOT_CHECKED);
  });

  test("NOT_STARTED -> REVIEWED succeeds without a review step (cases 8, 11)", async () => {
    const project = await createProject();
    const process = await createProcess(project.id, ProcessStatusEnum.NOT_STARTED);
    await pgsql.checklistResult.create({
      data: { tankProcessId: process.id, source: ChecklistSourceEnum.CUSTOM, customName: "Required, never checked", isRequired: true },
    });

    const updated = await correct(process.id, ProcessStatusEnum.REVIEWED, ProcessStatusEnum.NOT_STARTED);

    expect(updated.status).toBe(ProcessStatusEnum.REVIEWED);
    expect(updated.startDate).not.toBeNull();
    expect(updated.finishDate).toBeNull();
  });

  test("NOT_STARTED -> COMPLETED sets both timestamps to the same instant (case 9)", async () => {
    const project = await createProject();
    const process = await createProcess(project.id, ProcessStatusEnum.NOT_STARTED);

    const updated = await correct(process.id, ProcessStatusEnum.COMPLETED, ProcessStatusEnum.NOT_STARTED);

    expect(updated.status).toBe(ProcessStatusEnum.COMPLETED);
    expect(updated.startDate).not.toBeNull();
    expect(updated.finishDate).not.toBeNull();
    expect(updated.startDate!.getTime()).toBe(updated.finishDate!.getTime());
  });

  test("REVIEWED -> COMPLETED preserves startDate and stamps finishDate (case 10)", async () => {
    const project = await createProject();
    const existingStart = new Date("2026-01-05T08:00:00Z");
    const process = await createProcess(project.id, ProcessStatusEnum.REVIEWED, { startDate: existingStart });

    const updated = await correct(process.id, ProcessStatusEnum.COMPLETED, ProcessStatusEnum.REVIEWED);

    expect(updated.status).toBe(ProcessStatusEnum.COMPLETED);
    expect(updated.startDate!.getTime()).toBe(existingStart.getTime());
    expect(updated.finishDate).not.toBeNull();
  });
});

describe("TankProcessService.correctStatusManually — scope", () => {
  test("only the selected process changes; siblings and the project are untouched (cases 18, 19)", async () => {
    const project = await createProject(TankProjectStatusEnum.PLANNED);
    // Upstream, already completed because the target was completed before it.
    const upstream = await createProcess(project.id, ProcessStatusEnum.COMPLETED, {
      startDate: new Date("2026-01-01T08:00:00Z"),
      finishDate: new Date("2026-01-02T08:00:00Z"),
      sequenceOrder: 1,
    });
    // Downstream, started on the strength of the upstream completion.
    const downstream = await createProcess(project.id, ProcessStatusEnum.IN_PROGRESS, {
      startDate: new Date("2026-01-03T08:00:00Z"),
      templateId: templateId2,
      sequenceOrder: 2,
    });

    await correct(upstream.id, ProcessStatusEnum.IN_PROGRESS, ProcessStatusEnum.COMPLETED);

    const refreshedDownstream = await pgsql.tankProcess.findUniqueOrThrow({ where: { id: downstream.id } });
    expect(refreshedDownstream.status).toBe(ProcessStatusEnum.IN_PROGRESS);
    expect(refreshedDownstream.startDate!.getTime()).toBe(new Date("2026-01-03T08:00:00Z").getTime());
    expect(refreshedDownstream.finishDate).toBeNull();

    // The owning project keeps its own status: the correction deliberately applies no
    // PLANNED -> IN_PROGRESS side effect, unlike updateStatus/completeDirect.
    expect((await pgsql.tankProject.findUniqueOrThrow({ where: { id: project.id } })).status).toBe(TankProjectStatusEnum.PLANNED);
  });

  test("writes a UserActivityLog entry naming the actor, both statuses and the source (case 20)", async () => {
    const project = await createProject();
    const process = await createProcess(project.id, ProcessStatusEnum.COMPLETED, { startDate: new Date(), finishDate: new Date() });

    await correct(process.id, ProcessStatusEnum.IN_PROGRESS, ProcessStatusEnum.COMPLETED);

    const log = await pgsql.userActivityLog.findFirst({
      where: { userId: actorUserId, action: tankProcessAction.MANUAL_STATUS_CORRECTION },
      orderBy: { createdAt: "desc" },
    });
    expect(log).not.toBeNull();
    expect(log!.metadata).toMatchObject({
      source: "MANUAL_STATUS_CORRECTION",
      tankProcessId: process.id,
      tankId,
      projectId: project.id,
      previousStatus: ProcessStatusEnum.COMPLETED,
      newStatus: ProcessStatusEnum.IN_PROGRESS,
    });
  });

  test("no audit entry is written when the correction is rejected", async () => {
    const project = await createProject();
    const process = await createProcess(project.id, ProcessStatusEnum.IN_PROGRESS, { startDate: new Date() });
    const before = await pgsql.userActivityLog.count({ where: { userId: actorUserId, action: tankProcessAction.MANUAL_STATUS_CORRECTION } });

    await expect(correct(process.id, ProcessStatusEnum.COMPLETED, ProcessStatusEnum.NOT_STARTED)).rejects.toMatchObject({ status: 409 });

    const after = await pgsql.userActivityLog.count({ where: { userId: actorUserId, action: tankProcessAction.MANUAL_STATUS_CORRECTION } });
    expect(after).toBe(before);
  });
});

describe("TankProcessService.correctStatusManually — guards", () => {
  test("a stale expectedCurrentStatus is rejected with 409 and leaves the row alone (case 16)", async () => {
    const project = await createProject();
    const finishDate = new Date("2026-02-05T08:00:00Z");
    const process = await createProcess(project.id, ProcessStatusEnum.COMPLETED, { startDate: new Date("2026-01-05T08:00:00Z"), finishDate });

    // The client still believes the process is REVIEWED.
    await expect(correct(process.id, ProcessStatusEnum.IN_PROGRESS, ProcessStatusEnum.REVIEWED)).rejects.toMatchObject({ status: 409 });

    const refreshed = await pgsql.tankProcess.findUniqueOrThrow({ where: { id: process.id } });
    expect(refreshed.status).toBe(ProcessStatusEnum.COMPLETED);
    expect(refreshed.finishDate!.getTime()).toBe(finishDate.getTime());
  });

  test("a duplicate request is an idempotent no-op that does not re-stamp finishDate (case 17)", async () => {
    const project = await createProject();
    const process = await createProcess(project.id, ProcessStatusEnum.REVIEWED, { startDate: new Date("2026-01-05T08:00:00Z") });

    const first = await correct(process.id, ProcessStatusEnum.COMPLETED, ProcessStatusEnum.REVIEWED);
    const originalFinish = first.finishDate!.getTime();

    // Small delay so a bug that re-stamps finishDate would be detectable.
    await new Promise((r) => setTimeout(r, 10));

    // The retry now carries expectedCurrentStatus = COMPLETED, matching the row it already wrote.
    const second = await correct(process.id, ProcessStatusEnum.COMPLETED, ProcessStatusEnum.COMPLETED);
    expect(second.status).toBe(ProcessStatusEnum.COMPLETED);
    expect(second.finishDate!.getTime()).toBe(originalFinish);
  });

  test("a missing process is a 404 (case 14)", async () => {
    await expect(correct("does-not-exist", ProcessStatusEnum.IN_PROGRESS, ProcessStatusEnum.COMPLETED)).rejects.toMatchObject({ status: 404 });
  });

  test("a process reached through the wrong tank is a 404 and is left unchanged (case 14)", async () => {
    const otherTank = await pgsql.tank.create({ data: { tankNo: `TEST-TANK-OTHER-${crypto.randomUUID()}` } });
    const project = await createProject();
    const process = await createProcess(project.id, ProcessStatusEnum.COMPLETED, { startDate: new Date(), finishDate: new Date() });

    await expect(correct(process.id, ProcessStatusEnum.IN_PROGRESS, ProcessStatusEnum.COMPLETED, otherTank.id)).rejects.toMatchObject({ status: 404 });

    expect((await pgsql.tankProcess.findUniqueOrThrow({ where: { id: process.id } })).status).toBe(ProcessStatusEnum.COMPLETED);
    await pgsql.tank.delete({ where: { id: otherTank.id } });
  });

  test("a process under a soft-deleted project cannot be corrected (case 15)", async () => {
    const project = await createProject();
    const process = await createProcess(project.id, ProcessStatusEnum.COMPLETED, { startDate: new Date(), finishDate: new Date() });
    await pgsql.tankProject.update({ where: { id: project.id }, data: { deletedAt: new Date() } });

    await expect(correct(process.id, ProcessStatusEnum.IN_PROGRESS, ProcessStatusEnum.COMPLETED)).rejects.toMatchObject({ status: 404 });

    expect((await pgsql.tankProcess.findUniqueOrThrow({ where: { id: process.id } })).status).toBe(ProcessStatusEnum.COMPLETED);
  });

  test("a process under a soft-deleted tank cannot be corrected (case 15)", async () => {
    const deletedTank = await pgsql.tank.create({ data: { tankNo: `TEST-TANK-DEL-${crypto.randomUUID()}`, deletedAt: new Date() } });
    const project = await createProject(TankProjectStatusEnum.IN_PROGRESS, deletedTank.id);
    const process = await createProcess(project.id, ProcessStatusEnum.COMPLETED, { startDate: new Date(), finishDate: new Date() });

    await expect(correct(process.id, ProcessStatusEnum.IN_PROGRESS, ProcessStatusEnum.COMPLETED, deletedTank.id)).rejects.toMatchObject({ status: 404 });

    expect((await pgsql.tankProcess.findUniqueOrThrow({ where: { id: process.id } })).status).toBe(ProcessStatusEnum.COMPLETED);
    await pgsql.tank.delete({ where: { id: deletedTank.id } });
  });
});

describe("PATCH /tanks/:id/processes/:processId/status (HTTP layer)", () => {
  function patch(app: Hono, tank: string, processId: string, body: unknown) {
    return app.request(`/tanks/${tank}/processes/${processId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  test("an authorized role corrects COMPLETED -> IN_PROGRESS end-to-end (case 1)", async () => {
    const project = await createProject();
    const process = await createProcess(project.id, ProcessStatusEnum.COMPLETED, { startDate: new Date("2026-01-05T08:00:00Z"), finishDate: new Date() });

    const app = buildTestApp(RoleEnum.INSPECTOR, actorUserId);
    const res = await patch(app, tankId, process.id, { targetStatus: "IN_PROGRESS", expectedCurrentStatus: "COMPLETED" });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.status).toBe(ProcessStatusEnum.IN_PROGRESS);
    expect(body.data.finishDate).toBeNull();
    expect(body.data.startDate).not.toBeNull();
    // Enough for the client to refresh its row without a second request.
    expect(body.data.id).toBe(process.id);
    expect(body.data.project.tank.id).toBe(tankId);
    expect(body.data.updatedAt).toBeDefined();
  });

  test("an unsupported status value is rejected by validation (case 12)", async () => {
    const project = await createProject();
    const process = await createProcess(project.id, ProcessStatusEnum.IN_PROGRESS, { startDate: new Date() });

    const app = buildTestApp(RoleEnum.INSPECTOR, actorUserId);
    const res = await patch(app, tankId, process.id, { targetStatus: "CANCELLED", expectedCurrentStatus: "IN_PROGRESS" });

    expect(res.status).toBe(400);
    expect((await res.json()).success).toBe(false);
    expect((await pgsql.tankProcess.findUniqueOrThrow({ where: { id: process.id } })).status).toBe(ProcessStatusEnum.IN_PROGRESS);
  });

  test("a missing expectedCurrentStatus is rejected by validation (case 12)", async () => {
    const project = await createProject();
    const process = await createProcess(project.id, ProcessStatusEnum.IN_PROGRESS, { startDate: new Date() });

    const app = buildTestApp(RoleEnum.INSPECTOR, actorUserId);
    const res = await patch(app, tankId, process.id, { targetStatus: "COMPLETED" });

    expect(res.status).toBe(400);
    expect((await pgsql.tankProcess.findUniqueOrThrow({ where: { id: process.id } })).status).toBe(ProcessStatusEnum.IN_PROGRESS);
  });

  test("client-supplied timestamps are ignored rather than applied (case 12)", async () => {
    const project = await createProject();
    const existingStart = new Date("2026-01-05T08:00:00Z");
    const process = await createProcess(project.id, ProcessStatusEnum.REVIEWED, { startDate: existingStart });

    const app = buildTestApp(RoleEnum.INSPECTOR, actorUserId);
    const res = await patch(app, tankId, process.id, {
      targetStatus: "COMPLETED",
      expectedCurrentStatus: "REVIEWED",
      startDate: "1999-01-01T00:00:00Z",
      finishDate: "1999-01-02T00:00:00Z",
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(new Date(body.data.startDate).getTime()).toBe(existingStart.getTime());
    expect(new Date(body.data.finishDate).getFullYear()).toBeGreaterThan(1999);
  });

  test("an unauthorized role (USER, lacks process.update) receives 403 (case 13)", async () => {
    const project = await createProject();
    const process = await createProcess(project.id, ProcessStatusEnum.COMPLETED, { startDate: new Date(), finishDate: new Date() });

    const app = buildTestApp(RoleEnum.USER, actorUserId);
    const res = await patch(app, tankId, process.id, { targetStatus: "IN_PROGRESS", expectedCurrentStatus: "COMPLETED" });

    expect(res.status).toBe(403);
    expect((await res.json()).success).toBe(false);
    expect((await pgsql.tankProcess.findUniqueOrThrow({ where: { id: process.id } })).status).toBe(ProcessStatusEnum.COMPLETED);
  });

  test("a stale expectedCurrentStatus returns the 409 envelope with a refresh instruction (case 16)", async () => {
    const project = await createProject();
    const process = await createProcess(project.id, ProcessStatusEnum.COMPLETED, { startDate: new Date(), finishDate: new Date() });

    const app = buildTestApp(RoleEnum.INSPECTOR, actorUserId);
    const res = await patch(app, tankId, process.id, { targetStatus: "IN_PROGRESS", expectedCurrentStatus: "WAITING_REVIEW" });
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body.success).toBe(false);
    expect(body.message).toBe("Process status has changed. Refresh the data and try again.");
    expect((await pgsql.tankProcess.findUniqueOrThrow({ where: { id: process.id } })).status).toBe(ProcessStatusEnum.COMPLETED);
  });

  test("a missing process returns the standard not-found envelope (case 14)", async () => {
    const app = buildTestApp(RoleEnum.INSPECTOR, actorUserId);
    const res = await patch(app, tankId, "does-not-exist", { targetStatus: "IN_PROGRESS", expectedCurrentStatus: "COMPLETED" });

    expect(res.status).toBe(404);
    expect((await res.json()).success).toBe(false);
  });
});
