"use client";

import { useEffect, useRef, useState } from "react";
import { useMotionAllowed } from "@/components/fx/use-client-state";
import styles from "./about.module.css";

/*
 * «Slot Word»: в фразе «Делаю кадры для ___.» слово меняется в вертикальной прорези
 * (500 мс, раз в 2,4 с), только пока фраза на экране. Ширина прорези равна самому длинному слову,
 * текст вокруг не прыгает. Экранный диктор всегда читает полную фразу; без JS и при reduced motion
 * показывается она же обычным текстом. Кнопка паузы останавливает смену слов.
 */

const INTERVAL = 2400;

type Props = { full: string; before: string; words: string[] };

export function SlotWord({ full, before, words }: Props) {
  const motion = useMotionAllowed() && words.length > 1;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const line = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const element = line.current;
    if (!motion || paused || !element) return;
    let timer = 0;
    const observer = new IntersectionObserver(([entry]) => {
      window.clearInterval(timer);
      timer = 0;
      if (entry?.isIntersecting) timer = window.setInterval(() => setIndex((value) => (value + 1) % words.length), INTERVAL);
    });
    observer.observe(element);
    return () => {
      observer.disconnect();
      window.clearInterval(timer);
    };
  }, [motion, paused, words.length]);

  return (
    <>
      <p className={`lede ${styles.lead}`} ref={line} data-slot={motion ? "on" : "off"}>
        <span className={styles.slotFull}>{full}</span>
        <span className={styles.slotLine} aria-hidden="true">
          {before}{" "}
          <span className={styles.slot} data-slot-word>
            {words.map((word, wordIndex) => (
              <span key={word} data-state={wordIndex === index ? "active" : wordIndex === (index - 1 + words.length) % words.length ? "out" : "wait"}>
                {word}.
              </span>
            ))}
          </span>
        </span>
      </p>
      {motion ? (
        <button type="button" className={styles.slotPause} aria-pressed={paused} onClick={() => setPaused((value) => !value)} data-loop-pause>
          <span aria-hidden="true" className={paused ? styles.iconPlay : styles.iconPause} />
          <span className={styles.srOnly}>{paused ? "Пуск" : "Пауза"} смены площадок</span>
        </button>
      ) : null}
    </>
  );
}
