"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { ArrowIcon } from "@/components/arrow-icon";
import type { WorkImage } from "@/lib/works";
import styles from "./card-preview.module.css";

/** Телефон с карточкой товара: кадры листаются свайпом, кнопками или стрелками клавиатуры. */
export function CardPreview({ frames, title }: { frames: WorkImage[]; title: string }) {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  function go(next: number) {
    const element = track.current;
    if (!element) return;
    const target = Math.max(0, Math.min(frames.length - 1, next));
    element.scrollTo({ left: target * element.clientWidth, behavior: "smooth" });
  }

  function onScroll() {
    const element = track.current;
    if (!element || !element.clientWidth) return;
    setIndex(Math.round(element.scrollLeft / element.clientWidth));
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.phone}>
        <div
          className={styles.track}
          ref={track}
          onScroll={onScroll}
          tabIndex={0}
          role="region"
          aria-roledescription="карусель"
          aria-label={`Воронка карточки: ${title}. Листайте влево и вправо`}
          onKeyDown={(event) => {
            if (event.key === "ArrowRight") {
              event.preventDefault();
              go(index + 1);
            }
            if (event.key === "ArrowLeft") {
              event.preventDefault();
              go(index - 1);
            }
          }}
        >
          {frames.map((image, frameIndex) => (
            <div className={styles.slide} key={image.src} aria-hidden={frameIndex !== index}>
              <Image src={image.src} width={image.width} height={image.height} alt={`${title}: кадр ${frameIndex + 1} из ${frames.length}`} sizes="320px" priority={frameIndex === 0} />
            </div>
          ))}
        </div>
        <div className={styles.dots} aria-hidden="true">
          {frames.map((image, frameIndex) => (
            <span key={image.src} data-active={frameIndex === index} />
          ))}
        </div>
      </div>
      <div className={styles.controls}>
        <button type="button" onClick={() => go(index - 1)} disabled={index === 0} aria-label="Предыдущий кадр">
          <ArrowIcon direction="left" />
        </button>
        <p aria-live="polite">
          Кадр {index + 1} из {frames.length}
        </p>
        <button type="button" onClick={() => go(index + 1)} disabled={index === frames.length - 1} aria-label="Следующий кадр">
          <ArrowIcon />
        </button>
      </div>
    </div>
  );
}
