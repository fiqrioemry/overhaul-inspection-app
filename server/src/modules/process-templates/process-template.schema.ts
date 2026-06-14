import { z } from "zod";
import { ProcessType, ProcessResultEnum } from "generated/prisma";

export const createProcessTemplateRequest = z.object({
  code: z.string().min(1).max(50),
  name: z.string().min(2).max(300),
  type: z.nativeEnum(ProcessType),
  sequenceOrder: z.number().int().positive(),
  isOptional: z.boolean().default(false),
  applicabilityRule: z.string().max(200).optional(),
  isActive: z.boolean().default(true),
});

export const updateProcessTemplateRequest = z.object({
  code: z.string().min(1).max(50).optional(),
  name: z.string().min(2).max(300).optional(),
  type: z.nativeEnum(ProcessType).optional(),
  sequenceOrder: z.number().int().positive().optional(),
  isOptional: z.boolean().optional(),
  applicabilityRule: z.string().max(200).optional(),
  isActive: z.boolean().optional(),
});

export const listProcessTemplatesQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
  search: z.string().optional(),
  type: z.nativeEnum(ProcessType).optional(),
  isActive: z
    .string()
    .optional()
    .transform((v) => (v === "true" ? true : v === "false" ? false : undefined)),
  orderBy: z.enum(["code", "name", "type", "sequenceOrder", "createdAt"]).default("sequenceOrder"),
  sortBy: z.enum(["asc", "desc"]).default("asc"),
});

export const addProcessCriteriaRequest = z.object({
  criteriaId: z.string().min(1),
  sequenceOrder: z.number().int().nonnegative().default(0),
  isRequired: z.boolean().default(true),
  applicabilityRule: z.string().max(200).optional(),
});

export const updateProcessCriteriaRequest = z.object({
  sequenceOrder: z.number().int().nonnegative().optional(),
  isRequired: z.boolean().optional(),
  applicabilityRule: z.string().max(200).optional(),
});

export const addProcessDependencyRequest = z.object({
  requiredProcessTemplateId: z.string().min(1),
  requiredResult: z.nativeEnum(ProcessResultEnum).default(ProcessResultEnum.PASSED),
  isRequired: z.boolean().default(true),
  applicabilityRule: z.string().max(200).optional(),
});

export const updateProcessDependencyRequest = z.object({
  requiredResult: z.nativeEnum(ProcessResultEnum).optional(),
  isRequired: z.boolean().optional(),
  applicabilityRule: z.string().max(200).optional(),
});

export type CreateProcessTemplateRequest = z.infer<typeof createProcessTemplateRequest>;
export type UpdateProcessTemplateRequest = z.infer<typeof updateProcessTemplateRequest>;
export type ListProcessTemplatesQuery = z.infer<typeof listProcessTemplatesQuery>;
export type AddProcessCriteriaRequest = z.infer<typeof addProcessCriteriaRequest>;
export type UpdateProcessCriteriaRequest = z.infer<typeof updateProcessCriteriaRequest>;
export type AddProcessDependencyRequest = z.infer<typeof addProcessDependencyRequest>;
export type UpdateProcessDependencyRequest = z.infer<typeof updateProcessDependencyRequest>;
