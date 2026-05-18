// src/features/posts/components/PostGallery.tsx
import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

type GalleryImage = {
  id: string;
  url: string;
};

interface PostGalleryProps {
  images: GalleryImage[];
  alt?: string;
  aspectRatio?: "square" | "portrait" | "auto";
}

export default function PostGallery({ images, alt = "Post image", aspectRatio = "square" }: PostGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images?.length) return null;

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < images.length - 1;

  const goTo = (index: number) => {
    setCurrentIndex(Math.max(0, Math.min(images.length - 1, index)));
  };

  const aspectClass = aspectRatio === "square" ? "aspect-square" : aspectRatio === "portrait" ? "aspect-[4/5]" : "aspect-auto max-h-[600px]";

  return (
    <div className="relative w-full overflow-hidden bg-black select-none">
      <div className={cn("relative w-full overflow-hidden", aspectClass)}>
        {/* Carousel Container */}
        <div
          className="flex h-full transition-transform duration-300 ease-in-out"
          style={{
            transform: `translateX(-${currentIndex * 100}%)`,
          }}
        >
          {images.map((image, index) => (
            <div key={image.id} className="relative h-full w-full  shrink-0">
              <img src={image.url} alt={`${alt} ${index + 1}`} className="h-full w-full object-contain" draggable={false} loading={index === 0 ? "eager" : "lazy"} />
            </div>
          ))}
        </div>

        {/* Navigation Buttons */}
        {images.length > 1 && (
          <>
            {hasPrev && (
              <button
                type="button"
                onClick={() => goTo(currentIndex - 1)}
                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-1.5 text-white backdrop-blur-sm transition hover:bg-black/70 active:scale-95"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}

            {hasNext && (
              <button
                type="button"
                onClick={() => goTo(currentIndex + 1)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-1.5 text-white backdrop-blur-sm transition hover:bg-black/70 active:scale-95"
                aria-label="Next image"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            )}
          </>
        )}

        {/* Dot Indicators */}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {images.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => goTo(index)}
                className={cn("h-1.5 rounded-full transition-all duration-200", index === currentIndex ? "w-6 bg-white" : "w-1.5 bg-white/50 hover:bg-white/80")}
                aria-label={`Go to image ${index + 1}`}
              />
            ))}
          </div>
        )}

        {/* Image Counter */}
        {images.length > 1 && (
          <div className="absolute right-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
            {currentIndex + 1} / {images.length}
          </div>
        )}
      </div>
    </div>
  );
}
