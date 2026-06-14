import { z } from "zod";
import { AcceptanceType, CriteriaSeverity, MasterDataStatus } from "generated/prisma";

export const createAcceptanceCriteriaRequest = z.object({
  code: z.string().min(1).max(50),
  name: z.string().min(2).max(300),
  description: z.string().max(1000).optional(),
  acceptanceType: z.nativeEnum(AcceptanceType),
  operator: z.string().max(20).optional(),
  minValue: z.number().optional(),
  maxValue: z.number().optional(),
  unit: z.string().max(30).optional(),
  acceptanceText: z.string().max(500).optional(),
  method: z.string().max(200).optional(),
  tools: z.string().max(200).optional(),
  isRequired: z.boolean().default(true),
  severity: z.nativeEnum(CriteriaSeverity).default(CriteriaSeverity.MAJOR),
  status: z.nativeEnum(MasterDataStatus).default(MasterDataStatus.DRAFT),
});

export const updateAcceptanceCriteriaRequest = z.object({
  code: z.string().min(1).max(50).optional(),
  name: z.string().min(2).max(300).optional(),
  description: z.string().max(1000).optional(),
  acceptanceType: z.nativeEnum(AcceptanceType).optional(),
  operator: z.string().max(20).optional(),
  minValue: z.number().optional(),
  maxValue: z.number().optional(),
  unit: z.string().max(30).optional(),
  acceptanceText: z.string().max(500).optional(),
  method: z.string().max(200).optional(),
  tools: z.string().max(200).optional(),
  isRequired: z.boolean().optional(),
  severity: z.nativeEnum(CriteriaSeverity).optional(),
  status: z.nativeEnum(MasterDataStatus).optional(),
});

export const listAcceptanceCriteriaQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  acceptanceType: z.nativeEnum(AcceptanceType).optional(),
  severity: z.nativeEnum(CriteriaSeverity).optional(),
  status: z.nativeEnum(MasterDataStatus).optional(),
  orderBy: z.enum(["code", "name", "acceptanceType", "severity", "createdAt"]).default("code"),
  sortBy: z.enum(["asc", "desc"]).default("asc"),
});

export const addCriteriaReferenceRequest = z.object({
  referenceDocumentId: z.string().min(1),
  clause: z.string().max(100).optional(),
  page: z.string().max(20).optional(),
  notes: z.string().max(500).optional(),
});

export type CreateAcceptanceCriteriaRequest = z.infer<typeof createAcceptanceCriteriaRequest>;
export type UpdateAcceptanceCriteriaRequest = z.infer<typeof updateAcceptanceCriteriaRequest>;
export type ListAcceptanceCriteriaQuery = z.infer<typeof listAcceptanceCriteriaQuery>;
export type AddCriteriaReferenceRequest = z.infer<typeof addCriteriaReferenceRequest>;
