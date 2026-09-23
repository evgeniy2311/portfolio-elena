"use client";

import { useRef, useState } from "react";
import { ArrowIcon } from "@/components/arrow-icon";
import { SlideVisual } from "@/components/slide-visual";
import type { FinalSlide } from "@/lib/portfolio";

export function HeroCarousel({ slides, title, demo }: { slides: FinalSlide[]; title: string; demo: boolean }) {
  const [active, setActive] = useState(0);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const show = (next: number) => setActive((next + slides.length) % slides.length);
  const current = slides[active];

  return (
    <div className="hero-carousel" aria-roledescription="карусель" aria-label={`Воронка ${title}`}>
      <div className="hero-stage" tabIndex={0}
        onKeyDown={(event) => { if (event.key === "ArrowLeft") { event.preventDefault(); show(active - 1); } if (event.key === "ArrowRight") { event.preventDefault(); show(active + 1); } }}
        onTouchStart={(event) => { const touch = event.touches[0]; touchStart.current = touch ? { x: touch.clientX, y: touch.clientY } : null; }}
        onTouchEnd={(event) => { const start = touchStart.current; const touch = event.changedTouches[0]; if (!start || !touch) return; const dx = touch.clientX - start.x; const dy = touch.clientY - start.y; if (Math.abs(dx) > 44 && Math.abs(dx) > Math.abs(dy) * 1.4) show(active + (dx < 0 ? 1 : -1)); touchStart.current = null; }}>
        {[3, 2, 1].map((position) => <div className="stack-card stack-card-back" data-position={position} key={position} aria-hidden="true" />)}
        <div className="stack-card" data-position="0"><SlideVisual kind={current.kind} src={current.src} alt={current.alt} preload={active === 0} demoLabel={title} demo={demo} /></div>
      </div>
      <div className="carousel-controls">
        <button type="button" onClick={() => show(active - 1)} aria-label="Предыдущий слайд"><ArrowIcon direction="left" /></button>
        <p aria-live="polite"><strong>{String(active + 1).padStart(2, "0")}</strong> / {String(slides.length).padStart(2, "0")} <span>{current.role}</span></p>
        <button type="button" onClick={() => show(active + 1)} aria-label="Следующий слайд"><ArrowIcon /></button>
      </div>
    </div>
  );
}
