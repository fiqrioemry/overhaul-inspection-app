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
import SelectField from "@/components/fields/SelectField";
import DateField from "@/components/fields/DateField";
import LongTextField from "@/components/fields/LongTextField";
import ShortTextField from "@/components/fields/ShortTextField";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants/route.constant";
import { useCreateInspectionRequest, useUpdateInspectionRequest, useRequestTankOptions, useRequestTankProcessOptions } from "../inspection-requests.query";
import { TEST_TYPE_OPTIONS, OBJECT_TYPE_OPTIONS, TEST_TYPE_LABELS, isObjectOptionalTestType } from "../inspection-request.constants";
import type { CreateInspectionRequestPayload, UpdateInspectionRequestPayload, InspectionRequestDetail, InspectionRequestType, InspectionObjectType } from "../inspection-requests.api";
import { useCompanyOptions } from "@/features/companies/companies.query";
import { useUserOptions } from "@/features/users/users.query";
import type { UserOption } from "@/features/users/users.api";

const NO_TANK_VALUE = "__none__";
const NO_PROCESS_VALUE = "__none__";
const NONE_VALUE = "__none__";

function userOptionLabel(u: UserOption): string {
  return [u.name, u.position, u.company?.name].filter(Boolean).join(" - ");
}

const itemSchema = z.object({
  objectType: z.string().min(1, "Object type required"),
  objectName: z.string().optional(),
  quantity: z.coerce.number().int().min(1).default(1),
  unit: z.string().optional(),
  locationDetail: z.string().optional(),
  remarks: z.string().optional(),
});

const baseSchema = z.object({
  testType: z.string().min(1),
  tankId: z.string().optional(),
  tankProcessId: z.string().optional(),
  requestDate: z.string().min(1, "Request date required"),
  assetHolder: z.string().optional(),
  executionCompanyId: z.string().optional(),
  receivedById: z.string().optional(),
  preparedById: z.string().optional(),
  approvedById: z.string().optional(),
  standardAndCode: z.string().optional(),
  requestLocation: z.string().optional(),
  description: z.string().optional(),
  remarks: z.string().optional(),
  items: z.array(itemSchema),
});

// Inspection objects are only mandatory for test types that target specific
// objects; whole-tank / pressure tests skip them entirely.
const schema = baseSchema.superRefine((data, ctx) => {
  if (!isObjectOptionalTestType(data.testType as InspectionRequestType) && data.items.length === 0) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Add at least one inspection object", path: ["items"] });
  }
});

type FormValues = z.infer<typeof baseSchema>;

const emptyItem = { objectType: "WELD_JOINT", objectName: "", quantity: 1, unit: "", locationDetail: "", remarks: "" };

// Default Standard & Code per test type, auto-filled when the test type changes.
// Custom input is preserved: the value is only replaced while it is empty or
// still holds the previous type's default.
const DEFAULT_STANDARD_BY_TEST_TYPE: Record<InspectionRequestType, string> = {
  PENETRANT_TEST: "ASME Section V Article 6",
  RADIOGRAPHY_TEST: "ASME Section V Article 2",
  OIL_LEAK_TEST: "Royal Dutch",
  PNEUMATIC_REINFORCEMENT_TEST: "API 650 Section 7.3.5",
  HYDROTEST_SHELL: "API 650 Section 7.3.6",
  HYDROTEST_PIPE: "ASME B31.3",
  PNEUMATIC_BOTTOM_TEST: "API 650 Section 8.6",
  PNEUMATIC_ROOF_TEST: "Royal Dutch",
  OTHER: "",
};

interface InspectionRequestFormProps {
  /** When provided, the form runs in edit mode and saves via PATCH instead of creating. */
  request?: InspectionRequestDetail;
}

function requestToFormValues(request: InspectionRequestDetail): FormValues {
  return {
    testType: request.testType,
    tankId: request.tankId ?? NO_TANK_VALUE,
    tankProcessId: request.tankProcessId ?? (request.tankId ? NO_PROCESS_VALUE : ""),
    requestDate: format(new Date(request.requestDate), "yyyy-MM-dd"),
    assetHolder: request.assetHolder ?? "",
    executionCompanyId: request.executionCompanyId ?? NONE_VALUE,
    receivedById: request.receivedById ?? NONE_VALUE,
    preparedById: request.preparedById ?? NONE_VALUE,
    approvedById: request.approvedById ?? NONE_VALUE,
    standardAndCode: request.standardAndCode ?? "",
    requestLocation: request.requestLocation ?? "",
    description: request.description ?? "",
    remarks: request.remarks ?? "",
    items: [...request.items]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((it) => ({
        objectType: it.objectType,
        objectName: it.objectName ?? "",
        quantity: it.quantity,
        unit: it.unit ?? "",
        locationDetail: it.locationDetail ?? "",
        remarks: it.remarks ?? "",
      })),
  };
}

export default function InspectionRequestForm({ request }: InspectionRequestFormProps) {
  const navigate = useNavigate();
  const isEdit = Boolean(request);
  const createMutation = useCreateInspectionRequest();
  const updateMutation = useUpdateInspectionRequest();
  const isPending = createMutation.isPending || updateMutation.isPending;
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: request
      ? requestToFormValues(request)
      : {
          testType: "PENETRANT_TEST",
          tankId: "",
          tankProcessId: "",
          requestDate: format(new Date(), "yyyy-MM-dd"),
          assetHolder: "MA 4",
          executionCompanyId: "",
          receivedById: "",
          preparedById: "",
          approvedById: "",
          standardAndCode: DEFAULT_STANDARD_BY_TEST_TYPE.PENETRANT_TEST,
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

  // Personnel + execution company options
  const selectedExecutionCompany = form.watch("executionCompanyId") ?? "";
  const effectiveExecutionCompanyId = selectedExecutionCompany && selectedExecutionCompany !== NONE_VALUE ? selectedExecutionCompany : undefined;
  const { data: executionCompanies = [], isLoading: loadingCompanies } = useCompanyOptions("INSPECTOR_COMPANY");
  const { data: inspectorUsers = [], isLoading: loadingInspectorUsers } = useUserOptions({ companyType: "INSPECTOR_COMPANY" });
  const { data: ownerUsers = [], isLoading: loadingOwnerUsers } = useUserOptions({ companyType: "OWNER" });

  // Received By is scoped to the chosen execution company when one is selected
  const receivedByUsers = effectiveExecutionCompanyId ? inspectorUsers.filter((u) => u.companyId === effectiveExecutionCompanyId) : inspectorUsers;

  const executionCompanyOptions = [{ label: "— None —", value: NONE_VALUE }, ...executionCompanies.map((co) => ({ label: co.name, value: co.id }))];
  const receivedByOptions = [{ label: "— None —", value: NONE_VALUE }, ...receivedByUsers.map((u) => ({ label: userOptionLabel(u), value: u.id }))];
  const preparedByOptions = [{ label: "— None —", value: NONE_VALUE }, ...ownerUsers.map((u) => ({ label: userOptionLabel(u), value: u.id }))];
  const approvedByOptions = [{ label: "— None —", value: NONE_VALUE }, ...ownerUsers.map((u) => ({ label: userOptionLabel(u), value: u.id }))];

  // Auto-fill Standard & Code with the selected test type's default. Only
  // replace when the field is empty or still holds the previous type's
  // default so custom input is preserved.
  const selectedTestType = form.watch("testType") as InspectionRequestType;
  const objectsRequired = !isObjectOptionalTestType(selectedTestType);
  const prevTestTypeRef = useRef(selectedTestType);
  useEffect(() => {
    if (prevTestTypeRef.current !== selectedTestType) {
      const prevDefault = DEFAULT_STANDARD_BY_TEST_TYPE[prevTestTypeRef.current] ?? "";
      prevTestTypeRef.current = selectedTestType;
      const current = form.getValues("standardAndCode") ?? "";
      if (current === "" || current === prevDefault) {
        form.setValue("standardAndCode", DEFAULT_STANDARD_BY_TEST_TYPE[selectedTestType] ?? "");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTestType]);

  // Keep at least one editable object row when switching back to a test type
  // that requires inspection objects (rows may be empty after an edit load).
  useEffect(() => {
    if (objectsRequired && form.getValues("items").length === 0) {
      append({ ...emptyItem });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [objectsRequired]);

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
    const pick = (v?: string) => (v && v !== NONE_VALUE ? v : undefined);
    // Whole-tank test types don't take inspection objects; drop any hidden rows.
    const itemsPayload = objectsRequired
      ? values.items.map((it) => ({
          objectType: it.objectType as InspectionObjectType,
          objectName: it.objectName || undefined,
          quantity: it.quantity,
          unit: it.unit || undefined,
          locationDetail: it.locationDetail || undefined,
          remarks: it.remarks || undefined,
        }))
      : [];

    if (isEdit && request) {
      const nextTankId = effectiveTankId ?? null;
      const nextProcessId = effectiveProcessId ?? null;
      const payload: UpdateInspectionRequestPayload = {
        testType: values.testType as InspectionRequestType,
        tankId: nextTankId,
        tankProcessId: nextProcessId,
        // Drop the stale project link when the tank/process context changes so
        // the server re-derives it from the new process.
        ...((nextTankId !== request.tankId || nextProcessId !== request.tankProcessId) && { projectId: null }),
        requestDate: values.requestDate,
        assetHolder: values.assetHolder || null,
        executionCompanyId: pick(values.executionCompanyId) ?? null,
        receivedById: pick(values.receivedById) ?? null,
        preparedById: pick(values.preparedById) ?? null,
        approvedById: pick(values.approvedById) ?? null,
        standardAndCode: values.standardAndCode || null,
        requestLocation: values.requestLocation || null,
        description: values.description || null,
        remarks: values.remarks || null,
        items: itemsPayload,
      };
      updateMutation.mutate(
        { id: request.id, data: payload },
        { onSuccess: () => navigate(ROUTES.INSPECTION_REQUEST_DETAIL.replace(":id", request.id)) },
      );
      return;
    }

    const payload: CreateInspectionRequestPayload = {
      testType: values.testType as InspectionRequestType,
      tankId: effectiveTankId,
      tankProcessId: effectiveProcessId,
      requestDate: values.requestDate,
      assetHolder: values.assetHolder || undefined,
      executionCompanyId: pick(values.executionCompanyId),
      receivedById: pick(values.receivedById),
      preparedById: pick(values.preparedById),
      approvedById: pick(values.approvedById),
      standardAndCode: values.standardAndCode || undefined,
      requestLocation: values.requestLocation || undefined,
      description: values.description || undefined,
      remarks: values.remarks || undefined,
      items: itemsPayload,
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
          <ShortTextField control={form.control} name="assetHolder" label="Customer / Asset Holder" placeholder="e.g. MA 4" />
          <ShortTextField control={form.control} name="standardAndCode" label="Standard & Code" placeholder="e.g. ASME Sec. V" />
          <ShortTextField control={form.control} name="requestLocation" label="Remarks / NDT Location" placeholder="e.g. Lokasi NDT: Tank A2" />
        </div>

        {/* Execution & signatories */}
        <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
          <span className="text-sm font-medium">Execution &amp; Signatories</span>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {loadingCompanies ? (
              <p className="text-xs text-muted-foreground">Loading companies…</p>
            ) : executionCompanies.length === 0 ? (
              <p className="text-xs text-muted-foreground">No inspector company available</p>
            ) : (
              <SelectField control={form.control} name="executionCompanyId" label="Execution / 3rd Party" placeholder="Select inspector company..." options={executionCompanyOptions} />
            )}
            {loadingInspectorUsers ? (
              <p className="text-xs text-muted-foreground">Loading inspectors…</p>
            ) : receivedByUsers.length === 0 ? (
              <p className="text-xs text-muted-foreground">No inspector company user available</p>
            ) : (
              <SelectField control={form.control} name="receivedById" label="Received By" placeholder="Select inspector..." options={receivedByOptions} />
            )}
            {loadingOwnerUsers ? (
              <p className="text-xs text-muted-foreground">Loading owner users…</p>
            ) : ownerUsers.length === 0 ? (
              <p className="text-xs text-muted-foreground">No owner user available</p>
            ) : (
              <SelectField control={form.control} name="preparedById" label="Prepared By" placeholder="Select preparer..." options={preparedByOptions} />
            )}
            {loadingOwnerUsers ? (
              <p className="text-xs text-muted-foreground">Loading owner users…</p>
            ) : ownerUsers.length === 0 ? (
              <p className="text-xs text-muted-foreground">No owner user available</p>
            ) : (
              <SelectField control={form.control} name="approvedById" label="Approved By" placeholder="Select approver..." options={approvedByOptions} />
            )}
          </div>
        </div>

        <LongTextField control={form.control} name="description" label="Description (optional)" placeholder="Leave empty to auto-generate from objects" rows={4} />
        <LongTextField control={form.control} name="remarks" label="Additional Remarks (optional)" rows={2} />
      </div>

      {/* Inspection objects — hidden for whole-tank test types that don't target specific objects */}
      {!objectsRequired ? (
        <div className="rounded-lg border border-dashed p-4">
          <h2 className="text-sm font-medium">Inspection Objects</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Not required for {TEST_TYPE_LABELS[selectedTestType] ?? selectedTestType} — this request applies to the tank/system as a whole.
          </p>
        </div>
      ) : (
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
      )}

      {/* Supporting documents — attachments are managed on the detail page in edit mode */}
      {!isEdit && (
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
      )}

      <div className="flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate(isEdit && request ? ROUTES.INSPECTION_REQUEST_DETAIL.replace(":id", request.id) : ROUTES.INSPECTION_REQUESTS)}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isEdit ? (isPending ? "Saving..." : "Save Changes") : isPending ? "Creating..." : "Create Request"}
        </Button>
      </div>
    </form>
  );
}
