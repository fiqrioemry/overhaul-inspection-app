import { z } from "zod";
import { TestResultStatusEnum, ProcessResultEnum } from "generated/prisma";

export const createTestRecordRequest = z.object({
  inspectionRequestItemId: z.string().optional(),
  testDate: z.string().optional(),
  testPressure: z.coerce.number().positive().optional(),
  pressureUnit: z.string().max(20).optional(),
  holdingTime: z.string().max(50).optional(),
  testMedium: z.string().max(100).optional(),
  leakIndication: z.coerce.boolean().optional(),
  status: z.nativeEnum(TestResultStatusEnum).default(TestResultStatusEnum.NOT_STARTED),
  result: z.nativeEnum(ProcessResultEnum).optional(),
  remarks: z.string().max(2000).optional(),
  newFileCaptions: z.array(z.string().max(300)).optional(),
});
export type CreateTestRecordRequest = z.infer<typeof createTestRecordRequest>;

export const updateTestRecordRequest = z.object({
  inspectionRequestItemId: z.string().nullable().optional(),
  testDate: z.string().optional(),
  testPressure: z.coerce.number().positive().optional(),
  pressureUnit: z.string().max(20).optional(),
  holdingTime: z.string().max(50).optional(),
  testMedium: z.string().max(100).optional(),
  leakIndication: z.coerce.boolean().optional(),
  status: z.nativeEnum(TestResultStatusEnum).optional(),
  result: z.nativeEnum(ProcessResultEnum).optional(),
  remarks: z.string().max(2000).optional(),
  removedAttachmentIds: z.array(z.string()).optional(),
  newFileCaptions: z.array(z.string().max(300)).optional(),
});
export type UpdateTestRecordRequest = z.infer<typeof updateTestRecordRequest>;
