import { Prisma, TankAssetStatusEnum, TankProjectStatusEnum } from "generated/prisma";
import { pgsql } from "@/lib/database";

/** Projects in these statuses pull a tank out of normal operation. */
const ACTIVE_PROJECT_STATUSES: TankProjectStatusEnum[] = [
  TankProjectStatusEnum.IN_PROGRESS,
  TankProjectStatusEnum.ON_HOLD,
];

/** Asset statuses that are operator-controlled and must never be auto-overwritten. */
const TERMINAL_ASSET_STATUSES: TankAssetStatusEnum[] = [
  TankAssetStatusEnum.OUT_OF_SERVICE,
  TankAssetStatusEnum.DECOMMISSIONED,
];

type DbClient = Prisma.TransactionClient | typeof pgsql;

/**
 * Keep Tank.assetStatus in sync with its projects.
 * - If a tank has any active project (IN_PROGRESS/ON_HOLD) → UNDER_OVERHAUL.
 * - Otherwise → OPERATIONAL.
 * - OUT_OF_SERVICE / DECOMMISSIONED are operator-set and left untouched.
 */
export async function recalculateTankAssetStatus(tankId: string, client: DbClient = pgsql): Promise<void> {
  const tank = await client.tank.findUnique({ where: { id: tankId }, select: { assetStatus: true } });
  if (!tank) return;
  if (TERMINAL_ASSET_STATUSES.includes(tank.assetStatus)) return;

  const activeCount = await client.tankProject.count({
    where: { tankId, deletedAt: null, status: { in: ACTIVE_PROJECT_STATUSES } },
  });

  const next = activeCount > 0 ? TankAssetStatusEnum.UNDER_OVERHAUL : TankAssetStatusEnum.OPERATIONAL;
  if (next !== tank.assetStatus) {
    await client.tank.update({ where: { id: tankId }, data: { assetStatus: next } });
  }
}
