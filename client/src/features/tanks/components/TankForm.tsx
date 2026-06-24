// src/features/tanks/components/TankForm.tsx
import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import type { Resolver, Path } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ShortTextField from "@/components/fields/ShortTextField";
import SelectField from "@/components/fields/SelectField";
import SwitchField from "@/components/fields/SwitchField";
import { Field, FieldLabel } from "@/components/ui/field";
import StatusBadge from "@/components/common/StatusBadge";
import {
  createTankSchema,
  updateTankSchema,
  TANK_LOCATION_OPTIONS,
  TANK_SERVICE_OPTIONS,
  TANK_ASSET_STATUS_MANUAL_OPTIONS,
} from "@/schemas/tanks.schema";
import type { CreateTankFormValues, UpdateTankFormValues } from "@/schemas/tanks.schema";
import TankDocumentSection from "./TankDocumentSection";
import type { TankDetail, TankExtractResult } from "../tanks.api";

interface TankFormCreateProps {
  mode: "create";
  onSubmit: (values: CreateTankFormValues, files: File[]) => void;
  isPending: boolean;
}

interface TankFormEditProps {
  mode: "edit";
  tank: TankDetail;
  onSubmit: (values: UpdateTankFormValues) => void;
  isPending: boolean;
}

type TankFormProps = TankFormCreateProps | TankFormEditProps;

export default function TankForm(props: TankFormProps) {
  const isEdit = props.mode === "edit";

  const createForm = useForm<CreateTankFormValues>({
    resolver: zodResolver(createTankSchema) as Resolver<CreateTankFormValues>,
    defaultValues: {
      tankNo: "",
      tankName: "",
      shellCourseCount: 1,
      hasSteamCoil: false,
      assetStatus: "OPERATIONAL",
      shellCourses: [{ courseNo: 1, thicknessMm: 0 }],
    },
  });

  const editForm = useForm<UpdateTankFormValues>({
    resolver: zodResolver(updateTankSchema) as Resolver<UpdateTankFormValues>,
    defaultValues: isEdit
      ? {
          tankNo: props.tank.tankNo,
          tankName: props.tank.tankName ?? "",
          location: (props.tank.location ?? undefined) as UpdateTankFormValues["location"],
          capacityM3: props.tank.capacityM3 ?? undefined,
          service: (props.tank.service ?? undefined) as UpdateTankFormValues["service"],
          diameterMm: props.tank.diameterMm ?? undefined,
          heightMm: props.tank.heightMm ?? undefined,
          // UNDER_OVERHAUL is system-managed: shown read-only, never submitted.
          assetStatus: props.tank.assetStatus === "UNDER_OVERHAUL" ? undefined : props.tank.assetStatus,
        }
      : {},
  });

  const { fields, append, replace } = useFieldArray({
    control: createForm.control,
    name: "shellCourses",
  });

  const [documents, setDocuments] = useState<File[]>([]);

  function applyExtraction(result: TankExtractResult) {
    const setIf = (key: Path<CreateTankFormValues>, value: unknown) => {
      if (value === null || value === undefined) return;
      createForm.setValue(key, value as never, { shouldDirty: true, shouldValidate: true });
    };

    setIf("tankNo", result.tankNo);
    setIf("tankName", result.tankName);
    setIf("location", result.location);
    setIf("service", result.service);
    setIf("capacityM3", result.capacityM3);
    setIf("diameterMm", result.diameterMm);
    setIf("heightMm", result.heightMm);
    if (typeof result.hasSteamCoil === "boolean") setIf("hasSteamCoil", result.hasSteamCoil);

    // Shell courses: prefer explicit rows; otherwise fall back to count.
    if (result.shellCourses && result.shellCourses.length > 0) {
      const courses = result.shellCourses.map((sc, i) => ({
        courseNo: sc.courseNo ?? i + 1,
        thicknessMm: sc.thicknessMm ?? 0,
        plateDimension: sc.plateDimension ?? "",
        remarks: sc.remarks ?? "",
      }));
      createForm.setValue("shellCourseCount", courses.length, { shouldDirty: true, shouldValidate: true });
      replace(courses);
    } else if (result.shellCourseCount && result.shellCourseCount > 0) {
      setIf("shellCourseCount", result.shellCourseCount);
    }
  }

  const shellCourseCount = createForm.watch("shellCourseCount");

  useEffect(() => {
    if (isEdit) return;
    const count = Number(shellCourseCount) || 1;
    const newCourses = Array.from({ length: count }, (_, i) => ({
      courseNo: i + 1,
      thicknessMm: fields[i]?.thicknessMm ?? 0,
      plateDimension: fields[i]?.plateDimension ?? "",
      remarks: fields[i]?.remarks ?? "",
    }));
    replace(newCourses);
  }, [shellCourseCount]);

  if (isEdit) {
    return (
      <form onSubmit={editForm.handleSubmit(props.onSubmit as (v: UpdateTankFormValues) => void)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <ShortTextField control={editForm.control} name="tankNo" label="Tank No." placeholder="e.g. T-01" />
          <ShortTextField control={editForm.control} name="tankName" label="Tank Name" placeholder="Optional name" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <SelectField control={editForm.control} name="location" label="Location" options={[...TANK_LOCATION_OPTIONS]} placeholder="Select location" />
          <SelectField control={editForm.control} name="service" label="Service / Product" options={[...TANK_SERVICE_OPTIONS]} placeholder="Select service" />
        </div>
        <ShortTextField control={editForm.control} name="capacityM3" label="Capacity (m³)" type="text" placeholder="e.g. 5000" />
        <div className="grid grid-cols-2 gap-4">
          <ShortTextField control={editForm.control} name="diameterMm" label="Diameter (mm)" type="text" placeholder="e.g. 18000" />
          <ShortTextField control={editForm.control} name="heightMm" label="Height (mm)" type="text" placeholder="e.g. 12000" />
        </div>
        {props.tank.assetStatus === "UNDER_OVERHAUL" ? (
          <Field>
            <FieldLabel>Asset Status</FieldLabel>
            <div className="flex items-center gap-2">
              <StatusBadge status="UNDER_OVERHAUL" />
              <span className="text-xs text-muted-foreground">System-managed while an overhaul project is active</span>
            </div>
          </Field>
        ) : (
          <SelectField
            control={editForm.control}
            name="assetStatus"
            label="Asset Status"
            options={[...TANK_ASSET_STATUS_MANUAL_OPTIONS]}
            placeholder="Select asset status"
            description="Under Overhaul is set automatically when a tank project is active."
          />
        )}
        <Button type="submit" disabled={props.isPending} className="w-full">
          {props.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={createForm.handleSubmit((values) => (props.onSubmit as (v: CreateTankFormValues, f: File[]) => void)(values, documents))} className="space-y-4">
      <TankDocumentSection files={documents} onFilesChange={setDocuments} onApplyExtraction={applyExtraction} />

      <div className="grid grid-cols-2 gap-4">
        <ShortTextField control={createForm.control} name="tankNo" label="Tank No." placeholder="e.g. T-01" />
        <ShortTextField control={createForm.control} name="tankName" label="Tank Name" placeholder="Optional name" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <SelectField control={createForm.control} name="location" label="Location" options={[...TANK_LOCATION_OPTIONS]} placeholder="Select location" />
        <SelectField control={createForm.control} name="service" label="Service / Product" options={[...TANK_SERVICE_OPTIONS]} placeholder="Select service" />
      </div>
      <ShortTextField control={createForm.control} name="capacityM3" label="Capacity (m³)" type="text" placeholder="e.g. 5000" />
      <div className="grid grid-cols-2 gap-4">
        <ShortTextField control={createForm.control} name="diameterMm" label="Diameter (mm)" type="text" placeholder="e.g. 18000" />
        <ShortTextField control={createForm.control} name="heightMm" label="Height (mm)" type="text" placeholder="e.g. 12000" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <ShortTextField control={createForm.control} name="shellCourseCount" label="Shell Course Count" type="text" placeholder="e.g. 6" />
        <SwitchField control={createForm.control} name="hasSteamCoil" label="Has Steam Coil" description="Tank has internal steam coil" />
      </div>
      <SelectField
        control={createForm.control}
        name="assetStatus"
        label="Asset Status"
        options={[...TANK_ASSET_STATUS_MANUAL_OPTIONS]}
        placeholder="Select asset status"
        description="Use Operational for an existing tank. Under Overhaul is set automatically when you start a tank project."
      />

      {fields.length > 0 && (
        <div className="space-y-2">
          <FieldLabel>Shell Courses</FieldLabel>
          <div className="rounded-lg border divide-y">
            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-4 gap-2 p-3 items-end">
                <Field>
                  <FieldLabel className="text-xs">Course No.</FieldLabel>
                  <Input type="number" readOnly value={index + 1} className="bg-muted" {...createForm.register(`shellCourses.${index}.courseNo`, { valueAsNumber: true })} />
                </Field>
                <Field>
                  <FieldLabel className="text-xs">Thickness (mm)</FieldLabel>
                  <Input type="number" step="0.1" placeholder="0.0" {...createForm.register(`shellCourses.${index}.thicknessMm`, { valueAsNumber: true })} />
                </Field>
                <Field>
                  <FieldLabel className="text-xs">Plate Dimension</FieldLabel>
                  <Input placeholder="e.g. 2000×6000" {...createForm.register(`shellCourses.${index}.plateDimension`)} />
                </Field>
                <Field>
                  <FieldLabel className="text-xs">Remarks</FieldLabel>
                  <Input placeholder="Optional" {...createForm.register(`shellCourses.${index}.remarks`)} />
                </Field>
              </div>
            ))}
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => append({ courseNo: fields.length + 1, thicknessMm: 0 })}>
            <Plus className="h-3 w-3" /> Add Course
          </Button>
        </div>
      )}

      <Button type="submit" disabled={props.isPending} className="w-full">
        {props.isPending ? "Creating..." : "Create Tank"}
      </Button>
    </form>
  );
}
