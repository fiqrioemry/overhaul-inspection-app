// src/features/checklist-results/components/AddCustomChecklistDialog.tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import ShortTextField from "@/components/fields/ShortTextField";
import LongTextField from "@/components/fields/LongTextField";
import SwitchField from "@/components/fields/SwitchField";
import { useAddCustomChecklist } from "../checklist-results.query";

const schema = z.object({
  name: z.string().min(1, "Name is required").max(300),
  description: z.string().max(500).optional(),
  acceptanceText: z.string().max(500).optional(),
  method: z.string().max(200).optional(),
  referenceText: z.string().max(300).optional(),
  isRequired: z.boolean().default(true),
  remarks: z.string().max(500).optional(),
});

type FormValues = z.infer<typeof schema>;

interface AddCustomChecklistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  processId: string;
}

export default function AddCustomChecklistDialog({ open, onOpenChange, processId }: AddCustomChecklistDialogProps) {
  const mutation = useAddCustomChecklist(processId);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      description: "",
      acceptanceText: "",
      method: "",
      referenceText: "",
      isRequired: true,
      remarks: "",
    },
  });

  function onSubmit(values: FormValues) {
    mutation.mutate(
      {
        name: values.name,
        description: values.description || undefined,
        acceptanceText: values.acceptanceText || undefined,
        method: values.method || undefined,
        referenceText: values.referenceText || undefined,
        isRequired: values.isRequired,
        remarks: values.remarks || undefined,
      },
      {
        onSuccess: () => {
          form.reset();
          onOpenChange(false);
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) form.reset(); onOpenChange(o); }}>
      <DialogContent className="xl:h-auto! xl:w-130!">
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4 p-4">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">Add Custom Checklist Item</DialogTitle>
          </DialogHeader>

          <ShortTextField control={form.control} name="name" label="Parameter Name" placeholder="e.g. Visual weld inspection" required />
          <LongTextField control={form.control} name="description" label="Description (optional)" placeholder="Describe what to check..." rows={2} />
          <ShortTextField control={form.control} name="acceptanceText" label="Acceptance Criteria (optional)" placeholder="e.g. No visible cracks or porosity" />
          <ShortTextField control={form.control} name="method" label="Method (optional)" placeholder="e.g. Visual, UT, MT" />
          <ShortTextField control={form.control} name="referenceText" label="Reference (optional)" placeholder="e.g. API 650 Cl. 9.2" />
          <LongTextField control={form.control} name="remarks" label="Initial Remarks (optional)" placeholder="Any notes..." rows={2} />
          <SwitchField control={form.control} name="isRequired" label="Required" description="Blocking required items will prevent review submission" />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { form.reset(); onOpenChange(false); }} disabled={mutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Adding..." : "Add Item"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
