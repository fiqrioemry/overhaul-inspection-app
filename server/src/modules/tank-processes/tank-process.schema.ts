import { z } from "zod";
import { ProcessStatusEnum } from "generated/prisma";

export const updateProcessStatusRequest = z.object({
  status: z.nativeEnum(ProcessStatusEnum),
  plannedStartDate: z.string().optional(),
  actualStartDate: z.string().optional(),
  remarks: z.string().optional(),
});
export type UpdateProcessStatusRequest = z.infer<typeof updateProcessStatusRequest>;

export const listTankProcessesQuery = z.object({
  tankId: z.string().optional(),
  status: z.nativeEnum(ProcessStatusEnum).optional(),
  page: z.string().default("1").transform(Number),
  limit: z.string().default("20").transform(Number),
});
export type ListTankProcessesQuery = z.infer<typeof listTankProcessesQuery>;
