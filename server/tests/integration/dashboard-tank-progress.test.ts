// Integration tests for the dashboard's Tank Progress rows: which project appears, the progress
// percentage, and which process the row names.
//
// Run with the local dev database (see server/CLAUDE.md — bun auto-loads .env.local, which
// points at the wrong DB host; use .env.development instead):
//
//   bun --env-file=.env.development test tests/integration/dashboard-tank-progress.test.ts

import { describe, test, expect, beforeAll, afterAll, spyOn } from "bun:test";
import { pgsql } from "@/lib/database";
import { ProcessStatusEnum, ProcessType, TankProjectStatusEnum } from "generated/prisma";
import { DashboardService, resolveDisplayProcess } from "@/modules/dashboard/dashboard.service";
import { reconcileProjectStatusFromProcesses } from "@/services/project-status.service";
import type { TankProgressProcess } from "@/modules/dashboard/dashboard.types";

let tankId: string;
const templateIds: string[] = [];

async function createTemplate(sequenceOrder: number) {
  const template = await pgsql.processTemplate.create({
    data: { code: `TEST-PROGRESS-${crypto.randomUUID()}`, name: `Progress Template ${sequenceOrder}`, type: ProcessType.WORK, sequenceOrder },
  });
  templateIds.push(template.id);
  return template.id;
}

async function createProject(status: TankProjectStatusEnum = TankProjectStatusEnum.IN_PROGRESS) {
  return pgsql.tankProject.create({ data: { projectNo: `TEST-PROGRESS-PRJ-${crypto.randomUUID()}`, tankId, status } });
}

async function createProcess(projectId: string, name: string, sequenceOrder: number, status: ProcessStatusEnum, finishDate: Date | null = null) {
  return pgsql.tankProcess.create({
    data: {
      projectId,
      processTemplateId: await createTemplate(sequenceOrder),
      name,
      type: ProcessType.WORK,
      sequenceOrder,
      status,
      startDate: new Date("2026-01-01T08:00:00Z"),
      finishDate,
    },
  });
}

async function rowFor(projectId: string) {
  const rows = await DashboardService.getTankProgress();
  return rows.find((r) => r.id === projectId);
}

beforeAll(async () => {
  const tank = await pgsql.tank.create({ data: { tankNo: `TEST-TANK-PROGRESS-${crypto.randomUUID()}` } });
  tankId = tank.id;
});

afterAll(async () => {
  await pgsql.tank.delete({ where: { id: tankId } }).catch(() => {}); // cascades project -> process
  await pgsql.processTemplate.deleteMany({ where: { id: { in: templateIds } } }).catch(() => {});
  await pgsql.$disconnect();
});

describe("resolveDisplayProcess", () => {
  const process = (over: Partial<TankProgressProcess>): TankProgressProcess => ({
    id: "p1",
    name: "Process",
    type: "WORK",
    sequenceOrder: 1,
    status: ProcessStatusEnum.COMPLETED,
    ...over,
  });

  test("picks the highest sequenceOrder once everything is completed (case 3)", () => {
    const result = resolveDisplayProcess([
      process({ id: "a", name: "First", sequenceOrder: 1 }),
      process({ id: "b", name: "Last", sequenceOrder: 12 }),
      process({ id: "c", name: "Middle", sequenceOrder: 7 }),
    ]);
    expect(result).toMatchObject({ id: "b", name: "Last", sequenceOrder: 12 });
  });

  test("breaks ties on a duplicate sequenceOrder deterministically (case 5)", () => {
    const tied = [process({ id: "aaa", name: "Tied A", sequenceOrder: 5 }), process({ id: "zzz", name: "Tied Z", sequenceOrder: 5 })];
    const first = resolveDisplayProcess(tied);
    const reversed = resolveDisplayProcess([...tied].reverse());
    expect(first!.id).toBe(reversed!.id);
    expect(first!.id).toBe("zzz");
  });

  test("tolerates a missing sequenceOrder and prefers a valid one (case 6)", () => {
    const result = resolveDisplayProcess([
      process({ id: "a", name: "No order", sequenceOrder: null as unknown as number }),
      process({ id: "b", name: "Ordered", sequenceOrder: 2 }),
    ]);
    expect(result).toMatchObject({ id: "b", name: "Ordered" });

    // All orders missing: still deterministic, still no crash.
    const allMissing = resolveDisplayProcess([
      process({ id: "a", sequenceOrder: undefined as unknown as number }),
      process({ id: "b", sequenceOrder: null as unknown as number }),
    ]);
    expect(allMissing!.id).toBe("b");
  });

  test("returns null for a project with no processes (case 7)", () => {
    expect(resolveDisplayProcess([])).toBeNull();
  });

  test("names the running process while work is outstanding, matching the previous behaviour (case 8)", () => {
    const result = resolveDisplayProcess([
      process({ id: "a", name: "Done", sequenceOrder: 1, status: ProcessStatusEnum.COMPLETED }),
      process({ id: "b", name: "Running", sequenceOrder: 2, status: ProcessStatusEnum.IN_PROGRESS }),
      process({ id: "c", name: "Waiting", sequenceOrder: 3, status: ProcessStatusEnum.NOT_STARTED }),
    ]);
    expect(result).toMatchObject({ id: "b", name: "Running" });
  });

  test("returns null when nothing is running and the project is not finished (case 8)", () => {
    const result = resolveDisplayProcess([
      process({ id: "a", sequenceOrder: 1, status: ProcessStatusEnum.COMPLETED }),
      process({ id: "b", sequenceOrder: 2, status: ProcessStatusEnum.NOT_STARTED }),
    ]);
    expect(result).toBeNull();
  });
});

describe("DashboardService.getTankProgress", () => {
  test("a fully completed project reports COMPLETED at 100% and names its final process (cases 1, 2, 3)", async () => {
    const project = await createProject(TankProjectStatusEnum.IN_PROGRESS);
    await createProcess(project.id, "Preparation", 1, ProcessStatusEnum.COMPLETED, new Date("2026-03-01T08:00:00Z"));
    await createProcess(project.id, "Hydrotest", 5, ProcessStatusEnum.COMPLETED, new Date("2026-03-02T08:00:00Z"));
    await createProcess(project.id, "Final Inspection", 20, ProcessStatusEnum.COMPLETED, new Date("2026-03-03T08:00:00Z"));
    await pgsql.$transaction((tx) => reconcileProjectStatusFromProcesses(project.id, tx));

    const row = await rowFor(project.id);

    expect(row).toBeDefined();
    expect(row!.status).toBe(TankProjectStatusEnum.COMPLETED);
    expect(row!.progress).toBe(100);
    expect(row!.allProcessesCompleted).toBe(true);
    expect(row!.displayProcess).toMatchObject({ name: "Final Inspection", sequenceOrder: 20 });
  });

  test("the final process is chosen by sequenceOrder, not by completion or update time (case 4)", async () => {
    const project = await createProject(TankProjectStatusEnum.IN_PROGRESS);
    // Highest sequenceOrder finished FIRST and is touched FIRST...
    const last = await createProcess(project.id, "Final Step", 30, ProcessStatusEnum.COMPLETED, new Date("2026-01-10T08:00:00Z"));
    // ...while a lower-sequence process finished later and is updated most recently.
    const earlier = await createProcess(project.id, "Earlier Step", 2, ProcessStatusEnum.COMPLETED, new Date("2026-06-30T08:00:00Z"));
    await pgsql.tankProcess.update({ where: { id: earlier.id }, data: { remarks: "touched last" } });
    await pgsql.$transaction((tx) => reconcileProjectStatusFromProcesses(project.id, tx));

    const row = await rowFor(project.id);

    const refreshedEarlier = await pgsql.tankProcess.findUniqueOrThrow({ where: { id: earlier.id } });
    const refreshedLast = await pgsql.tankProcess.findUniqueOrThrow({ where: { id: last.id } });
    expect(refreshedEarlier.updatedAt.getTime()).toBeGreaterThan(refreshedLast.updatedAt.getTime());
    expect(refreshedEarlier.finishDate!.getTime()).toBeGreaterThan(refreshedLast.finishDate!.getTime());
    // Neither of those changes the answer.
    expect(row!.displayProcess).toMatchObject({ id: last.id, name: "Final Step", sequenceOrder: 30 });
  });

  test("an unfinished project keeps naming its running process (case 8)", async () => {
    const project = await createProject(TankProjectStatusEnum.IN_PROGRESS);
    await createProcess(project.id, "Preparation", 1, ProcessStatusEnum.COMPLETED, new Date("2026-03-01T08:00:00Z"));
    await createProcess(project.id, "Welding", 2, ProcessStatusEnum.IN_PROGRESS);
    await createProcess(project.id, "Final Inspection", 9, ProcessStatusEnum.NOT_STARTED);

    const row = await rowFor(project.id);

    expect(row!.status).toBe(TankProjectStatusEnum.IN_PROGRESS);
    expect(row!.allProcessesCompleted).toBe(false);
    expect(row!.progress).toBe(33);
    expect(row!.displayProcess).toMatchObject({ name: "Welding" });
  });

  test("a project with no processes reports 0% and fabricates no final process (case 7)", async () => {
    const project = await createProject(TankProjectStatusEnum.PLANNED);

    const row = await rowFor(project.id);

    expect(row).toBeDefined();
    expect(row!.progress).toBe(0);
    expect(row!.allProcessesCompleted).toBe(false);
    expect(row!.displayProcess).toBeNull();
    expect(row!.status).toBe(TankProjectStatusEnum.PLANNED);
  });

  test("a cancelled project stays out of Tank Progress", async () => {
    const project = await createProject(TankProjectStatusEnum.CANCELLED);
    await createProcess(project.id, "Abandoned", 1, ProcessStatusEnum.NOT_STARTED);

    expect(await rowFor(project.id)).toBeUndefined();
  });

  test("the whole table is one project query with no per-project process query (case 9)", async () => {
    // Several projects, several processes each: an N+1 would scale the query count with them.
    for (let i = 0; i < 3; i++) {
      const project = await createProject(TankProjectStatusEnum.IN_PROGRESS);
      await createProcess(project.id, `P${i}-a`, 1, ProcessStatusEnum.COMPLETED, new Date("2026-03-01T08:00:00Z"));
      await createProcess(project.id, `P${i}-b`, 2, ProcessStatusEnum.IN_PROGRESS);
    }

    const projectFindMany = spyOn(pgsql.tankProject, "findMany");
    const processFindMany = spyOn(pgsql.tankProcess, "findMany");
    try {
      const rows = await DashboardService.getTankProgress();
      expect(rows.length).toBeGreaterThanOrEqual(3);
      expect(projectFindMany).toHaveBeenCalledTimes(1);
      expect(processFindMany).toHaveBeenCalledTimes(0);
    } finally {
      projectFindMany.mockRestore();
      processFindMany.mockRestore();
    }
  });
});
