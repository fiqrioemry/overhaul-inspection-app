// src/schemas/acceptance-criteria.schema.ts
import { z } from "zod";

export const ACCEPTANCE_TYPE_OPTIONS = [
  { label: "Pass / Fail", value: "PASS_FAIL" },
  { label: "Numeric Min", value: "NUMERIC_MIN" },
  { label: "Numeric Max", value: "NUMERIC_MAX" },
  { label: "Numeric Range", value: "NUMERIC_RANGE" },
  { label: "Text", value: "TEXT" },
  { label: "Dependency", value: "DEPENDENCY" },
];

export const SEVERITY_OPTIONS = [
  { label: "Critical", value: "CRITICAL" },
  { label: "Major", value: "MAJOR" },
  { label: "Minor", value: "MINOR" },
  { label: "Observation", value: "OBSERVATION" },
];

export const ACCEPTANCE_CRITERIA_STATUS_OPTIONS = [
  { label: "Active", value: "ACTIVE" },
  { label: "Inactive", value: "INACTIVE" },
];

export const createAcceptanceCriteriaSchema = z.object({
  code: z.string().min(1, "Code is required"),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  acceptanceType: z.enum(["PASS_FAIL", "NUMERIC_MIN", "NUMERIC_MAX", "NUMERIC_RANGE", "TEXT", "DEPENDENCY"], {
    error: "Acceptance type is required",
  }),
  minValue: z.number().optional(),
  maxValue: z.number().optional(),
  unit: z.string().optional(),
  acceptanceText: z.string().optional(),
  method: z.string().optional(),
  tools: z.string().optional(),
  isCountable: z.boolean(),
  isRequired: z.boolean(),
  severity: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

export type CreateAcceptanceCriteriaFormValues = z.infer<typeof createAcceptanceCriteriaSchema>;

export const updateAcceptanceCriteriaSchema = createAcceptanceCriteriaSchema.partial();
export type UpdateAcceptanceCriteriaFormValues = z.infer<typeof updateAcceptanceCriteriaSchema>;

export const addCriteriaReferenceSchema = z.object({
  referenceDocumentId: z.string().min(1, "Reference document is required"),
  clause: z.string().optional(),
});

export type AddCriteriaReferenceFormValues = z.infer<typeof addCriteriaReferenceSchema>;
