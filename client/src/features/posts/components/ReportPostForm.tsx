// src/features/posts/components/ReportPostForm.tsx

import { useForm } from "react-hook-form";
import { useWatch } from "react-hook-form";
import type { Post } from "@/types/posts.type";
import { zodResolver } from "@hookform/resolvers/zod";
import SelectField from "@/components/fields/SelectField";
import { useReportPost } from "@/features/posts/posts.query";
import LongTextField from "@/components/fields/LongTextField";
import { reportPostRequest, type ReportPostRequest } from "@/schemas/posts.schema";

const REPORT_REASON_OPTIONS = [
  { label: "Spam", value: "SPAM" },
  { label: "Nudity", value: "NUDITY" },
  { label: "Harassment", value: "HARASSMENT" },
  { label: "Violence", value: "VIOLENCE" },
  { label: "Misinformation", value: "MISSINFORMATION" },
  { label: "Other", value: "OTHER" },
];

interface ReportPostFormProps {
  post: Post;
  onSuccess: () => void;
  onClose: () => void;
  isPendingChange?: (isPending: boolean) => void;
}

export default function ReportPostForm({ post, onSuccess, onClose, isPendingChange }: ReportPostFormProps) {
  const { mutateAsync: reportPost, isPending } = useReportPost(post.id);

  isPendingChange?.(isPending);

  const {
    control,
    handleSubmit,
    formState: { isValid },
  } = useForm<ReportPostRequest>({
    resolver: zodResolver(reportPostRequest),
    mode: "onChange",
    defaultValues: {
      reason: undefined,
      description: "",
    },
  });

  // Watch reason to conditionally show description field
  const reason = useWatch({ control, name: "reason" });

  async function onSubmit(data: ReportPostRequest) {
    await reportPost(data);
    onSuccess();
  }

  return (
    <>
      {/* Body */}
      <div className="px-6 pb-4 flex flex-col gap-4">
        <SelectField control={control} name="reason" label="Reason" options={REPORT_REASON_OPTIONS} placeholder="Select a reason..." description="Choose the reason that best describes the issue." />

        {reason === "OTHER" && <LongTextField control={control} name="description" label="Description" placeholder="Please describe the issue in detail..." rows={4} maxLength={1000} />}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border bg-muted/30">
        <button type="button" onClick={onClose} disabled={isPending} className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-50">
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit(onSubmit)}
          disabled={isPending || !isValid}
          className="px-4 py-2 text-sm rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-50 font-medium"
        >
          {isPending ? "Submitting..." : "Submit Report"}
        </button>
      </div>
    </>
  );
}
