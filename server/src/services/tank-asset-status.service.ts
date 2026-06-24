import { Prisma, TankAssetStatusEnum, TankProjectStatusEnum } from "generated/prisma";
import { pgsql } from "@/lib/database";

/** Projects in these statuses pull a tank out of normal operation (an "active" project). */
const ACTIVE_PROJECT_STATUSES: TankProjectStatusEnum[] = [
  TankProjectStatusEnum.PLANNED,
  TankProjectStatusEnum.IN_PROGRESS,
  TankProjectStatusEnum.ON_HOLD,
];

type DbClient = Prisma.TransactionClient | typeof pgsql;

/**
 * Keep Tank.assetStatus in sync with its projects (system-managed).
 * - DECOMMISSIONED is permanent and never auto-overwritten.
 * - If a tank has any active project (PLANNED/IN_PROGRESS/ON_HOLD) → UNDER_OVERHAUL.
 *   This intentionally allows an OUT_OF_SERVICE (idle) tank to enter overhaul.
 * - Otherwise → OPERATIONAL (e.g. after the project completes/cancels).
 */
export async function recalculateTankAssetStatus(tankId: string, client: DbClient = pgsql): Promise<void> {
  const tank = await client.tank.findUnique({ where: { id: tankId }, select: { assetStatus: true } });
  if (!tank) return;
  if (tank.assetStatus === TankAssetStatusEnum.DECOMMISSIONED) return;

  const activeCount = await client.tankProject.count({
    where: { tankId, deletedAt: null, status: { in: ACTIVE_PROJECT_STATUSES } },
  });

  const next = activeCount > 0 ? TankAssetStatusEnum.UNDER_OVERHAUL : TankAssetStatusEnum.OPERATIONAL;
  if (next !== tank.assetStatus) {
    await client.tank.update({ where: { id: tankId }, data: { assetStatus: next } });
  }
}
