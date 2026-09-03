// src/components/fields/ImageCropDialog.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import ReactCrop, { centerCrop, makeAspectCrop } from "react-image-crop";
import type { Crop, PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ImageCropDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The raw file just picked from disk. The dialog reads it, it never uploads anything itself. */
  file: File | null;
  /** width / height of the crop selection. Defaults to a square, matching avatar/logo display. */
  aspect?: number;
  /** Shows the crop selection as a circle guide; the exported image itself is still a rectangle. */
  circularCrop?: boolean;
  /** Called with the cropped image, re-encoded as a File with the original name and type. */
  onConfirm: (file: File) => void;
}

// Only these two are ever accepted by the avatar/logo inputs this dialog is used from; anything
// else falls back to PNG so canvas re-encoding never silently produces an unsupported type.
const OUTPUT_TYPES = new Set(["image/jpeg", "image/png"]);

function centeredCrop(width: number, height: number, aspect: number): Crop {
  return centerCrop(makeAspectCrop({ unit: "%", width: 90 }, aspect, width, height), width, height);
}

function getCroppedFile(image: HTMLImageElement, crop: PixelCrop, fileName: string, mimeType: string): Promise<File> {
  // crop.x/y/width/height are in on-screen pixels (relative to the rendered <img>); scale them up
  // to the source image's natural resolution so the export isn't limited to display size.
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(crop.width * scaleX));
  canvas.height = Math.max(1, Math.round(crop.height * scaleY));

  const ctx = canvas.getContext("2d");
  if (!ctx) return Promise.reject(new Error("Canvas is not supported in this browser."));
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(image, crop.x * scaleX, crop.y * scaleY, crop.width * scaleX, crop.height * scaleY, 0, 0, canvas.width, canvas.height);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Failed to export the cropped image."));
          return;
        }
        resolve(new File([blob], fileName, { type: mimeType, lastModified: Date.now() }));
      },
      mimeType,
      0.9,
    );
  });
}

export default function ImageCropDialog({ open, onOpenChange, file, aspect = 1, circularCrop, onConfirm }: ImageCropDialogProps) {
  // Derived straight from `file`, not effect-driven state: object URL creation is synchronous,
  // so there's nothing to synchronize after render — only the revoke on change/unmount is a
  // real effect.
  const imageSrc = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [isExporting, setIsExporting] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    return () => {
      if (imageSrc) URL.revokeObjectURL(imageSrc);
    };
  }, [imageSrc]);

  function handleImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    setCrop(centeredCrop(width, height, aspect));
  }

  function handleReset() {
    if (!imgRef.current) return;
    const { width, height } = imgRef.current;
    setCrop(centeredCrop(width, height, aspect));
  }

  async function handleConfirm() {
    if (!imgRef.current || !completedCrop?.width || !file) return;
    setIsExporting(true);
    try {
      const mimeType = OUTPUT_TYPES.has(file.type) ? file.type : "image/png";
      const cropped = await getCroppedFile(imgRef.current, completedCrop, file.name, mimeType);
      onConfirm(cropped);
      onOpenChange(false);
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="xl:h-auto! xl:w-125!">
        <div className="flex flex-col gap-4 p-4">
          <DialogHeader>
            <DialogTitle>Position Image</DialogTitle>
          </DialogHeader>

          <p className="text-xs text-muted-foreground">Drag to reposition, drag a handle to resize the selection, then apply.</p>

          {imageSrc && (
            <div className="flex items-center justify-center rounded-lg border bg-muted/30 p-3">
              <ReactCrop crop={crop} onChange={(_, percentCrop) => setCrop(percentCrop)} onComplete={(pixelCrop) => setCompletedCrop(pixelCrop)} aspect={aspect} circularCrop={circularCrop} keepSelection minWidth={20} minHeight={20}>
                <img ref={imgRef} src={imageSrc} onLoad={handleImageLoad} className="max-h-[55vh] max-w-full" alt="Selected file to position within the crop frame" />
              </ReactCrop>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="ghost" className="sm:mr-auto" onClick={handleReset} disabled={isExporting}>
              Reset
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isExporting}>
              Cancel
            </Button>
            <Button type="button" onClick={handleConfirm} disabled={!completedCrop?.width || isExporting}>
              {isExporting ? "Applying..." : "Apply"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
