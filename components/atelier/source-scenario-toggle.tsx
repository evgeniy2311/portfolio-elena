"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { AtelierImage } from "@/lib/atelier-stories";
import styles from "./source-scenario-toggle.module.css";

export function SourceScenarioToggle({ source, scenario }: { source: AtelierImage; scenario: AtelierImage }) {
  const [mode, setMode] = useState<"source" | "scenario">("source");
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (rootRef.current) rootRef.current.dataset.enhanced = "true";
  }, []);

  const select = (next: "source" | "scenario") => setMode(next);

  return (
    <div
      ref={rootRef}
      className={styles.compare}
      data-testid="source-scenario-toggle"
      data-mode={mode}
      data-enhanced="false"
      tabIndex={0}
      aria-label="Сравнение исходного материала и визуального сценария"
      onKeyDown={(event) => {
        if (event.key === "ArrowRight") { event.preventDefault(); select("scenario"); }
        if (event.key === "ArrowLeft") { event.preventDefault(); select("source"); }
      }}
    >
      <div className={styles.controls} role="group" aria-label="Выбор кадра">
        <button type="button" aria-pressed={mode === "source"} onClick={() => select("source")}>Исходный материал</button>
        <button type="button" aria-pressed={mode === "scenario"} onClick={() => select("scenario")}>Визуальный сценарий</button>
      </div>
      <div className={styles.stage} aria-live="polite">
        {[source, scenario].map((item) => (
          <figure key={item.id} data-kind={item.role} data-active={mode === item.role}>
            <div><Image src={item.src} alt={item.alt} fill sizes="(max-width: 767px) 92vw, 52vw" /></div>
            <figcaption>{item.caption}</figcaption>
          </figure>
        ))}
      </div>
      <p className={styles.help}>Переключите кадр кнопками или клавишами со стрелками.</p>
    </div>
  );
}
