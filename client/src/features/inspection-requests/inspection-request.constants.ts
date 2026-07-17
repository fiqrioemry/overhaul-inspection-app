// src/features/inspection-requests/inspection-request.constants.ts
import type { InspectionRequestType, InspectionObjectType, InspectionRequestStatus, AttachmentType } from "./inspection-requests.api";

// Single source of truth per test type. Mirrors TEST_TYPE_CONFIG in the server
// (config/constant/inspection-request.constant.ts). Every per-type flag below is
// derived from here instead of maintaining parallel arrays.
//   hasClearanceForm true -> prints the A4 landscape NDE clearance form.
//                    false -> PENETRANT / RADIOGRAPHY keep the legacy A4 form.
//   objectScope      WHOLE_TANK -> per-object rows are optional.
type SignatorySet = "NDT" | "EXECUTION";
type ObjectScope = "PER_OBJECT" | "WHOLE_TANK";

interface TestTypeConfig {
  label: string;
  signatorySet: SignatorySet;
  hasClearanceForm: boolean;
  objectScope: ObjectScope;
}

export const TEST_TYPE_CONFIG: Record<InspectionRequestType, TestTypeConfig> = {
  PENETRANT_TEST: { label: "Penetrant Test", signatorySet: "NDT", hasClearanceForm: false, objectScope: "PER_OBJECT" },
  PRE_RADIOGRAPHY_TEST: { label: "Pre-Radiography Test", signatorySet: "EXECUTION", hasClearanceForm: true, objectScope: "WHOLE_TANK" },
  RADIOGRAPHY_TEST: { label: "Radiography Test", signatorySet: "NDT", hasClearanceForm: false, objectScope: "PER_OBJECT" },
  OIL_LEAK_TEST: { label: "Oil Leak Test", signatorySet: "EXECUTION", hasClearanceForm: true, objectScope: "PER_OBJECT" },
  PNEUMATIC_REINFORCEMENT_TEST: { label: "Pneumatic Reinforcement Test", signatorySet: "EXECUTION", hasClearanceForm: true, objectScope: "WHOLE_TANK" },
  HYDROTEST_SHELL: { label: "Hydrotest Shell", signatorySet: "EXECUTION", hasClearanceForm: true, objectScope: "WHOLE_TANK" },
  HYDROTEST_PIPE: { label: "Hydrotest Pipe", signatorySet: "EXECUTION", hasClearanceForm: true, objectScope: "WHOLE_TANK" },
  PNEUMATIC_BOTTOM_TEST: { label: "Pneumatic Bottom Test", signatorySet: "EXECUTION", hasClearanceForm: true, objectScope: "WHOLE_TANK" },
  PNEUMATIC_ROOF_TEST: { label: "Pneumatic Roof Test", signatorySet: "EXECUTION", hasClearanceForm: true, objectScope: "WHOLE_TANK" },
  OTHER: { label: "Other", signatorySet: "EXECUTION", hasClearanceForm: true, objectScope: "WHOLE_TANK" },
};

const TEST_TYPE_KEYS = Object.keys(TEST_TYPE_CONFIG) as InspectionRequestType[];

export const TEST_TYPE_LABELS = TEST_TYPE_KEYS.reduce<Record<InspectionRequestType, string>>(
  (acc, key) => {
    acc[key] = TEST_TYPE_CONFIG[key].label;
    return acc;
  },
  {} as Record<InspectionRequestType, string>,
);

export const TEST_TYPE_OPTIONS = TEST_TYPE_KEYS.map((value) => ({
  value,
  label: TEST_TYPE_CONFIG[value].label,
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

// Print form routing: types without a clearance form (PT/RT) keep the original
// A4 portrait request form; every clearance-form type prints the A4 landscape
// NDE Clearance form.
export function isLegacyPrintTestType(testType: InspectionRequestType): boolean {
  return !TEST_TYPE_CONFIG[testType].hasClearanceForm;
}

// Whole-tank / pressure tests apply to the tank or system as a whole, so
// per-object inspection item rows are optional for these test types.
export function isObjectOptionalTestType(testType: InspectionRequestType): boolean {
  return TEST_TYPE_CONFIG[testType].objectScope === "WHOLE_TANK";
}

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
  SIGNED_RESULT_FORM: "Signed Result Form",
  SKETCH: "Sketch",
  OTHER: "Other",
};

export const TEST_RESULT_STATUS_LABELS: Record<string, string> = {
  NOT_STARTED: "Not Started",
  REPAIR: "Repair",
  PASSED: "Passed",
};
