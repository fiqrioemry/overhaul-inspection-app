// src/schemas/companies.schema.ts
import { z } from "zod";

export const COMPANY_TYPE_OPTIONS = [
  { label: "Owner", value: "OWNER" },
  { label: "Inspector Company", value: "INSPECTOR_COMPANY" },
  { label: "Contractor", value: "CONTRACTOR" },
];

export const createCompanySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(200),
  type: z.enum(["OWNER", "INSPECTOR_COMPANY", "CONTRACTOR"], { error: "Type is required" }),
  address: z.string().max(500).optional(),
  phone: z.string().max(30).optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  isActive: z.boolean().default(true),
});

export type CreateCompanyFormValues = z.infer<typeof createCompanySchema>;

export const updateCompanySchema = z.object({
  name: z.string().min(2).max(200).optional(),
  type: z.enum(["OWNER", "INSPECTOR_COMPANY", "CONTRACTOR"]).optional(),
  address: z.string().max(500).optional(),
  phone: z.string().max(30).optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  isActive: z.boolean().optional(),
});

export type UpdateCompanyFormValues = z.infer<typeof updateCompanySchema>;
