/*
 * Чистая математика движка прокрутки (components/scroll-fx.tsx). Без DOM: её проверяют тесты.
 */

/** Сглаживание за кадр при 60 fps; на других частотах пересчитывается по dt. */
export const SMOOTHING = 0.14;
/** Ближе этого к цели значение сразу встаёт в цель, и сглаживание останавливается. */
export const SETTLE = 0.0005;
const FRAME_MS = 1000 / 60;

export function clamp01(value: number) {
  if (!Number.isFinite(value)) return 0;
  return value < 0 ? 0 : value > 1 ? 1 : value;
}

/** Один шаг сглаживания с поправкой на длительность кадра: 30, 60 и 120 fps дают одинаковую скорость. */
export function smoothStep(current: number, target: number, dt: number) {
  if (!Number.isFinite(current)) return target;
  const frames = Math.max(0, dt) / FRAME_MS;
  const alpha = 1 - Math.pow(1 - SMOOTHING, frames);
  const next = current + (target - current) * alpha;
  return Math.abs(target - next) < SETTLE ? target : next;
}

/**
 * Прогресс «липкой» сцены по фактическому ходу sticky-слоя: 0 — слой только прилип (верх секции
 * дошёл до его top, обычно высоты шапки), 1 — слой отлипает (низ секции дошёл до низа слоя).
 */
export function pinProgress(sectionTop: number, sectionHeight: number, stageTop: number, stageHeight: number) {
  const travel = sectionHeight - stageHeight;
  if (!(travel > 0)) return sectionTop <= stageTop ? 1 : 0;
  return clamp01((stageTop - sectionTop) / travel);
}

/** Прогресс элемента от появления снизу экрана до ухода вверх. */
export function viewProgress(top: number, height: number, viewport: number) {
  const total = viewport + height;
  return total > 0 ? clamp01((viewport - top) / total) : 0;
}

/** Номер сегмента k (0..count-1) и прогресс t внутри него. Пустой набор даёт 0/0, без NaN. */
export function segmentOf(progress: number, count: number) {
  const n = Number.isFinite(count) ? Math.floor(count) : 0;
  if (n < 1) return { k: 0, t: 0 };
  const scaled = clamp01(progress) * n;
  const k = Math.min(n - 1, Math.floor(scaled));
  return { k, t: clamp01(scaled - k) };
}

/** Прогресс панели горизонтальной ленты: 0 — левый край у правого края окна, 1 — у левого. */
export function panelProgress(left: number, viewportWidth: number) {
  return viewportWidth > 0 ? clamp01((viewportWidth - left) / viewportWidth) : 0;
}
