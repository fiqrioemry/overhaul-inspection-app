export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ProcessTemplateItem {
  id: string;
  code: string;
  name: string;
  type: string;
  sequenceOrder: number;
  isOptional: boolean;
  applicabilityRule: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProcessCriteriaItem {
  id: string;
  processTemplateId: string;
  criteriaId: string;
  sequenceOrder: number;
  isRequired: boolean;
  applicabilityRule: string | null;
  createdAt: Date;
  updatedAt: Date;
  criteria: { id: string; code: string; name: string; acceptanceType: string; severity: string };
}

export interface ProcessDependencyItem {
  id: string;
  processTemplateId: string;
  requiredProcessTemplateId: string;
  requiredResult: string;
  isRequired: boolean;
  applicabilityRule: string | null;
  createdAt: Date;
  updatedAt: Date;
  requiredProcessTemplate: { id: string; code: string; name: string; type: string; sequenceOrder: number };
}

export interface ProcessTemplateDetail extends ProcessTemplateItem {
  processCriteria: ProcessCriteriaItem[];
  dependants: ProcessDependencyItem[];
}

export interface ProcessTemplateListResult {
  data: ProcessTemplateItem[];
  meta: PaginationMeta;
}
