export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface DailyReportAttachmentItem {
  id: string;
  fileStorageId: string;
  attachmentUrl: string;
  caption: string | null;
  sortOrder: number;
  createdAt: Date;
}

export interface DailyReportListItem {
  id: string;
  tankId: string | null;
  projectId: string | null;
  tankProcessId: string | null;
  reportDate: Date;
  activityType: string;
  description: string | null;
  recommendation: string | null;
  inspectorId: string | null;
  pertaminaPicId: string | null;
  aiSuggestedDescription: string | null;
  createdAt: Date;
  updatedAt: Date;
  tank: { id: string; tankNo: string; tankName: string | null; location: string | null } | null;
  project: { id: string; projectNo: string; type: string; status: string } | null;
  tankProcess: { id: string; name: string } | null;
  inspector: { id: string; name: string } | null;
  attachments: DailyReportAttachmentItem[];
}

export interface DailyReportListResult {
  data: DailyReportListItem[];
  meta: PaginationMeta;
}
