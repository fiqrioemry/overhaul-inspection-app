import { z } from "zod";
import { DocumentType, MasterDataStatus } from "generated/prisma";

export const createReferenceDocumentRequest = z.object({
  code: z.string().min(1).max(50),
  title: z.string().min(2).max(300),
  documentType: z.nativeEnum(DocumentType),
  revision: z.string().max(20).optional(),
  issuer: z.string().max(200).optional(),
  fileUrl: z.string().url().optional().or(z.literal("")),
  status: z.nativeEnum(MasterDataStatus).default(MasterDataStatus.DRAFT),
});

export const updateReferenceDocumentRequest = z.object({
  code: z.string().min(1).max(50).optional(),
  title: z.string().min(2).max(300).optional(),
  documentType: z.nativeEnum(DocumentType).optional(),
  revision: z.string().max(20).optional(),
  issuer: z.string().max(200).optional(),
  fileUrl: z.string().url().optional().or(z.literal("")),
  status: z.nativeEnum(MasterDataStatus).optional(),
});

export const listReferenceDocumentsQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  documentType: z.nativeEnum(DocumentType).optional(),
  status: z.nativeEnum(MasterDataStatus).optional(),
  orderBy: z.enum(["code", "title", "documentType", "createdAt"]).default("code"),
  sortBy: z.enum(["asc", "desc"]).default("asc"),
});

export type CreateReferenceDocumentRequest = z.infer<typeof createReferenceDocumentRequest>;
export type UpdateReferenceDocumentRequest = z.infer<typeof updateReferenceDocumentRequest>;
export type ListReferenceDocumentsQuery = z.infer<typeof listReferenceDocumentsQuery>;
