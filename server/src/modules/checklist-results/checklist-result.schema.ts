import { z } from "zod";

export const checkChecklistRequest = z.object({
  remarks: z.string().max(500).optional(),
});

export const bulkCheckRequest = z.object({
  checklistIds: z.array(z.string().min(1)).min(1, "At least one checklist ID is required"),
});

export const addCustomChecklistRequest = z.object({
  name: z.string().min(1).max(300),
  description: z.string().max(1000).optional(),
  acceptanceText: z.string().max(500).optional(),
  method: z.string().max(200).optional(),
  referenceText: z.string().max(500).optional(),
  isRequired: z.boolean().default(true),
  sequenceOrder: z.number().int().min(0).default(0),
  remarks: z.string().max(500).optional(),
});

export type CheckChecklistRequest = z.infer<typeof checkChecklistRequest>;
export type BulkCheckRequest = z.infer<typeof bulkCheckRequest>;
export type AddCustomChecklistRequest = z.infer<typeof addCustomChecklistRequest>;
