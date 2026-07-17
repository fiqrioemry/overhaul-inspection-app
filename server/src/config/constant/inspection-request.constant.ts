import { InspectionRequestTypeEnum } from "generated/prisma";

const inspectionRequestSuccessMessage = {
  CREATE_REQUEST: "Inspection request created successfully",
  GET_REQUESTS: "Inspection requests retrieved successfully",
  GET_REQUEST: "Inspection request retrieved successfully",
  UPDATE_REQUEST: "Inspection request updated successfully",
  DELETE_REQUEST: "Inspection request deleted successfully",
  SUBMIT_CONFIRM: "Inspection request submitted and confirmed successfully",
  UPDATE_STATUS: "Inspection request status updated successfully",
  UPLOAD_ATTACHMENT: "Attachment uploaded successfully",
  REMOVE_ATTACHMENT: "Attachment removed successfully",
  GET_TANK_OPTIONS: "Tank options retrieved successfully",
  GET_TANK_PROCESS_OPTIONS: "Tank process options retrieved successfully",
};

// ─── Test type configuration (single source of truth) ────────────────────────
// One entry per InspectionRequestTypeEnum drives labels, signatory templates,
// clearance-form availability, and whether per-object rows are required. Derive
// every per-type boolean from here instead of maintaining scattered Sets.
//
//   signatorySet     NDT       -> User / Inspector / Head of SSIE (direct NDE).
//                    EXECUTION -> Inspector / Contractor / User (clearance forms).
//   hasClearanceForm true when an InspectionFormTemplate is seeded for the type;
//                    PENETRANT / RADIOGRAPHY keep the legacy A4 portrait form.
//   objectScope      PER_OBJECT -> at least one inspection object row required.
//                    WHOLE_TANK -> whole-tank / pressure test, object rows optional.

export type SignatorySet = "NDT" | "EXECUTION";
export type ObjectScope = "PER_OBJECT" | "WHOLE_TANK";

export interface TestTypeConfig {
  label: string;
  signatorySet: SignatorySet;
  hasClearanceForm: boolean;
  objectScope: ObjectScope;
}

const TEST_TYPE_CONFIG: Record<InspectionRequestTypeEnum, TestTypeConfig> = {
  PENETRANT_TEST: { label: "Penetrant Test", signatorySet: "NDT", hasClearanceForm: false, objectScope: "PER_OBJECT" },
  // Pre-Radiography is a visual weld clearance (ring 1..n) that informally
  // precedes Radiography; it is recorded like the other clearance forms.
  PRE_RADIOGRAPHY_TEST: { label: "Pre-Radiography Test", signatorySet: "EXECUTION", hasClearanceForm: true, objectScope: "WHOLE_TANK" },
  RADIOGRAPHY_TEST: { label: "Radiography Test", signatorySet: "NDT", hasClearanceForm: false, objectScope: "PER_OBJECT" },
  OIL_LEAK_TEST: { label: "Oil Leak Test", signatorySet: "EXECUTION", hasClearanceForm: true, objectScope: "PER_OBJECT" },
  PNEUMATIC_REINFORCEMENT_TEST: { label: "Pneumatic Reinforcement Test", signatorySet: "EXECUTION", hasClearanceForm: true, objectScope: "WHOLE_TANK" },
  HYDROTEST_SHELL: { label: "Hydrotest Shell", signatorySet: "EXECUTION", hasClearanceForm: true, objectScope: "WHOLE_TANK" },
  HYDROTEST_PIPE: { label: "Hydrotest Pipe", signatorySet: "EXECUTION", hasClearanceForm: true, objectScope: "WHOLE_TANK" },
  PNEUMATIC_BOTTOM_TEST: { label: "Pneumatic Bottom Test", signatorySet: "EXECUTION", hasClearanceForm: true, objectScope: "WHOLE_TANK" },
  PNEUMATIC_ROOF_TEST: { label: "Pneumatic Roof Test", signatorySet: "EXECUTION", hasClearanceForm: true, objectScope: "WHOLE_TANK" },
  OTHER: { label: "Inspection", signatorySet: "EXECUTION", hasClearanceForm: true, objectScope: "WHOLE_TANK" },
};

const TEST_TYPE_KEYS = Object.keys(TEST_TYPE_CONFIG) as InspectionRequestTypeEnum[];

// Labels used to build the auto-generated request description.
const TEST_TYPE_LABELS = TEST_TYPE_KEYS.reduce<Record<InspectionRequestTypeEnum, string>>(
  (acc, key) => {
    acc[key] = TEST_TYPE_CONFIG[key].label;
    return acc;
  },
  {} as Record<InspectionRequestTypeEnum, string>,
);

// NDT test types use the User / Inspector / Head of SSIE signatory set.
const NDT_TEST_TYPES = new Set<InspectionRequestTypeEnum>(TEST_TYPE_KEYS.filter((key) => TEST_TYPE_CONFIG[key].signatorySet === "NDT"));

// Whole-tank / pressure tests apply to the tank or system as a whole, so
// per-object inspection item rows are optional for these test types.
const OBJECT_OPTIONAL_TEST_TYPES = new Set<InspectionRequestTypeEnum>(TEST_TYPE_KEYS.filter((key) => TEST_TYPE_CONFIG[key].objectScope === "WHOLE_TANK"));

const NDT_SIGNATORY_TEMPLATE = ["User", "Inspector", "Head of SSIE"];
const EXECUTION_SIGNATORY_TEMPLATE = ["Inspector", "Contractor", "User"];

function getSignatoryTemplate(testType: InspectionRequestTypeEnum): string[] {
  return TEST_TYPE_CONFIG[testType].signatorySet === "NDT" ? [...NDT_SIGNATORY_TEMPLATE] : [...EXECUTION_SIGNATORY_TEMPLATE];
}

export { inspectionRequestSuccessMessage, TEST_TYPE_CONFIG, TEST_TYPE_LABELS, NDT_TEST_TYPES, OBJECT_OPTIONAL_TEST_TYPES, getSignatoryTemplate };
