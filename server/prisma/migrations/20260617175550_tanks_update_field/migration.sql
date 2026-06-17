-- CreateEnum
CREATE TYPE "TankLocationEnum" AS ENUM ('SUNGAI_GERONG', 'PLADJU');

-- CreateEnum
CREATE TYPE "TankServiceEnum" AS ENUM ('AVTUR', 'NAPTHA', 'PREMIUM', 'PERTALITE', 'PERTAMAX', 'PERTAMAX_TURBO', 'SOLAR', 'DEXLITE', 'PERTAMINA_DEX', 'KEROSENE', 'CRUDE_OIL', 'FUEL_OIL', 'LUBRICATING_OIL', 'LPG', 'CONDENSATE', 'SLOP_OIL', 'OTHER');

-- AlterTable
ALTER TABLE "tanks" ADD COLUMN     "capacity_m3" DOUBLE PRECISION,
ADD COLUMN     "location" "TankLocationEnum",
ADD COLUMN     "service" "TankServiceEnum";
