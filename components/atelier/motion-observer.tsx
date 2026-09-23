"use client";

import { useEffect } from "react";

export function MotionObserver() {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const items = Array.from(document.querySelectorAll<HTMLElement>("[data-atelier-reveal]"));
    let observer: IntersectionObserver | null = null;

    const apply = () => {
      observer?.disconnect();
      if (reduced.matches) {
        items.forEach((item) => {
          item.dataset.revealReady = "false";
          item.dataset.in = "true";
        });
        return;
      }
      items.forEach((item) => { item.dataset.revealReady = "true"; });
      observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          (entry.target as HTMLElement).dataset.in = "true";
          observer?.unobserve(entry.target);
        });
      }, { rootMargin: "0px 0px -10%", threshold: 0.12 });
      items.forEach((item) => observer?.observe(item));
    };

    reduced.addEventListener("change", apply);
    apply();
    return () => {
      reduced.removeEventListener("change", apply);
      observer?.disconnect();
    };
  }, []);

  return null;
}
