// src/schemas/tanks.schema.ts
import { z } from "zod";

const shellCourseSchema = z.object({
  courseNo: z.coerce.number().int().positive("Course number must be positive"),
  thicknessMm: z.coerce.number().positive("Thickness must be positive"),
  plateDimension: z.string().optional(),
  remarks: z.string().optional(),
});

export const createTankSchema = z.object({
  tankNo: z.string().min(1, "Tank number is required"),
  tankName: z.string().optional(),
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
  diameterMm: z.coerce.number().positive().optional().or(z.literal("")),
  heightMm: z.coerce.number().positive().optional().or(z.literal("")),
  contractorCompanyId: z.string().optional(),
  inspectionCompanyId: z.string().optional(),
  startDate: z.string().optional(),
  estimatedFinishDate: z.string().optional(),
});

export type UpdateTankFormValues = z.infer<typeof updateTankSchema>;
