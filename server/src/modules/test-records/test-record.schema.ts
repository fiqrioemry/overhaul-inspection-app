import { z } from "zod";
import { ProcessResultEnum } from "generated/prisma";

export const createTestRecordRequest = z.object({
  testDate: z.string().optional(),
  testPressure: z.number().positive().optional(),
  pressureUnit: z.string().max(20).optional(),
  holdingTime: z.string().max(50).optional(),
  testMedium: z.string().max(100).optional(),
  leakIndication: z.boolean().optional(),
  result: z.nativeEnum(ProcessResultEnum).default(ProcessResultEnum.PENDING),
  remarks: z.string().optional(),
  fileIds: z.array(z.string()).optional(),
});
export type CreateTestRecordRequest = z.infer<typeof createTestRecordRequest>;

export const updateTestRecordRequest = createTestRecordRequest.partial();
export type UpdateTestRecordRequest = z.infer<typeof updateTestRecordRequest>;

export const completeTestRecordRequest = z.object({
  result: z.enum(["PASSED", "FAILED"]),
  remarks: z.string().optional(),
  actualFinishDate: z.string().optional(),
});
export type CompleteTestRecordRequest = z.infer<typeof completeTestRecordRequest>;
