// src/features/tank-projects/components/AddProcessDialog.tsx
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Resolver } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import SelectField from "@/components/fields/SelectField";
import { useAvailableProcessTemplates, useGenerateProjectProcesses } from "../tank-projects.query";

const schema = z.object({
  processTemplateId: z.string().min(1, "Select a process to add"),
});

type FormValues = z.infer<typeof schema>;

interface AddProcessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}

export default function AddProcessDialog({ open, onOpenChange, projectId }: AddProcessDialogProps) {
  const { data: available = [], isLoading } = useAvailableProcessTemplates(open ? projectId : null);
  const generateMutation = useGenerateProjectProcesses();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: { processTemplateId: "" },
  });

  useEffect(() => {
    if (!open) form.reset({ processTemplateId: "" });
  }, [open]);

  const options = [...available].sort((a, b) => a.sequenceOrder - b.sequenceOrder).map((t) => ({ label: `${t.code} — ${t.name}`, value: t.id }));
  const noneAvailable = !isLoading && options.length === 0;

  function onSubmit(values: FormValues) {
    generateMutation.mutate({ id: projectId, processTemplateIds: [values.processTemplateId] }, { onSuccess: () => onOpenChange(false) });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="xl:w-110! h-56!">
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4 p-4">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Add Process</DialogTitle>
          </DialogHeader>

          {noneAvailable ? (
            <p className="text-sm text-muted-foreground">All available process templates have already been added to this project.</p>
          ) : (
            <SelectField control={form.control} name="processTemplateId" label="Process Template" options={options} placeholder="Select a process to add" />
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={generateMutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={generateMutation.isPending || noneAvailable}>
              {generateMutation.isPending ? "Adding..." : "Add Process"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
