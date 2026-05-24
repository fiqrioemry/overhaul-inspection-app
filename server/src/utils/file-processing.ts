// src/utils/file-processing.ts
import sharp from "sharp";

export type AspectRatio = "1:1" | "4:5" | "1.91:1" | "16:9";

export interface CropRect {
  cropX: number;
  cropY: number;
  cropW: number;
  cropH: number;
}

const RATIO_DIMENSIONS: Record<AspectRatio, { width: number; height: number }> = {
  "1:1": { width: 1080, height: 1080 },
  "4:5": { width: 1080, height: 1350 },
  "1.91:1": { width: 1080, height: 566 },
  "16:9": { width: 1920, height: 1080 },
};

export async function processImage(file: File, aspectRatio: AspectRatio = "1:1", cropRect?: CropRect): Promise<Buffer> {
  const arrayBuffer = await file.arrayBuffer();
  const inputBuffer = Buffer.from(arrayBuffer);
  const { width: outW, height: outH } = RATIO_DIMENSIONS[aspectRatio];

  // Baca metadata dulu untuk dapat natural dimensions
  const meta = await sharp(inputBuffer).rotate().metadata();
  const natW = meta.width ?? 0;
  const natH = meta.height ?? 0;

  let pipeline = sharp(inputBuffer).rotate();

  const isFullFrame = !cropRect || (cropRect.cropX === 0 && cropRect.cropY === 0 && cropRect.cropW === 1 && cropRect.cropH === 1);

  if (!isFullFrame && natW > 0 && natH > 0) {
    const left = Math.round(cropRect.cropX * natW);
    const top = Math.round(cropRect.cropY * natH);
    const width = Math.round(cropRect.cropW * natW);
    const height = Math.round(cropRect.cropH * natH);

    if (width > 0 && height > 0 && left >= 0 && top >= 0) {
      pipeline = pipeline.extract({ left, top, width, height });
    }
  }

  const processed = await pipeline
    .resize({
      width: outW,
      height: outH,
      fit: isFullFrame ? "cover" : "fill",
      position: "center",
    })
    .webp({ quality: 85 })
    .toBuffer();

  return processed;
}

export async function processFile(file: File, _type: string): Promise<Buffer> {
  const arrayBuffer = await file.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
