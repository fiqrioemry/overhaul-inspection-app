// src/features/posts/components/ImageUploadStep.tsx
import { toast } from "sonner";
import { useCallback } from "react";
import { ImageDropzone } from "@/components/fields/ImageDropzone";
import { ImagePreviewGallery } from "@/components/fields/ImagePreviewGallery";

const MAX_FILES = 5;
const MAX_SIZE = 8 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

export interface PreviewItem {
  file: File;
  previewUrl: string;
}

interface ImageUploadStepProps {
  previews: PreviewItem[];
  onChange: (items: PreviewItem[]) => void;
}

export function ImageUploadStep({ previews, onChange }: ImageUploadStepProps) {
  const handleDrop = useCallback(
    (dropped: File[]) => {
      const valid: PreviewItem[] = [];
      for (const file of dropped) {
        if (!ALLOWED.includes(file.type)) {
          toast.error(`${file.name}: Format not supported.`);
          continue;
        }
        if (file.size > MAX_SIZE) {
          toast.error(`${file.name}: Size exceeds ${MAX_SIZE / (1024 * 1024)}MB.`);
          continue;
        }
        if (previews.length + valid.length >= MAX_FILES) {
          toast.warning(`Maximum ${MAX_FILES} images.`);
          break;
        }
        valid.push({ file, previewUrl: URL.createObjectURL(file) });
      }
      if (valid.length > 0) onChange([...previews, ...valid]);
    },
    [previews, onChange],
  );

  const handleRemove = useCallback(
    (index: number) => {
      const next = previews.filter((_, i) => i !== index);
      URL.revokeObjectURL(previews[index].previewUrl);
      onChange(next);
    },
    [previews, onChange],
  );

  return (
    <div className="flex flex-col gap-4">
      <ImageDropzone onDrop={handleDrop} maxFiles={MAX_FILES} currentCount={previews.length} />
      <ImagePreviewGallery items={previews} onRemove={handleRemove} />
    </div>
  );
}
