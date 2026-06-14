import { z } from "zod";
import { ProcessStatusEnum, ProcessResultEnum } from "generated/prisma";

export const updateProcessStatusRequest = z.object({
  status: z.nativeEnum(ProcessStatusEnum),
  plannedStartDate: z.string().optional(),
  actualStartDate: z.string().optional(),
  remarks: z.string().optional(),
});
export type UpdateProcessStatusRequest = z.infer<typeof updateProcessStatusRequest>;

export const updateProcessResultRequest = z.object({
  result: z.nativeEnum(ProcessResultEnum),
  actualFinishDate: z.string().optional(),
  remarks: z.string().optional(),
});
export type UpdateProcessResultRequest = z.infer<typeof updateProcessResultRequest>;

export const listTankProcessesQuery = z.object({
  tankId: z.string().optional(),
  status: z.nativeEnum(ProcessStatusEnum).optional(),
  result: z.nativeEnum(ProcessResultEnum).optional(),
  page: z.string().default("1").transform(Number),
  limit: z.string().default("20").transform(Number),
});
export type ListTankProcessesQuery = z.infer<typeof listTankProcessesQuery>;
