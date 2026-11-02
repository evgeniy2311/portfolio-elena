"use client";

import { useEffect } from "react";

const PIN_QUERY = "(min-width: 1024px) and (min-height: 600px)";

/**
 * Проявление на телефоне и планшете (без «липкой» ленты): панель карусели получает data-developed,
 * когда она в карусели больше чем на 60 % и сама карусель на экране. Один раз на панель.
 * От 1024 px проявлением управляет --pp движка (components/scroll-fx.tsx), здесь ничего не делается.
 * Без JS и при reduced motion data-fx нет, и CSS показывает кадры сразу проявленными.
 */
export function RailDevelop({ sectionId }: { sectionId: string }) {
  useEffect(() => {
    const section = document.getElementById(sectionId);
    const carousel = section?.querySelector<HTMLElement>("[data-rail-panels]");
    if (!section || !carousel) return;
    const panels = Array.from(carousel.querySelectorAll<HTMLElement>("[data-panel]"));
    if (panels.length === 0) return;

    const visible = new Set<Element>();
    let onScreen = false;
    const develop = () => {
      if (!onScreen) return;
      for (const panel of visible) panel.setAttribute("data-developed", "");
    };

    const inCarousel = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target);
          else visible.delete(entry.target);
        }
        develop();
      },
      { root: carousel, threshold: 0.6 },
    );
    const inViewport = new IntersectionObserver(
      (entries) => {
        onScreen = entries.some((entry) => entry.isIntersecting);
        develop();
      },
      { threshold: 0.35 },
    );

    const pin = window.matchMedia(PIN_QUERY);
    function start() {
      inCarousel.disconnect();
      inViewport.disconnect();
      if (pin.matches) return;
      for (const panel of panels) inCarousel.observe(panel);
      inViewport.observe(carousel!);
    }
    start();
    pin.addEventListener("change", start);
    return () => {
      pin.removeEventListener("change", start);
      inCarousel.disconnect();
      inViewport.disconnect();
    };
  }, [sectionId]);
  return null;
}
