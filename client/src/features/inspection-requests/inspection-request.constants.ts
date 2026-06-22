// src/features/inspection-requests/inspection-request.constants.ts
import type {
  InspectionRequestType,
  InspectionObjectType,
  InspectionRequestStatus,
  AttachmentType,
} from "./inspection-requests.api";

export const TEST_TYPE_LABELS: Record<InspectionRequestType, string> = {
  PENETRANT_TEST: "Penetrant Test",
  RADIOGRAPHY_TEST: "Radiography Test",
  OIL_LEAK_TEST: "Oil Leak Test",
  PNEUMATIC_REINFORCEMENT_TEST: "Pneumatic Reinforcement Test",
  HYDROTEST_SHELL: "Hydrotest Shell",
  HYDROTEST_PIPE: "Hydrotest Pipe",
  PNEUMATIC_BOTTOM_TEST: "Pneumatic Bottom Test",
  PNEUMATIC_ROOF_TEST: "Pneumatic Roof Test",
  MATERIAL_INSPECTION: "Material Inspection",
  VISUAL_INSPECTION: "Visual Inspection",
  COATING_INSPECTION: "Coating Inspection",
  OTHER: "Other",
};

export const TEST_TYPE_OPTIONS = (Object.keys(TEST_TYPE_LABELS) as InspectionRequestType[]).map((value) => ({
  value,
  label: TEST_TYPE_LABELS[value],
}));

export const OBJECT_TYPE_LABELS: Record<InspectionObjectType, string> = {
  MANHOLE: "Manhole",
  COD: "COD",
  NOZZLE: "Nozzle",
  SHELL_PLATE: "Shell Plate",
  BOTTOM_PLATE: "Bottom Plate",
  ROOF_PLATE: "Roof Plate",
  REINFORCEMENT_PAD: "Reinforcement Pad",
  PIPE: "Pipe",
  STEAM_COIL: "Steam Coil",
  WELD_JOINT: "Weld Joint",
  ANNULAR_PLATE: "Annular Plate",
  FLOOR_PLATE: "Floor Plate",
  VALVE: "Valve",
  FLANGE: "Flange",
  FITTING: "Fitting",
  MATERIAL: "Material",
  OTHER: "Other",
};

export const OBJECT_TYPE_OPTIONS = (Object.keys(OBJECT_TYPE_LABELS) as InspectionObjectType[]).map((value) => ({
  value,
  label: OBJECT_TYPE_LABELS[value],
}));

export const STATUS_LABELS: Record<InspectionRequestStatus, string> = {
  NOT_STARTED: "Not Started",
  IN_PROCESS: "In Process",
  REPAIR: "Repair",
  PASSED: "Passed",
};

export const STATUS_BADGE_CLASS: Record<InspectionRequestStatus, string> = {
  NOT_STARTED: "bg-slate-100 text-slate-700 border-slate-200",
  IN_PROCESS: "bg-blue-100 text-blue-700 border-blue-200",
  REPAIR: "bg-amber-100 text-amber-800 border-amber-200",
  PASSED: "bg-green-100 text-green-700 border-green-200",
};

export const ATTACHMENT_TYPE_LABELS: Record<AttachmentType, string> = {
  SUPPORTING_DOCUMENT: "Supporting Document",
  GENERATED_REQUEST_FORM: "Generated Request Form",
  SIGNED_REQUEST_FORM: "Signed Request Form",
  SKETCH: "Sketch",
  OTHER: "Other",
};

export const TEST_RESULT_STATUS_LABELS: Record<string, string> = {
  NOT_STARTED: "Not Started",
  REPAIR: "Repair",
  PASSED: "Passed",
};
