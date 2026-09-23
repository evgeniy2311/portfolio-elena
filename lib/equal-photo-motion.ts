export type EqualPhotoBand = {
  index: number;
  startPx: number;
  completePx: number;
  start: number;
  complete: number;
};

export type EqualPhotoTiming = {
  photoStepPx: number;
  revealPx: number;
  introPx: number;
  finalHoldPx: number;
  totalTravelPx: number;
  bands: EqualPhotoBand[];
};

export const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

export const smoothstep = (value: number, start: number, end: number) => {
  const t = clamp01((value - start) / Math.max(0.0001, end - start));
  return t * t * (3 - 2 * t);
};

export function photoStepForViewport(viewportHeight: number) {
  return Math.round(Math.min(840, Math.max(600, viewportHeight * 0.9)));
}

export function createEqualPhotoBands({
  frameCount,
  photoStepPx,
  revealPx = Math.round(photoStepPx * 0.4),
  finalHoldPx = Math.round(photoStepPx * 0.65),
}: {
  frameCount: number;
  photoStepPx: number;
  revealPx?: number;
  finalHoldPx?: number;
}): EqualPhotoTiming {
  if (!Number.isInteger(frameCount) || frameCount < 1) throw new Error("frameCount must be a positive integer");
  if (photoStepPx <= 0 || revealPx <= 0 || revealPx >= photoStepPx || finalHoldPx < 0) {
    throw new Error("Equal-photo timing requires 0 < revealPx < photoStepPx and finalHoldPx >= 0");
  }

  const totalTravelPx = photoStepPx * Math.max(0, frameCount - 1) + finalHoldPx;
  const denominator = Math.max(1, totalTravelPx);
  const bands = Array.from({ length: frameCount }, (_, index) => {
    const completePx = index * photoStepPx;
    const startPx = index === 0 ? 0 : completePx - revealPx;
    return {
      index,
      startPx,
      completePx,
      start: startPx / denominator,
      complete: completePx / denominator,
    };
  });

  return {
    photoStepPx,
    revealPx,
    introPx: Math.max(0, photoStepPx - revealPx),
    finalHoldPx,
    totalTravelPx,
    bands,
  };
}
