import type { CropState } from "@/constants/posts.constant";

export function getImageCoverSize(naturalW: number, naturalH: number, winW: number, winH: number) {
  const scale = Math.max(winW / naturalW, winH / naturalH);
  return { w: naturalW * scale, h: naturalH * scale };
}

export function clampOffset(offset: CropState, imgW: number, imgH: number, winW: number, winH: number): CropState {
  return {
    x: Math.max(winW - imgW, Math.min(0, offset.x)),
    y: Math.max(winH - imgH, Math.min(0, offset.y)),
  };
}

export function getCenteredOffset(imgW: number, imgH: number, winW: number, winH: number): CropState {
  return {
    x: (winW - imgW) / 2,
    y: (winH - imgH) / 2,
  };
}

export function toCropData(offset: CropState, imgW: number, winW: number, winH: number, naturalW: number, naturalH: number) {
  const scale = imgW / naturalW;
  return {
    cropX: -offset.x / scale / naturalW,
    cropY: -offset.y / scale / naturalH,
    cropW: winW / scale / naturalW,
    cropH: winH / scale / naturalH,
  };
}
