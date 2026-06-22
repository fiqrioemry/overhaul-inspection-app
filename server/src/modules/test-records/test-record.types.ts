export interface TestRecordAttachmentItem {
  id: string;
  fileStorageId: string;
  attachmentUrl: string;
  caption: string | null;
  sortOrder: number;
  createdAt: Date;
}

export interface TestRecordItem {
  id: string;
  inspectionRequestId: string;
  inspectionRequestItemId: string | null;
  tankProcessId: string | null;
  testDate: Date | null;
  testPressure: number | null;
  pressureUnit: string | null;
  holdingTime: string | null;
  testMedium: string | null;
  leakIndication: boolean | null;
  status: string;
  result: string;
  remarks: string | null;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  inspectionRequest: { id: string; requestNo: string; testType: string; status: string } | null;
  inspectionRequestItem: { id: string; objectType: string; objectName: string | null } | null;
  tankProcess: {
    id: string;
    name: string;
    type: string;
    status: string;
    tankId: string;
    tank: { id: string; tankNo: string; tankName: string | null };
  } | null;
  createdByUser: { id: string; name: string } | null;
  attachments: TestRecordAttachmentItem[];
}
