// src/features/findings/components/FindingEditDialog.tsx
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
import SwitchField from "@/components/fields/SwitchField";
import { useUpdateFinding } from "../findings.query";
import type { FindingSummary } from "../findings.api";

const schema = z.object({
  title: z.string().min(2, "Title required"),
  description: z.string().optional(),
  locationDetail: z.string().optional(),
  severity: z.enum(["MINOR", "MAJOR", "CRITICAL"]),
  isBlocking: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

const SEVERITY_OPTIONS = [
  { label: "Minor", value: "MINOR" },
  { label: "Major", value: "MAJOR" },
  { label: "Critical", value: "CRITICAL" },
];

interface FindingEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  finding: FindingSummary;
}

export default function FindingEditDialog({ open, onOpenChange, finding }: FindingEditDialogProps) {
  const updateMutation = useUpdateFinding();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: {
      title: finding.title,
      description: finding.description ?? "",
      locationDetail: finding.locationDetail ?? "",
      severity: finding.severity,
      isBlocking: finding.isBlocking,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        title: finding.title,
        description: finding.description ?? "",
        locationDetail: finding.locationDetail ?? "",
        severity: finding.severity,
        isBlocking: finding.isBlocking,
      });
    }
  }, [open, finding, form]);

  function onSubmit(values: FormValues) {
    updateMutation.mutate(
      {
        id: finding.id,
        data: {
          title: values.title,
          description: values.description || undefined,
          locationDetail: values.locationDetail || undefined,
          severity: values.severity,
          isBlocking: values.isBlocking,
        },
      },
      { onSuccess: () => onOpenChange(false) },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="xl:h-auto! xl:w-110!">
        <div className="p-4">
          <DialogHeader>
            <DialogTitle>Edit Finding</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4 space-y-4">
            <ShortTextField control={form.control} name="title" label="Title" placeholder="Describe the finding..." />
            <SelectField control={form.control} name="severity" label="Severity" options={SEVERITY_OPTIONS} />
            <LongTextField control={form.control} name="locationDetail" label="Location" placeholder="E.g. Bottom plate, weld seam #3" rows={2} />
            <LongTextField control={form.control} name="description" label="Description" placeholder="Additional detail..." rows={3} />
            <SwitchField control={form.control} name="isBlocking" label="Blocking" description="Block process from proceeding" />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
