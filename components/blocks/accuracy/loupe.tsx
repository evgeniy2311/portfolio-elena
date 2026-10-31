"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";
import type { Vars } from "@/components/ui/css-vars";
import { Photo } from "@/components/ui/photo";
import type { WorkImage } from "@/lib/works";
import type { Check } from "./data";
import styles from "./accuracy.module.css";

const PIN_QUERY = "(min-width: 1024px) and (min-height: 600px)";
const AUTO_ADVANCE_MS = 1600;

type Props = { head: ReactNode; source: WorkImage; sourceAlt: string; checks: Check[] };
type Line = { x1: number; y1: number; x2: number; y2: number; width: number; height: number };

/**
 * «Лупа»: исходник слева, лупа ×2,2 едет к точке текущей детали, справа готовый кадр открывается
 * кругом из той же относительной точки, между ними рисуется линия. Пункт списка один: его описание
 * сменяет предыдущее «по одному» (ушло, потом пришло), без анимации высоты.
 *
 * Текущий пункт:
 * - от 1024×600 (сцена «липнет») — сегмент движка: ScrollFx ставит data-active у [data-segment],
 *   здесь это только читается (MutationObserver), без своих слушателей прокрутки;
 *   нажатие на пункт прокручивает к его отрезку;
 * - уже — кнопки-пункты, свайп по фото и автопереход на второй пункт один раз после появления.
 * Без JS и при reduced motion CSS показывает статичную сетку четырёх пар с номерами на исходнике.
 */
export function Loupe({ head, source, sourceAlt, checks }: Props) {
  const [active, setActive] = useState(0);
  const [previous, setPrevious] = useState<number | null>(null);
  const [line, setLine] = useState<Line | null>(null);
  const viewer = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLOListElement>(null);
  const touched = useRef(false);
  const swipe = useRef<{ x: number; y: number } | null>(null);

  const current = useRef(0);
  const go = useCallback(
    (next: number) => {
      const clamped = Math.max(0, Math.min(checks.length - 1, next));
      if (clamped === current.current) return;
      setPrevious(current.current);
      current.current = clamped;
      setActive(clamped);
    },
    [checks.length],
  );

  // Сцена «липнет»: текущий пункт — сегмент движка.
  useEffect(() => {
    const items = list.current ? Array.from(list.current.querySelectorAll<HTMLElement>("[data-segment]")) : [];
    if (items.length === 0) return;
    const sync = () => {
      const index = items.findIndex((item) => item.hasAttribute("data-active"));
      if (index >= 0) go(index);
    };
    const observer = new MutationObserver(sync);
    for (const item of items) observer.observe(item, { attributes: true, attributeFilter: ["data-active"] });
    sync();
    return () => observer.disconnect();
  }, [go]);

  // Пошаговый режим: автопереход на второй пункт один раз, когда фото появилось на экране.
  useEffect(() => {
    const element = viewer.current;
    if (!element || checks.length < 2) return;
    const pin = window.matchMedia(PIN_QUERY);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let timer = 0;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        if (pin.matches || reduced.matches) return;
        timer = window.setTimeout(() => {
          if (!touched.current) go(1);
        }, AUTO_ADVANCE_MS);
      },
      { threshold: 0.6 },
    );
    observer.observe(element);
    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
    };
  }, [checks.length, go]);

  // Линия от лупы к кадру: по фактическим размерам, заново при смене пункта и размера.
  useEffect(() => {
    const element = viewer.current;
    if (!element) return;
    const measure = () => {
      const box = element.getBoundingClientRect();
      const sourceBox = element.querySelector("[data-source]")?.getBoundingClientRect();
      const resultBox = element.querySelector("[data-results]")?.getBoundingClientRect();
      const lens = element.querySelector<HTMLElement>("[data-lens]");
      if (!sourceBox || !resultBox || !lens || box.width === 0) return setLine(null);
      const focus = checks[active].focus;
      const radius = lens.offsetWidth / 2;
      const x1 = sourceBox.left - box.left + (sourceBox.width * focus.x) / 100 + radius;
      const y1 = sourceBox.top - box.top + (sourceBox.height * focus.y) / 100;
      const x2 = resultBox.left - box.left;
      const y2 = resultBox.top - box.top + (resultBox.height * focus.y) / 100;
      setLine(x2 > x1 ? { x1, y1, x2, y2, width: box.width, height: box.height } : null);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [active, checks]);

  function choose(index: number) {
    touched.current = true;
    const section = viewer.current?.closest<HTMLElement>("[data-pin]");
    const stage = section?.querySelector<HTMLElement>("[data-stage]");
    if (section && stage && window.matchMedia(PIN_QUERY).matches && getComputedStyle(stage).position === "sticky") {
      // Сцена «липнет»: пункт выбирается прокруткой к середине его отрезка.
      const rect = section.getBoundingClientRect();
      const stageTop = parseFloat(getComputedStyle(stage).top) || 0;
      const start = rect.top + window.scrollY - stageTop;
      const travel = rect.height - stage.getBoundingClientRect().height;
      window.scrollTo({ top: start + travel * ((index + 0.5) / checks.length), behavior: "smooth" });
      return;
    }
    go(index);
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    swipe.current = { x: event.clientX, y: event.clientY };
  }

  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    const start = swipe.current;
    swipe.current = null;
    if (!start || window.matchMedia(PIN_QUERY).matches) return;
    const dx = event.clientX - start.x;
    if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(event.clientY - start.y)) return;
    touched.current = true;
    go(active + (dx < 0 ? 1 : -1));
  }

  const focus = checks[active].focus;
  return (
    <div className={styles.grid} style={{ "--fx": focus.x, "--fy": focus.y } as Vars}>
      <div className={styles.copy}>
        {head}
        <ol className={styles.list} ref={list}>
          {checks.map((check, index) => (
            <li
              key={check.title}
              className={styles.item}
              data-segment
              data-state={index === active ? "active" : index < active ? "done" : "next"}
              aria-current={index === active ? "step" : undefined}
            >
              <button type="button" className={styles.step} onClick={() => choose(index)}>
                <span className={styles.ring} aria-hidden="true">
                  <span className={styles.ringNumber}>{index + 1}</span>
                  <svg className={styles.tick} viewBox="0 0 32 32" aria-hidden="true">
                    <path d="M10 16.5l4 4 8-9" pathLength={1} />
                  </svg>
                </span>
                <span className={styles.stepTitle}>{check.title}</span>
              </button>
              <p className={styles.description} data-slot="description">
                {check.text}
              </p>
            </li>
          ))}
        </ol>
      </div>
      <div className={styles.viewer} ref={viewer} data-viewer onPointerDown={onPointerDown} onPointerUp={onPointerUp} onPointerCancel={() => (swipe.current = null)}>
        <figure className={styles.source}>
          <div className={styles.sourceImage} data-source>
            <Photo image={source} alt={sourceAlt} sizes="(max-width: 1023px) 46vw, 26vw" />
            {checks.map((check, index) => (
              <span className={styles.dot} key={check.title} data-dot style={{ left: `${check.focus.x}%`, top: `${check.focus.y}%` }} aria-hidden="true">
                {index + 1}
              </span>
            ))}
            <span className={styles.lens} data-lens aria-hidden="true">
              <span className={styles.lensImage}>
                <Photo image={source} alt="" sizes="(max-width: 1023px) 46vw, 26vw" />
              </span>
            </span>
          </div>
          <figcaption className={styles.caption}>Исходник</figcaption>
        </figure>
        <div className={styles.results} data-results>
          {checks.map((check, index) => (
            <figure
              key={check.title}
              className={styles.result}
              data-state={index === active ? "active" : index === previous ? "previous" : "idle"}
              style={{ "--rx": check.focus.x, "--ry": check.focus.y } as Vars}
            >
              <div className={styles.resultImage} data-clip>
                <Photo image={check.image} alt={`Готовый кадр: ${check.title.toLowerCase()}`} sizes="(max-width: 1023px) 46vw, 26vw" />
              </div>
              <figcaption className={styles.caption} data-slot="caption">
                <span className={styles.captionNumber}>{index + 1}</span> Готовый кадр: {check.title.toLowerCase()}
              </figcaption>
            </figure>
          ))}
        </div>
        {line ? (
          <svg className={styles.connector} viewBox={`0 0 ${line.width} ${line.height}`} aria-hidden="true">
            <path key={active} d={`M${line.x1} ${line.y1} C${(line.x1 + line.x2) / 2} ${line.y1} ${(line.x1 + line.x2) / 2} ${line.y2} ${line.x2} ${line.y2}`} pathLength={1} />
            <circle key={`dot-${active}`} cx={line.x2} cy={line.y2} r={3} />
          </svg>
        ) : null}
      </div>
    </div>
  );
}
