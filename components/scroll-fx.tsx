"use client";

import { useEffect } from "react";

/*
 * Один лёгкий драйвер прокрутки для всей страницы. Сам ничего не анимирует:
 * записывает прогресс в CSS-переменную --p, а движение описано в CSS.
 *
 * [data-pin]    прогресс 0..1 по «липкому» участку секции (её высота минус окно)
 * [data-view]   прогресс 0..1 от появления элемента снизу до ухода вверх
 * [data-rail]   горизонтальная лента внутри [data-pin]: высота секции подгоняется под ширину ленты
 * [data-reveal] получает класс is-in один раз при появлении
 *
 * Без JavaScript и при prefers-reduced-motion атрибут data-fx не ставится,
 * и CSS показывает каждую сцену сразу в финальном состоянии.
 */

// Должно совпадать с media-условием «липких» сцен в home.module.css.
const RAIL_QUERY = "(min-width: 1024px) and (min-height: 600px)";

function clamp(value: number) {
  return value < 0 ? 0 : value > 1 ? 1 : value;
}

export function ScrollFx() {
  useEffect(() => {
    const root = document.documentElement;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const railMedia = window.matchMedia(RAIL_QUERY);

    const revealObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            revealObserver.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.08 },
    );

    let frame = 0;
    let pins: HTMLElement[] = [];
    let views: HTMLElement[] = [];
    const last = new WeakMap<HTMLElement, string>();

    function write(element: HTMLElement, value: number) {
      const text = value.toFixed(4);
      if (last.get(element) === text) return;
      last.set(element, text);
      element.style.setProperty("--p", text);
    }

    function measureRails() {
      for (const section of document.querySelectorAll<HTMLElement>("[data-rail]")) {
        const track = section.querySelector<HTMLElement>("[data-rail-track]");
        if (!track) continue;
        if (!railMedia.matches || reduced.matches) {
          section.style.removeProperty("height");
          section.style.removeProperty("--rail-shift");
          continue;
        }
        const shift = Math.max(0, track.scrollWidth - window.innerWidth);
        section.style.setProperty("--rail-shift", `${shift}px`);
        section.style.height = `${shift + window.innerHeight}px`;
      }
    }

    function update() {
      frame = 0;
      const viewport = window.innerHeight;
      for (const section of pins) {
        const rect = section.getBoundingClientRect();
        if (rect.bottom < -viewport || rect.top > viewport * 2) continue;
        const travel = rect.height - viewport;
        write(section, travel > 0 ? clamp(-rect.top / travel) : rect.top <= 0 ? 1 : 0);
      }
      for (const element of views) {
        const rect = element.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > viewport) continue;
        write(element, clamp((viewport - rect.top) / (viewport + rect.height)));
      }
      const scrollable = root.scrollHeight - viewport;
      root.style.setProperty("--page-p", scrollable > 0 ? clamp(window.scrollY / scrollable).toFixed(4) : "0");
    }

    function schedule() {
      if (!frame) frame = window.requestAnimationFrame(update);
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

    function onResize() {
      measureRails();
      schedule();
    }

    function setup() {
      window.cancelAnimationFrame(frame);
      frame = 0;
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", onResize);
      pins = Array.from(document.querySelectorAll<HTMLElement>("[data-pin]"));
      views = Array.from(document.querySelectorAll<HTMLElement>("[data-view]"));

      if (reduced.matches) {
        delete root.dataset.fx;
        for (const element of [...pins, ...views]) element.style.setProperty("--p", "1");
        for (const element of document.querySelectorAll("[data-reveal]")) element.classList.add("is-in");
        measureRails();
        return;
      }

      root.dataset.fx = "on";
      for (const element of document.querySelectorAll("[data-reveal]:not(.is-in)")) revealObserver.observe(element);
      measureRails();
      update();
      window.addEventListener("scroll", schedule, { passive: true });
      window.addEventListener("resize", onResize);
    }

    setup();
    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
    reduced.addEventListener("change", setup);
    railMedia.addEventListener("change", onResize);
    // Шрифты и картинки могут изменить ширину ленты после первого замера.
    const lateMeasure = window.setTimeout(onResize, 600);

    return () => {
      window.clearTimeout(lateMeasure);
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", updateHeader);
      ctaObserver.disconnect();
      reduced.removeEventListener("change", setup);
      railMedia.removeEventListener("change", onResize);
      revealObserver.disconnect();
      delete root.dataset.fx;
      delete root.dataset.cta;
      delete root.dataset.header;
    };
  }, []);

  return null;
}
