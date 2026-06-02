// src/utils/formatImage.ts
import type { CropState } from "@/constants/posts.constant";

/**
 * Returns the cover-fit dimensions of an image inside a window at a given zoom level.
 * Uses exact floats — no rounding — so zoom operations are perfectly reversible.
 */
export function getImageCoverSize(
  naturalW: number,
  naturalH: number,
  winW: number,
  winH: number,
  zoom = 1,
): { w: number; h: number } {
  const scale = Math.max(winW / naturalW, winH / naturalH) * zoom;
  return { w: naturalW * scale, h: naturalH * scale };
}

/**
 * Clamps an offset so the image fully covers the window (no empty edges).
 */
export function clampOffset(
  offset: CropState,
  imgW: number,
  imgH: number,
  winW: number,
  winH: number,
): CropState {
  return {
    x: Math.max(winW - imgW, Math.min(0, offset.x)),
    y: Math.max(winH - imgH, Math.min(0, offset.y)),
  };
}

/**
 * Returns the offset to center an image in a window.
 * Uses exact floats — no rounding — so the center is pixel-accurate.
 */
export function getCenteredOffset(imgW: number, imgH: number, winW: number, winH: number): CropState {
  return {
    x: (winW - imgW) / 2,
    y: (winH - imgH) / 2,
  };
}

/**
 * Returns normalized [0, 1] crop coordinates from an image offset and display dimensions.
 */
export function toCropData(
  offset: CropState,
  imgW: number,
  imgH: number,
  winW: number,
  winH: number,
): { cropX: number; cropY: number; cropW: number; cropH: number } {
  if (imgW === 0 || imgH === 0) return { cropX: 0, cropY: 0, cropW: 1, cropH: 1 };
  return {
    cropX: -offset.x / imgW,
    cropY: -offset.y / imgH,
    cropW: winW / imgW,
    cropH: winH / imgH,
  };
}
