"use client";

import { useCallback, useRef, useState, type ReactNode, type TouchEvent } from "react";
import { useEqualPhotoMotion } from "./use-equal-photo-motion";

type Props = {
  id: string;
  className: string;
  frameCount: number;
  captions: string[];
  progressProperty: string;
  controlsClassName: string;
  readoutClassName: string;
  children: ReactNode;
  legacyKind?: "dark";
};

export function PhotoStoryMotion({
  id,
  className,
  frameCount,
  captions,
  progressProperty,
  controlsClassName,
  readoutClassName,
  children,
  legacyKind,
}: Props) {
  const sectionRef = useRef<HTMLElement>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const [active, setActive] = useState(0);

  useEqualPhotoMotion({
    sectionRef,
    frameSelector: "[data-photo-frame]",
    frameCount,
    progressProperty,
    legacyKind,
    onFrameChange: setActive,
  });

  const goTo = useCallback((requested: number) => {
    const section = sectionRef.current;
    const strip = section?.querySelector<HTMLElement>("[data-photo-strip]");
    if (!section || !strip || section.dataset.motionEnhanced === "true") return;
    const next = (requested + frameCount) % frameCount;
    const frame = strip.querySelectorAll<HTMLElement>("[data-photo-frame]").item(next);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    strip.scrollTo({ left: frame?.offsetLeft ?? 0, behavior: reduced ? "auto" : "smooth" });
    setActive(next);
  }, [frameCount]);

  const finishTouch = (event: TouchEvent<HTMLElement>) => {
    const start = touchStart.current;
    const touch = event.changedTouches[0];
    touchStart.current = null;
    if (!start || !touch) return;
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.abs(dx) > 44 && Math.abs(dx) > Math.abs(dy) * 1.4) goTo(active + (dx < 0 ? 1 : -1));
  };

  return (
    <section
      ref={sectionRef}
      className={className}
      id={id}
      data-atelier-reveal
      data-motion-kind={id}
      data-motion-ready="false"
      data-motion-enhanced="false"
      data-motion-listener="inactive"
      data-motion-raf="idle"
      data-motion-progress="1.0000"
      data-current-frame={frameCount}
      data-visible-count={frameCount}
      onKeyDown={(event) => {
        if (!(event.target as Element).closest("[data-photo-strip]")) return;
        if (event.key === "ArrowRight") { event.preventDefault(); goTo(active + 1); }
        if (event.key === "ArrowLeft") { event.preventDefault(); goTo(active - 1); }
      }}
      onTouchStart={(event) => {
        if (!(event.target as Element).closest("[data-photo-strip]")) return;
        const touch = event.touches[0];
        touchStart.current = touch ? { x: touch.clientX, y: touch.clientY } : null;
      }}
      onTouchEnd={finishTouch}
    >
      <p className={readoutClassName} data-motion-readout aria-live="polite"><b>{String(active + 1).padStart(2, "0")}</b> / {String(frameCount).padStart(2, "0")}<span>{captions[active]}</span></p>
      {children}
      <div className={controlsClassName} data-photo-controls aria-label={`Управление фотоисторией ${id}`}>
        <button type="button" onClick={() => goTo(active - 1)} aria-label="Предыдущая фотография">←</button>
        <p aria-live="polite"><b>{String(active + 1).padStart(2, "0")}</b> / {String(frameCount).padStart(2, "0")}<span>{captions[active]}</span></p>
        <button type="button" onClick={() => goTo(active + 1)} aria-label="Следующая фотография">→</button>
      </div>
    </section>
  );
}
