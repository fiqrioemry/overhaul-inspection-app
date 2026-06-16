export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface InspectionRequestListItem {
  id: string;
  tankProcessId: string;
  requestNo: string;
  status: string;
  notes: string | null;
  requestedBy: string | null;
  requestedAt: Date | null;
  reviewedBy: string | null;
  reviewNotes: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  tankProcess: {
    id: string;
    name: string;
    type: string;
    status: string;
    tankId: string;
    tank: { id: string; tankNo: string };
    processTemplate: { code: string; name: string };
  };
  requestedByUser: { id: string; name: string } | null;
  reviewedByUser: { id: string; name: string } | null;
}

export interface InspectionRequestListResult {
  data: InspectionRequestListItem[];
  meta: PaginationMeta;
}
