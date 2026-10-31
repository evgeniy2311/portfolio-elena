"use client";

import { useEffect } from "react";
import { panelProgress, pinProgress, segmentOf, smoothStep, viewProgress } from "@/components/fx/progress";
import { subscribeTicker } from "@/components/fx/ticker";

/*
 * Один драйвер прокрутки для всей страницы. Сам ничего не анимирует: пишет CSS-переменные,
 * а движение описано в CSS блоков. Кадры идут через общий ticker (components/fx/ticker.ts),
 * только пока значения догоняют прокрутку; в покое цикл стоит.
 *
 * [data-pin]       --p 0..1 по фактическому ходу sticky-слоя ([data-stage] или первый sticky-потомок)
 *                  с учётом его top (шапка); data-pinned="on", пока сцена действительно «липкая»
 * [data-segments]  у [data-pin]: --k (номер сегмента), --t (прогресс внутри), data-active у [data-segment]
 * [data-view]      --p 0..1 от появления элемента снизу до ухода вверх
 * [data-rail]      горизонтальная лента внутри [data-pin]: высота секции подгоняется под ширину ленты;
 *                  её [data-panel] получают --pp (0 — панель у правого края окна, 1 — у левого);
 *                  кадры ленты начинают грузиться заранее, когда она в двух экранах от окна
 * [data-reveal]    получает класс is-in один раз при появлении; значение атрибута выбирает вид
 *                  появления в CSS, data-reveal-threshold — свой порог срабатывания
 *
 * Значения сглаживаются (0,14 за кадр при 60 fps, с поправкой на dt) и встают точно в 0 и 1.
 * Без JavaScript и при prefers-reduced-motion атрибут data-fx не ставится, и CSS показывает
 * каждую сцену сразу в финальном состоянии.
 */

// Должно совпадать с media-условием «липких» сцен в CSS-модулях блоков.
const PIN_QUERY = "(min-width: 1024px) and (min-height: 600px)";

type Tracked = { element: HTMLElement; kind: "pin" | "view"; current: number; target: number; stage: HTMLElement | null; segments: HTMLElement[]; segmentCount: number; panels: HTMLElement[] };

function findStage(section: HTMLElement) {
  const marked = section.querySelector<HTMLElement>("[data-stage]");
  if (marked) return marked;
  for (const child of Array.from(section.children) as HTMLElement[]) {
    if (getComputedStyle(child).position === "sticky") return child;
  }
  return null;
}

export function ScrollFx() {
  useEffect(() => {
    const root = document.documentElement;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const pinMedia = window.matchMedia(PIN_QUERY);
    function write(element: HTMLElement, name: string, value: string) {
      if (element.style.getPropertyValue(name) !== value) element.style.setProperty(name, value);
    }

    // Появление: отдельный наблюдатель на каждый порог, а не один общий fade-up.
    const revealObservers = new Map<string, IntersectionObserver>();
    function revealObserver(threshold: string) {
      let observer = revealObservers.get(threshold);
      if (!observer) {
        observer = new IntersectionObserver(
          (entries) => {
            for (const entry of entries) {
              if (!entry.isIntersecting) continue;
              entry.target.classList.add("is-in");
              observer!.unobserve(entry.target);
            }
          },
          { rootMargin: "0px 0px -12% 0px", threshold: Math.min(1, Math.max(0, Number(threshold) || 0.08)) },
        );
        revealObservers.set(threshold, observer);
      }
      return observer;
    }

    // Кадры горизонтальной ленты лежат за правым краем окна, и ленивая загрузка браузера до них
    // может не дойти при быстрой прокрутке. Когда лента приближается (за два экрана), они грузятся сразу.
    const railImages = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          for (const image of entry.target.querySelectorAll<HTMLImageElement>("[data-rail-track] img[loading='lazy']")) image.loading = "eager";
          railImages.unobserve(entry.target);
        }
      },
      { rootMargin: "200% 0px" },
    );
    for (const rail of document.querySelectorAll("[data-rail]")) railImages.observe(rail);

    let tracked: Tracked[] = [];
    let unsubscribe: (() => void) | null = null;
    let motion = false;

    function measureRails() {
      for (const section of document.querySelectorAll<HTMLElement>("[data-rail]")) {
        const track = section.querySelector<HTMLElement>("[data-rail-track]");
        if (!track) continue;
        if (!pinMedia.matches || reduced.matches) {
          section.style.removeProperty("height");
          section.style.removeProperty("--rail-shift");
          continue;
        }
        const shift = Math.max(0, track.scrollWidth - window.innerWidth);
        section.style.setProperty("--rail-shift", `${shift}px`);
        // Ход sticky-слоя ровно равен сдвигу ленты: секция = высота слоя + сдвиг.
        const stage = findStage(section);
        const stageHeight = stage ? stage.getBoundingClientRect().height : window.innerHeight;
        section.style.height = `${shift + stageHeight}px`;
      }
    }

    function targetOf(item: Tracked, viewport: number, everywhere = false) {
      const rect = item.element.getBoundingClientRect();
      // Далеко за экраном значение на каждом кадре не нужно: frame() ставит его при возвращении.
      if (!everywhere && (rect.bottom < -viewport || rect.top > viewport * 2)) return null;
      if (item.kind === "view") return viewProgress(rect.top, rect.height, viewport);
      if (item.stage) {
        const stageTop = parseFloat(getComputedStyle(item.stage).top) || 0;
        return pinProgress(rect.top, rect.height, stageTop, item.stage.getBoundingClientRect().height);
      }
      // Сцена без sticky-слоя (телефон или старая разметка): прежняя формула «высота минус окно».
      return pinProgress(rect.top, rect.height, 0, viewport);
    }

    function publish(item: Tracked) {
      const value = item.current;
      write(item.element, "--p", value.toFixed(4));
      if (item.kind !== "pin") return;
      if (item.segmentCount > 0 && pinMedia.matches) {
        const { k, t } = segmentOf(value, item.segmentCount);
        write(item.element, "--k", String(k));
        write(item.element, "--t", t.toFixed(4));
        item.segments.forEach((segment, index) => {
          if (index === k) segment.setAttribute("data-active", "");
          else segment.removeAttribute("data-active");
        });
      }
      if (item.panels.length > 0) {
        const width = window.innerWidth;
        for (const panel of item.panels) write(panel, "--pp", panelProgress(panel.getBoundingClientRect().left, width).toFixed(4));
      }
    }

    function frame(dt: number) {
      const viewport = window.innerHeight;
      let moving = false;
      for (const item of tracked) {
        const target = targetOf(item, viewport);
        if (target === null) continue;
        item.target = target;
        // За пределами sticky-хода (0 или 1) значение встаёт сразу: слой уже отлип или ещё не прилип,
        // и при отлипании содержимое не должно догонять с рывком. Внутри хода — сглаживание.
        const next = item.kind === "pin" && (target === 0 || target === 1) ? target : smoothStep(item.current, target, dt);
        if (next !== item.current) {
          item.current = next;
          publish(item);
        }
        if (next !== target) moving = true;
      }
      const scrollable = root.scrollHeight - viewport;
      write(root, "--page-p", scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)).toFixed(4) : "0");
      if (!moving) stopFrames();
    }

    function startFrames() {
      if (motion && !unsubscribe) unsubscribe = subscribeTicker(frame);
    }

    function stopFrames() {
      unsubscribe?.();
      unsubscribe = null;
    }

    function collect() {
      const make = (element: HTMLElement, kind: Tracked["kind"]): Tracked => {
        const segments = kind === "pin" ? Array.from(element.querySelectorAll<HTMLElement>("[data-segment]")) : [];
        const declared = Number(element.dataset.segments);
        return {
          element,
          kind,
          current: Number.NaN,
          target: 0,
          stage: kind === "pin" ? findStage(element) : null,
          segments,
          segmentCount: element.hasAttribute("data-segments") ? (Number.isFinite(declared) && declared > 0 ? declared : segments.length) : 0,
          panels: kind === "pin" && element.hasAttribute("data-rail") ? Array.from(element.querySelectorAll<HTMLElement>("[data-panel]")) : [],
        };
      };
      tracked = [
        ...Array.from(document.querySelectorAll<HTMLElement>("[data-pin]"), (element) => make(element, "pin")),
        ...Array.from(document.querySelectorAll<HTMLElement>("[data-view]"), (element) => make(element, "view")),
      ];
    }

    function markPinned() {
      for (const item of tracked) {
        if (item.kind !== "pin") continue;
        if (motion && pinMedia.matches) item.element.dataset.pinned = "on";
        else delete item.element.dataset.pinned;
      }
    }

    /** Первый кадр после настройки: без сглаживания, сразу в положение прокрутки, для всех сцен страницы. */
    function snap() {
      const viewport = window.innerHeight;
      for (const item of tracked) {
        const target = targetOf(item, viewport, true);
        if (target === null) continue;
        item.current = item.target = target;
        publish(item);
      }
      const scrollable = root.scrollHeight - viewport;
      write(root, "--page-p", scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)).toFixed(4) : "0");
    }

    function onScroll() {
      startFrames();
    }

    function onResize() {
      measureRails();
      for (const item of tracked) if (item.kind === "pin") item.stage = findStage(item.element);
      markPinned();
      startFrames();
    }

    function setup() {
      stopFrames();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      collect();
      motion = !reduced.matches;

      if (!motion) {
        delete root.dataset.fx;
        for (const item of tracked) {
          write(item.element, "--p", "1");
          item.element.style.removeProperty("--k");
          item.element.style.removeProperty("--t");
          for (const segment of item.segments) segment.removeAttribute("data-active");
        }
        markPinned();
        for (const element of document.querySelectorAll("[data-reveal]")) element.classList.add("is-in");
        measureRails();
        return;
      }

      root.dataset.fx = "on";
      for (const element of document.querySelectorAll<HTMLElement>("[data-reveal]:not(.is-in)")) {
        revealObserver(element.dataset.revealThreshold ?? "0.08").observe(element);
      }
      measureRails();
      for (const item of tracked) if (item.kind === "pin") item.stage = findStage(item.element);
      markPinned();
      snap();
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onResize);
    }

    // Шапка прозрачна у самого верха и получает фон и линию после 40 px прокрутки.
    function updateHeader() {
      root.dataset.header = window.scrollY > 40 ? "scrolled" : "top";
    }

    /*
     * Липкая панель «2 кадра бесплатно» (телефон и планшет, components/ui/mobile-trial-bar.tsx).
     * Показывается, когда посетитель дошёл до блока услуг (#services), а на страницах без него —
     * когда первый экран ([data-first-screen]) ушёл вверх. Скрыта, пока виден первый экран или #contact.
     * Состояния — по IntersectionObserver, работает и при reduced motion.
     */
    const ctaGate = document.getElementById("services");
    const firstScreen = document.querySelector("[data-first-screen]");
    const contactBlock = document.getElementById("contact");
    const cta = { firstVisible: Boolean(firstScreen), firstPassed: !firstScreen, reached: false, contactVisible: false };
    function applyCta() {
      const reached = ctaGate ? cta.reached : cta.firstPassed;
      root.dataset.cta = reached && !cta.firstVisible && !cta.contactVisible ? "show" : "hide";
    }
    const ctaObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const above = !entry.isIntersecting && entry.boundingClientRect.bottom <= 0;
        if (entry.target === firstScreen) {
          cta.firstVisible = entry.isIntersecting;
          cta.firstPassed = above;
        }
        if (entry.target === ctaGate) cta.reached = entry.isIntersecting || above;
        if (entry.target === contactBlock) cta.contactVisible = entry.isIntersecting;
      }
      applyCta();
    });
    for (const element of [firstScreen, ctaGate, contactBlock]) if (element) ctaObserver.observe(element);
    applyCta();

    setup();
    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
    reduced.addEventListener("change", setup);
    pinMedia.addEventListener("change", onResize);
    // Шрифты и картинки могут изменить ширину ленты после первого замера.
    const lateMeasure = window.setTimeout(onResize, 600);

    return () => {
      window.clearTimeout(lateMeasure);
      stopFrames();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", updateHeader);
      reduced.removeEventListener("change", setup);
      pinMedia.removeEventListener("change", onResize);
      for (const observer of revealObservers.values()) observer.disconnect();
      ctaObserver.disconnect();
      railImages.disconnect();
      for (const item of tracked) delete item.element.dataset.pinned;
      delete root.dataset.fx;
      delete root.dataset.cta;
      delete root.dataset.header;
    };
  }, []);

  return null;
}
