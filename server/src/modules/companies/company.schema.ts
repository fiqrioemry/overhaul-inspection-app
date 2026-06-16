import { z } from "zod";
import { CompanyType } from "generated/prisma";

const booleanFromString = z.preprocess(
  (v) => (v === "true" ? true : v === "false" ? false : v),
  z.boolean(),
);

export const createCompanyRequest = z.object({
  name: z.string().min(2).max(200),
  type: z.nativeEnum(CompanyType),
  address: z.string().max(500).optional(),
  phone: z.string().max(30).optional(),
  email: z.string().email().optional().or(z.literal("")),
  isActive: booleanFromString.default(true),
});

export const updateCompanyRequest = z.object({
  name: z.string().min(2).max(200).optional(),
  type: z.nativeEnum(CompanyType).optional(),
  address: z.string().max(500).optional(),
  phone: z.string().max(30).optional(),
  email: z.string().email().optional().or(z.literal("")),
  isActive: booleanFromString.optional(),
});

export const listCompaniesQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  type: z.nativeEnum(CompanyType).optional(),
  isActive: z
    .string()
    .optional()
    .transform((v) => (v === "true" ? true : v === "false" ? false : undefined)),
  orderBy: z.enum(["name", "type", "createdAt"]).default("name"),
  sortBy: z.enum(["asc", "desc"]).default("asc"),
});

export const companyOptionsQuery = z.object({
  type: z.nativeEnum(CompanyType).optional(),
});

export type CreateCompanyRequest = z.infer<typeof createCompanyRequest>;
export type UpdateCompanyRequest = z.infer<typeof updateCompanyRequest>;
export type ListCompaniesQuery = z.infer<typeof listCompaniesQuery>;
export type CompanyOptionsQuery = z.infer<typeof companyOptionsQuery>;
