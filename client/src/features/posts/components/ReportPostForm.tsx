// src/features/posts/components/ReportPostForm.tsx

import { useForm } from "react-hook-form";
import { useWatch } from "react-hook-form";
import type { Post } from "@/types/posts.type";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import SelectField from "@/components/fields/SelectField";
import { useReportPost } from "@/features/posts/posts.query";
import LongTextField from "@/components/fields/LongTextField";
import { reportPostRequest, type ReportPostRequest } from "@/schemas/posts.schema";

interface ReportPostFormProps {
  post: Post;
  onSuccess: () => void;
  onClose: () => void;
  isPendingChange?: (isPending: boolean) => void;
}

export default function ReportPostForm({ post, onSuccess, onClose, isPendingChange }: ReportPostFormProps) {
  const { mutateAsync: reportPost, isPending } = useReportPost(post.id);
  const { t } = useTranslation(["post"]);

  isPendingChange?.(isPending);

  const REPORT_REASON_OPTIONS = [
    { label: t("post:reportReasonSpam"), value: "SPAM" },
    { label: t("post:reportReasonNudity"), value: "NUDITY" },
    { label: t("post:reportReasonHarassment"), value: "HARASSMENT" },
    { label: t("post:reportReasonViolence"), value: "VIOLENCE" },
    { label: t("post:reportReasonMisinformation"), value: "MISSINFORMATION" },
    { label: t("post:reportReasonOther"), value: "OTHER" },
  ];

  const {
    control,
    handleSubmit,
    formState: { isValid },
  } = useForm<ReportPostRequest>({
    resolver: zodResolver(reportPostRequest()),
    mode: "onChange",
    defaultValues: {
      reason: undefined,
      description: "",
    },
  });

  const reason = useWatch({ control, name: "reason" });

  async function onSubmit(data: ReportPostRequest) {
    await reportPost(data);
    onSuccess();
  }

  return (
    <>
      {/* Body */}
      <div className="px-6 pb-4 flex flex-col gap-4">
        <SelectField
          control={control}
          name="reason"
          label={t("post:reportReasonLabel")}
          options={REPORT_REASON_OPTIONS}
          placeholder={t("post:reportReasonPlaceholder")}
          description={t("post:reportReasonDescription")}
        />

        {reason === "OTHER" && (
          <LongTextField
            control={control}
            name="description"
            label={t("post:reportDescriptionLabel")}
            placeholder={t("post:reportDescriptionPlaceholder")}
            rows={4}
            maxLength={1000}
          />
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border bg-muted/30">
        <button type="button" onClick={onClose} disabled={isPending} className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-50">
          {t("post:reportCancel")}
        </button>
        <button
          type="button"
          onClick={handleSubmit(onSubmit)}
          disabled={isPending || !isValid}
          className="px-4 py-2 text-sm rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-50 font-medium"
        >
          {isPending ? t("post:reportSubmitting") : t("post:reportSubmit")}
        </button>
      </div>
    </>
  );
}
