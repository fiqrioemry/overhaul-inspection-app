import { z } from "zod";
import { DailyActivityTypeEnum } from "generated/prisma";

export const captionUpdateItem = z.object({
  attachmentId: z.string().min(1),
  caption: z.string().max(300),
});

export const createDailyReportRequest = z.object({
  tankId: z.string().optional(),
  projectId: z.string().optional(),
  tankProcessId: z.string().optional(),
  reportDate: z.string().min(1),
  activityType: z.nativeEnum(DailyActivityTypeEnum),
  title: z.string().min(1).max(300),
  description: z.string().min(1).max(20000),
  recommendation: z.string().max(20000).optional(),
  inspectorId: z.string().optional(),
  pertaminaPicId: z.string().optional(),
  newFileCaptions: z.array(z.string().max(300)).optional(),
});
export type CreateDailyReportRequest = z.infer<typeof createDailyReportRequest>;

export const tankProcessOptionsQuery = z.object({
  tankId: z.string().min(1),
});
export type TankProcessOptionsQuery = z.infer<typeof tankProcessOptionsQuery>;

export const sortOrderUpdateItem = z.object({
  attachmentId: z.string().min(1),
  sortOrder: z.number().int().min(0),
});

export const updateDailyReportRequest = z.object({
  tankId: z.string().nullable().optional(),
  tankProcessId: z.string().nullable().optional(),
  reportDate: z.string().optional(),
  activityType: z.nativeEnum(DailyActivityTypeEnum).optional(),
  title: z.string().min(1).max(300).optional(),
  description: z.string().min(1).max(20000).optional(),
  recommendation: z.string().max(20000).nullable().optional(),
  inspectorId: z.string().optional(),
  pertaminaPicId: z.string().optional(),
  removedAttachmentIds: z.array(z.string()).optional(),
  captions: z.array(captionUpdateItem).optional(),
  sortOrders: z.array(sortOrderUpdateItem).optional(),
});
export type UpdateDailyReportRequest = z.infer<typeof updateDailyReportRequest>;

export const listDailyReportsQuery = z.object({
  tankId: z.string().optional(),
  projectId: z.string().optional(),
  tankProcessId: z.string().optional(),
  reportDate: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  activityType: z.nativeEnum(DailyActivityTypeEnum).optional(),
  page: z.string().default("1").transform(Number),
  limit: z.string().default("20").transform(Number),
});
export type ListDailyReportsQuery = z.infer<typeof listDailyReportsQuery>;
