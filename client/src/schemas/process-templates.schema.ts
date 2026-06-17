// src/schemas/process-templates.schema.ts
import { z } from "zod";

export const PROCESS_TYPE_OPTIONS = [
  { label: "Work", value: "WORK" },
  { label: "Inspection", value: "INSPECTION" },
  { label: "Test", value: "TEST" },
  { label: "NDT", value: "NDT" },
  { label: "Coating", value: "COATING" },
  { label: "Commissioning", value: "COMMISSIONING" },
];

export const REQUIRED_STATUS_OPTIONS = [
  { label: "Completed", value: "COMPLETED" },
  { label: "Reviewed", value: "REVIEWED" },
];

export const createProcessTemplateSchema = z.object({
  code: z.string().min(1, "Code is required"),
  name: z.string().min(1, "Name is required"),
  type: z.enum(["WORK", "INSPECTION", "TEST", "NDT", "COATING", "COMMISSIONING"], {
    error: "Type is required",
  }),
  sequenceOrder: z.number().int().min(0, "Sequence order must be a non-negative integer"),
  isOptional: z.boolean(),
  applicabilityRule: z.string().optional(),
  isActive: z.boolean(),
});

export type CreateProcessTemplateFormValues = z.infer<typeof createProcessTemplateSchema>;

export const updateProcessTemplateSchema = createProcessTemplateSchema.partial();
export type UpdateProcessTemplateFormValues = z.infer<typeof updateProcessTemplateSchema>;

export const addCriteriaToTemplateSchema = z.object({
  criteriaId: z.string().min(1, "Criteria is required"),
  sequenceOrder: z.number().int(),
  isRequired: z.boolean(),
});

export type AddCriteriaToTemplateFormValues = z.infer<typeof addCriteriaToTemplateSchema>;

export const addDependencySchema = z.object({
  dependsOnId: z.string().min(1, "Process is required"),
  requiredStatus: z.enum(["COMPLETED", "REVIEWED"]),
  isRequired: z.boolean(),
  applicabilityRule: z.string().optional(),
});

export type AddDependencyFormValues = z.infer<typeof addDependencySchema>;
