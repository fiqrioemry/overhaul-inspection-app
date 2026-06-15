// src/schemas/companies.schema.ts
import { z } from "zod";

export const createCompanySchema = z.object({
  name: z.string().min(1, "Name is required"),
  role: z.enum(["OWNER", "CONTRACTOR", "BKI", "CONSULTANT", "OTHER"], { error: "Role is required" }),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

export type CreateCompanyFormValues = z.infer<typeof createCompanySchema>;

export const updateCompanySchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  role: z.enum(["OWNER", "CONTRACTOR", "BKI", "CONSULTANT", "OTHER"]).optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

export type UpdateCompanyFormValues = z.infer<typeof updateCompanySchema>;

export const COMPANY_ROLE_OPTIONS = [
  { label: "Owner", value: "OWNER" },
  { label: "Contractor", value: "CONTRACTOR" },
  { label: "BKI", value: "BKI" },
  { label: "Consultant", value: "CONSULTANT" },
  { label: "Other", value: "OTHER" },
];

export const COMPANY_STATUS_OPTIONS = [
  { label: "Active", value: "ACTIVE" },
  { label: "Inactive", value: "INACTIVE" },
];
