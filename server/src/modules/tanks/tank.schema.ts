import { z } from "zod";
import { TankAssetStatusEnum, TankLocationEnum, TankServiceEnum } from "generated/prisma";

// UNDER_OVERHAUL is system-managed (derived from active projects) and must never be
// accepted from a manual create/update payload. recalculateTankAssetStatus sets it internally.
const manualAssetStatus = z.enum([
  TankAssetStatusEnum.OPERATIONAL,
  TankAssetStatusEnum.OUT_OF_SERVICE,
  TankAssetStatusEnum.DECOMMISSIONED,
]);

export const shellCourseInput = z.object({
  courseNo: z.number().int().min(1),
  thicknessMm: z.number().positive().optional(),
  plateDimension: z.string().max(100).optional(),
  remarks: z.string().optional(),
});
export type ShellCourseInput = z.infer<typeof shellCourseInput>;

// Tank is now a physical asset registry only. Project/engagement fields
// (contractor, inspection company, schedule dates, workflow) live on TankProject.
export const createTankRequest = z.object({
  tankNo: z.string().min(1).max(50),
  tankName: z.string().max(200).optional(),
  location: z.nativeEnum(TankLocationEnum).optional(),
  capacityM3: z.number().positive().optional(),
  service: z.nativeEnum(TankServiceEnum).optional(),
  diameterMm: z.number().positive().optional(),
  heightMm: z.number().positive().optional(),
  shellCourseCount: z.number().int().min(1).optional(),
  bottomPlateDimension: z.string().max(100).optional(),
  hasSteamCoil: z.boolean().default(false),
  assetStatus: manualAssetStatus.optional(),
  shellCourses: z.array(shellCourseInput).optional(),
  newFileCaptions: z.array(z.string().max(300)).optional(),
});
export type CreateTankRequest = z.infer<typeof createTankRequest>;

export const updateTankRequest = createTankRequest.omit({ shellCourses: true, newFileCaptions: true }).partial();
export type UpdateTankRequest = z.infer<typeof updateTankRequest>;

export const listTanksQuery = z.object({
  search: z.string().optional(),
  // Filtering may target any status, including the system-managed UNDER_OVERHAUL.
  assetStatus: z.nativeEnum(TankAssetStatusEnum).optional(),
  page: z.string().default("1").transform(Number),
  limit: z.string().default("10").transform(Number),
});
export type ListTanksQuery = z.infer<typeof listTanksQuery>;
