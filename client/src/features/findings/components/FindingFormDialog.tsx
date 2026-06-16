// src/features/findings/components/FindingFormDialog.tsx
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
import { useCreateFinding } from "../findings.query";

const schema = z.object({
  title: z.string().min(2, "Title required"),
  description: z.string().optional(),
  locationDetail: z.string().optional(),
  severity: z.enum(["MINOR", "MAJOR", "CRITICAL"]).default("MAJOR"),
});

type FormValues = z.infer<typeof schema>;

const SEVERITY_OPTIONS = [
  { label: "Minor", value: "MINOR" },
  { label: "Major", value: "MAJOR" },
  { label: "Critical", value: "CRITICAL" },
];

interface FindingFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tankId: string;
  tankProcessId: string;
  criteriaId?: string;
}

export default function FindingFormDialog({ open, onOpenChange, tankId, tankProcessId, criteriaId }: FindingFormDialogProps) {
  const createMutation = useCreateFinding();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: { title: "", description: "", locationDetail: "", severity: "MAJOR" },
  });

  useEffect(() => {
    if (!open) form.reset();
  }, [open, form]);

  function onSubmit(values: FormValues) {
    createMutation.mutate(
      {
        tankId,
        tankProcessId,
        criteriaId,
        title: values.title,
        description: values.description || undefined,
        locationDetail: values.locationDetail || undefined,
        severity: values.severity,
        isBlocking: true,
      },
      { onSuccess: () => onOpenChange(false) },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="xl:h-auto! xl:w-110!">
        <div className="p-4">
          <DialogHeader>
            <DialogTitle>Add Finding</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4 space-y-4">
            <ShortTextField control={form.control} name="title" label="Title" placeholder="Describe the finding..." />
            <SelectField control={form.control} name="severity" label="Severity" options={SEVERITY_OPTIONS} />
            <LongTextField control={form.control} name="locationDetail" label="Location" placeholder="E.g. Bottom plate, weld seam #3" rows={2} />
            <LongTextField control={form.control} name="description" label="Description" placeholder="Additional detail..." rows={3} />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Saving..." : "Create Finding"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
