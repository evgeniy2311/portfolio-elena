"use client";

import { useSyncExternalStore } from "react";

/*
 * Состояние браузера для клиентских блоков без setState в эффектах.
 * На сервере и до гидрации: не смонтировано и «движение выключено», поэтому HTML без JS
 * всегда показывает спокойный финальный вид, а движение включается уже в браузере.
 */

const noop = () => () => {};

/** true после гидрации; на сервере false. */
export function useMounted() {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
}

const REDUCED = "(prefers-reduced-motion: reduce)";

function subscribeReduced(callback: () => void) {
  const query = window.matchMedia(REDUCED);
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

/** Можно ли двигать: в браузере и без prefers-reduced-motion. На сервере false. */
export function useMotionAllowed() {
  return useSyncExternalStore(
    subscribeReduced,
    () => !window.matchMedia(REDUCED).matches,
    () => false,
  );
}
