import { z } from "zod";
import { InspectionRequestStatusEnum } from "generated/prisma";

export const createInspectionRequestRequest = z.object({
  tankProcessId: z.string().min(1),
  notes: z.string().optional(),
});
export type CreateInspectionRequestRequest = z.infer<typeof createInspectionRequestRequest>;

export const reviewInspectionRequestRequest = z.object({
  status: z.enum(["REVIEWED", "RETURNED"]),
  reviewNotes: z.string().optional(),
});
export type ReviewInspectionRequestRequest = z.infer<typeof reviewInspectionRequestRequest>;

export const listInspectionRequestsQuery = z.object({
  tankProcessId: z.string().optional(),
  tankId: z.string().optional(),
  status: z.nativeEnum(InspectionRequestStatusEnum).optional(),
  page: z.string().default("1").transform(Number),
  limit: z.string().default("10").transform(Number),
});
export type ListInspectionRequestsQuery = z.infer<typeof listInspectionRequestsQuery>;
