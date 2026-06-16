export interface TestRecordListItem {
  id: string;
  tankProcessId: string;
  testDate: Date | null;
  testPressure: number | null;
  pressureUnit: string | null;
  holdingTime: string | null;
  testMedium: string | null;
  leakIndication: boolean | null;
  result: string;
  remarks: string | null;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdByUser: { id: string; name: string } | null;
}

export interface TestRecordDetail {
  id: string;
  tankProcessId: string;
  testDate: Date | null;
  testPressure: number | null;
  pressureUnit: string | null;
  holdingTime: string | null;
  testMedium: string | null;
  leakIndication: boolean | null;
  result: string;
  remarks: string | null;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  tankProcess: {
    id: string;
    name: string;
    type: string;
    status: string;
    tankId: string;
    tank: { id: string; tankNo: string; tankName: string | null };
    processTemplate: { code: string; name: string } | null;
  } | null;
  createdByUser: { id: string; name: string } | null;
  attachments: {
    id: string;
    url: string;
    path: string;
    module: string;
    isUsed: boolean;
    createdAt: Date;
  }[];
}
