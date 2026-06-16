// src/features/inspection-requests/components/ReviewDialog.tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import SelectField from "@/components/fields/SelectField";
import LongTextField from "@/components/fields/LongTextField";
import { reviewInspectionRequestSchema } from "@/schemas/inspection-requests.schema";
import type { ReviewInspectionRequestFormValues } from "@/schemas/inspection-requests.schema";
import { useReviewInspectionRequest } from "../inspection-requests.query";

const ACTION_OPTIONS = [
  { label: "Mark as Reviewed", value: "REVIEWED" },
  { label: "Return to Submitter", value: "RETURNED" },
];

interface ReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requestId: string;
}

export default function ReviewDialog({ open, onOpenChange, requestId }: ReviewDialogProps) {
  const mutation = useReviewInspectionRequest(requestId);

  const form = useForm<ReviewInspectionRequestFormValues>({
    resolver: zodResolver(reviewInspectionRequestSchema),
    defaultValues: { action: "REVIEWED", notes: "" },
  });

  function onSubmit(values: ReviewInspectionRequestFormValues) {
    mutation.mutate(values, { onSuccess: () => onOpenChange(false) });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="xl:h-auto! xl:w-105!">
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4 p-4">
          <DialogHeader>
            <DialogTitle>Review Inspection Request</DialogTitle>
          </DialogHeader>

          <SelectField control={form.control} name="action" label="Action" options={ACTION_OPTIONS} />
          <LongTextField control={form.control} name="notes" label="Notes" placeholder="Optional notes for the submitter" rows={4} />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Submitting..." : "Confirm"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
