"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import { ArrowIcon } from "@/components/arrow-icon";
import type { AtelierImage } from "@/lib/atelier-stories";
import { useEqualPhotoMotion } from "./use-equal-photo-motion";
import styles from "./scroll-story.module.css";

export function ScrollStory({ images }: { images: AtelierImage[] }) {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLOListElement>(null);
  const counterTimerRef = useRef<number | null>(null);
  const [active, setActive] = useState(0);

  useEqualPhotoMotion({
    sectionRef,
    stageRef,
    frameSelector: "[data-frame]",
    frameCount: images.length,
    progressProperty: "--scene-progress",
    legacyKind: "hero",
    onFrameChange: setActive,
  });

  const goTo = useCallback((index: number) => {
    const strip = stripRef.current;
    if (!strip) return;
    const next = (index + images.length) % images.length;
    const frame = strip.children.item(next) as HTMLElement | null;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    strip.scrollTo({ left: frame?.offsetLeft ?? 0, behavior: reduced ? "auto" : "smooth" });
    setActive(next);
  }, [images.length]);

  const syncCounter = () => {
    if (counterTimerRef.current !== null) window.clearTimeout(counterTimerRef.current);
    counterTimerRef.current = window.setTimeout(() => {
      const strip = stripRef.current;
      if (!strip) return;
      const frames = Array.from(strip.children) as HTMLElement[];
      const center = strip.scrollLeft + strip.clientWidth / 2;
      const closest = frames.reduce((best, frame, index) => {
        const distance = Math.abs(frame.offsetLeft + frame.offsetWidth / 2 - center);
        return distance < best.distance ? { index, distance } : best;
      }, { index: 0, distance: Number.POSITIVE_INFINITY });
      setActive(closest.index);
    }, 90);
  };

  return (
    <section
      ref={sectionRef}
      className={styles.scene}
      id="hero"
      aria-labelledby="hero-title"
      data-enhanced="false"
      data-scene={images.length}
      data-listener="inactive"
      data-raf="idle"
      data-motion-kind="hero"
      data-motion-ready="false"
      data-motion-enhanced="false"
      data-motion-listener="inactive"
      data-motion-raf="idle"
      data-motion-progress="1.0000"
      data-current-frame={images.length}
      data-visible-count={images.length}
    >
      <div ref={stageRef} className={styles.stage} data-motion-stage>
        <div className={styles.copy}>
          <p className={styles.label}>Елена Бадьина · Fashion marketplace design</p>
          <h1 id="hero-title">Елена Бадьина</h1>
          <p className={styles.thesis}>Товар остаётся собой. <em>Визуал становится сценой.</em></p>
          <p className={styles.lead}>Нейровизуал и системы карточек для одежды на Wildberries и Ozon.</p>
          <div className={styles.ctaRow}>
            <a className={styles.cta} href="#selected" aria-label="Смотреть фотоистории на этой странице">Смотреть истории <span aria-hidden="true">↓</span></a>
            <Link className={styles.routeCta} href="/works" aria-label="Открыть все кейсы">Все кейсы <ArrowIcon /></Link>
          </div>
          <p className={styles.permission}>Локальный прототип. Публикационные разрешения уточняются.</p>
        </div>

        <div className={styles.artwork}>
          <span className={styles.sceneReadout} aria-hidden="true">
            Scene / <b data-testid="hero-scene-readout">0{active + 1}</b>
          </span>
          <span className={styles.drawnLine} aria-hidden="true" />
          <ol
            ref={stripRef}
            className={styles.frames}
            data-testid="hero-strip"
            aria-label="История визуального сценария пальто"
            tabIndex={0}
            onScroll={syncCounter}
            onKeyDown={(event) => {
              if (event.key === "ArrowRight") { event.preventDefault(); goTo(active + 1); }
              if (event.key === "ArrowLeft") { event.preventDefault(); goTo(active - 1); }
            }}
          >
            {images.map((item, index) => (
              <li
                className={styles.frame}
                data-frame={index + 1}
                key={item.id}
              >
                <figure>
                  <div className={styles.imageWrap}>
                    <Image
                      src={item.src}
                      alt={item.alt}
                      fill
                      sizes="(max-width: 1023px) 82vw, 24vw"
                      preload={index === 0}
                      loading={index === 0 ? undefined : "lazy"}
                      style={{ objectPosition: item.objectPosition ?? "center" }}
                    />
                  </div>
                  <figcaption><span>0{index + 1}</span>{item.caption}</figcaption>
                </figure>
              </li>
            ))}
          </ol>
          <div className={styles.controls} aria-label="Управление галереей">
            <button type="button" onClick={() => goTo(active - 1)} aria-label="Предыдущий кадр">←</button>
            <p aria-live="polite" data-testid="hero-counter"><b>0{active + 1}</b> / 0{images.length}<span>{images[active]?.caption}</span></p>
            <button type="button" onClick={() => goTo(active + 1)} aria-label="Следующий кадр">→</button>
          </div>
        </div>
      </div>
    </section>
  );
}
