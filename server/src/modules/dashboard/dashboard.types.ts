export interface DashboardSummary {
  tanks: { total: number; active: number; inProgress: number };
  processes: { total: number; completed: number };
  findings: { open: number; critical: number };
  inspectionRequests: { pending: number };
}

export interface TankProgressProcess {
  id: string;
  name: string;
  type: string;
  sequenceOrder: number;
  status: string;
  result: string | null;
}

export interface TankProgressItem {
  id: string;
  tankNo: string;
  tankName: string | null;
  status: string;
  startDate: Date | null;
  estimatedFinishDate: Date | null;
  createdAt: Date;
  contractorCompany: { id: string; name: string } | null;
  inspectionCompany: { id: string; name: string } | null;
  processes: TankProgressProcess[];
  _count: { findings: number };
  progress: number;
}

export interface FindingStatusCount {
  status: string;
  count: number;
}

export interface FindingSeverityCount {
  severity: string;
  count: number;
}

export interface FindingSummary {
  byStatus: FindingStatusCount[];
  bySeverity: FindingSeverityCount[];
  recent: {
    id: string;
    findingNo: string;
    title: string;
    status: string;
    severity: string;
    createdAt: Date;
    tank: { id: string; tankNo: string };
    tankProcess: { id: string; name: string };
  }[];
}

export interface TestSummary {
  testRecords: {
    passed: number;
    failed: number;
    pending: number;
    recent: {
      id: string;
      tankProcessId: string;
      testDate: Date | null;
      result: string;
      createdAt: Date;
      tankProcess: { id: string; name: string; tank: { id: string; tankNo: string } };
      createdByUser: { id: string; name: string } | null;
    }[];
  };
  radiography: {
    recent: {
      id: string;
      tankProcessId: string;
      testDate: Date | null;
      result: string | null;
      createdAt: Date;
      tankProcess: { id: string; name: string; tank: { id: string; tankNo: string } };
    }[];
  };
}
