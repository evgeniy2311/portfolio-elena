import { expect, type Page } from "@playwright/test";
import { works } from "../../lib/works";

/*
 * Общие шаги проверки «рефакторинг без изменения вида».
 * Сцена = прямой потомок <main> (13 блоков главной). Снимки делаются в реальных положениях прокрутки:
 * у «липких» сцен на компьютере — пять точек прогресса --p, у остальных — экран за экраном по всей высоте.
 */

export const scenes = ["hero", "categories", "about", "pains", "services", "rail", "requests", "accuracy", "trial", "process", "prices", "faq", "contact"] as const;

const longestWork = [...works].sort((a, b) => b.frames.length - a.frames.length)[0];
/** Страницы вне главной, на которых стоит общий блок контактов и шапка. */
export const otherRoutes = ["/works", `/works/${longestWork.slug}`, "/works/white-wrap-blouse"];

export const pinProgress = [0, 0.25, 0.5, 0.75, 1];

const isDesktopPin = (page: Page) => {
  const size = page.viewportSize();
  return (size?.width ?? 0) >= 1024 && (size?.height ?? 0) >= 600;
};

export async function settle(page: Page) {
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
}

/** Открывает страницу, дожидается шрифтов, всех картинок и появления всех [data-reveal]. */
export async function prepare(page: Page, path = "/") {
  await page.goto(path);
  // ScrollFx ставит data-cta в эффекте: значит, React уже гидрировал страницу и атрибуты картинок можно трогать.
  await expect(page.locator("html")).toHaveAttribute("data-cta", /show|hide/, { timeout: 30_000 });
  // Поздний замер ленты в ScrollFx (через 600 мс) один раз пишет --page-p даже при reduced motion.
  // Ждём его до пролистывания, чтобы записанное значение не зависело от того, где была прокрутка.
  await page.waitForTimeout(700);
  await page.evaluate(async () => {
    await document.fonts.ready;
    // Картинки в горизонтальных лентах за краем экрана с loading="lazy" не грузятся никогда:
    // для сравнения все кадры загружаются заранее, иначе снимок зависит от того, что успело подгрузиться.
    for (const image of document.images) image.loading = "eager";
    for (let y = 0; y < document.documentElement.scrollHeight; y += window.innerHeight / 2) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 60));
    }
    await Promise.all(Array.from(document.images, (image) => Promise.race([image.decode().catch(() => undefined), new Promise((resolve) => setTimeout(resolve, 5000))])));
  });
  await expect
    .poll(() => page.evaluate(() => Array.from(document.images).filter((image) => !image.complete || !image.naturalWidth).length), { timeout: 15_000 })
    .toBe(0);
  // Быстрое пролистывание иногда проскакивает элемент: докручиваем к каждому, кто ещё не появился.
  await expect
    .poll(
      () =>
        page.evaluate(async () => {
          const missing = document.querySelector("[data-reveal]:not(.is-in)");
          if (missing) {
            missing.scrollIntoView({ block: "center", behavior: "instant" });
            await new Promise((resolve) => setTimeout(resolve, 150));
          }
          return document.querySelectorAll("[data-reveal]:not(.is-in)").length;
        }),
      { timeout: 20_000 },
    )
    .toBe(0);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await settle(page);
}

export type Shot = { name: string; top: number; progress?: number };

/** Положения прокрутки, в которых снимается сцена. */
export async function sceneShots(page: Page, index: number, name: string): Promise<Shot[]> {
  const scene = page.locator("main > *").nth(index);
  const info = await scene.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const motion = document.documentElement.dataset.fx === "on";
    return { top: rect.top + window.scrollY, height: rect.height, pin: motion && element.hasAttribute("data-pin"), viewport: window.innerHeight };
  });
  if (info.pin && isDesktopPin(page)) {
    const travel = Math.max(0, info.height - info.viewport);
    return pinProgress.map((progress) => ({ name: `${name}-${progress}`, top: info.top + travel * progress, progress }));
  }
  const shots: Shot[] = [];
  const count = Math.max(1, Math.ceil((info.height - 1) / info.viewport));
  for (let step = 0; step < count; step += 1) shots.push({ name: `${name}-${step}`, top: info.top + step * info.viewport });
  return shots;
}

export async function scrollToShot(page: Page, index: number, shot: Shot) {
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), shot.top);
  if (shot.progress !== undefined) {
    const scene = page.locator("main > *").nth(index);
    await expect
      .poll(async () => Number(await scene.evaluate((element) => getComputedStyle(element).getPropertyValue("--p"))))
      .toBeCloseTo(shot.progress, 2);
  }
  await settle(page);
}

/** Положения для страниц архива и кейсов: экран за экраном до конца страницы. */
export async function pageShots(page: Page, name: string): Promise<Shot[]> {
  const { height, viewport } = await page.evaluate(() => ({ height: document.documentElement.scrollHeight, viewport: window.innerHeight }));
  const shots: Shot[] = [];
  for (let top = 0, step = 0; top < height; top += viewport, step += 1) shots.push({ name: `${name}-${step}`, top });
  return shots;
}

/*
 * Слепок вычисленных стилей: по строке на элемент (путь в DOM, атрибуты кроме class, свой текст,
 * хэш всех вычисленных свойств элемента и его ::before/::after). Имена CSS-модулей отличаются после
 * переноса правил, поэтому хэш-префиксы модулей из значений вычищаются.
 */
export async function styleDigest(page: Page) {
  return page.evaluate(() => {
    // Переходы появления доводятся до конца, бесконечная лента категорий ставится в начало.
    for (const animation of document.getAnimations()) {
      if (animation.effect?.getComputedTiming().iterations === Infinity) {
        animation.pause();
        animation.currentTime = 0;
      } else {
        animation.finish();
      }
    }
    // --p у сцен вне экрана остаётся от последнего кадра пролистывания и зависит от тайминга:
    // для слепка всем сценам задаётся одно и то же значение.
    for (const element of document.querySelectorAll<HTMLElement>("[data-pin], [data-view]")) element.style.setProperty("--p", "0.5");
    document.documentElement.style.setProperty("--page-p", "0");
    const strip = (value: string) => value.replace(/[\w-]*module__[\w-]+?__/g, "");
    const hash = (text: string) => {
      let h = 0x811c9dc5;
      for (let i = 0; i < text.length; i += 1) {
        h ^= text.charCodeAt(i);
        h = Math.imul(h, 0x01000193);
      }
      return (h >>> 0).toString(16).padStart(8, "0");
    };
    const styleText = (style: CSSStyleDeclaration) => {
      const parts: string[] = [];
      for (let i = 0; i < style.length; i += 1) {
        const property = style[i];
        // Пользовательские свойства — входные данные (прогресс прокрутки и т. п.); их итог виден в остальных свойствах.
        if (property.startsWith("--")) continue;
        parts.push(`${property}:${strip(style.getPropertyValue(property))}`);
      }
      return parts.join(";");
    };
    const lines: string[] = [];
    const walk = (element: Element, path: string) => {
      const tag = element.tagName.toLowerCase();
      if (tag === "nextjs-portal" || tag === "script" || tag === "next-route-announcer") return;
      const attributes = Array.from(element.attributes)
        .filter((attribute) => attribute.name !== "class")
        .map((attribute) => `${attribute.name}=${strip(attribute.value)}`)
        .join(" ");
      const ownText = Array.from(element.childNodes)
        .filter((node) => node.nodeType === Node.TEXT_NODE)
        .map((node) => node.textContent?.trim())
        .filter(Boolean)
        .join("|");
      const style = styleText(getComputedStyle(element)) + styleText(getComputedStyle(element, "::before")) + styleText(getComputedStyle(element, "::after"));
      lines.push(`${path} ${hash(style)} [${attributes}] ${ownText}`);
      Array.from(element.children).forEach((child, index) => walk(child, `${path}/${child.tagName.toLowerCase()}${index}`));
    };
    walk(document.body, "body");
    return lines.join("\n") + "\n";
  });
}
