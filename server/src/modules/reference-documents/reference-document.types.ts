export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ReferenceDocumentItem {
  id: string;
  code: string;
  title: string;
  documentType: string;
  revision: string | null;
  issuer: string | null;
  fileUrl: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CriteriaRefEntry {
  id: string;
  criteriaId: string;
  clause: string | null;
  page: string | null;
  notes: string | null;
  criteria: { id: string; code: string; name: string };
}

export interface ReferenceDocumentDetail extends ReferenceDocumentItem {
  criteriaRefs: CriteriaRefEntry[];
}

export interface ReferenceDocumentListResult {
  data: ReferenceDocumentItem[];
  meta: PaginationMeta;
}
