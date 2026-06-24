export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface TankProjectProgress {
  totalProcesses: number;
  completedProcesses: number;
  progress: number;
  currentProcess: { id: string; name: string; status: string } | null;
}

export interface TankProjectListItem {
  id: string;
  projectNo: string;
  tankId: string;
  type: string;
  status: string;
  startDate: Date | null;
  estimatedFinishDate: Date | null;
  actualFinishDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  tank: { id: string; tankNo: string; tankName: string | null; location: string | null; service: string | null } | null;
  contractorCompany: { id: string; name: string } | null;
  inspectionCompany: { id: string; name: string } | null;
  progress: TankProjectProgress;
  _count: { findings: number };
}

export interface TankProjectListResult {
  data: TankProjectListItem[];
  meta: PaginationMeta;
}
