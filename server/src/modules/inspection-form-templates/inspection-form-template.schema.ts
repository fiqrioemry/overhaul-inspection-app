import { z } from "zod";
import { InspectionRequestTypeEnum } from "generated/prisma";

export const listFormTemplatesQuery = z.object({
  testType: z.nativeEnum(InspectionRequestTypeEnum).optional(),
  isActive: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
});
export type ListFormTemplatesQuery = z.infer<typeof listFormTemplatesQuery>;

export const formTemplateTestTypeParam = z.object({
  testType: z.nativeEnum(InspectionRequestTypeEnum),
});
