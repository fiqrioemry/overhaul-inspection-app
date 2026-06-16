export interface ChecklistResultItem {
  id: string;
  tankProcessId: string;
  criteriaId: string;
  status: string;
  actualValue: number | null;
  actualText: string | null;
  remarks: string | null;
  checkedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  criteria: {
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
    severity: string;
    isRequired: boolean;
  };
  checkedByUser: { id: string; name: string } | null;
}
