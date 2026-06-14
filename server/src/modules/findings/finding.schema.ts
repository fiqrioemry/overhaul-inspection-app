import { z } from "zod";
import { FindingStatusEnum, SeverityEnum } from "generated/prisma";

export const createFindingRequest = z.object({
  tankId: z.string().min(1),
  tankProcessId: z.string().min(1),
  criteriaId: z.string().optional(),
  title: z.string().min(2).max(300),
  description: z.string().optional(),
  locationDetail: z.string().max(200).optional(),
  severity: z.nativeEnum(SeverityEnum).default(SeverityEnum.MAJOR),
  isBlocking: z.boolean().default(true),
  fileIds: z.array(z.string()).optional(),
});
export type CreateFindingRequest = z.infer<typeof createFindingRequest>;

export const updateFindingRequest = z.object({
  title: z.string().min(2).max(300).optional(),
  description: z.string().optional(),
  locationDetail: z.string().max(200).optional(),
  severity: z.nativeEnum(SeverityEnum).optional(),
  isBlocking: z.boolean().optional(),
  fileIds: z.array(z.string()).optional(),
});
export type UpdateFindingRequest = z.infer<typeof updateFindingRequest>;

export const updateFindingStatusRequest = z.object({
  status: z.nativeEnum(FindingStatusEnum),
  remarks: z.string().optional(),
});
export type UpdateFindingStatusRequest = z.infer<typeof updateFindingStatusRequest>;

export const listFindingsQuery = z.object({
  tankId: z.string().optional(),
  tankProcessId: z.string().optional(),
  status: z.nativeEnum(FindingStatusEnum).optional(),
  severity: z.nativeEnum(SeverityEnum).optional(),
  isBlocking: z
    .string()
    .optional()
    .transform((v) => (v === "true" ? true : v === "false" ? false : undefined)),
  page: z.string().default("1").transform(Number),
  limit: z.string().default("10").transform(Number),
});
export type ListFindingsQuery = z.infer<typeof listFindingsQuery>;
