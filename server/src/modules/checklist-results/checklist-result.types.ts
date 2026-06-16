export interface ChecklistCriteriaRef {
  documentCode: string;
  documentTitle: string;
  clause: string | null;
  page: string | null;
  notes: string | null;
}

export interface ChecklistCriteriaDetail {
  id: string;
  code: string;
  name: string;
  description: string | null;
  acceptanceType: string;
  operator: string | null;
  minValue: number | null;
  maxValue: number | null;
  unit: string | null;
  acceptanceText: string | null;
  method: string | null;
  tools: string | null;
  severity: string;
  isRequired: boolean;
  references: ChecklistCriteriaRef[];
}

export interface ChecklistResultItem {
  id: string;
  tankProcessId: string;
  criteriaId: string | null;
  source: "TEMPLATE" | "CUSTOM";
  status: "NOT_CHECKED" | "PASSED";
  isRequired: boolean;
  sequenceOrder: number;
  customName: string | null;
  customDescription: string | null;
  customAcceptanceText: string | null;
  customMethod: string | null;
  customReferenceText: string | null;
  remarks: string | null;
  checkedAt: Date | null;
  checkedBy: { id: string; name: string } | null;
  createdAt: Date;
  updatedAt: Date;
  criteria: ChecklistCriteriaDetail | null;
  acceptanceDisplay: string;
  methodDisplay: string;
  referenceDisplay: string;
  nameDisplay: string;
}
