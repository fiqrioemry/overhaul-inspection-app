export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface InspectionRequestSummaryCounts {
  totalObjects: number;
  totalTestRecords: number;
  totalPassed: number;
  totalRepair: number;
  totalNotStarted: number;
  progressPercent: number;
}

export interface InspectionRequestListItem {
  id: string;
  requestNo: string;
  testType: string;
  status: string;
  requestDate: Date;
  tankId: string | null;
  tankProcessId: string | null;
  createdAt: Date;
  updatedAt: Date;
  tank: { id: string; tankNo: string; tankName: string | null } | null;
  tankProcess: { id: string; name: string } | null;
  requestedByUser: { id: string; name: string } | null;
  summary: InspectionRequestSummaryCounts;
}

export interface InspectionRequestListResult {
  data: InspectionRequestListItem[];
  meta: PaginationMeta;
}
