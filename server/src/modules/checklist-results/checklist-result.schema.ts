import { z } from "zod";
import { ChecklistStatusEnum } from "generated/prisma";

export const updateChecklistResultRequest = z.object({
  status: z.nativeEnum(ChecklistStatusEnum),
  actualValue: z.number().optional(),
  actualText: z.string().max(500).optional(),
  remarks: z.string().max(500).optional(),
});
export type UpdateChecklistResultRequest = z.infer<typeof updateChecklistResultRequest>;
