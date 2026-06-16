export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface AcceptanceCriteriaItem {
  id: string;
  code: string;
  name: string;
  description: string | null;
  acceptanceType: string;
  operator: string | null;
  minValue: number | null;
  maxValue: number | null;
  unit: string | null;
  acceptanceText: string | null;
  method: string | null;
  tools: string | null;
  isRequired: boolean;
  severity: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  criteriaRefs: Array<{ id: string; referenceDocument: { id: string; code: string; title: string } }>;
}

export interface CriteriaReferenceItem {
  id: string;
  criteriaId: string;
  referenceDocumentId: string;
  clause: string | null;
  page: string | null;
  notes: string | null;
  createdAt: Date;
  referenceDocument: { id: string; code: string; title: string; documentType: string };
}

export interface AcceptanceCriteriaDetail extends AcceptanceCriteriaItem {
  criteriaRefs: CriteriaReferenceItem[];
}

export interface AcceptanceCriteriaListResult {
  data: AcceptanceCriteriaItem[];
  meta: PaginationMeta;
}
