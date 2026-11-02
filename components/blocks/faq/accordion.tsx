"use client";

import { useEffect, useRef, type MouseEvent, type SyntheticEvent } from "react";
import { useMotionAllowed } from "@/components/fx/use-client-state";
import type { Vars } from "@/components/ui/css-vars";
import styles from "./faq.module.css";

/*
 * «Breathing Accordion» на нативных <details>. С движением обработчик сам ставит open:
 * при раскрытии сначала open, затем на следующем кадре data-state="open" (высота 0fr → 1fr, 320 мс);
 * при закрытии сначала анимация (data-state="closing"), и только после её конца снимается open,
 * так что ответ остаётся в дереве доступности до конца визуального закрытия. Быстрые повторные
 * нажатия отменяют отложенный шаг. Без JS и при reduced motion — обычные details.
 * Если details раскрыл или закрыл сам браузер (поиск по странице, якорь), без клика по summary,
 * вид догоняет нативное состояние по событию toggle, иначе ответ остался бы на 0fr и прозрачным.
 */

const DURATION = 320;

type Item = { q: string; a: string };

export function Accordion({ items }: { items: Item[] }) {
  const motion = useMotionAllowed();
  const timers = useRef(new Map<HTMLDetailsElement, number>());

  useEffect(() => {
    const pending = timers.current;
    return () => {
      for (const timer of pending.values()) window.clearTimeout(timer);
      pending.clear();
    };
  }, []);

  const onToggle = (event: MouseEvent<HTMLElement>) => {
    if (!motion) return;
    const details = event.currentTarget.parentElement as HTMLDetailsElement;
    event.preventDefault();
    const previous = timers.current.get(details);
    if (previous) window.clearTimeout(previous);
    timers.current.delete(details);
    const opening = !details.open || details.dataset.state === "closing";
    if (opening) {
      details.open = true;
      details.dataset.state = "opening";
      // Кадр с 0fr, затем переход к 1fr.
      const timer = window.setTimeout(() => {
        details.dataset.state = "open";
        timers.current.delete(details);
      }, 20);
      timers.current.set(details, timer);
    } else {
      details.dataset.state = "closing";
      const timer = window.setTimeout(() => {
        details.open = false;
        delete details.dataset.state;
        timers.current.delete(details);
      }, DURATION);
      timers.current.set(details, timer);
    }
  };

  // Нативное переключение мимо onToggle-клика: состояние вида приводится к open без анимации.
  const onNativeToggle = (event: SyntheticEvent<HTMLDetailsElement>) => {
    if (!motion) return;
    const details = event.currentTarget;
    const state = details.dataset.state;
    if (details.open && state !== "opening" && state !== "open" && state !== "closing") details.dataset.state = "open";
    else if (!details.open && state) {
      const timer = timers.current.get(details);
      if (timer) window.clearTimeout(timer);
      timers.current.delete(details);
      delete details.dataset.state;
    }
  };

  return (
    <ul className={styles.list} data-acc={motion ? "on" : undefined}>
      {items.map((item, index) => (
        <li key={item.q} data-reveal style={{ "--d": `${Math.min(index, 5) * 50}ms` } as Vars}>
          <details className={styles.item} onToggle={onNativeToggle}>
            <summary className={styles.summary} onClick={onToggle}>
              <span>{item.q}</span>
              <span className={styles.plus} aria-hidden="true" />
            </summary>
            <div className={styles.answer}>
              <div className={styles.answerInner}>
                <p>{item.a}</p>
              </div>
            </div>
          </details>
        </li>
      ))}
    </ul>
  );
}
