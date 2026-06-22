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
    repair: number;
    notStarted: number;
    recent: {
      id: string;
      tankProcessId: string | null;
      testDate: Date | null;
      status: string;
      result: string;
      createdAt: Date;
      inspectionRequest: { id: string; requestNo: string; testType: string } | null;
      tankProcess: { id: string; name: string; tank: { id: string; tankNo: string } } | null;
      createdByUser: { id: string; name: string } | null;
    }[];
  };
  inspectionRequests: {
    notStarted: number;
    inProcess: number;
    repair: number;
    passed: number;
    byType: { testType: string; count: number }[];
    recent: {
      id: string;
      requestNo: string;
      testType: string;
      status: string;
      createdAt: Date;
      tank: { id: string; tankNo: string } | null;
    }[];
  };
}
