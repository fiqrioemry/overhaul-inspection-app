export interface TankProcessDetail {
  id: string;
  tankId: string;
  processTemplateId: string;
  name: string;
  type: string;
  sequenceOrder: number;
  status: string;
  plannedStartDate: Date | null;
  actualStartDate: Date | null;
  actualFinishDate: Date | null;
  remarks: string | null;
  createdAt: Date;
  updatedAt: Date;
  tank: { id: string; tankNo: string; tankName: string; hasSteamCoil: boolean };
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
