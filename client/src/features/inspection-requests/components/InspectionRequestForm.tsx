// src/features/inspection-requests/components/InspectionRequestForm.tsx
import { useEffect, useRef, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import type { Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, Copy, X, FileText } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SelectField from "@/components/fields/SelectField";
import DateField from "@/components/fields/DateField";
import LongTextField from "@/components/fields/LongTextField";
import ShortTextField from "@/components/fields/ShortTextField";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants/route.constant";
import { useCreateInspectionRequest, useRequestTankOptions, useRequestTankProcessOptions } from "../inspection-requests.query";
import { TEST_TYPE_OPTIONS, OBJECT_TYPE_OPTIONS } from "../inspection-request.constants";
import type { CreateInspectionRequestPayload, InspectionRequestType, InspectionObjectType } from "../inspection-requests.api";

const NO_TANK_VALUE = "__none__";
const NO_PROCESS_VALUE = "__none__";

const itemSchema = z.object({
  objectType: z.string().min(1, "Object type required"),
  objectName: z.string().optional(),
  quantity: z.coerce.number().int().min(1).default(1),
  unit: z.string().optional(),
  locationDetail: z.string().optional(),
  remarks: z.string().optional(),
});

const schema = z.object({
  testType: z.string().min(1),
  tankId: z.string().optional(),
  tankProcessId: z.string().optional(),
  requestDate: z.string().min(1, "Request date required"),
  assetHolder: z.string().optional(),
  executionParty: z.string().optional(),
  standardAndCode: z.string().optional(),
  requestLocation: z.string().optional(),
  description: z.string().optional(),
  remarks: z.string().optional(),
  items: z.array(itemSchema).min(1, "Add at least one inspection object"),
});

type FormValues = z.infer<typeof schema>;

const emptyItem = { objectType: "WELD_JOINT", objectName: "", quantity: 1, unit: "", locationDetail: "", remarks: "" };

export default function InspectionRequestForm() {
  const navigate = useNavigate();
  const createMutation = useCreateInspectionRequest();
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: {
      testType: "PENETRANT_TEST",
      tankId: "",
      tankProcessId: "",
      requestDate: format(new Date(), "yyyy-MM-dd"),
      assetHolder: "",
      executionParty: "",
      standardAndCode: "",
      requestLocation: "",
      description: "",
      remarks: "",
      items: [{ ...emptyItem }],
    },
  });

  const { fields, append, remove, insert } = useFieldArray({ control: form.control, name: "items" });

  const selectedTankValue = form.watch("tankId") ?? "";
  const effectiveTankId = selectedTankValue && selectedTankValue !== NO_TANK_VALUE ? selectedTankValue : undefined;
  const selectedProcessValue = form.watch("tankProcessId") ?? "";

  const { data: tankOptions = [] } = useRequestTankOptions();
  const { data: processOptions = [] } = useRequestTankProcessOptions(effectiveTankId ?? "");

  const tankSelectOptions = [{ label: "General — no tank", value: NO_TANK_VALUE }, ...tankOptions.map((t) => ({ label: t.tankName ? `${t.tankNo} — ${t.tankName}` : t.tankNo, value: t.id }))];
  const processSelectOptions = [{ label: "No specific process", value: NO_PROCESS_VALUE }, ...processOptions.map((p) => ({ label: p.name, value: p.id }))];

  // Reset process when tank changes
  const prevTankRef = useRef(selectedTankValue);
  useEffect(() => {
    if (prevTankRef.current !== selectedTankValue) {
      prevTankRef.current = selectedTankValue;
      form.setValue("tankProcessId", "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTankValue]);

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    setFiles((prev) => [...prev, ...picked].slice(0, 15));
    e.target.value = "";
  }

  function onSubmit(values: FormValues) {
    const effectiveProcessId = selectedProcessValue && selectedProcessValue !== NO_PROCESS_VALUE ? selectedProcessValue : undefined;

    const payload: CreateInspectionRequestPayload = {
      testType: values.testType as InspectionRequestType,
      tankId: effectiveTankId,
      tankProcessId: effectiveProcessId,
      requestDate: values.requestDate,
      assetHolder: values.assetHolder || undefined,
      executionParty: values.executionParty || undefined,
      standardAndCode: values.standardAndCode || undefined,
      requestLocation: values.requestLocation || undefined,
      description: values.description || undefined,
      remarks: values.remarks || undefined,
      items: values.items.map((it) => ({
        objectType: it.objectType as InspectionObjectType,
        objectName: it.objectName || undefined,
        quantity: it.quantity,
        unit: it.unit || undefined,
        locationDetail: it.locationDetail || undefined,
        remarks: it.remarks || undefined,
      })),
      files,
    };

    createMutation.mutate(payload, {
      onSuccess: (detail) => navigate(ROUTES.INSPECTION_REQUEST_DETAIL.replace(":id", detail.id)),
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pb-12">
      {/* Request details */}
      <div className="rounded-lg border p-5 space-y-4">
        <h2 className="text-sm font-medium">Request Details</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SelectField control={form.control} name="testType" label="Test / Inspection Type" options={TEST_TYPE_OPTIONS} />
          <DateField control={form.control} name="requestDate" label="Request Date" />
        </div>

        {/* Tank / process context */}
        <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
          <span className="text-sm font-medium">Tank Context (optional)</span>
          <div className={cn("grid grid-cols-1 gap-4", effectiveTankId && "sm:grid-cols-2")}>
            <SelectField control={form.control} name="tankId" label="Tank" placeholder="Select tank..." options={tankSelectOptions} />
            {effectiveTankId && <SelectField control={form.control} name="tankProcessId" label="Process" placeholder="Select process..." options={processSelectOptions} />}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ShortTextField control={form.control} name="assetHolder" label="Customer / Asset Holder" placeholder="e.g. MA" />
          <ShortTextField control={form.control} name="executionParty" label="Execution / 3rd Party" placeholder="e.g. PT. BKI" />
          <ShortTextField control={form.control} name="standardAndCode" label="Standard & Code" placeholder="e.g. ASME Sec. V" />
          <ShortTextField control={form.control} name="requestLocation" label="Remarks / NDT Location" placeholder="e.g. Lokasi NDT: Tank A2" />
        </div>

        <LongTextField control={form.control} name="description" label="Description (optional)" placeholder="Leave empty to auto-generate from objects" rows={4} />
        <LongTextField control={form.control} name="remarks" label="Additional Remarks (optional)" rows={2} />
      </div>

      {/* Inspection objects */}
      <div className="rounded-lg border p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-medium">Inspection Objects</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Add one or more objects to inspect/test.</p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => append({ ...emptyItem })}>
            <Plus className="h-4 w-4 mr-1" /> Add Object
          </Button>
        </div>

        {form.formState.errors.items?.message && <p className="text-xs text-destructive">{form.formState.errors.items.message}</p>}

        <div className="space-y-3">
          {fields.map((field, idx) => (
            <div key={field.id} className="rounded-md border bg-card p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Object #{idx + 1}</span>
                <div className="flex items-center gap-1">
                  <Button type="button" variant="ghost" size="icon-sm" title="Duplicate" onClick={() => insert(idx + 1, { ...form.getValues(`items.${idx}`) })}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon-sm" title="Remove" disabled={fields.length === 1} onClick={() => remove(idx)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <div className="col-span-2 sm:col-span-1">
                  <SelectField control={form.control} name={`items.${idx}.objectType`} label="Type" options={OBJECT_TYPE_OPTIONS} />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <ShortTextField control={form.control} name={`items.${idx}.objectName`} label="Name / No." placeholder="e.g. T90 / Manhole 24in" />
                </div>
                <div>
                  <ShortTextField control={form.control} name={`items.${idx}.quantity`} label="Qty" type="number" min={1} />
                </div>
                <div>
                  <ShortTextField control={form.control} name={`items.${idx}.unit`} label="Unit" placeholder="Pcs" />
                </div>
                <div className="col-span-2">
                  <ShortTextField control={form.control} name={`items.${idx}.locationDetail`} label="Location / Detail" placeholder="e.g. Shell plate course 1" />
                </div>
                <div className="col-span-2">
                  <ShortTextField control={form.control} name={`items.${idx}.remarks`} label="Remarks" placeholder="Optional remarks" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Supporting documents */}
      <div className="rounded-lg border p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">Supporting Documents (optional)</h2>
          <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={files.length >= 15}>
            <Plus className="h-4 w-4 mr-1" /> Add Files
          </Button>
          <input ref={fileInputRef} type="file" multiple accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden" onChange={handleFiles} />
        </div>
        {files.length === 0 ? (
          <p className="text-xs text-muted-foreground">JPEG, PNG, WebP, or PDF — max 15 files, 15 MB each.</p>
        ) : (
          <div className="space-y-1.5">
            {files.map((f, i) => (
              <div key={i} className="flex items-center gap-2 rounded border px-2 py-1.5 text-xs">
                <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="truncate flex-1">{f.name}</span>
                <button type="button" onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}>
                  <X className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => navigate(ROUTES.INSPECTION_REQUESTS)} disabled={createMutation.isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={createMutation.isPending}>
          {createMutation.isPending ? "Creating..." : "Create Request"}
        </Button>
      </div>
    </form>
  );
}
