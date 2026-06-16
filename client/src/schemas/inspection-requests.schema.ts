// src/schemas/inspection-requests.schema.ts
import { z } from "zod";

export const createInspectionRequestSchema = z.object({
  tankProcessId: z.string().min(1, "Process is required"),
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().optional(),
});

export type CreateInspectionRequestFormValues = z.infer<typeof createInspectionRequestSchema>;

export const reviewInspectionRequestSchema = z.object({
  action: z.enum(["REVIEWED", "RETURNED"]),
  notes: z.string().optional(),
});

export type ReviewInspectionRequestFormValues = z.infer<typeof reviewInspectionRequestSchema>;
