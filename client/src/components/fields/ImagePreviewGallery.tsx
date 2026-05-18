import { X } from "lucide-react";

interface PreviewItem {
  file: File;
  previewUrl: string;
}

interface ImagePreviewGalleryProps {
  items: PreviewItem[];
  onRemove: (index: number) => void;
}

export function ImagePreviewGallery({ items, onRemove }: ImagePreviewGalleryProps) {
  if (items.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{items.length} gambar dipilih</p>
      {/* Horizontal scroll gallery */}
      <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
        {items.map((item, index) => (
          <div key={item.previewUrl} className="relative shrink-0 w-28 h-28 rounded-xl overflow-hidden snap-start group ring-1 ring-border">
            <img src={item.previewUrl} alt={item.file.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-200" />
            {/* Remove button */}
            <button
              type="button"
              onClick={() => onRemove(index)}
              className="absolute top-1.5 right-1.5 flex size-5 items-center justify-center rounded-full bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
            >
              <X className="size-3" />
            </button>
            {/* Index badge */}
            <div className="absolute bottom-1.5 left-1.5 flex size-5 items-center justify-center rounded-full bg-black/60 text-white text-[10px] font-bold">{index + 1}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
