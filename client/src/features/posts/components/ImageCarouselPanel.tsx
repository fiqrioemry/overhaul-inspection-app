import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PreviewItem } from "@/features/posts/components/ImageUploadStep";

interface ImageCarouselPanelProps {
  previews: PreviewItem[];
}

export function ImageCarouselPanel({ previews }: ImageCarouselPanelProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  // Clamp activeIndex if previews shrink (e.g. user removed images)
  const safeIndex = Math.min(activeIndex, previews.length - 1);
  const current = previews[safeIndex];

  function prev() {
    setActiveIndex((i) => Math.max(0, i - 1));
  }

  function next() {
    setActiveIndex((i) => Math.min(previews.length - 1, i + 1));
  }

  return (
    <div className="relative w-full h-full flex items-center justify-center select-none">
      {/* Main Image */}
      <img key={current.previewUrl} src={current.previewUrl} alt="" className="w-full h-full object-contain" />

      {/* Prev Button */}
      {safeIndex > 0 && (
        <button type="button" onClick={prev} className="absolute left-3 flex size-8 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors backdrop-blur-sm">
          <ChevronLeft className="size-4" />
        </button>
      )}

      {/* Next Button */}
      {safeIndex < previews.length - 1 && (
        <button type="button" onClick={next} className="absolute right-3 flex size-8 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors backdrop-blur-sm">
          <ChevronRight className="size-4" />
        </button>
      )}

      {/* Dot indicators */}
      {previews.length > 1 && (
        <div className="absolute bottom-4 flex gap-1.5">
          {previews.map((_, i) => (
            <button key={i} type="button" onClick={() => setActiveIndex(i)} className={cn("size-1.5 rounded-full transition-all", i === safeIndex ? "bg-white scale-125" : "bg-white/50 hover:bg-white/75")} />
          ))}
        </div>
      )}

      {/* Counter badge */}
      <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-sm text-white text-xs font-medium">
        {safeIndex + 1} / {previews.length}
      </div>
    </div>
  );
}
