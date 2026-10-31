"use client";

import { useEffect } from "react";

/** Окно, в котором текст слайда виден: вход .10–.22, выход .78–.90; в .90 → .10 слот пуст. */
export const TEXT_IN = 0.1;
export const TEXT_OUT = 0.9;

/**
 * Правило «один текст в слоте» для сцены услуг. Движок (components/scroll-fx.tsx) пишет на секцию
 * --k и --t; здесь по ним скрытые тексты получают inert, aria-hidden и data-text-state="hidden",
 * чтобы невидимое не читалось и не ловило Tab. Вне «липкого» режима (телефон, reduced motion,
 * низкое окно) всё снимается: список читается целиком. Кадров не запускает: срабатывает только
 * на изменение атрибутов секции.
 */
export function ServiceStage({ sectionId }: { sectionId: string }) {
  useEffect(() => {
    const section = document.getElementById(sectionId);
    if (!section) return;
    const slots = Array.from(section.querySelectorAll<HTMLElement>("[data-text-slot]"));
    const counter = section.querySelector<HTMLElement>("[data-service-counter]");
    const last = slots.length - 1;

    function apply() {
      const pinned = section!.dataset.pinned === "on";
      const k = Number(section!.style.getPropertyValue("--k")) || 0;
      const t = Number(section!.style.getPropertyValue("--t")) || 0;
      slots.forEach((slot, index) => {
        const visible = !pinned || (index === k && (index === 0 || t > TEXT_IN) && (index === last || t < TEXT_OUT));
        const state = visible ? "visible" : "hidden";
        if (slot.dataset.textState === state) return;
        slot.dataset.textState = state;
        slot.inert = !visible;
        if (visible) slot.removeAttribute("aria-hidden");
        else slot.setAttribute("aria-hidden", "true");
      });
      if (counter) counter.dataset.value = String(pinned ? k + 1 : 1);
    }

    apply();
    const observer = new MutationObserver(apply);
    observer.observe(section, { attributes: true, attributeFilter: ["style", "data-pinned"] });
    return () => {
      observer.disconnect();
      for (const slot of slots) {
        delete slot.dataset.textState;
        slot.inert = false;
        slot.removeAttribute("aria-hidden");
      }
    };
  }, [sectionId]);

  return null;
}
