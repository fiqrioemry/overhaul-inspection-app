// src/features/test-records/components/TestRecordFormDialog.tsx
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Resolver } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import ShortTextField from "@/components/fields/ShortTextField";
import LongTextField from "@/components/fields/LongTextField";
import SelectField from "@/components/fields/SelectField";
import DateField from "@/components/fields/DateField";
import { useCreateTestRecord } from "../test-records.query";

const schema = z.object({
  testDate: z.string().optional(),
  testPressure: z.coerce.number().positive().optional().or(z.literal("")),
  pressureUnit: z.string().optional(),
  holdingTime: z.string().optional(),
  testMedium: z.string().optional(),
  result: z.enum(["PENDING", "PASSED", "FAILED", "NOT_APPLICABLE"]).default("PENDING"),
  remarks: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const RESULT_OPTIONS = [
  { label: "Pending", value: "PENDING" },
  { label: "Passed", value: "PASSED" },
  { label: "Failed", value: "FAILED" },
  { label: "Not Applicable", value: "NOT_APPLICABLE" },
];

interface TestRecordFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tankProcessId: string;
}

export default function TestRecordFormDialog({ open, onOpenChange, tankProcessId }: TestRecordFormDialogProps) {
  const createMutation = useCreateTestRecord(tankProcessId);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: { testDate: "", testPressure: "", pressureUnit: "bar", holdingTime: "", testMedium: "", result: "PENDING", remarks: "" },
  });

  useEffect(() => {
    if (!open) form.reset({ testDate: "", testPressure: "", pressureUnit: "bar", holdingTime: "", testMedium: "", result: "PENDING", remarks: "" });
  }, [open, form]);

  function onSubmit(values: FormValues) {
    createMutation.mutate(
      {
        testDate: values.testDate || undefined,
        testPressure: values.testPressure ? Number(values.testPressure) : undefined,
        pressureUnit: values.pressureUnit || undefined,
        holdingTime: values.holdingTime || undefined,
        testMedium: values.testMedium || undefined,
        result: values.result as "PENDING" | "PASSED" | "FAILED" | "NOT_APPLICABLE",
        remarks: values.remarks || undefined,
      },
      { onSuccess: () => onOpenChange(false) },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="xl:h-auto! xl:w-120!">
        <div className="p-4">
          <DialogHeader>
            <DialogTitle>Add Test Record</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4 space-y-4">
            <DateField control={form.control} name="testDate" label="Test Date" />
            <div className="grid grid-cols-2 gap-4">
              <ShortTextField control={form.control} name="testPressure" label="Test Pressure" placeholder="e.g. 1.5" />
              <ShortTextField control={form.control} name="pressureUnit" label="Unit" placeholder="bar / kPa / psi" />
            </div>
            <ShortTextField control={form.control} name="holdingTime" label="Holding Time" placeholder="e.g. 30 minutes" />
            <ShortTextField control={form.control} name="testMedium" label="Test Medium" placeholder="e.g. Water / Air / Nitrogen" />
            <SelectField control={form.control} name="result" label="Result" options={RESULT_OPTIONS} />
            <LongTextField control={form.control} name="remarks" label="Remarks" rows={3} />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Saving..." : "Create Record"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
