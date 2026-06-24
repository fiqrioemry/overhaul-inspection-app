export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface TankActiveProjectRef {
  id: string;
  projectNo: string;
  type: string;
  status: string;
}

export interface TankListItem {
  id: string;
  tankNo: string;
  tankName: string | null;
  assetStatus: string;
  location: string | null;
  capacityM3: number | null;
  service: string | null;
  diameterMm: number | null;
  heightMm: number | null;
  shellCourseCount: number | null;
  hasSteamCoil: boolean;
  createdAt: Date;
  updatedAt: Date;
  activeProject: TankActiveProjectRef | null;
  _count: { projects: number; findings: number };
}

export interface TankShellCourse {
  id: string;
  courseNo: number;
  thicknessMm: number | null;
  plateDimension: string | null;
  remarks: string | null;
}

export interface TankAttachment {
  id: string;
  fileStorageId: string;
  attachmentUrl: string;
  caption: string | null;
  sortOrder: number;
  createdAt: Date;
}

export interface TankDetail {
  id: string;
  tankNo: string;
  tankName: string | null;
  assetStatus: string;
  location: string | null;
  capacityM3: number | null;
  service: string | null;
  diameterMm: number | null;
  heightMm: number | null;
  shellCourseCount: number | null;
  bottomPlateDimension: string | null;
  hasSteamCoil: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdByUser: { id: string; name: string } | null;
  shellCourses: TankShellCourse[];
  attachments: TankAttachment[];
  _count: { projects: number; findings: number; dailyReports: number };
}

export interface TankProcessSummaryItem {
  id: string;
  name: string;
  type: string;
  sequenceOrder: number;
  status: string;
  processTemplate: { code: string; isOptional: boolean; applicabilityRule: string | null } | null;
  _count: { checklistResults: number; findings: number };
}

export interface TankListResult {
  data: TankListItem[];
  meta: PaginationMeta;
}
