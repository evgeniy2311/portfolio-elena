"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { ArrowIcon } from "@/components/arrow-icon";
import { useMotionAllowed, useMounted } from "@/components/fx/use-client-state";
import { Photo } from "@/components/ui/photo";
import type { PackagePreview } from "./data";
import styles from "./prices.module.css";

/*
 * «Live Preview» внутри карточки пакета.
 * auto  — кадры сменяются сами (crossfade 350 мс раз в 1,6 с), только пока карточка на экране;
 *         наведение, фокус с клавиатуры и кнопка «Пауза» останавливают (касание и клик — нет).
 * scrub — на компьютере положение указателя выбирает кадр, касание листает по кругу.
 * Кнопки «назад/вперёд» и стрелки клавиатуры доходят до последнего кадра в любом режиме.
 * Без JS — обычная горизонтальная прокрутка кадров со snap, первым виден первый кадр.
 * При reduced motion — первый кадр и ручное листание, без автозапуска.
 */

const INTERVAL = 1600;

type Props = { preview: PackagePreview; dark?: boolean };

export function FramePreview({ preview, dark = false }: Props) {
  const { frames, mode, label, alt } = preview;
  const count = frames.length;
  const mounted = useMounted();
  const motion = useMotionAllowed();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [held, setHeld] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const lastPointer = useRef<string>("mouse");

  const go = (next: number) => setIndex(((next % count) + count) % count);

  useEffect(() => {
    const element = root.current;
    if (mode !== "auto" || !motion || paused || held || count < 2 || !element) return;
    let timer = 0;
    const observer = new IntersectionObserver(([entry]) => {
      window.clearInterval(timer);
      timer = 0;
      if (entry?.isIntersecting) timer = window.setInterval(() => setIndex((value) => (value + 1) % count), INTERVAL);
    });
    observer.observe(element);
    return () => {
      observer.disconnect();
      window.clearInterval(timer);
    };
  }, [mode, motion, paused, held, count]);

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    lastPointer.current = event.pointerType;
    if (mode !== "scrub" || event.pointerType !== "mouse" || count < 2) return;
    const box = event.currentTarget.getBoundingClientRect();
    const next = Math.min(count - 1, Math.max(0, Math.floor(((event.clientX - box.left) / box.width) * count)));
    setIndex(next);
  };

  const onClick = () => {
    // Касание (не мышь) листает кадры по кругу; у мыши кадр уже выбран положением.
    if (mode === "scrub" && lastPointer.current !== "mouse") go(index + 1);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowRight") go(index + 1);
    else if (event.key === "ArrowLeft") go(index - 1);
    else return;
    event.preventDefault();
  };

  const interactive = mounted && count > 1;

  return (
    <div
      className={`${styles.preview} ${dark ? styles.previewDark : ""}`}
      ref={root}
      data-preview={mode}
      data-ready={mounted ? "" : undefined}
      onPointerEnter={(event) => event.pointerType === "mouse" && setHeld(true)}
      onPointerLeave={() => setHeld(false)}
      // Останавливает только фокус с клавиатуры: касание или клик тоже ставят фокус на ленту и кнопки,
      // и показ замирал бы до первого клика мимо карточки.
      onFocus={(event) => {
        if (event.target.matches(":focus-visible")) setHeld(true);
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setHeld(false);
      }}
    >
      <div
        className={styles.frames}
        role={count > 1 ? "group" : undefined}
        aria-label={count > 1 ? label : undefined}
        aria-roledescription={count > 1 ? "карусель" : undefined}
        tabIndex={interactive ? 0 : undefined}
        onPointerDown={(event) => (lastPointer.current = event.pointerType)}
        onPointerMove={onPointerMove}
        onClick={onClick}
        onKeyDown={interactive ? onKeyDown : undefined}
      >
        {frames.map((image, frameIndex) => (
          <div className={styles.frame} key={image.src} data-active={frameIndex === index ? "" : undefined} aria-hidden={mounted && frameIndex !== index ? true : undefined}>
            <Photo image={image} alt={count > 1 ? `${alt}, кадр ${frameIndex + 1} из ${count}` : alt} sizes="(max-width: 767px) 90vw, (max-width: 1023px) 45vw, 400px" />
          </div>
        ))}
      </div>
      {interactive ? (
        <div className={styles.controls}>
          <button type="button" className={styles.control} aria-label="Предыдущий кадр" onClick={() => go(index - 1)}>
            <ArrowIcon direction="left" />
          </button>
          <span className={`num ${styles.counter}`} data-counter>
            {index + 1} / {count}
          </span>
          <span className={styles.dots} aria-hidden="true">
            {frames.map((image, dot) => (
              <span key={image.src} data-on={dot === index ? "" : undefined} />
            ))}
          </span>
          {mode === "auto" && motion ? (
            <button type="button" className={`${styles.control} ${styles.pause}`} aria-pressed={paused} onClick={() => setPaused((value) => !value)} data-loop-pause>
              {paused ? "Пуск" : "Пауза"}
              <span className={styles.srOnly}> примера</span>
            </button>
          ) : null}
          <button type="button" className={styles.control} aria-label="Следующий кадр" onClick={() => go(index + 1)}>
            <ArrowIcon />
          </button>
        </div>
      ) : null}
    </div>
  );
}
