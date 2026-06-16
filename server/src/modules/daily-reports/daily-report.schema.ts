import { z } from "zod";
import { DailyActivityTypeEnum } from "generated/prisma";

export const captionUpdateItem = z.object({
  attachmentId: z.string().min(1),
  caption: z.string().max(300),
});

export const createDailyReportRequest = z.object({
  tankId: z.string().min(1),
  tankProcessId: z.string().optional(),
  reportDate: z.string().min(1),
  activityType: z.nativeEnum(DailyActivityTypeEnum),
  description: z.string().min(1).max(2000),
  inspectorId: z.string().optional(),
  pertaminaPicId: z.string().optional(),
});
export type CreateDailyReportRequest = z.infer<typeof createDailyReportRequest>;

export const updateDailyReportRequest = z.object({
  reportDate: z.string().optional(),
  activityType: z.nativeEnum(DailyActivityTypeEnum).optional(),
  description: z.string().min(1).max(2000).optional(),
  inspectorId: z.string().optional(),
  pertaminaPicId: z.string().optional(),
  removedAttachmentIds: z.array(z.string()).optional(),
  captions: z.array(captionUpdateItem).optional(),
});
export type UpdateDailyReportRequest = z.infer<typeof updateDailyReportRequest>;

export const listDailyReportsQuery = z.object({
  tankId: z.string().optional(),
  tankProcessId: z.string().optional(),
  reportDate: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  activityType: z.nativeEnum(DailyActivityTypeEnum).optional(),
  page: z.string().default("1").transform(Number),
  limit: z.string().default("20").transform(Number),
});
export type ListDailyReportsQuery = z.infer<typeof listDailyReportsQuery>;
