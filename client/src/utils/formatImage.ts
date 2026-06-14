// src/utils/formatImage.ts

/**
 * Returns the cover-fit dimensions of an image inside a window at a given zoom level.
 * Uses exact floats — no rounding — so zoom operations are perfectly reversible.
 */
export function getImageCoverSize(naturalW: number, naturalH: number, winW: number, winH: number, zoom = 1): { w: number; h: number } {
  const scale = Math.max(winW / naturalW, winH / naturalH) * zoom;
  return { w: naturalW * scale, h: naturalH * scale };
}
