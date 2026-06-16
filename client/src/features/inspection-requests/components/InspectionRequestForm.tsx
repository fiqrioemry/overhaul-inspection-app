// src/features/inspection-requests/components/InspectionRequestForm.tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import ShortTextField from "@/components/fields/ShortTextField";
import LongTextField from "@/components/fields/LongTextField";
import { createInspectionRequestSchema } from "@/schemas/inspection-requests.schema";
import type { CreateInspectionRequestFormValues } from "@/schemas/inspection-requests.schema";
import { useCreateInspectionRequest } from "../inspection-requests.query";

interface InspectionRequestFormProps {
  tankProcessId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function InspectionRequestForm({ tankProcessId, onSuccess, onCancel }: InspectionRequestFormProps) {
  const mutation = useCreateInspectionRequest();

  const form = useForm<CreateInspectionRequestFormValues>({
    resolver: zodResolver(createInspectionRequestSchema),
    defaultValues: { tankProcessId, title: "", description: "" },
  });

  function onSubmit(values: CreateInspectionRequestFormValues) {
    mutation.mutate(values, { onSuccess });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <ShortTextField control={form.control} name="title" label="Request Title" placeholder="e.g. Hydrostatic Test — Shell Course 1-3" />
      <LongTextField control={form.control} name="description" label="Description" placeholder="Describe what is being inspected or tested" rows={4} />
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={mutation.isPending}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Submitting..." : "Submit Request"}
        </Button>
      </div>
    </form>
  );
}
