/*
 * Чистая математика ленты «Silk Ribbon» (ribbon.tsx). Без DOM: её проверяет tests/ribbon.spec.ts.
 */

const FRAME_MS = 1000 / 60;

/** Скорость дрейфа, px/s (минус — влево). */
export const IDLE_SPEED = -40;
/** Сглаживание скорости при наведении и уходе курсора, за кадр при 60 fps. */
export const HOVER_LERP = 0.08;
/** Затухание инерции после броска, за кадр при 60 fps. */
export const FRICTION = 0.95;
/** Окно, по которому считается скорость броска, мс. */
export const VELOCITY_WINDOW = 80;
/** Порог, после которого жест считается горизонтальным или вертикальным, px. */
export const AXIS_LOCK = 8;
/** Перетаскивание длиннее этого отменяет клик по плитке, px. */
export const CLICK_SLOP = 6;
/** Наибольший наклон плиток от скорости, градусы. */
export const MAX_SKEW = 5;

/** Положение по модулю ширины одной копии, в диапазоне [-width, 0). Без ширины — 0 (нет NaN). */
export function wrap(x: number, width: number) {
  if (!(width > 0) || !Number.isFinite(x)) return 0;
  const r = x % width;
  return r >= 0 ? r - width : r;
}

/** Экспоненциальное приближение к цели с поправкой на длительность кадра. */
export function approach(current: number, target: number, factor: number, dt: number) {
  const alpha = 1 - Math.pow(1 - factor, Math.max(0, dt) / FRAME_MS);
  return current + (target - current) * alpha;
}

/** Затухание инерции: v · 0.95^(dt/16.7), одинаково на 30, 60 и 120 fps. */
export function decay(velocity: number, dt: number) {
  return velocity * Math.pow(FRICTION, Math.max(0, dt) / FRAME_MS);
}

/** Скорость броска (px/s) по точкам за последние 80 мс. Меньше двух точек — 0. */
export function releaseVelocity(samples: { t: number; x: number }[], now: number) {
  const recent = samples.filter((sample) => now - sample.t <= VELOCITY_WINDOW);
  if (recent.length < 2) return 0;
  const first = recent[0];
  const last = recent[recent.length - 1];
  const span = last.t - first.t;
  return span > 0 ? ((last.x - first.x) / span) * 1000 : 0;
}

/** Наклон skewX от скорости: ±5° при 1000 px/s и больше. */
export function skewFor(velocity: number) {
  if (!Number.isFinite(velocity)) return 0;
  return Math.max(-MAX_SKEW, Math.min(MAX_SKEW, (-velocity / 1000) * MAX_SKEW));
}

/**
 * Сколько копий набора нужно, чтобы лента без зазора закрывала окно при любом сдвиге.
 * 0 плиток — 0 копий; одна плитка — одна копия без цикла; иначе не меньше двух.
 */
export function copiesFor(count: number, copyWidth: number, viewport: number) {
  if (!(count > 0)) return 0;
  if (count === 1) return 1;
  if (!(copyWidth > 0) || !(viewport > 0)) return 2;
  return Math.max(2, Math.ceil(viewport / copyWidth) + 1);
}

/** Движется ли лента сама: нужен хотя бы два элемента, иначе ни цикла, ни инерции. */
export function canLoop(count: number) {
  return count > 1;
}

/** Номер плитки, ближайшей к центру окна (по всем копиям), или -1 для пустой ленты. */
export function nearestToCenter(x: number, step: number, total: number, leading: number, viewport: number) {
  if (!(total > 0) || !(step > 0)) return -1;
  const raw = Math.round((viewport / 2 - leading - x - step / 2) / step);
  return Math.max(0, Math.min(total - 1, raw));
}
