"use client";

import { useEffect, useRef, useState } from "react";
import type { Vars } from "@/components/ui/css-vars";
import { Photo } from "@/components/ui/photo";
import styles from "./about.module.css";
import { aboutCollage } from "./data";

/**
 * TEMP: коллаж из моих кадров вместо портрета, пока нет фото Елены.
 * Блок ниже первого экрана, но ленивая загрузка Chrome взяла бы его кадры сразу (порог 1250–3000 px),
 * поэтому кадры запрашиваются, только когда коллаж за полэкрана от окна (бюджет первого экрана, tests/performance.spec.ts).
 */
export function AboutCollage() {
  const figure = useRef<HTMLElement>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const element = figure.current;
    if (!element || near) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) setNear(true);
    }, { rootMargin: "50% 0px" });
    // Смотрим на обёртку: у фигуры clip-path раскрытия, и до него её видимая доля нулевая.
    observer.observe(element.parentElement ?? element);
    return () => observer.disconnect();
  }, [near]);

  return (
    <figure ref={figure} className={`${styles.portrait} ${styles.collage}`} role="img" aria-label="Кадры из моих работ" data-collage>
      {aboutCollage.map((print) => (
        <span className={styles.print} key={print.image.src} style={{ "--r": `${print.rotate}deg` } as Vars}>
          <Photo image={print.image} alt="" sizes="(max-width: 1023px) 50vw, 20vw" defer={!near} />
        </span>
      ))}
    </figure>
  );
}
