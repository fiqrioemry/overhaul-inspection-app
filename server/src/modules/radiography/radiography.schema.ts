import { z } from "zod";
import { ProcessResultEnum, RadiographyJointResultEnum } from "generated/prisma";

export const createRadiographyRequest = z.object({
  testDate: z.string().optional(),
  area: z.string().max(200).optional(),
  remarks: z.string().optional(),
  fileIds: z.array(z.string()).optional(),
});
export type CreateRadiographyRequest = z.infer<typeof createRadiographyRequest>;

export const updateRadiographyRequest = createRadiographyRequest.partial().extend({
  result: z.nativeEnum(ProcessResultEnum).optional(),
});
export type UpdateRadiographyRequest = z.infer<typeof updateRadiographyRequest>;

export const addJointResultRequest = z.object({
  jointNo: z.string().min(1).max(50),
  location: z.string().max(200).optional(),
  weldType: z.string().max(50).optional(),
  welderNo: z.string().max(50).optional(),
  filmNo: z.string().max(50).optional(),
  result: z.nativeEnum(RadiographyJointResultEnum).default(RadiographyJointResultEnum.PENDING),
  defectType: z.string().max(100).optional(),
  repairStatus: z.string().max(100).optional(),
  remarks: z.string().optional(),
});
export type AddJointResultRequest = z.infer<typeof addJointResultRequest>;

export const updateJointResultRequest = addJointResultRequest.partial();
export type UpdateJointResultRequest = z.infer<typeof updateJointResultRequest>;
