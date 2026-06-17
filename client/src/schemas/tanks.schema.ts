// src/schemas/tanks.schema.ts
import { z } from "zod";

export const TANK_LOCATION_OPTIONS = [
  { label: "Sungai Gerong", value: "SUNGAI_GERONG" },
  { label: "Pladju", value: "PLADJU" },
] as const;

export const TANK_SERVICE_OPTIONS = [
  { label: "Avtur", value: "AVTUR" },
  { label: "Naptha", value: "NAPTHA" },
  { label: "Premium", value: "PREMIUM" },
  { label: "Pertalite", value: "PERTALITE" },
  { label: "Pertamax", value: "PERTAMAX" },
  { label: "Pertamax Turbo", value: "PERTAMAX_TURBO" },
  { label: "Solar", value: "SOLAR" },
  { label: "Dexlite", value: "DEXLITE" },
  { label: "Pertamina Dex", value: "PERTAMINA_DEX" },
  { label: "Kerosene", value: "KEROSENE" },
  { label: "Crude Oil", value: "CRUDE_OIL" },
  { label: "Fuel Oil", value: "FUEL_OIL" },
  { label: "Lubricating Oil", value: "LUBRICATING_OIL" },
  { label: "LPG", value: "LPG" },
  { label: "Condensate", value: "CONDENSATE" },
  { label: "Slop Oil", value: "SLOP_OIL" },
  { label: "Other", value: "OTHER" },
] as const;

export const TANK_LOCATION_LABEL: Record<string, string> = {
  SUNGAI_GERONG: "Sungai Gerong",
  PLADJU: "Pladju",
};

export const TANK_SERVICE_LABEL: Record<string, string> = {
  AVTUR: "Avtur",
  NAPTHA: "Naptha",
  PREMIUM: "Premium",
  PERTALITE: "Pertalite",
  PERTAMAX: "Pertamax",
  PERTAMAX_TURBO: "Pertamax Turbo",
  SOLAR: "Solar",
  DEXLITE: "Dexlite",
  PERTAMINA_DEX: "Pertamina Dex",
  KEROSENE: "Kerosene",
  CRUDE_OIL: "Crude Oil",
  FUEL_OIL: "Fuel Oil",
  LUBRICATING_OIL: "Lubricating Oil",
  LPG: "LPG",
  CONDENSATE: "Condensate",
  SLOP_OIL: "Slop Oil",
  OTHER: "Other",
};

const shellCourseSchema = z.object({
  courseNo: z.coerce.number().int().positive("Course number must be positive"),
  thicknessMm: z.coerce.number().positive("Thickness must be positive"),
  plateDimension: z.string().optional(),
  remarks: z.string().optional(),
});

export const createTankSchema = z.object({
  tankNo: z.string().min(1, "Tank number is required"),
  tankName: z.string().optional(),
  location: z.enum(["SUNGAI_GERONG", "PLADJU"]).optional(),
  capacityM3: z.coerce.number().positive().optional().or(z.literal("")),
  service: z.enum(["AVTUR","NAPTHA","PREMIUM","PERTALITE","PERTAMAX","PERTAMAX_TURBO","SOLAR","DEXLITE","PERTAMINA_DEX","KEROSENE","CRUDE_OIL","FUEL_OIL","LUBRICATING_OIL","LPG","CONDENSATE","SLOP_OIL","OTHER"]).optional(),
  diameterMm: z.coerce.number().positive().optional().or(z.literal("")),
  heightMm: z.coerce.number().positive().optional().or(z.literal("")),
  shellCourseCount: z.coerce.number().int().min(1, "At least 1 shell course required"),
  hasSteamCoil: z.boolean().default(false),
  contractorCompanyId: z.string().optional(),
  inspectionCompanyId: z.string().optional(),
  startDate: z.string().optional(),
  estimatedFinishDate: z.string().optional(),
  shellCourses: z.array(shellCourseSchema).optional(),
});

export type CreateTankFormValues = z.infer<typeof createTankSchema>;

export const updateTankSchema = z.object({
  tankNo: z.string().min(1, "Tank number is required").optional(),
  tankName: z.string().optional(),
  location: z.enum(["SUNGAI_GERONG", "PLADJU"]).optional(),
  capacityM3: z.coerce.number().positive().optional().or(z.literal("")),
  service: z.enum(["AVTUR","NAPTHA","PREMIUM","PERTALITE","PERTAMAX","PERTAMAX_TURBO","SOLAR","DEXLITE","PERTAMINA_DEX","KEROSENE","CRUDE_OIL","FUEL_OIL","LUBRICATING_OIL","LPG","CONDENSATE","SLOP_OIL","OTHER"]).optional(),
  diameterMm: z.coerce.number().positive().optional().or(z.literal("")),
  heightMm: z.coerce.number().positive().optional().or(z.literal("")),
  contractorCompanyId: z.string().optional(),
  inspectionCompanyId: z.string().optional(),
  startDate: z.string().optional(),
  estimatedFinishDate: z.string().optional(),
});

export type UpdateTankFormValues = z.infer<typeof updateTankSchema>;
