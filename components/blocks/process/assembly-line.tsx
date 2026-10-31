"use client";

import { useEffect, useRef, useState } from "react";

/** Длительность одного состояния в режиме «по времени» (телефон, планшет, низкое окно). */
export const STEP_MS = 1400;

type Props = { count: number; labels: string[]; className: string };

/**
 * Режим «по времени» сцены «Assembly Line»: когда сцена не «липнет» (ниже 1024 × 600) и движение
 * разрешено, состояния сменяются каждые 1,4 с по кругу, только пока сцена на экране и вкладка видна.
 * Точки 44 px переключают состояние и останавливают цикл; кнопка паузы (WCAG 2.2.2) его
 * останавливает и продолжает. В «липком» режиме, при reduced motion и без JS ничего не делает:
 * там сцену ведёт прокрутка или показаны статичные кадры. Номер состояния пишется в data-phase.
 */
export function AssemblyControls({ count, labels, className }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [timed, setTimed] = useState(false);
  const [phase, setPhase] = useState(0);
  const [paused, setPaused] = useState(false);
  const api = useRef({ go: (index: number) => void index, setPaused: (value: boolean) => void value });

  useEffect(() => {
    const section = ref.current?.closest("section");
    const stage = section?.querySelector<HTMLElement>("[data-assembly]");
    if (!section || !stage) return;
    const root = document.documentElement;
    const stepItems = Array.from(section.querySelectorAll<HTMLElement>("[data-step]"));
    let current = Number(stage.dataset.phase) || 0;
    let timer = 0;
    let inView = false;
    let stopped = false;

    const isTimed = () => root.dataset.fx === "on" && section.dataset.pinned !== "on";

    function show(index: number) {
      current = ((index % count) + count) % count;
      stage!.dataset.phase = String(current);
      stepItems.forEach((item, i) => {
        if (isTimed() && i === current) item.setAttribute("data-current", "");
        else item.removeAttribute("data-current");
      });
      setPhase(current);
    }

    function schedule() {
      window.clearTimeout(timer);
      timer = 0;
      if (!isTimed() || !inView || stopped || document.visibilityState !== "visible") return;
      timer = window.setTimeout(() => {
        show(current + 1);
        schedule();
      }, STEP_MS);
    }

    function refresh() {
      const on = isTimed();
      setTimed(on);
      if (!on) {
        // Прокрутка или статичные кадры: сцена в начальном состоянии, подсветку ведёт движок.
        if (current !== 0) show(0);
        for (const item of stepItems) item.removeAttribute("data-current");
      } else show(current);
      schedule();
    }

    api.current = {
      go(index) {
        stopped = true;
        setPaused(true);
        show(index);
        schedule();
      },
      setPaused(value) {
        stopped = value;
        setPaused(value);
        schedule();
      },
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) inView = entry.isIntersecting;
        schedule();
      },
      { threshold: 0.35 },
    );
    observer.observe(stage);
    // Кадры ленты выдачи лежат за краем «экрана» телефона (overflow: hidden), и ленивая загрузка до них
    // не доходит. Когда сцена в двух экранах от окна, все её кадры грузятся сразу.
    const preload = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        for (const image of section.querySelectorAll<HTMLImageElement>("img[loading='lazy']")) image.loading = "eager";
        preload.disconnect();
      },
      { rootMargin: "200% 0px" },
    );
    preload.observe(section);
    const attributes = new MutationObserver(refresh);
    attributes.observe(section, { attributes: true, attributeFilter: ["data-pinned"] });
    attributes.observe(root, { attributes: true, attributeFilter: ["data-fx"] });
    document.addEventListener("visibilitychange", schedule);
    refresh();

    return () => {
      window.clearTimeout(timer);
      observer.disconnect();
      preload.disconnect();
      attributes.disconnect();
      document.removeEventListener("visibilitychange", schedule);
      api.current = { go: () => {}, setPaused: () => {} };
    };
  }, [count]);

  return (
    <div ref={ref} className={className} data-assembly-controls="" hidden={!timed}>
      <div data-assembly-dots="">
        {labels.map((label, index) => (
          <button key={label} type="button" aria-label={`Шаг ${index + 1}: ${label}`} aria-current={index === phase ? "step" : undefined} onClick={() => api.current.go(index)} />
        ))}
      </div>
      <button type="button" data-assembly-pause="" aria-label={paused ? "Продолжить показ шагов" : "Пауза показа шагов"} onClick={() => api.current.setPaused(!paused)}>
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
          {paused ? <path d="M8 5v14l11-7z" fill="currentColor" /> : <path d="M7 5h3v14H7zM14 5h3v14h-3z" fill="currentColor" />}
        </svg>
      </button>
    </div>
  );
}
