// src/features/radiography/components/RadiographyFormDialog.tsx
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Resolver } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import ShortTextField from "@/components/fields/ShortTextField";
import LongTextField from "@/components/fields/LongTextField";
import DateField from "@/components/fields/DateField";
import { useCreateRadiography } from "../radiography.query";

const schema = z.object({
  testDate: z.string().optional(),
  area: z.string().optional(),
  remarks: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface RadiographyFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tankProcessId: string;
}

export default function RadiographyFormDialog({ open, onOpenChange, tankProcessId }: RadiographyFormDialogProps) {
  const createMutation = useCreateRadiography(tankProcessId);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: { testDate: "", area: "", remarks: "" },
  });

  useEffect(() => {
    if (!open) form.reset({ testDate: "", area: "", remarks: "" });
  }, [open, form]);

  function onSubmit(values: FormValues) {
    createMutation.mutate(
      {
        testDate: values.testDate || undefined,
        area: values.area || undefined,
        remarks: values.remarks || undefined,
      },
      { onSuccess: () => onOpenChange(false) },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="xl:h-auto! xl:w-110!">
        <div className="p-4">
          <DialogHeader>
            <DialogTitle>New Radiography Test</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4 space-y-4">
            <DateField control={form.control} name="testDate" label="Test Date" />
            <ShortTextField control={form.control} name="area" label="Area / Location" placeholder="e.g. Shell course 1-2 weld" />
            <LongTextField control={form.control} name="remarks" label="Remarks" rows={3} />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Saving..." : "Create Test"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
