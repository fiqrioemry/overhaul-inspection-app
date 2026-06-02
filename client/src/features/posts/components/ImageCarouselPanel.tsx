// src/features/posts/components/ImageCarouselPanel.tsx
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
import { RATIO_OPTIONS } from "@/constants/posts.constant";
import { useState, useRef, useEffect } from "react";
import type { AspectRatio, CropState } from "@/constants/posts.constant";
import type { PreviewItem } from "@/features/posts/components/ImageUploadStep";
import { getImageCoverSize, clampOffset, getCenteredOffset, toCropData } from "@/utils/formatImage";

export interface PerImageCrop {
  offset: CropState;
  scale: number;
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

// ─── Pure math helper ─────────────────────────────────────────────────────────

/**
 * Computes the largest integer-pixel window that fits the given aspect ratio
 * inside the container. Integer pixels give predictable CSS overflow clipping.
 */
function getWinSize(containerW: number, containerH: number, ratio: number) {
  let w = containerW;
  let h = w / ratio;
  if (h > containerH) {
    h = containerH;
    w = h * ratio;
  }
  return { w: Math.floor(w), h: Math.floor(h) };
}

// ─── CropEditor ───────────────────────────────────────────────────────────────

interface CropEditorProps {
  previewUrl: string;
  aspectRatio: AspectRatio;
  /** null = "not yet initialised for this image" */
  crop: PerImageCrop | null;
  onChange: (crop: PerImageCrop) => void;
}

function CropEditor({ previewUrl, aspectRatio, crop, onChange }: CropEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [natSize, setNatSize] = useState({ w: 0, h: 0 });
  const [conSize, setConSize] = useState({ w: 0, h: 0 });
  // Both zoom and offset are fully local — no parent round-trip needed for display
  // or for the geometry effect to read. onChange is fire-and-forget sync to parent.
  const [zoom, setZoom] = useState(() => crop?.scale ?? 1);
  const [offset, setOffset] = useState<CropState>(() => crop?.offset ?? { x: 0, y: 0 });
  const dragRef = useRef<{ mx: number; my: number; ox: number; oy: number } | null>(null);
  const prevImgRef = useRef({ w: 0, h: 0 });
  // offsetRef mirrors local offset state but is readable inside effects without
  // adding offset to their dependency array (which would cause infinite loops).
  const offsetRef = useRef<CropState>(offset);

  const ratio = RATIO_OPTIONS.find((r) => r.value === aspectRatio)!.ratio;
  const { w: winW, h: winH } = conSize.w ? getWinSize(conSize.w, conSize.h, ratio) : { w: 0, h: 0 };
  const img = natSize.w ? getImageCoverSize(natSize.w, natSize.h, winW, winH, zoom) : { w: 0, h: 0 };
  const canDrag = img.w > winW + 0.5 || img.h > winH + 0.5;

  function applyOffset(newOffset: CropState, imgW: number, imgH: number) {
    offsetRef.current = newOffset;
    setOffset(newOffset);
    onChange({ offset: newOffset, scale: zoom, cropData: toCropData(newOffset, imgW, imgH, winW, winH) });
  }

  // Observe container
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      setConSize({ w: e.contentRect.width, h: e.contentRect.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Fires when the image footprint changes (zoom, window resize, image load).
  // Reads offsetRef — always current — and re-anchors from the window centre.
  useEffect(() => {
    if (!img.w || !winW) return;

    const prev = prevImgRef.current;
    prevImgRef.current = { w: img.w, h: img.h };

    if (prev.w === 0) {
      // First valid geometry: restore saved position or centre fresh
      const base = offsetRef.current;
      const newOffset = crop ? clampOffset(base, img.w, img.h, winW, winH) : getCenteredOffset(img.w, img.h, winW, winH);
      applyOffset(newOffset, img.w, img.h);
      return;
    }

    if (prev.w === img.w && prev.h === img.h) return;

    // Anchor-from-centre: keep the same image point at the window centre
    const cx = winW / 2;
    const cy = winH / 2;
    const cur = offsetRef.current;
    const raw = {
      x: cx - (cx - cur.x) * (img.w / prev.w),
      y: cy - (cy - cur.y) * (img.h / prev.h),
    };
    applyOffset(clampOffset(raw, img.w, img.h, winW, winH), img.w, img.h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [img.w, img.h, winW, winH]);

  // ── Drag (pointer) ──
  function onPointerDown(e: React.PointerEvent) {
    if (!canDrag) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { mx: e.clientX, my: e.clientY, ox: offset.x, oy: offset.y };
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!dragRef.current || !img.w) return;
    const raw = { x: dragRef.current.ox + e.clientX - dragRef.current.mx, y: dragRef.current.oy + e.clientY - dragRef.current.my };
    applyOffset(clampOffset(raw, img.w, img.h, winW, winH), img.w, img.h);
  }
  function onPointerUp() {
    dragRef.current = null;
  }

  // ── Drag (touch) ──
  function onTouchStart(e: React.TouchEvent) {
    if (!canDrag) return;
    const t = e.touches[0];
    dragRef.current = { mx: t.clientX, my: t.clientY, ox: offset.x, oy: offset.y };
  }
  function onTouchMove(e: React.TouchEvent) {
    if (!dragRef.current || !img.w) return;
    e.preventDefault();
    const t = e.touches[0];
    const raw = { x: dragRef.current.ox + t.clientX - dragRef.current.mx, y: dragRef.current.oy + t.clientY - dragRef.current.my };
    applyOffset(clampOffset(raw, img.w, img.h, winW, winH), img.w, img.h);
  }
  function onTouchEnd() {
    dragRef.current = null;
  }

  // ── Zoom: only update local scale; geometry effect re-anchors from offsetRef ──
  function applyZoom(rawZoom: number) {
    const newZoom = Math.min(MAX_SCALE, Math.max(MIN_SCALE, Math.round(rawZoom * 100) / 100));
    if (newZoom !== zoom) setZoom(newZoom);
  }

  const displayOffset = offset;

  return (
    <div ref={containerRef} className="relative w-full h-full flex items-center justify-center bg-black">
      {/* Crop window */}
      <div
        className={cn("relative overflow-hidden shrink-0", canDrag ? "cursor-grab active:cursor-grabbing" : "cursor-default")}
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
          src={previewUrl}
          alt=""
          draggable={false}
          onLoad={(e) => setNatSize({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
          style={{
            position: "absolute",
            left: displayOffset.x,
            top: displayOffset.y,
            width: img.w || "100%",
            height: img.h || "100%",
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
          {(["tl", "tr", "bl", "br"] as const).map((pos) => (
            <div key={pos} className={cn("absolute size-5 pointer-events-none", pos.startsWith("t") ? "top-0" : "bottom-0", pos.endsWith("l") ? "left-0" : "right-0")}>
              <div className={cn("absolute bg-white h-0.5 w-4", pos.startsWith("t") ? "top-0" : "bottom-0", pos.endsWith("l") ? "left-0" : "right-0")} />
              <div className={cn("absolute bg-white w-0.5 h-4", pos.startsWith("t") ? "top-0" : "bottom-0", pos.endsWith("l") ? "left-0" : "right-0")} />
            </div>
          ))}
        </div>

        {canDrag && <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-2.5 py-0.5 text-white/70 text-[10px] font-medium whitespace-nowrap">Drag to reposition</div>}
      </div>

      {/* Zoom controls */}
      <div className="absolute bottom-3 right-3 z-10 flex items-center gap-1.5 rounded-full bg-black/60 px-2 py-1.5">
        <button
          type="button"
          onClick={() => applyZoom(zoom - 0.1)}
          disabled={zoom <= MIN_SCALE}
          className="flex size-6 items-center justify-center rounded-full text-white hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ZoomOut className="size-3.5" />
        </button>
        <input type="range" min={MIN_SCALE} max={MAX_SCALE} step={0.01} value={zoom} onChange={(e) => applyZoom(Number(e.target.value))} className="w-20 accent-white cursor-pointer" />
        <button
          type="button"
          onClick={() => applyZoom(zoom + 0.1)}
          disabled={zoom >= MAX_SCALE}
          className="flex size-6 items-center justify-center rounded-full text-white hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ZoomIn className="size-3.5" />
        </button>
        <span className="w-8 text-center text-[10px] font-medium text-white/70 tabular-nums">{Math.round(zoom * 100)}%</span>
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

  // Pass null when this image has never been initialised — CropEditor will centre it.
  const currentCrop = cropMap.get(safeIndex) ?? null;

  return (
    <div className="w-full h-full flex flex-col bg-black">
      <div className="relative flex-1 min-h-0">
        <CropEditor key={`${safeIndex}-${previews[safeIndex]?.previewUrl}-${aspectRatio}`} previewUrl={previews[safeIndex].previewUrl} aspectRatio={aspectRatio} crop={currentCrop} onChange={(crop) => onCropChange(safeIndex, crop)} />

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
