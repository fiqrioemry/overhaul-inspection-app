export interface DashboardSummary {
  tanks: { total: number; operational: number; underOverhaul: number };
  projects: { total: number; active: number; completed: number; overdue: number };
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

// One progress row = one TankProject (engagement), not a tank.
export interface TankProgressItem {
  id: string;
  projectNo: string;
  type: string;
  status: string;
  startDate: Date | null;
  estimatedFinishDate: Date | null;
  createdAt: Date;
  tank: { id: string; tankNo: string; tankName: string | null } | null;
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
    tankProcess: { id: string; name: string } | null;
  }[];
}

export interface DailyActivityItem {
  id: string;
  title: string;
  activityType: string;
  reportDate: Date;
  createdAt: Date;
  attachmentCount: number;
  tank: { id: string; tankNo: string; tankName: string | null } | null;
  tankProcess: { id: string; name: string } | null;
  inspector: { id: string; name: string } | null;
}

export interface DailyActivitySummary {
  date: string;
  total: number;
  items: DailyActivityItem[];
}

export interface DashboardInspectionRequestObject {
  id: string;
  objectType: string;
  objectName: string | null;
  quantity: number;
  unit: string | null;
  locationDetail: string | null;
}

export interface DashboardInspectionRequestItem {
  id: string;
  requestNo: string;
  testType: string;
  status: string;
  requestDate: Date;
  createdAt: Date;
  executionParty: string | null;
  tank: { id: string; tankNo: string; tankName: string | null } | null;
  tankProcess: { id: string; name: string } | null;
  items: DashboardInspectionRequestObject[];
}

export interface InProcessInspectionRequests {
  total: number;
  items: DashboardInspectionRequestItem[];
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
      tankProcess: { id: string; name: string; project: { id: string; tank: { id: string; tankNo: string } } } | null;
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
