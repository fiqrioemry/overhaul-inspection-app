import { Prisma } from "generated/prisma";
import { pgsql as database } from "@/lib/database";
import { CreateReferenceDocumentRequest, ListReferenceDocumentsQuery, UpdateReferenceDocumentRequest } from "@/modules/reference-documents/reference-document.schema";

const refDocSelect = {
  id: true,
  code: true,
  title: true,
  documentType: true,
  revision: true,
  issuer: true,
  fileUrl: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} as const;

export class ReferenceDocumentRepository {
  static async create(data: CreateReferenceDocumentRequest) {
    return database.referenceDocument.create({
      data: {
        code: data.code,
        title: data.title,
        documentType: data.documentType,
        revision: data.revision ?? null,
        issuer: data.issuer ?? null,
        fileUrl: data.fileUrl || null,
        status: data.status,
      },
      select: refDocSelect,
    });
  }

  static async findById(id: string) {
    return database.referenceDocument.findUnique({
      where: { id, deletedAt: null },
      select: {
        ...refDocSelect,
        criteriaRefs: {
          select: {
            id: true,
            criteriaId: true,
            clause: true,
            page: true,
            notes: true,
            criteria: { select: { id: true, code: true, name: true } },
          },
        },
      },
    });
  }

  static async findByCode(code: string) {
    return database.referenceDocument.findUnique({
      where: { code },
      select: { id: true },
    });
  }

  static async findMany(query: ListReferenceDocumentsQuery) {
    const { page, limit, search, documentType, status, orderBy, sortBy } = query;

    const where: Prisma.ReferenceDocumentWhereInput = {
      deletedAt: null,
      ...(search && {
        OR: [
          { code: { contains: search, mode: "insensitive" } },
          { title: { contains: search, mode: "insensitive" } },
          { issuer: { contains: search, mode: "insensitive" } },
        ],
      }),
      ...(documentType && { documentType }),
      ...(status && { status }),
    };

    const [documents, total] = await Promise.all([
      database.referenceDocument.findMany({
        where,
        select: refDocSelect,
        orderBy: { [orderBy]: sortBy },
        skip: (page - 1) * limit,
        take: limit,
      }),
      database.referenceDocument.count({ where }),
    ]);

    return { documents, total };
  }

  static async update(id: string, data: UpdateReferenceDocumentRequest) {
    return database.referenceDocument.update({
      where: { id, deletedAt: null },
      data: {
        ...(data.code !== undefined && { code: data.code }),
        ...(data.title !== undefined && { title: data.title }),
        ...(data.documentType !== undefined && { documentType: data.documentType }),
        ...(data.revision !== undefined && { revision: data.revision }),
        ...(data.issuer !== undefined && { issuer: data.issuer }),
        ...(data.fileUrl !== undefined && { fileUrl: data.fileUrl || null }),
        ...(data.status !== undefined && { status: data.status }),
      },
      select: refDocSelect,
    });
  }

  static async softDelete(id: string) {
    return database.referenceDocument.update({
      where: { id, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  }

  static async countCriteriaUsing(id: string) {
    return database.criteriaReference.count({
      where: { referenceDocumentId: id },
    });
  }
}
