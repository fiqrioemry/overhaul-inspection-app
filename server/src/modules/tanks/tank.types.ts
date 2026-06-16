export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface TankListItem {
  id: string;
  tankNo: string;
  tankName: string | null;
  status: string;
  diameterMm: number | null;
  heightMm: number | null;
  shellCourseCount: number | null;
  hasSteamCoil: boolean;
  startDate: Date | null;
  estimatedFinishDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  contractorCompany: { id: string; name: string } | null;
  inspectionCompany: { id: string; name: string } | null;
  _count: { processes: number; findings: number };
}

export interface TankShellCourse {
  id: string;
  courseNo: number;
  thicknessMm: number | null;
  plateDimension: string | null;
  remarks: string | null;
}

export interface TankDetail {
  id: string;
  tankNo: string;
  tankName: string | null;
  status: string;
  diameterMm: number | null;
  heightMm: number | null;
  shellCourseCount: number | null;
  bottomPlateDimension: string | null;
  hasSteamCoil: boolean;
  startDate: Date | null;
  estimatedFinishDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  contractorCompany: { id: string; name: string; type: string } | null;
  inspectionCompany: { id: string; name: string; type: string } | null;
  createdByUser: { id: string; name: string } | null;
  shellCourses: TankShellCourse[];
  _count: { processes: number; findings: number };
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
