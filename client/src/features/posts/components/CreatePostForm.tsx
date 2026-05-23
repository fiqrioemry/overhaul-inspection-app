// src/features/posts/components/CreatePostForm.tsx
import { toast } from "sonner";
import { X } from "lucide-react";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, FormProvider } from "react-hook-form";
import { useCreatePost } from "@/features/posts/posts.query";
import { PostDetailStep } from "@/features/posts/components/PostDetailStep";
import { createPostRequest, type CreatePostRequest } from "@/schemas/posts.schema";
import { ImageCarouselPanel } from "@/features/posts/components/ImageCarouselPanel";
import { ImageUploadStep, type PreviewItem } from "@/features/posts/components/ImageUploadStep";

interface CreatePostFormProps {
  onSuccess: () => void;
  onClose: () => void;
  onHasImagesChange?: (hasImages: boolean) => void;
  isPendingChange?: (isPending: boolean) => void;
}

type Step = "upload" | "detail";

export default function CreatePostForm({ onSuccess, onClose, onHasImagesChange, isPendingChange }: CreatePostFormProps) {
  const [step, setStep] = useState<Step>("upload");
  const [previews, setPreviews] = useState<PreviewItem[]>([]);
  const { mutateAsync: createPost, isPending } = useCreatePost();

  isPendingChange?.(isPending);

  const methods = useForm<CreatePostRequest>({
    resolver: zodResolver(createPostRequest),
    defaultValues: { title: "", content: "", galleries: [] },
  });

  function handlePreviewChange(items: PreviewItem[]) {
    setPreviews(items);
    onHasImagesChange?.(items.length > 0);
    methods.setValue(
      "galleries",
      items.map((p) => p.file),
      { shouldValidate: true },
    );
  }

  function handleNext() {
    if (previews.length === 0) {
      toast.error("Upload at least 1 image first.");
      return;
    }
    setStep("detail");
  }

  async function onSubmit(data: CreatePostRequest) {
    await createPost(data);
    previews.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    onSuccess();
  }

  const showSplitLayout = previews.length > 0;

  return (
    <FormProvider {...methods}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          {step === "detail" && (
            <button type="button" onClick={() => setStep("upload")} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              ← Back
            </button>
          )}
          <h2 className="text-sm font-semibold">{step === "upload" ? "Create New Post" : "Post Details"}</h2>
        </div>
        <div className="flex items-center gap-2">
          {step === "upload" && previews.length > 0 && (
            <button type="button" onClick={handleNext} className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors">
              Continue
            </button>
          )}
          {step === "detail" && (
            <button type="button" onClick={methods.handleSubmit(onSubmit)} disabled={isPending || !methods.formState.isValid} className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors disabled:opacity-50">
              {isPending ? "Posting..." : "Share"}
            </button>
          )}
          <button type="button" onClick={onClose} disabled={isPending} className="flex size-7 items-center justify-center rounded-full hover:bg-muted transition-colors disabled:opacity-50">
            <X className="size-4" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className={`flex overflow-hidden ${showSplitLayout ? "flex-col xl:flex-row flex-1" : "flex-1"}`}>
        {/* Image panel */}
        {showSplitLayout && (
          <div
            className={[
              // Mobile: image di atas, tinggi compact
              "w-full bg-black flex items-center justify-center shrink-0",
              "h-56 sm:h-72",
              // xl: kembali ke split kiri-kanan
              "xl:h-auto xl:w-auto xl:flex-1 xl:min-w-0",
            ].join(" ")}
          >
            <ImageCarouselPanel previews={previews} />
          </div>
        )}

        {/* Form panel */}
        <div
          className={[
            showSplitLayout
              ? // Ada gambar: form di bawah (mobile) atau kanan (xl)
                "w-full flex flex-col overflow-y-auto border-t border-border xl:border-t-0 xl:border-l xl:w-80 xl:shrink-0 xl:max-w-none"
              : // Tidak ada gambar: form full width
                "flex-1 flex flex-col overflow-y-auto",
          ].join(" ")}
        >
          <div className="p-5 flex-1">{step === "upload" ? <ImageUploadStep previews={previews} onChange={handlePreviewChange} /> : <PostDetailStep />}</div>
        </div>
      </div>
    </FormProvider>
  );
}
