import { Prisma } from "generated/prisma";
import { pgsql as database } from "@/lib/database";
import { AddCriteriaReferenceRequest, CreateAcceptanceCriteriaRequest, ListAcceptanceCriteriaQuery, UpdateAcceptanceCriteriaRequest } from "@/modules/acceptance-criteria/acceptance-criteria.schema";

const criteriaSelect = {
  id: true,
  code: true,
  name: true,
  description: true,
  acceptanceType: true,
  operator: true,
  minValue: true,
  maxValue: true,
  unit: true,
  acceptanceText: true,
  method: true,
  tools: true,
  isRequired: true,
  severity: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} as const;

const criteriaReferenceSelect = {
  id: true,
  criteriaId: true,
  referenceDocumentId: true,
  clause: true,
  page: true,
  notes: true,
  createdAt: true,
  referenceDocument: {
    select: { id: true, code: true, title: true, documentType: true },
  },
} as const;

export class AcceptanceCriteriaRepository {
  static async create(data: CreateAcceptanceCriteriaRequest) {
    return database.acceptanceCriteria.create({
      data: {
        code: data.code,
        name: data.name,
        description: data.description ?? null,
        acceptanceType: data.acceptanceType,
        operator: data.operator ?? null,
        minValue: data.minValue ?? null,
        maxValue: data.maxValue ?? null,
        unit: data.unit ?? null,
        acceptanceText: data.acceptanceText ?? null,
        method: data.method ?? null,
        tools: data.tools ?? null,
        isRequired: data.isRequired,
        severity: data.severity,
        status: data.status,
      },
      select: criteriaSelect,
    });
  }

  static async findById(id: string) {
    return database.acceptanceCriteria.findUnique({
      where: { id, deletedAt: null },
      select: {
        ...criteriaSelect,
        criteriaRefs: { select: criteriaReferenceSelect },
      },
    });
  }

  static async findByCode(code: string) {
    return database.acceptanceCriteria.findUnique({
      where: { code },
      select: { id: true },
    });
  }

  static async findMany(query: ListAcceptanceCriteriaQuery) {
    const { page, limit, search, acceptanceType, severity, status, orderBy, sortBy } = query;

    const where: Prisma.AcceptanceCriteriaWhereInput = {
      deletedAt: null,
      ...(search && {
        OR: [
          { code: { contains: search, mode: "insensitive" } },
          { name: { contains: search, mode: "insensitive" } },
        ],
      }),
      ...(acceptanceType && { acceptanceType }),
      ...(severity && { severity }),
      ...(status && { status }),
    };

    const [criteria, total] = await Promise.all([
      database.acceptanceCriteria.findMany({
        where,
        select: criteriaSelect,
        orderBy: { [orderBy]: sortBy },
        skip: (page - 1) * limit,
        take: limit,
      }),
      database.acceptanceCriteria.count({ where }),
    ]);

    return { criteria, total };
  }

  static async update(id: string, data: UpdateAcceptanceCriteriaRequest) {
    return database.acceptanceCriteria.update({
      where: { id, deletedAt: null },
      data: {
        ...(data.code !== undefined && { code: data.code }),
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.acceptanceType !== undefined && { acceptanceType: data.acceptanceType }),
        ...(data.operator !== undefined && { operator: data.operator }),
        ...(data.minValue !== undefined && { minValue: data.minValue }),
        ...(data.maxValue !== undefined && { maxValue: data.maxValue }),
        ...(data.unit !== undefined && { unit: data.unit }),
        ...(data.acceptanceText !== undefined && { acceptanceText: data.acceptanceText }),
        ...(data.method !== undefined && { method: data.method }),
        ...(data.tools !== undefined && { tools: data.tools }),
        ...(data.isRequired !== undefined && { isRequired: data.isRequired }),
        ...(data.severity !== undefined && { severity: data.severity }),
        ...(data.status !== undefined && { status: data.status }),
      },
      select: criteriaSelect,
    });
  }

  static async softDelete(id: string) {
    return database.acceptanceCriteria.update({
      where: { id, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  }

  static async countProcessUsage(id: string) {
    return database.processCriteriaTemplate.count({ where: { criteriaId: id } });
  }

  // Criteria references
  static async addReference(criteriaId: string, data: AddCriteriaReferenceRequest) {
    return database.criteriaReference.create({
      data: {
        criteriaId,
        referenceDocumentId: data.referenceDocumentId,
        clause: data.clause ?? null,
        page: data.page ?? null,
        notes: data.notes ?? null,
      },
      select: criteriaReferenceSelect,
    });
  }

  static async findReferenceById(id: string) {
    return database.criteriaReference.findUnique({
      where: { id },
      select: { id: true, criteriaId: true },
    });
  }

  static async findReferenceByUnique(criteriaId: string, referenceDocumentId: string) {
    return database.criteriaReference.findUnique({
      where: { criteriaId_referenceDocumentId: { criteriaId, referenceDocumentId } },
      select: { id: true },
    });
  }

  static async listReferences(criteriaId: string) {
    return database.criteriaReference.findMany({
      where: { criteriaId },
      select: criteriaReferenceSelect,
      orderBy: { createdAt: "asc" },
    });
  }

  static async deleteReference(id: string) {
    return database.criteriaReference.delete({ where: { id } });
  }

  static async countReferences(criteriaId: string) {
    return database.criteriaReference.count({ where: { criteriaId } });
  }
}
