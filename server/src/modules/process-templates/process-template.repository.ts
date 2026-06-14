import { Prisma } from "generated/prisma";
import { pgsql as database } from "@/lib/database";
import {
  AddProcessCriteriaRequest,
  AddProcessDependencyRequest,
  CreateProcessTemplateRequest,
  ListProcessTemplatesQuery,
  UpdateProcessCriteriaRequest,
  UpdateProcessDependencyRequest,
  UpdateProcessTemplateRequest,
} from "@/modules/process-templates/process-template.schema";

const templateSelect = {
  id: true,
  code: true,
  name: true,
  type: true,
  sequenceOrder: true,
  isOptional: true,
  applicabilityRule: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

const processCriteriaSelect = {
  id: true,
  processTemplateId: true,
  criteriaId: true,
  sequenceOrder: true,
  isRequired: true,
  applicabilityRule: true,
  createdAt: true,
  updatedAt: true,
  criteria: {
    select: { id: true, code: true, name: true, acceptanceType: true, severity: true },
  },
} as const;

const dependencySelect = {
  id: true,
  processTemplateId: true,
  requiredProcessTemplateId: true,
  requiredResult: true,
  isRequired: true,
  applicabilityRule: true,
  createdAt: true,
  updatedAt: true,
  requiredProcessTemplate: {
    select: { id: true, code: true, name: true, type: true, sequenceOrder: true },
  },
} as const;

export class ProcessTemplateRepository {
  static async create(data: CreateProcessTemplateRequest) {
    return database.processTemplate.create({
      data: {
        code: data.code,
        name: data.name,
        type: data.type,
        sequenceOrder: data.sequenceOrder,
        isOptional: data.isOptional,
        applicabilityRule: data.applicabilityRule ?? null,
        isActive: data.isActive,
      },
      select: templateSelect,
    });
  }

  static async findById(id: string) {
    return database.processTemplate.findUnique({
      where: { id, deletedAt: null },
      select: {
        ...templateSelect,
        processCriteria: {
          select: processCriteriaSelect,
          orderBy: { sequenceOrder: "asc" },
        },
        dependants: {
          select: dependencySelect,
        },
      },
    });
  }

  static async findByCode(code: string) {
    return database.processTemplate.findUnique({
      where: { code },
      select: { id: true },
    });
  }

  static async findMany(query: ListProcessTemplatesQuery) {
    const { page, limit, search, type, isActive, orderBy, sortBy } = query;

    const where: Prisma.ProcessTemplateWhereInput = {
      deletedAt: null,
      ...(search && {
        OR: [
          { code: { contains: search, mode: "insensitive" } },
          { name: { contains: search, mode: "insensitive" } },
        ],
      }),
      ...(type && { type }),
      ...(isActive !== undefined && { isActive }),
    };

    const [templates, total] = await Promise.all([
      database.processTemplate.findMany({
        where,
        select: templateSelect,
        orderBy: { [orderBy]: sortBy },
        skip: (page - 1) * limit,
        take: limit,
      }),
      database.processTemplate.count({ where }),
    ]);

    return { templates, total };
  }

  static async update(id: string, data: UpdateProcessTemplateRequest) {
    return database.processTemplate.update({
      where: { id, deletedAt: null },
      data: {
        ...(data.code !== undefined && { code: data.code }),
        ...(data.name !== undefined && { name: data.name }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.sequenceOrder !== undefined && { sequenceOrder: data.sequenceOrder }),
        ...(data.isOptional !== undefined && { isOptional: data.isOptional }),
        ...(data.applicabilityRule !== undefined && { applicabilityRule: data.applicabilityRule }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
      select: templateSelect,
    });
  }

  static async softDelete(id: string) {
    return database.processTemplate.update({
      where: { id, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  }

  // Process criteria template
  static async addCriteria(processTemplateId: string, data: AddProcessCriteriaRequest) {
    return database.processCriteriaTemplate.create({
      data: {
        processTemplateId,
        criteriaId: data.criteriaId,
        sequenceOrder: data.sequenceOrder,
        isRequired: data.isRequired,
        applicabilityRule: data.applicabilityRule ?? null,
      },
      select: processCriteriaSelect,
    });
  }

  static async findCriteriaMapping(processTemplateId: string, criteriaId: string) {
    return database.processCriteriaTemplate.findUnique({
      where: { processTemplateId_criteriaId: { processTemplateId, criteriaId } },
      select: { id: true },
    });
  }

  static async findCriteriaMappingById(id: string) {
    return database.processCriteriaTemplate.findUnique({
      where: { id },
      select: { id: true, processTemplateId: true },
    });
  }

  static async listCriteria(processTemplateId: string) {
    return database.processCriteriaTemplate.findMany({
      where: { processTemplateId },
      select: processCriteriaSelect,
      orderBy: { sequenceOrder: "asc" },
    });
  }

  static async updateCriteriaMapping(id: string, data: UpdateProcessCriteriaRequest) {
    return database.processCriteriaTemplate.update({
      where: { id },
      data: {
        ...(data.sequenceOrder !== undefined && { sequenceOrder: data.sequenceOrder }),
        ...(data.isRequired !== undefined && { isRequired: data.isRequired }),
        ...(data.applicabilityRule !== undefined && { applicabilityRule: data.applicabilityRule }),
      },
      select: processCriteriaSelect,
    });
  }

  static async deleteCriteriaMapping(id: string) {
    return database.processCriteriaTemplate.delete({ where: { id } });
  }

  // Process dependency
  static async addDependency(processTemplateId: string, data: AddProcessDependencyRequest) {
    return database.processDependency.create({
      data: {
        processTemplateId,
        requiredProcessTemplateId: data.requiredProcessTemplateId,
        requiredResult: data.requiredResult,
        isRequired: data.isRequired,
        applicabilityRule: data.applicabilityRule ?? null,
      },
      select: dependencySelect,
    });
  }

  static async findDependency(processTemplateId: string, requiredProcessTemplateId: string) {
    return database.processDependency.findUnique({
      where: { processTemplateId_requiredProcessTemplateId: { processTemplateId, requiredProcessTemplateId } },
      select: { id: true },
    });
  }

  static async findDependencyById(id: string) {
    return database.processDependency.findUnique({
      where: { id },
      select: { id: true, processTemplateId: true },
    });
  }

  static async listDependencies(processTemplateId: string) {
    return database.processDependency.findMany({
      where: { processTemplateId },
      select: dependencySelect,
      orderBy: { createdAt: "asc" },
    });
  }

  static async updateDependency(id: string, data: UpdateProcessDependencyRequest) {
    return database.processDependency.update({
      where: { id },
      data: {
        ...(data.requiredResult !== undefined && { requiredResult: data.requiredResult }),
        ...(data.isRequired !== undefined && { isRequired: data.isRequired }),
        ...(data.applicabilityRule !== undefined && { applicabilityRule: data.applicabilityRule }),
      },
      select: dependencySelect,
    });
  }

  static async deleteDependency(id: string) {
    return database.processDependency.delete({ where: { id } });
  }
}
