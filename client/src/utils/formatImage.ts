import type { CropState } from "@/constants/posts.constant";

export function toCropData(offset: CropState, imgW: number, winW: number, winH: number, naturalW: number, naturalH: number) {
  const scale = imgW / naturalW;
  return {
    cropX: -offset.x / scale / naturalW,
    cropY: -offset.y / scale / naturalH,
    cropW: winW / scale / naturalW,
    cropH: winH / scale / naturalH,
  };
}
