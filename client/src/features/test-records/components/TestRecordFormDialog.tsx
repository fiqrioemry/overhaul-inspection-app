// src/features/test-records/components/TestRecordFormDialog.tsx
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Resolver } from "react-hook-form";
import { X, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import ShortTextField from "@/components/fields/ShortTextField";
import LongTextField from "@/components/fields/LongTextField";
import SelectField from "@/components/fields/SelectField";
import DateField from "@/components/fields/DateField";
import { useCreateTestRecord, useUpdateTestRecord } from "../test-records.query";
import type { TestRecord, TestResultStatus } from "../test-records.api";

const schema = z.object({
  status: z.enum(["NOT_STARTED", "REPAIR", "PASSED"]).default("NOT_STARTED"),
  inspectionRequestItemId: z.string().optional(),
  testDate: z.string().optional(),
  testPressure: z.coerce.number().positive().optional().or(z.literal("")),
  pressureUnit: z.string().optional(),
  holdingTime: z.string().optional(),
  testMedium: z.string().optional(),
  remarks: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const STATUS_OPTIONS = [
  { label: "Not Started", value: "NOT_STARTED" },
  { label: "Repair", value: "REPAIR" },
  { label: "Passed", value: "PASSED" },
];

interface TestRecordFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inspectionRequestId: string;
  objectOptions: { label: string; value: string }[];
  record?: TestRecord;
}

export default function TestRecordFormDialog({ open, onOpenChange, inspectionRequestId, objectOptions, record }: TestRecordFormDialogProps) {
  const isEdit = Boolean(record);
  const createMutation = useCreateTestRecord(inspectionRequestId);
  const updateMutation = useUpdateTestRecord(inspectionRequestId);
  const isPending = createMutation.isPending || updateMutation.isPending;

  const [files, setFiles] = useState<File[]>([]);
  const [removedIds, setRemovedIds] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const itemOptions = [{ label: "— Not linked —", value: "__none__" }, ...objectOptions];

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: { status: "NOT_STARTED", inspectionRequestItemId: "__none__", testDate: "", testPressure: "", pressureUnit: "bar", holdingTime: "", testMedium: "", remarks: "" },
  });

  useEffect(() => {
    if (open && record) {
      form.reset({
        status: record.status,
        inspectionRequestItemId: record.inspectionRequestItemId ?? "__none__",
        testDate: record.testDate ? record.testDate.slice(0, 10) : "",
        testPressure: record.testPressure ?? "",
        pressureUnit: record.pressureUnit ?? "bar",
        holdingTime: record.holdingTime ?? "",
        testMedium: record.testMedium ?? "",
        remarks: record.remarks ?? "",
      });
    } else if (!open) {
      form.reset({ status: "NOT_STARTED", inspectionRequestItemId: "__none__", testDate: "", testPressure: "", pressureUnit: "bar", holdingTime: "", testMedium: "", remarks: "" });
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFiles([]);
      setRemovedIds([]);
    }
  }, [open, record, form]);

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    setFiles((prev) => [...prev, ...picked].slice(0, 15));
    e.target.value = "";
  }

  function onSubmit(values: FormValues) {
    const itemId = values.inspectionRequestItemId && values.inspectionRequestItemId !== "__none__" ? values.inspectionRequestItemId : undefined;
    const base = {
      status: values.status as TestResultStatus,
      testDate: values.testDate || undefined,
      testPressure: values.testPressure ? Number(values.testPressure) : undefined,
      pressureUnit: values.pressureUnit || undefined,
      holdingTime: values.holdingTime || undefined,
      testMedium: values.testMedium || undefined,
      remarks: values.remarks || undefined,
      files,
    };

    if (isEdit && record) {
      updateMutation.mutate({ id: record.id, data: { ...base, inspectionRequestItemId: itemId ?? null, removedAttachmentIds: removedIds } }, { onSuccess: () => onOpenChange(false) });
    } else {
      createMutation.mutate({ ...base, inspectionRequestItemId: itemId }, { onSuccess: () => onOpenChange(false) });
    }
  }

  const existingAttachments = (record?.attachments ?? []).filter((a) => !removedIds.includes(a.id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="xl:w-130! max-h-[90vh] overflow-y-auto">
        <div className="p-4">
          <DialogHeader>
            <DialogTitle>{isEdit ? "Edit Test Record" : "Add Test Record"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <SelectField control={form.control} name="status" label="Result Status" options={STATUS_OPTIONS} />
              <SelectField control={form.control} name="inspectionRequestItemId" label="Object" options={itemOptions} />
            </div>
            <DateField control={form.control} name="testDate" label="Test Date" />
            <div className="grid grid-cols-2 gap-4">
              <ShortTextField control={form.control} name="testPressure" label="Test Pressure" placeholder="e.g. 1.5" />
              <ShortTextField control={form.control} name="pressureUnit" label="Unit" placeholder="bar / kPa / psi" />
            </div>
            <ShortTextField control={form.control} name="holdingTime" label="Holding Time" placeholder="e.g. 30 minutes" />
            <ShortTextField control={form.control} name="testMedium" label="Test Medium" placeholder="e.g. Water / Air" />
            <LongTextField control={form.control} name="remarks" label="Remarks" rows={3} />

            {/* Existing attachments (edit) */}
            {existingAttachments.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {existingAttachments.map((a) => (
                  <div key={a.id} className="relative aspect-square rounded border overflow-hidden bg-muted group">
                    <img src={a.attachmentUrl} alt={a.caption ?? ""} className="w-full h-full object-contain" />
                    <button type="button" onClick={() => setRemovedIds((p) => [...p, a.id])} className="absolute top-1 right-1 rounded-full bg-black/70 text-white p-0.5 opacity-0 group-hover:opacity-100">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* New files */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-muted-foreground">Photos ({existingAttachments.length + files.length}/15)</span>
                <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add
                </Button>
                <input ref={fileInputRef} type="file" multiple accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden" onChange={handleFiles} />
              </div>
              {files.length > 0 && (
                <div className="space-y-1">
                  {files.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 rounded border px-2 py-1 text-xs">
                      <span className="truncate flex-1">{f.name}</span>
                      <button type="button" onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}>
                        <X className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : isEdit ? "Save Changes" : "Create Record"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
