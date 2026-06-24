import { z } from "zod";
import { TankProjectTypeEnum, TankProjectStatusEnum } from "generated/prisma";

export const createTankProjectRequest = z.object({
  tankId: z.string().min(1),
  projectNo: z.string().max(60).optional(),
  type: z.nativeEnum(TankProjectTypeEnum).default(TankProjectTypeEnum.OVERHAUL),
  status: z.nativeEnum(TankProjectStatusEnum).optional(),
  contractorCompanyId: z.string().optional(),
  inspectionCompanyId: z.string().optional(),
  startDate: z.string().optional(),
  estimatedFinishDate: z.string().optional(),
  actualFinishDate: z.string().optional(),
  description: z.string().max(2000).optional(),
  remarks: z.string().max(2000).optional(),
  generateProcesses: z.boolean().optional(),
});
export type CreateTankProjectRequest = z.infer<typeof createTankProjectRequest>;

export const updateTankProjectRequest = z.object({
  projectNo: z.string().max(60).optional(),
  type: z.nativeEnum(TankProjectTypeEnum).optional(),
  status: z.nativeEnum(TankProjectStatusEnum).optional(),
  contractorCompanyId: z.string().nullable().optional(),
  inspectionCompanyId: z.string().nullable().optional(),
  startDate: z.string().nullable().optional(),
  estimatedFinishDate: z.string().nullable().optional(),
  actualFinishDate: z.string().nullable().optional(),
  description: z.string().max(2000).nullable().optional(),
  remarks: z.string().max(2000).nullable().optional(),
});
export type UpdateTankProjectRequest = z.infer<typeof updateTankProjectRequest>;

export const listTankProjectsQuery = z.object({
  search: z.string().optional(),
  tankId: z.string().optional(),
  type: z.nativeEnum(TankProjectTypeEnum).optional(),
  status: z.nativeEnum(TankProjectStatusEnum).optional(),
  active: z
    .string()
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
  page: z.string().default("1").transform(Number),
  limit: z.string().default("10").transform(Number),
});
export type ListTankProjectsQuery = z.infer<typeof listTankProjectsQuery>;
