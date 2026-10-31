import { expect, type Page } from "@playwright/test";

/*
 * Помощники для сцен движка (components/scroll-fx.tsx): прокрутка к точке фактического sticky-хода,
 * чтение CSS-переменных и учёт кадров/слушателей страницы.
 */

export const isPinViewport = (page: Page) => {
  const size = page.viewportSize();
  return (size?.width ?? 0) >= 1024 && (size?.height ?? 0) >= 600;
};

export async function settle(page: Page) {
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
}

export function readVar(page: Page, selector: string, name: string) {
  return page.locator(selector).first().evaluate((element, property) => getComputedStyle(element).getPropertyValue(property).trim(), name);
}

/** Геометрия «липкой» сцены: где слой прилипает (start) и где отлипает (end), в координатах прокрутки. */
export async function pinGeometry(page: Page, selector: string) {
  return page.locator(selector).first().evaluate((section) => {
    const stage =
      section.querySelector<HTMLElement>("[data-stage]") ??
      (Array.from(section.children) as HTMLElement[]).find((child) => getComputedStyle(child).position === "sticky") ??
      null;
    const rect = section.getBoundingClientRect();
    const top = rect.top + window.scrollY;
    const stageTop = stage ? parseFloat(getComputedStyle(stage).top) || 0 : 0;
    const stageHeight = stage ? stage.getBoundingClientRect().height : window.innerHeight;
    return { start: top - stageTop, end: top - stageTop + rect.height - stageHeight, sticky: Boolean(stage) };
  });
}

/** Прокручивает к прогрессу sticky-хода и ждёт, пока сглаженное --p догонит. */
export async function scrollToPin(page: Page, selector: string, progress: number) {
  const { start, end } = await pinGeometry(page, selector);
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), start + (end - start) * progress);
  await expect.poll(async () => Number(await readVar(page, selector, "--p")), { timeout: 5000 }).toBeCloseTo(progress, 2);
}

/**
 * Ставит до загрузки страницы счётчики: активные слушатели scroll/resize/visibilitychange
 * и вызовы requestAnimationFrame. Нужен для проверок «нет второго ticker/listener».
 */
export async function instrument(page: Page) {
  await page.addInitScript(() => {
    // Учитываются только действительно зарегистрированные пары «тип + обработчик», как это делает браузер.
    const registered = new Map<string, Set<unknown>>();
    const counts: Record<string, number> = {};
    const watched = ["scroll", "resize", "visibilitychange"];
    const track = (target: EventTarget, label: string) => {
      const add = target.addEventListener.bind(target);
      const remove = target.removeEventListener.bind(target);
      target.addEventListener = (type: string, listener: EventListenerOrEventListenerObject | null, options?: boolean | AddEventListenerOptions) => {
        if (watched.includes(type) && listener) {
          const key = `${label}:${type}`;
          const set = registered.get(key) ?? new Set();
          set.add(listener);
          registered.set(key, set);
          counts[key] = set.size;
        }
        return add(type, listener, options);
      };
      target.removeEventListener = (type: string, listener: EventListenerOrEventListenerObject | null, options?: boolean | EventListenerOptions) => {
        if (watched.includes(type) && listener) {
          const key = `${label}:${type}`;
          const set = registered.get(key);
          set?.delete(listener);
          counts[key] = set?.size ?? 0;
        }
        return remove(type, listener, options);
      };
    };
    track(window, "window");
    track(document, "document");
    let frames = 0;
    const raf = window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = (callback: FrameRequestCallback) => {
      frames += 1;
      return raf(callback);
    };
    Object.assign(window, { __fxCounts: counts, __fxFrames: () => frames });
  });
}

export function listenerCounts(page: Page) {
  return page.evaluate(() => ({ ...(window as unknown as { __fxCounts: Record<string, number> }).__fxCounts }));
}

/** Сколько раз за интервал страница просила кадр. */
export async function framesDuring(page: Page, ms: number) {
  return page.evaluate(async (wait) => {
    const read = (window as unknown as { __fxFrames: () => number }).__fxFrames;
    const before = read();
    await new Promise((resolve) => setTimeout(resolve, wait));
    return read() - before;
  }, ms);
}
