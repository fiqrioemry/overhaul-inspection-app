export interface TankProcessDetail {
  id: string;
  projectId: string;
  processTemplateId: string;
  name: string;
  type: string;
  sequenceOrder: number;
  status: string;
  startDate: Date | null;
  finishDate: Date | null;
  remarks: string | null;
  createdAt: Date;
  updatedAt: Date;
  project: {
    id: string;
    projectNo: string;
    type: string;
    status: string;
    tank: { id: string; tankNo: string; tankName: string | null; hasSteamCoil: boolean };
  };
  processTemplate: {
    id: string;
    code: string;
    name: string;
    type: string;
    sequenceOrder: number;
    isOptional: boolean;
    applicabilityRule: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  } | null;
  _count: { checklistResults: number; findings: number; inspectionRequests: number };
}
