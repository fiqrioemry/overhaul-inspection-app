export interface RadiographyJointResult {
  id: string;
  radiographyTestId: string;
  jointNo: string;
  location: string | null;
  weldType: string | null;
  welderNo: string | null;
  filmNo: string | null;
  result: string;
  defectType: string | null;
  repairStatus: string | null;
  remarks: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface RadiographyTestListItem {
  id: string;
  tankProcessId: string;
  testDate: Date | null;
  area: string | null;
  totalJoint: number;
  totalShot: number;
  totalAccepted: number;
  totalRepair: number;
  totalReshoot: number;
  result: string | null;
  remarks: string | null;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdByUser: { id: string; name: string } | null;
  _count: { jointResults: number };
}

export interface RadiographyTestDetail {
  id: string;
  tankProcessId: string;
  testDate: Date | null;
  area: string | null;
  totalJoint: number;
  totalShot: number;
  totalAccepted: number;
  totalRepair: number;
  totalReshoot: number;
  result: string | null;
  remarks: string | null;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  tankProcess: {
    id: string;
    name: string;
    type: string;
    status: string;
    tank: { id: string; tankNo: string; tankName: string | null };
    processTemplate: { code: string; name: string } | null;
  } | null;
  createdByUser: { id: string; name: string } | null;
  jointResults: RadiographyJointResult[];
  attachments: {
    id: string;
    url: string;
    path: string;
    module: string;
    isUsed: boolean;
    createdAt: Date;
  }[];
}
