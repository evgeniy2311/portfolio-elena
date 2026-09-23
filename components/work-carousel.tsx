"use client";

import { useRef, useState } from "react";
import { ArrowIcon } from "@/components/arrow-icon";
import { SlideVisual } from "@/components/slide-visual";
import type { FinalSlide } from "@/lib/portfolio";

export function WorkCarousel({ slides, title, demo }: { slides: FinalSlide[]; title: string; demo: boolean }) {
  const [active, setActive] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const show = (next: number) => setActive((next + slides.length) % slides.length);
  const slide = slides[active];

  return (
    <div className="work-carousel" aria-roledescription="карусель" aria-label={`Финальная воронка ${title}`}>
      <div
        className="work-stage"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft") { event.preventDefault(); show(active - 1); }
          if (event.key === "ArrowRight") { event.preventDefault(); show(active + 1); }
        }}
        onTouchStart={(event) => {
          const touch = event.touches[0];
          touchStart.current = touch ? { x: touch.clientX, y: touch.clientY } : null;
        }}
        onTouchEnd={(event) => {
          const start = touchStart.current;
          const touch = event.changedTouches[0];
          if (!start || !touch) return;
          const dx = touch.clientX - start.x;
          const dy = touch.clientY - start.y;
          if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.4) show(active + (dx < 0 ? 1 : -1));
          touchStart.current = null;
        }}
      >
        <div className="work-stage-image">
          <SlideVisual kind={slide.kind} src={slide.src} alt={slide.alt} demoLabel={title} demo={demo} />
        </div>
        <div className="work-stage-copy">
          <p><span>{String(slide.position).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}</span>{slide.role}</p>
          <h3>{slide.title}</h3>
          <p>{slide.rationale}</p>
        </div>
      </div>

      <div className="work-carousel-controls">
        <button type="button" onClick={() => show(active - 1)} aria-label="Предыдущий слайд"><ArrowIcon direction="left" /></button>
        <p aria-live="polite"><strong>{String(active + 1).padStart(2, "0")}</strong> / {String(slides.length).padStart(2, "0")}<span>{slide.role}</span></p>
        <button type="button" onClick={() => show(active + 1)} aria-label="Следующий слайд"><ArrowIcon /></button>
      </div>

      <div className="filmstrip" aria-label="Выбор слайда">
        {slides.map((item, index) => (
          <button type="button" key={item.id} tabIndex={index === active ? 0 : -1} aria-label={`Слайд ${item.position}: ${item.title}`} aria-pressed={index === active} onClick={() => setActive(index)}>
            <span>{String(item.position).padStart(2, "0")}</span>{item.role}
          </button>
        ))}
      </div>

      <button className="text-action" type="button" aria-expanded={showAll} onClick={() => setShowAll((value) => !value)}>
        {showAll ? "Скрыть контактный лист ↑" : "Показать всю серию ↓"}
      </button>

      {showAll && (
        <div className="contact-sheet" aria-label="Вся финальная серия">
          {slides.map((item) => (
            <article key={item.id}>
              <div><SlideVisual kind={item.kind} src={item.src} alt={item.alt} demoLabel={title} demo={demo} /></div>
              <p><span>{String(item.position).padStart(2, "0")}</span><strong>{item.role}</strong>{item.title}</p>
            </article>
          ))}
        </div>
      )}

      <ol className="mobile-role-list" aria-label="Роли слайдов">
        {slides.map((item) => <li key={item.id}><span>{String(item.position).padStart(2, "0")}</span><div><strong>{item.role}</strong><p>{item.rationale}</p></div></li>)}
      </ol>
    </div>
  );
}
