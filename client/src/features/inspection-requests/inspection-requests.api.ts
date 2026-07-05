// src/features/inspection-requests/inspection-requests.api.ts
import api from "@/lib/axios";
import type { PaginatedResponse } from "@/types/pagination.type";
import type { ResponseSuccess, ResponseList } from "@/types/response.type";

export type InspectionRequestStatus = "NOT_STARTED" | "IN_PROCESS" | "REPAIR" | "PASSED";

export type InspectionRequestType =
  | "PENETRANT_TEST"
  | "RADIOGRAPHY_TEST"
  | "OIL_LEAK_TEST"
  | "PNEUMATIC_REINFORCEMENT_TEST"
  | "HYDROTEST_SHELL"
  | "HYDROTEST_PIPE"
  | "PNEUMATIC_BOTTOM_TEST"
  | "PNEUMATIC_ROOF_TEST"
  | "OTHER";

export type InspectionObjectType =
  | "MANHOLE"
  | "COD"
  | "NOZZLE"
  | "SHELL_PLATE"
  | "BOTTOM_PLATE"
  | "ROOF_PLATE"
  | "REINFORCEMENT_PAD"
  | "PIPE"
  | "STEAM_COIL"
  | "WELD_JOINT"
  | "ANNULAR_PLATE"
  | "FLOOR_PLATE"
  | "VALVE"
  | "FLANGE"
  | "FITTING"
  | "MATERIAL"
  | "OTHER";

export type AttachmentType =
  | "SUPPORTING_DOCUMENT"
  | "GENERATED_REQUEST_FORM"
  | "SIGNED_REQUEST_FORM"
  | "SKETCH"
  | "OTHER";

export interface InspectionRequestItem {
  id: string;
  objectType: InspectionObjectType;
  objectName: string | null;
  quantity: number;
  unit: string | null;
  locationDetail: string | null;
  remarks: string | null;
  sortOrder: number;
}

export interface InspectionRequestItemInput {
  objectType: InspectionObjectType;
  objectName?: string;
  quantity: number;
  unit?: string;
  locationDetail?: string;
  remarks?: string;
}

export interface InspectionRequestAttachment {
  id: string;
  fileStorageId: string;
  attachmentUrl: string;
  attachmentType: AttachmentType;
  caption: string | null;
  sortOrder: number;
  createdAt: string;
}

export interface InspectionRequestSummary {
  totalObjects: number;
  totalTestRecords: number;
  totalPassed: number;
  totalRepair: number;
  totalNotStarted: number;
  progressPercent: number;
}

interface TankRef {
  id: string;
  tankNo: string;
  tankName: string | null;
  location?: string | null;
  inspectionCompany?: { id: string; name: string; logoFile: { url: string } | null } | null;
  contractorCompany?: { id: string; name: string; logoFile: { url: string } | null } | null;
}

export interface CompanyRef {
  id: string;
  name: string;
  type: "OWNER" | "INSPECTOR_COMPANY" | "CONTRACTOR";
  logoFile?: { url: string } | null;
}

// TankProject reference on the detail response; contractor / inspection
// companies live at the project level (see server projectSelect).
export interface InspectionRequestProjectRef {
  id: string;
  projectNo: string;
  type: string;
  status: string;
  inspectionCompany?: { id: string; name: string; logoFile: { url: string } | null } | null;
  contractorCompany?: { id: string; name: string; logoFile: { url: string } | null } | null;
}

export interface PersonnelRef {
  id: string;
  name: string;
  position: string | null;
  company: CompanyRef | null;
}

export interface InspectionRequestListRow {
  id: string;
  requestNo: string;
  testType: InspectionRequestType;
  status: InspectionRequestStatus;
  requestDate: string;
  tankId: string | null;
  tankProcessId: string | null;
  createdAt: string;
  updatedAt: string;
  tank: { id: string; tankNo: string; tankName: string | null } | null;
  tankProcess: { id: string; name: string } | null;
  requestedByUser: { id: string; name: string } | null;
  summary: InspectionRequestSummary;
}

// Dynamic clearance-form template (NDE Clearance print form). The snapshot
// stored on a request has the same shape minus `isActive`.
export interface InspectionFormTemplateChecklistItem {
  label: string;
}

export interface InspectionFormTemplateInfo {
  id: string;
  code: string;
  testType: InspectionRequestType;
  title: string;
  revision: string;
  defaultStandardAndCode: string | null;
  procedureText: string | null;
  acceptanceCriteriaText: string | null;
  checklistItems: InspectionFormTemplateChecklistItem[];
  isActive?: boolean;
}

// Saved checklist values keyed by row index; rendered on the printable form.
export interface InspectionRequestFormChecklistValue {
  result?: "ACCEPT" | "REJECT";
  remarks?: string;
}

export interface InspectionRequestFormData {
  checklist?: InspectionRequestFormChecklistValue[];
}

export interface InspectionRequestDetail {
  id: string;
  requestNo: string;
  testType: InspectionRequestType;
  status: InspectionRequestStatus;
  requestDate: string;
  assetHolder: string | null;
  executionParty: string | null;
  executionCompanyId: string | null;
  receivedById: string | null;
  preparedById: string | null;
  approvedById: string | null;
  standardAndCode: string | null;
  requestLocation: string | null;
  description: string | null;
  remarks: string | null;
  confirmedAt: string | null;
  tankId: string | null;
  tankProcessId: string | null;
  createdAt: string;
  updatedAt: string;
  tank: TankRef | null;
  project?: InspectionRequestProjectRef | null;
  tankProcess: { id: string; name: string; type: string } | null;
  requestedByUser: { id: string; name: string; email: string } | null;
  executionCompany: CompanyRef | null;
  receivedByUser: PersonnelRef | null;
  preparedByUser: PersonnelRef | null;
  approvedByUser: PersonnelRef | null;
  items: InspectionRequestItem[];
  attachments: InspectionRequestAttachment[];
  signatoryTemplate: string[];
  summary: InspectionRequestSummary;
  // Resolved OWNER company logo (from the approver's company, else any OWNER company).
  inspectionLogoUrl: string | null;
  // Contractor company resolved from the request's project, else the tank's
  // most recent active project (used on the NDE clearance signature block).
  contractorCompany?: CompanyRef | null;
  // Dynamic clearance-form support (optional: absent on older requests / legacy PT-RT).
  formTemplateId?: string | null;
  formTemplate?: InspectionFormTemplateInfo | null;
  formTemplateSnapshot?: InspectionFormTemplateInfo | null;
  formData?: InspectionRequestFormData | null;
}

export interface ListInspectionRequestsParams {
  page?: number;
  limit?: number;
  status?: InspectionRequestStatus;
  testType?: InspectionRequestType;
  tankId?: string;
  tankProcessId?: string;
}

export interface CreateInspectionRequestPayload {
  testType: InspectionRequestType;
  tankId?: string;
  tankProcessId?: string;
  requestDate: string;
  assetHolder?: string;
  executionParty?: string;
  executionCompanyId?: string;
  receivedById?: string;
  preparedById?: string;
  approvedById?: string;
  standardAndCode?: string;
  requestLocation?: string;
  description?: string;
  remarks?: string;
  items: InspectionRequestItemInput[];
  files?: File[];
}

export interface UpdateInspectionRequestPayload {
  testType?: InspectionRequestType;
  tankId?: string | null;
  projectId?: string | null;
  tankProcessId?: string | null;
  requestDate?: string;
  assetHolder?: string | null;
  executionParty?: string | null;
  executionCompanyId?: string | null;
  receivedById?: string | null;
  preparedById?: string | null;
  approvedById?: string | null;
  standardAndCode?: string | null;
  requestLocation?: string | null;
  description?: string | null;
  remarks?: string | null;
  items?: InspectionRequestItemInput[];
}

export interface TankOption {
  id: string;
  tankNo: string;
  tankName: string | null;
}

export interface TankProcessOption {
  id: string;
  name: string;
  type: string;
  status: string;
}

export async function listInspectionRequests(params: ListInspectionRequestsParams): Promise<PaginatedResponse<InspectionRequestListRow>> {
  const res = await api.get<ResponseList<InspectionRequestListRow>>("/inspection-requests", { params });
  return { items: res.data.data, meta: res.data.meta };
}

export async function getInspectionRequestById(id: string): Promise<InspectionRequestDetail> {
  const res = await api.get<ResponseSuccess<InspectionRequestDetail>>(`/inspection-requests/${id}`);
  return res.data.data!;
}

export async function createInspectionRequest(payload: CreateInspectionRequestPayload): Promise<InspectionRequestDetail> {
  const formData = new FormData();
  formData.append("testType", payload.testType);
  if (payload.tankId) formData.append("tankId", payload.tankId);
  if (payload.tankProcessId) formData.append("tankProcessId", payload.tankProcessId);
  formData.append("requestDate", payload.requestDate);
  if (payload.assetHolder) formData.append("assetHolder", payload.assetHolder);
  if (payload.executionParty) formData.append("executionParty", payload.executionParty);
  if (payload.executionCompanyId) formData.append("executionCompanyId", payload.executionCompanyId);
  if (payload.receivedById) formData.append("receivedById", payload.receivedById);
  if (payload.preparedById) formData.append("preparedById", payload.preparedById);
  if (payload.approvedById) formData.append("approvedById", payload.approvedById);
  if (payload.standardAndCode) formData.append("standardAndCode", payload.standardAndCode);
  if (payload.requestLocation) formData.append("requestLocation", payload.requestLocation);
  if (payload.description) formData.append("description", payload.description);
  if (payload.remarks) formData.append("remarks", payload.remarks);
  formData.append("items", JSON.stringify(payload.items));
  (payload.files ?? []).forEach((file) => formData.append("attachments", file));
  const res = await api.post<ResponseSuccess<InspectionRequestDetail>>("/inspection-requests", formData);
  return res.data.data!;
}

export async function updateInspectionRequest(id: string, payload: UpdateInspectionRequestPayload): Promise<InspectionRequestDetail> {
  const res = await api.patch<ResponseSuccess<InspectionRequestDetail>>(`/inspection-requests/${id}`, payload);
  return res.data.data!;
}

export async function submitConfirmInspectionRequest(id: string): Promise<InspectionRequestDetail> {
  const res = await api.post<ResponseSuccess<InspectionRequestDetail>>(`/inspection-requests/${id}/submit-confirm`, {});
  return res.data.data!;
}

export async function updateInspectionRequestStatus(id: string, status: "REPAIR" | "PASSED", remarks?: string): Promise<InspectionRequestDetail> {
  const res = await api.patch<ResponseSuccess<InspectionRequestDetail>>(`/inspection-requests/${id}/status`, { status, remarks });
  return res.data.data!;
}

export async function uploadInspectionRequestAttachment(
  id: string,
  attachmentType: AttachmentType,
  files: File[],
  caption?: string,
): Promise<InspectionRequestDetail> {
  const formData = new FormData();
  formData.append("attachmentType", attachmentType);
  if (caption) formData.append("caption", caption);
  files.forEach((file) => formData.append("attachments", file));
  const res = await api.post<ResponseSuccess<InspectionRequestDetail>>(`/inspection-requests/${id}/attachments`, formData);
  return res.data.data!;
}

export async function removeInspectionRequestAttachment(id: string, attachmentId: string): Promise<InspectionRequestDetail> {
  const res = await api.delete<ResponseSuccess<InspectionRequestDetail>>(`/inspection-requests/${id}/attachments/${attachmentId}`);
  return res.data.data!;
}

export async function deleteInspectionRequest(id: string): Promise<void> {
  await api.delete(`/inspection-requests/${id}`);
}

export async function listRequestTankOptions(): Promise<TankOption[]> {
  const res = await api.get<ResponseSuccess<TankOption[]>>("/inspection-requests/options/tanks");
  return res.data.data!;
}

export async function listRequestTankProcessOptions(tankId: string): Promise<TankProcessOption[]> {
  const res = await api.get<ResponseSuccess<TankProcessOption[]>>("/inspection-requests/options/tank-processes", { params: { tankId } });
  return res.data.data!;
}
