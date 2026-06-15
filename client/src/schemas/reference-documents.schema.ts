// src/schemas/reference-documents.schema.ts
import { z } from "zod";

export const DOCUMENT_TYPE_OPTIONS = [
  { label: "Standard", value: "STANDARD" },
  { label: "Specification", value: "SPECIFICATION" },
  { label: "Procedure", value: "PROCEDURE" },
  { label: "Drawing", value: "DRAWING" },
  { label: "Regulation", value: "REGULATION" },
  { label: "Other", value: "OTHER" },
];

export const REFERENCE_DOCUMENT_STATUS_OPTIONS = [
  { label: "Active", value: "ACTIVE" },
  { label: "Inactive", value: "INACTIVE" },
];

export const createReferenceDocumentSchema = z.object({
  code: z.string().min(1, "Code is required"),
  title: z.string().min(1, "Title is required"),
  documentType: z.enum(["STANDARD", "SPECIFICATION", "PROCEDURE", "DRAWING", "REGULATION", "OTHER"], {
    error: "Document type is required",
  }),
  revision: z.string().optional(),
  issuer: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

export type CreateReferenceDocumentFormValues = z.infer<typeof createReferenceDocumentSchema>;

export const updateReferenceDocumentSchema = createReferenceDocumentSchema.partial();
export type UpdateReferenceDocumentFormValues = z.infer<typeof updateReferenceDocumentSchema>;
