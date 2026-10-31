/*
 * Один общий requestAnimationFrame на всю страницу. Подписчики (сглаживание прокрутки, стена работ,
 * лента категорий) получают dt и время кадра. Кадры не идут, когда подписчиков нет, вкладка скрыта
 * или включён prefers-reduced-motion: так останавливаются все циклы сразу.
 */

export type TickerCallback = (dt: number, now: number) => void;

const subscribers = new Set<TickerCallback>();
let frame = 0;
let last = 0;
let reducedQuery: MediaQueryList | null = null;

function canRun() {
  return subscribers.size > 0 && !document.hidden && !reducedQuery?.matches;
}

function loop(now: number) {
  frame = 0;
  // Длинная пауза (вкладка была скрыта, отладчик) не превращается в рывок: dt не больше 100 мс.
  const dt = last ? Math.min(now - last, 100) : 1000 / 60;
  last = now;
  for (const callback of Array.from(subscribers)) {
    try {
      callback(dt, now);
    } catch (error) {
      subscribers.delete(callback);
      console.error("ticker: подписчик отключён после ошибки", error);
    }
  }
  schedule();
}

function stop() {
  if (frame) window.cancelAnimationFrame(frame);
  frame = 0;
  last = 0;
}

function schedule() {
  if (!canRun()) return stop();
  if (!frame) frame = window.requestAnimationFrame(loop);
}

function bind() {
  if (reducedQuery) return;
  reducedQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  document.addEventListener("visibilitychange", schedule);
  reducedQuery.addEventListener("change", schedule);
}

function unbind() {
  if (!reducedQuery) return;
  document.removeEventListener("visibilitychange", schedule);
  reducedQuery.removeEventListener("change", schedule);
  reducedQuery = null;
}

/** Подписка на общий кадр. Возвращает отписку; повторный вызов отписки ничего не делает. */
export function subscribeTicker(callback: TickerCallback) {
  subscribers.add(callback);
  bind();
  schedule();
  let active = true;
  return () => {
    if (!active) return;
    active = false;
    subscribers.delete(callback);
    if (subscribers.size === 0) {
      stop();
      unbind();
    }
  };
}

/**
 * Подписка, которая получает кадры только пока элемент на экране (IntersectionObserver).
 * Возвращает очистку: снимает и подписку, и наблюдатель.
 */
export function subscribeWhileVisible(element: Element, callback: TickerCallback, rootMargin = "0px") {
  let unsubscribe: (() => void) | null = null;
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry?.isIntersecting && !unsubscribe) unsubscribe = subscribeTicker(callback);
      if (entry && !entry.isIntersecting && unsubscribe) {
        unsubscribe();
        unsubscribe = null;
      }
    },
    { rootMargin },
  );
  observer.observe(element);
  return () => {
    observer.disconnect();
    unsubscribe?.();
    unsubscribe = null;
  };
}

/** Состояние для проверок: число подписчиков и идёт ли цикл. */
export function tickerState() {
  return { subscribers: subscribers.size, running: frame !== 0 };
}
