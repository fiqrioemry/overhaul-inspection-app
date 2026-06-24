const tankProjectSuccessMessage = {
  CREATE_PROJECT: "Tank project created successfully",
  GET_PROJECTS: "Tank projects retrieved successfully",
  GET_PROJECT: "Tank project retrieved successfully",
  GET_PROJECT_PROCESSES: "Tank project processes retrieved successfully",
  GET_PROGRESS_SUMMARY: "Tank project progress summary retrieved successfully",
  GENERATE_PROCESSES: "Tank project processes generated successfully",
  UPDATE_PROJECT: "Tank project updated successfully",
  DELETE_PROJECT: "Tank project deleted successfully",
};

/** Project type → project number prefix, e.g. OVH-TK170-2026. */
export const TANK_PROJECT_NO_PREFIX: Record<string, string> = {
  NEW_BUILD: "NBL",
  OVERHAUL: "OVH",
  REPAIR: "REP",
  ROUTINE_INSPECTION: "RTI",
};

/** Project types that generate the full overhaul workflow by default. */
export const DEFAULT_GENERATE_PROCESS_TYPES = new Set<string>(["NEW_BUILD", "OVERHAUL", "REPAIR"]);

export { tankProjectSuccessMessage };
