import { z } from "zod";
import {
  InspectionRequestStatusEnum,
  InspectionRequestTypeEnum,
  InspectionObjectTypeEnum,
  InspectionRequestAttachmentTypeEnum,
} from "generated/prisma";

// Whole-tank / pressure tests apply to the tank or system as a whole, so
// per-object inspection item rows are optional for these test types. Sourced
// from the single TEST_TYPE_CONFIG map (objectScope === "WHOLE_TANK").
export { OBJECT_OPTIONAL_TEST_TYPES } from "@/config/constant/inspection-request.constant";
import { OBJECT_OPTIONAL_TEST_TYPES } from "@/config/constant/inspection-request.constant";

export const inspectionRequestItemInput = z.object({
  objectType: z.nativeEnum(InspectionObjectTypeEnum),
  objectName: z.string().max(200).optional(),
  quantity: z.coerce.number().int().min(1).default(1),
  unit: z.string().max(50).optional(),
  locationDetail: z.string().max(300).optional(),
  remarks: z.string().max(500).optional(),
});
export type InspectionRequestItemInput = z.infer<typeof inspectionRequestItemInput>;

export const createInspectionRequestRequest = z
  .object({
    testType: z.nativeEnum(InspectionRequestTypeEnum),
    tankId: z.string().optional(),
    projectId: z.string().optional(),
    tankProcessId: z.string().optional(),
    requestDate: z.string().min(1),
    requestedBy: z.string().optional(),
    assetHolder: z.string().max(200).optional(),
    executionParty: z.string().max(200).optional(),
    executionCompanyId: z.string().optional(),
    receivedById: z.string().optional(),
    preparedById: z.string().optional(),
    approvedById: z.string().optional(),
    standardAndCode: z.string().max(200).optional(),
    requestLocation: z.string().max(300).optional(),
    description: z.string().max(10000).optional(),
    remarks: z.string().max(2000).optional(),
    items: z.array(inspectionRequestItemInput).default([]),
  })
  // A tank process can only be referenced when the request is also tied to a tank.
  .refine((data) => !data.tankProcessId || Boolean(data.tankId), {
    message: "tankId is required when tankProcessId is provided",
    path: ["tankProcessId"],
  })
  .refine((data) => OBJECT_OPTIONAL_TEST_TYPES.has(data.testType) || data.items.length > 0, {
    message: "At least one inspection object is required for this test type",
    path: ["items"],
  });
export type CreateInspectionRequestRequest = z.infer<typeof createInspectionRequestRequest>;

export const updateInspectionRequestRequest = z
  .object({
    testType: z.nativeEnum(InspectionRequestTypeEnum).optional(),
    tankId: z.string().nullable().optional(),
    projectId: z.string().nullable().optional(),
    tankProcessId: z.string().nullable().optional(),
    requestDate: z.string().optional(),
    requestedBy: z.string().nullable().optional(),
    assetHolder: z.string().max(200).nullable().optional(),
    executionParty: z.string().max(200).nullable().optional(),
    executionCompanyId: z.string().nullable().optional(),
    receivedById: z.string().nullable().optional(),
    preparedById: z.string().nullable().optional(),
    approvedById: z.string().nullable().optional(),
    standardAndCode: z.string().max(200).nullable().optional(),
    requestLocation: z.string().max(300).nullable().optional(),
    description: z.string().max(10000).nullable().optional(),
    remarks: z.string().max(2000).nullable().optional(),
    // Emptiness is validated in the service against the effective test type,
    // since testType may be absent from a partial update payload.
    items: z.array(inspectionRequestItemInput).optional(),
  })
  .refine((data) => !data.tankProcessId || Boolean(data.tankId), {
    message: "tankId is required when tankProcessId is provided",
    path: ["tankProcessId"],
  });
export type UpdateInspectionRequestRequest = z.infer<typeof updateInspectionRequestRequest>;

export const updateStatusRequest = z.object({
  status: z.enum([InspectionRequestStatusEnum.REPAIR, InspectionRequestStatusEnum.PASSED]),
  remarks: z.string().max(2000).optional(),
});
export type UpdateStatusRequest = z.infer<typeof updateStatusRequest>;

export const uploadAttachmentRequest = z.object({
  attachmentType: z.nativeEnum(InspectionRequestAttachmentTypeEnum).default("SUPPORTING_DOCUMENT"),
  caption: z.string().max(300).optional(),
});
export type UploadAttachmentRequest = z.infer<typeof uploadAttachmentRequest>;

export const listInspectionRequestsQuery = z.object({
  tankId: z.string().optional(),
  projectId: z.string().optional(),
  tankProcessId: z.string().optional(),
  testType: z.nativeEnum(InspectionRequestTypeEnum).optional(),
  status: z.nativeEnum(InspectionRequestStatusEnum).optional(),
  search: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.string().default("1").transform(Number),
  limit: z.string().default("10").transform(Number),
});
export type ListInspectionRequestsQuery = z.infer<typeof listInspectionRequestsQuery>;

export const tankProcessOptionsQuery = z.object({
  tankId: z.string().min(1),
});
export type TankProcessOptionsQuery = z.infer<typeof tankProcessOptionsQuery>;
