import { z } from "zod";
import { ProcessStatusEnum } from "generated/prisma";

export const updateProcessStatusRequest = z.object({
  status: z.nativeEnum(ProcessStatusEnum),
  remarks: z.string().optional(),
  // Only applied when this transition sets the process in motion (NOT_STARTED -> IN_PROGRESS).
  startDate: z.string().optional(),
  // Explicit finish date, e.g. for retroactive/historical entry while starting the process.
  // undefined = leave finishDate untouched; null/"" = clear it.
  finishDate: z.string().nullable().optional(),
});
export type UpdateProcessStatusRequest = z.infer<typeof updateProcessStatusRequest>;

// Manual status correction. Deliberately narrower than updateProcessStatusRequest: no dates
// and no remarks, so the client cannot set timestamps — the server derives those from the
// target status. `expectedCurrentStatus` is the status the client had on screen; the update
// only applies while the row still holds it (optimistic concurrency).
export const correctProcessStatusRequest = z.object({
  targetStatus: z.nativeEnum(ProcessStatusEnum),
  expectedCurrentStatus: z.nativeEnum(ProcessStatusEnum),
});
export type CorrectProcessStatusRequest = z.infer<typeof correctProcessStatusRequest>;

export const updateProcessDatesRequest = z.object({
  startDate: z.string().min(1, "Start date is required"),
  finishDate: z.string().nullable().optional(),
});
export type UpdateProcessDatesRequest = z.infer<typeof updateProcessDatesRequest>;

export const listTankProcessesQuery = z.object({
  tankId: z.string().optional(),
  status: z.nativeEnum(ProcessStatusEnum).optional(),
  page: z.string().default("1").transform(Number),
  limit: z.string().default("20").transform(Number),
});
export type ListTankProcessesQuery = z.infer<typeof listTankProcessesQuery>;
