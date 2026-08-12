// Integration tests for the dashboard tank metrics: under-overhaul / completed counts and
// the Sungai Gerong / Pladju site headcount.
//
// Run with the local dev database (see server/CLAUDE.md — bun auto-loads .env.local, which
// points at the wrong DB host; use .env.development instead):
//
//   bun --env-file=.env.development test tests/integration/dashboard-tank-metrics.test.ts
//
// getSummary() counts the whole fleet, so every assertion is a *delta* against a baseline
// captured before the fixtures are inserted. That keeps the tests correct against a seeded
// dev database instead of assuming an empty one. Fixtures use unique cuid-based tank numbers
// and are deleted in afterAll.

import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { pgsql } from "@/lib/database";
import { TankAssetStatusEnum, TankLocationEnum, TankProjectStatusEnum } from "generated/prisma";
import { DashboardService, foldTankLocationCounts } from "@/modules/dashboard/dashboard.service";
import type { DashboardSummary } from "@/modules/dashboard/dashboard.types";

const createdTankIds: string[] = [];

async function createTank(options: {
  assetStatus: TankAssetStatusEnum;
  location?: TankLocationEnum | null;
  deleted?: boolean;
  project?: { status: TankProjectStatusEnum; deleted?: boolean };
}) {
  const tank = await pgsql.tank.create({
    data: {
      tankNo: `TEST-DASH-${crypto.randomUUID()}`,
      assetStatus: options.assetStatus,
      location: options.location ?? null,
      deletedAt: options.deleted ? new Date() : null,
    },
  });
  createdTankIds.push(tank.id);

  if (options.project) {
    await pgsql.tankProject.create({
      data: {
        projectNo: `TEST-DASH-PRJ-${crypto.randomUUID()}`,
        tankId: tank.id,
        status: options.project.status,
        deletedAt: options.project.deleted ? new Date() : null,
      },
    });
  }
  return tank;
}

let baseline: DashboardSummary;
let after: DashboardSummary;

beforeAll(async () => {
  baseline = await DashboardService.getSummary();

  // 1-2: plainly under overhaul, one per site.
  await createTank({ assetStatus: TankAssetStatusEnum.UNDER_OVERHAUL, location: TankLocationEnum.SUNGAI_GERONG });
  await createTank({ assetStatus: TankAssetStatusEnum.UNDER_OVERHAUL, location: TankLocationEnum.PLADJU });
  // 3: overhaul finished — back to OPERATIONAL with a COMPLETED project behind it.
  await createTank({
    assetStatus: TankAssetStatusEnum.OPERATIONAL,
    location: TankLocationEnum.SUNGAI_GERONG,
    project: { status: TankProjectStatusEnum.COMPLETED },
  });
  // 4-5: statuses that are neither in progress nor completed, but still occupy a site.
  await createTank({ assetStatus: TankAssetStatusEnum.OUT_OF_SERVICE, location: TankLocationEnum.PLADJU });
  await createTank({ assetStatus: TankAssetStatusEnum.DECOMMISSIONED, location: TankLocationEnum.SUNGAI_GERONG });
  // 6: soft-deleted — must not reach any count, despite matching both metrics.
  await createTank({
    assetStatus: TankAssetStatusEnum.UNDER_OVERHAUL,
    location: TankLocationEnum.SUNGAI_GERONG,
    deleted: true,
    project: { status: TankProjectStatusEnum.COMPLETED },
  });
  // 7: completed but sited nowhere — counts as completed, counts at neither location.
  await createTank({ assetStatus: TankAssetStatusEnum.OPERATIONAL, location: null, project: { status: TankProjectStatusEnum.COMPLETED } });
  // 8: under overhaul with a still-running project — in progress, not completed.
  await createTank({
    assetStatus: TankAssetStatusEnum.UNDER_OVERHAUL,
    location: TankLocationEnum.PLADJU,
    project: { status: TankProjectStatusEnum.IN_PROGRESS },
  });
  // 9: its only COMPLETED project is soft-deleted — must not count as completed.
  await createTank({
    assetStatus: TankAssetStatusEnum.OPERATIONAL,
    location: TankLocationEnum.PLADJU,
    project: { status: TankProjectStatusEnum.COMPLETED, deleted: true },
  });

  after = await DashboardService.getSummary();
});

afterAll(async () => {
  // TankProject cascades from Tank, so deleting the tanks is enough.
  await pgsql.tank.deleteMany({ where: { id: { in: createdTankIds } } });
  await pgsql.$disconnect();
});

describe("DashboardService.getSummary — tank metrics", () => {
  test("under-overhaul count includes only tanks whose asset status is UNDER_OVERHAUL (case 1)", () => {
    // Fixtures 1, 2 and 8. Fixture 6 matches the status but is soft-deleted.
    expect(after.tanks.underOverhaul - baseline.tanks.underOverhaul).toBe(3);
  });

  test("the 'in progress' figure is the same count as the card's primary value (case 2)", async () => {
    // The card renders tanks.underOverhaul both as the headline number and as "x in progress",
    // so there is a single source for both and it agrees with a direct query.
    const direct = await pgsql.tank.count({ where: { deletedAt: null, assetStatus: TankAssetStatusEnum.UNDER_OVERHAUL } });
    expect(after.tanks.underOverhaul).toBe(direct);
  });

  test("completed count includes only tanks with a completed overhaul (case 3)", () => {
    // Fixtures 3 and 7. Fixture 8 is still running, fixture 9's project is soft-deleted,
    // and the other OPERATIONAL/OUT_OF_SERVICE tanks never had a project at all.
    expect(after.tanks.completed - baseline.tanks.completed).toBe(2);
  });

  test("soft-deleted tanks are excluded from every tank count (case 4)", () => {
    // Nine tanks created, one of them soft-deleted.
    expect(after.tanks.total - baseline.tanks.total).toBe(8);
    // Fixture 6 would otherwise have added to underOverhaul, completed and Sungai Gerong.
    expect(after.tanks.underOverhaul - baseline.tanks.underOverhaul).toBe(3);
    expect(after.tanks.completed - baseline.tanks.completed).toBe(2);
    expect(after.tanks.byLocation.sungaiGerong - baseline.tanks.byLocation.sungaiGerong).toBe(3);
  });

  test("Sungai Gerong count is correct (case 5)", () => {
    // Fixtures 1, 3, 5.
    expect(after.tanks.byLocation.sungaiGerong - baseline.tanks.byLocation.sungaiGerong).toBe(3);
  });

  test("Pladju count is correct (case 6)", () => {
    // Fixtures 2, 4, 8, 9.
    expect(after.tanks.byLocation.pladju - baseline.tanks.byLocation.pladju).toBe(4);
  });

  test("location counts span every asset status, not just tanks under overhaul (case 7)", async () => {
    const sungaiGerong = await pgsql.tank.count({ where: { deletedAt: null, location: TankLocationEnum.SUNGAI_GERONG } });
    const pladju = await pgsql.tank.count({ where: { deletedAt: null, location: TankLocationEnum.PLADJU } });

    expect(after.tanks.byLocation.sungaiGerong).toBe(sungaiGerong);
    expect(after.tanks.byLocation.pladju).toBe(pladju);

    // The fixtures deliberately include OPERATIONAL, OUT_OF_SERVICE and DECOMMISSIONED tanks,
    // so the site headcount must exceed the under-overhaul count contributed by the fixtures.
    const sgDelta = after.tanks.byLocation.sungaiGerong - baseline.tanks.byLocation.sungaiGerong;
    const sgUnderOverhaul = 1; // only fixture 1
    expect(sgDelta).toBeGreaterThan(sgUnderOverhaul);
  });

  test("both locations are always present as numbers, including in the live response (case 8)", () => {
    expect(after.tanks.byLocation).toEqual({
      sungaiGerong: expect.any(Number),
      pladju: expect.any(Number),
    });
  });
});

describe("foldTankLocationCounts", () => {
  test("reports zero for a location with no rows instead of dropping it (case 8)", () => {
    expect(foldTankLocationCounts([])).toEqual({ sungaiGerong: 0, pladju: 0 });
    expect(foldTankLocationCounts([{ location: TankLocationEnum.PLADJU, _count: { _all: 4 } }])).toEqual({
      sungaiGerong: 0,
      pladju: 4,
    });
  });

  test("ignores tanks with no location rather than attributing them to a site", () => {
    expect(
      foldTankLocationCounts([
        { location: null, _count: { _all: 7 } },
        { location: TankLocationEnum.SUNGAI_GERONG, _count: { _all: 2 } },
      ]),
    ).toEqual({ sungaiGerong: 2, pladju: 0 });
  });
});
