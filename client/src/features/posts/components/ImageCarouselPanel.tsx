// src/features/posts/components/ImageCarouselPanel.tsx
import ReactCrop, { centerCrop, makeAspectCrop, type Crop, type PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
import { RATIO_OPTIONS } from "@/constants/posts.constant";
import { useState, useRef, useCallback } from "react";
import type { AspectRatio } from "@/constants/posts.constant";
import type { PreviewItem } from "@/features/posts/components/ImageUploadStep";

export interface PerImageCrop {
  scale: number;
  percentCrop: Crop;
  cropData: { cropX: number; cropY: number; cropW: number; cropH: number };
}

const MIN_SCALE = 1;
const MAX_SCALE = 3;

const RATIO_ICONS: Record<AspectRatio, React.ReactNode> = {
  "1:1": (
    <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="2" width="12" height="12" rx="1" />
    </svg>
  ),
  "4:5": (
    <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3.5" y="1" width="9" height="14" rx="1" />
    </svg>
  ),
  "1.91:1": (
    <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="1" y="4.5" width="14" height="7" rx="1" />
    </svg>
  ),
  "16:9": (
    <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="1" y="3" width="14" height="10" rx="1" />
    </svg>
  ),
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Largest crop that fits the aspect ratio, centred within the image */
function makeCenteredCrop(imgW: number, imgH: number, aspect: number): Crop {
  return centerCrop(makeAspectCrop({ unit: "%", width: 100 }, aspect, imgW, imgH), imgW, imgH);
}

/**
 * Build a crop at the given zoom scale, anchored to the current crop centre.
 * Zoom in → smaller crop region → zoomed-in output; zoom out → larger region.
 */
function buildZoomedCrop(
  current: Crop | undefined,
  scale: number,
  imgW: number,
  imgH: number,
  aspect: number,
): Crop {
  // Maximum-fit width % at scale=1 (may be < 100 for portrait images + landscape ratio)
  const maxFit = makeAspectCrop({ unit: "%", width: 100 }, aspect, imgW, imgH);
  const newW = maxFit.width / scale;
  const sized = makeAspectCrop({ unit: "%", width: newW }, aspect, imgW, imgH);
  const newH = sized.height;

  // Anchor to current crop centre so the same image point stays centred
  const base = current ?? makeCenteredCrop(imgW, imgH, aspect);
  const cx = base.x + base.width / 2;
  const cy = base.y + base.height / 2;

  return {
    unit: "%",
    x: Math.max(0, Math.min(100 - newW, cx - newW / 2)),
    y: Math.max(0, Math.min(100 - newH, cy - newH / 2)),
    width: newW,
    height: newH,
  };
}

/** Convert ReactCrop percentage crop → normalized [0, 1] server coordinates */
function toNormalizedCropData(pct: Crop) {
  if (!pct.width || !pct.height) return { cropX: 0, cropY: 0, cropW: 1, cropH: 1 };
  return {
    cropX: pct.x / 100,
    cropY: pct.y / 100,
    cropW: pct.width / 100,
    cropH: pct.height / 100,
  };
}

// ─── CropEditor ───────────────────────────────────────────────────────────────

interface CropEditorProps {
  previewUrl: string;
  aspectRatio: AspectRatio;
  savedCrop: PerImageCrop | null;
  onChange: (crop: PerImageCrop) => void;
}

function CropEditor({ previewUrl, aspectRatio, savedCrop, onChange }: CropEditorProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [percentCrop, setPercentCrop] = useState<Crop | undefined>(savedCrop?.percentCrop);
  const [scale, setScale] = useState(() => savedCrop?.scale ?? 1);

  const ratio = RATIO_OPTIONS.find((r) => r.value === aspectRatio)!.ratio;

  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const { width, height } = e.currentTarget;
      // Restore saved crop or build a fresh centred crop at the initial zoom level
      const initial = savedCrop?.percentCrop ?? buildZoomedCrop(undefined, scale, width, height, ratio);
      setPercentCrop(initial);
      onChange({ scale, percentCrop: initial, cropData: toNormalizedCropData(initial) });
    },
    // ratio/savedCrop/scale changes cause CropEditor to remount via key — runs once per mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const onCropChange = useCallback((_px: PixelCrop, pct: Crop) => {
    setPercentCrop(pct);
  }, []);

  const onCropComplete = useCallback(
    (_px: PixelCrop, pct: Crop) => {
      if (!pct.width || !pct.height) return;
      onChange({ scale, percentCrop: pct, cropData: toNormalizedCropData(pct) });
    },
    [scale, onChange],
  );

  function applyZoom(raw: number) {
    if (!imgRef.current) return;
    const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, Math.round(raw * 100) / 100));
    if (newScale === scale) return;
    const { width, height } = imgRef.current;
    const newCrop = buildZoomedCrop(percentCrop, newScale, width, height, ratio);
    setScale(newScale);
    setPercentCrop(newCrop);
    onChange({ scale: newScale, percentCrop: newCrop, cropData: toNormalizedCropData(newCrop) });
  }

  return (
    <div className="w-full h-full flex flex-col bg-black">
      {/* Image + crop area */}
      <div className="flex-1 min-h-0 flex items-center justify-center overflow-hidden p-3">
        <ReactCrop crop={percentCrop} onChange={onCropChange} onComplete={onCropComplete} aspect={ratio} className="max-w-full">
          <img
            ref={imgRef}
            src={previewUrl}
            alt=""
            onLoad={onImageLoad}
            draggable={false}
            style={{ display: "block", maxHeight: "55vh", maxWidth: "100%" }}
          />
        </ReactCrop>
      </div>

      {/* Zoom controls */}
      <div className="flex items-center justify-center gap-1.5 px-4 py-2 border-t border-white/10 shrink-0">
        <button
          type="button"
          onClick={() => applyZoom(scale - 0.1)}
          disabled={scale <= MIN_SCALE}
          className="flex size-6 items-center justify-center rounded-full text-white hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ZoomOut className="size-3.5" />
        </button>
        <input
          type="range"
          min={MIN_SCALE}
          max={MAX_SCALE}
          step={0.01}
          value={scale}
          onChange={(e) => applyZoom(Number(e.target.value))}
          className="w-24 accent-white cursor-pointer"
        />
        <button
          type="button"
          onClick={() => applyZoom(scale + 0.1)}
          disabled={scale >= MAX_SCALE}
          className="flex size-6 items-center justify-center rounded-full text-white hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ZoomIn className="size-3.5" />
        </button>
        <span className="w-8 text-center text-[10px] font-medium text-white/70 tabular-nums">{Math.round(scale * 100)}%</span>
      </div>
    </div>
  );
}

// ─── ImageCarouselPanel ───────────────────────────────────────────────────────

interface ImageCarouselPanelProps {
  previews: PreviewItem[];
  aspectRatio: AspectRatio;
  onAspectRatioChange: (ratio: AspectRatio) => void;
  cropMap: Map<number, PerImageCrop>;
  onCropChange: (index: number, crop: PerImageCrop) => void;
}

export function ImageCarouselPanel({ previews, aspectRatio, onAspectRatioChange, cropMap, onCropChange }: ImageCarouselPanelProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const safeIndex = Math.min(activeIndex, previews.length - 1);
  const savedCrop = cropMap.get(safeIndex) ?? null;

  return (
    <div className="w-full h-full flex flex-col bg-black">
      <div className="relative flex-1 min-h-0">
        <CropEditor
          key={`${safeIndex}-${previews[safeIndex]?.previewUrl}-${aspectRatio}`}
          previewUrl={previews[safeIndex].previewUrl}
          aspectRatio={aspectRatio}
          savedCrop={savedCrop}
          onChange={(crop) => onCropChange(safeIndex, crop)}
        />

        {safeIndex > 0 && (
          <button
            type="button"
            onClick={() => setActiveIndex((i) => Math.max(0, i - 1))}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-10 flex size-8 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
          >
            <ChevronLeft className="size-4" />
          </button>
        )}
        {safeIndex < previews.length - 1 && (
          <button
            type="button"
            onClick={() => setActiveIndex((i) => Math.min(previews.length - 1, i + 1))}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 flex size-8 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
          >
            <ChevronRight className="size-4" />
          </button>
        )}

        {previews.length > 1 && (
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-10 flex gap-1.5">
            {previews.map((_, i) => (
              <button key={i} type="button" onClick={() => setActiveIndex(i)} className={cn("size-1.5 rounded-full transition-all", i === safeIndex ? "bg-white scale-125" : "bg-white/50 hover:bg-white/75")} />
            ))}
          </div>
        )}

        <div className="absolute top-3 right-3 z-10 px-2 py-0.5 rounded-full bg-black/50 text-white text-xs font-medium">
          {safeIndex + 1} / {previews.length}
        </div>
      </div>

      {/* Aspect ratio toolbar */}
      <div className="flex items-center justify-center gap-1 px-4 py-2.5 border-t border-white/10 shrink-0">
        {RATIO_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onAspectRatioChange(opt.value)}
            className={cn("flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all", aspectRatio === opt.value ? "bg-white text-black" : "text-white/60 hover:text-white hover:bg-white/10")}
          >
            {RATIO_ICONS[opt.value]}
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
