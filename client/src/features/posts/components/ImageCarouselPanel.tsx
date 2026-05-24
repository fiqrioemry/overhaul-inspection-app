// src/features/posts/components/ImageCarouselPanel.tsx
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { RATIO_OPTIONS } from "@/constants/posts.constant";
import { useState, useRef, useCallback, useEffect } from "react";
import type { AspectRatio, CropState } from "@/constants/posts.constant";
import type { PreviewItem } from "@/features/posts/components/ImageUploadStep";
import { clampOffset, getCenteredOffset, getImageCoverSize, toCropData } from "@/utils/formatImage";

export interface PerImageCrop {
  offset: CropState;
  cropData: { cropX: number; cropY: number; cropW: number; cropH: number };
}

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

interface CropEditorProps {
  previewUrl: string;
  aspectRatio: AspectRatio;
  offset: CropState;
  onOffsetChange: (o: CropState) => void;
  onCropDataChange: (data: { cropX: number; cropY: number; cropW: number; cropH: number }) => void;
}

function CropEditor({ previewUrl, aspectRatio, offset, onOffsetChange, onCropDataChange }: CropEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [naturalSize, setNaturalSize] = useState({ w: 0, h: 0 });
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });

  // Unified drag state for both pointer and touch
  const dragStart = useRef<{ mx: number; my: number; ox: number; oy: number } | null>(null);

  const ratio = RATIO_OPTIONS.find((r) => r.value === aspectRatio)!.ratio;

  const winSize = useCallback(
    (cW: number, cH: number) => {
      let w = cW;
      let h = w / ratio;
      if (h > cH) {
        h = cH;
        w = h * ratio;
      }
      return { w: Math.floor(w), h: Math.floor(h) };
    },
    [ratio],
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setContainerSize({ w: width, h: height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { w: winW, h: winH } = winSize(containerSize.w, containerSize.h);
  const imgFit = naturalSize.w > 0 ? getImageCoverSize(naturalSize.w, naturalSize.h, winW, winH) : { w: 0, h: 0 };
  const canDrag = imgFit.w > winW + 1 || imgFit.h > winH + 1;

  useEffect(() => {
    if (imgFit.w === 0 || winW === 0) return;

    // FIX: When dimensions change (new image load, ratio change, resize),
    // center the image instead of clamping from (0,0) which produces asymmetric crop.
    const centeredOffset = getCenteredOffset(imgFit.w, imgFit.h, winW, winH);

    // Only re-center if the current offset is at the default (0,0) sentinel —
    // otherwise honour the user's existing drag position, just re-clamp it.
    const isDefaultOffset = offset.x === 0 && offset.y === 0;
    const newOffset = isDefaultOffset ? centeredOffset : clampOffset(offset, imgFit.w, imgFit.h, winW, winH);

    if (newOffset.x !== offset.x || newOffset.y !== offset.y) {
      onOffsetChange(newOffset);
    }
    onCropDataChange(toCropData(newOffset, imgFit.w, winW, winH, naturalSize.w, naturalSize.h));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imgFit.w, imgFit.h, winW, winH]);

  // --- Pointer events (mouse & stylus) ---
  function onPointerDown(e: React.PointerEvent) {
    if (!canDrag) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStart.current = { mx: e.clientX, my: e.clientY, ox: offset.x, oy: offset.y };
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragStart.current || imgFit.w === 0) return;
    const raw = {
      x: dragStart.current.ox + (e.clientX - dragStart.current.mx),
      y: dragStart.current.oy + (e.clientY - dragStart.current.my),
    };
    const clamped = clampOffset(raw, imgFit.w, imgFit.h, winW, winH);
    onOffsetChange(clamped);
    onCropDataChange(toCropData(clamped, imgFit.w, winW, winH, naturalSize.w, naturalSize.h));
  }

  function onPointerUp() {
    dragStart.current = null;
  }

  function onTouchStart(e: React.TouchEvent) {
    if (!canDrag) return;
    const t = e.touches[0];
    dragStart.current = { mx: t.clientX, my: t.clientY, ox: offset.x, oy: offset.y };
  }

  function onTouchMove(e: React.TouchEvent) {
    if (!dragStart.current || imgFit.w === 0) return;
    e.preventDefault(); // prevent page scroll while dragging
    const t = e.touches[0];
    const raw = {
      x: dragStart.current.ox + (t.clientX - dragStart.current.mx),
      y: dragStart.current.oy + (t.clientY - dragStart.current.my),
    };
    const clamped = clampOffset(raw, imgFit.w, imgFit.h, winW, winH);
    onOffsetChange(clamped);
    onCropDataChange(toCropData(clamped, imgFit.w, winW, winH, naturalSize.w, naturalSize.h));
  }

  function onTouchEnd() {
    dragStart.current = null;
  }

  return (
    <div ref={containerRef} className="relative w-full h-full flex items-center justify-center bg-black">
      {/* Crop window */}
      <div
        className={cn("relative overflow-hidden  shrink-0", canDrag ? "cursor-grab active:cursor-grabbing" : "cursor-default")}
        style={{ width: winW || "100%", height: winH || "100%" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
      >
        <img
          ref={imgRef}
          src={previewUrl}
          alt=""
          draggable={false}
          onLoad={(e) => {
            const img = e.currentTarget;
            setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
          }}
          style={{
            position: "absolute",
            left: offset.x,
            top: offset.y,
            width: imgFit.w || "100%",
            height: imgFit.h || "100%",
            userSelect: "none",
            touchAction: "none",
            pointerEvents: "none",
          }}
        />

        {/* Rule-of-thirds grid */}
        <div className="pointer-events-none absolute inset-0">
          {[1, 2].map((i) => (
            <div key={`v${i}`} className="absolute top-0 bottom-0 w-px bg-white/20" style={{ left: `${(i / 3) * 100}%` }} />
          ))}
          {[1, 2].map((i) => (
            <div key={`h${i}`} className="absolute left-0 right-0 h-px bg-white/20" style={{ top: `${(i / 3) * 100}%` }} />
          ))}
          {/* Corner brackets */}
          {(["tl", "tr", "bl", "br"] as const).map((pos) => (
            <div key={pos} className={cn("absolute size-5 pointer-events-none", pos.startsWith("t") ? "top-0" : "bottom-0", pos.endsWith("l") ? "left-0" : "right-0")}>
              <div className={cn("absolute bg-white h-0.5 w-4", pos.startsWith("t") ? "top-0" : "bottom-0", pos.endsWith("l") ? "left-0" : "right-0")} />
              <div className={cn("absolute bg-white w-0.5 h-4", pos.startsWith("t") ? "top-0" : "bottom-0", pos.endsWith("l") ? "left-0" : "right-0")} />
            </div>
          ))}
        </div>

        {canDrag && <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-2.5 py-0.5 text-white/70 text-[10px] font-medium whitespace-nowrap">Drag to reposition</div>}
      </div>
    </div>
  );
}

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
  const currentCrop = cropMap.get(safeIndex) ?? {
    // FIX: Use {x:0, y:0} as a sentinel meaning "not yet positioned".
    // CropEditor's useEffect will convert it to the centered offset on first render.
    offset: { x: 0, y: 0 },
    cropData: { cropX: 0, cropY: 0, cropW: 1, cropH: 1 },
  };

  return (
    <div className="w-full h-full flex flex-col bg-black">
      {/* Editor */}
      <div className="relative flex-1 min-h-0">
        <CropEditor
          key={`${safeIndex}-${previews[safeIndex]?.previewUrl}-${aspectRatio}`}
          previewUrl={previews[safeIndex].previewUrl}
          aspectRatio={aspectRatio}
          offset={currentCrop.offset}
          onOffsetChange={(offset) => onCropChange(safeIndex, { ...currentCrop, offset })}
          onCropDataChange={(cropData) => onCropChange(safeIndex, { ...currentCrop, cropData })}
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
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex gap-1.5">
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
