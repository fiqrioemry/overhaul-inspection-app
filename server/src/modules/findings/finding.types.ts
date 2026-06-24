export interface FindingListItem {
  id: string;
  findingNo: string;
  tankId: string;
  projectId: string | null;
  tankProcessId: string | null;
  criteriaId: string | null;
  title: string;
  description: string | null;
  locationDetail: string | null;
  severity: string;
  status: string;
  isBlocking: boolean;
  createdAt: Date;
  updatedAt: Date;
  tank: { id: string; tankNo: string };
  project: { id: string; projectNo: string; type: string; status: string } | null;
  tankProcess: { id: string; name: string } | null;
  criteria: { id: string; code: string; name: string } | null;
  createdByUser: { id: string; name: string } | null;
}

export interface FindingListMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface FindingListResult {
  data: FindingListItem[];
  meta: FindingListMeta;
}
