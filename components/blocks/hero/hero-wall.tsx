"use client";

import { useEffect, useRef, useState } from "react";
import { subscribeWhileVisible } from "@/components/fx/ticker";
import { useMounted } from "@/components/fx/use-client-state";
import { Photo } from "@/components/ui/photo";
import type { WallTile } from "./data";
import styles from "./hero.module.css";

/*
 * «Conveyor Loom»: три колонки работ бесконечно едут вверх / вниз / вверх.
 * Каждая колонка выведена дважды (повтор с aria-hidden и пустым alt), сдвиг идёт по модулю высоты
 * одной копии, поэтому шва не видно. Кадры приходят из общего ticker и только пока стена на экране
 * и вкладка видима. Прокрутка страницы ненадолго разгоняет колонки, наведение на кадр замедляет
 * его колонку до 15 %. Без JS работает CSS-цикл; при reduced motion стена неподвижна и в одну копию.
 */

const BOOST_FACTOR = 0.25;
const BOOST_MAX = 600;
const BOOST_DECAY = 0.06;
const HOVER_FACTOR = 0.15;
const HOVER_LERP = 0.07;
const FRAME_MS = 1000 / 60;

type Speeds = { desktop: readonly number[]; phone: readonly number[] };
type Props = { columns: WallTile[][]; speeds: Speeds; label: string };

/** Шаг экспоненциального сглаживания с поправкой на длительность кадра. */
function ease(current: number, target: number, factor: number, dt: number) {
  return current + (target - current) * (1 - Math.pow(1 - factor, dt / FRAME_MS));
}

export function HeroWall({ columns, speeds, label }: Props) {
  const wall = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const mounted = useMounted();
  // Положение колонок переживает паузу и повторный запуск эффекта: «Пуск» продолжает с того же места.
  const memory = useRef<{ offset: number; factor: number; hover: boolean }[]>([]);

  useEffect(() => {
    const root = wall.current;
    if (!root) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const desktop = window.matchMedia("(min-width: 1024px)");
    const tracks = Array.from(root.querySelectorAll<HTMLElement>("[data-track]"));
    if (memory.current.length !== tracks.length) memory.current = tracks.map(() => ({ offset: 0, factor: 1, hover: false }));
    const state = memory.current;
    let copyHeights: number[] = [];
    let boost = 0;
    let lastScroll = window.scrollY;
    let stop: (() => void) | null = null;

    function measure() {
      copyHeights = tracks.map((track) => (track.firstElementChild as HTMLElement | null)?.getBoundingClientRect().height ?? 0);
    }

    function paint() {
      tracks.forEach((track, index) => {
        track.style.transform = `translate3d(0, ${(-state[index].offset).toFixed(2)}px, 0)`;
      });
    }

    function tick(dt: number) {
      const scroll = window.scrollY;
      const velocity = dt > 0 ? ((scroll - lastScroll) / dt) * 1000 : 0;
      lastScroll = scroll;
      if (velocity !== 0) {
        const surge = Math.max(-BOOST_MAX, Math.min(BOOST_MAX, velocity * BOOST_FACTOR));
        if (Math.abs(surge) > Math.abs(boost)) boost = surge;
      }
      boost = ease(boost, 0, BOOST_DECAY, dt);
      if (Math.abs(boost) < 0.01) boost = 0;
      const base = desktop.matches ? speeds.desktop : speeds.phone;
      tracks.forEach((_, index) => {
        const column = state[index];
        const height = copyHeights[index];
        if (!(height > 0)) return;
        column.factor = ease(column.factor, column.hover ? HOVER_FACTOR : 1, HOVER_LERP, dt);
        const speed = base[index] ?? 0;
        // Минус — вверх: смещение растёт. Разгон от прокрутки добавляется по направлению колонки.
        const pxPerSecond = -(speed * column.factor + Math.sign(speed) * boost);
        column.offset = (((column.offset + (pxPerSecond * dt) / 1000) % height) + height) % height;
      });
      paint();
    }

    function start() {
      stop?.();
      stop = null;
      if (reduced.matches) {
        delete root!.dataset.loom;
        for (const track of tracks) track.style.removeProperty("transform");
        return;
      }
      // JS ведёт колонки сам: CSS-цикл для «без JS» выключается, текущее положение не сбрасывается.
      root!.dataset.loom = "js";
      measure();
      paint();
      if (!paused) stop = subscribeWhileVisible(root!, tick);
    }

    const enter = (index: number) => () => (state[index].hover = true);
    const leave = (index: number) => () => (state[index].hover = false);
    const hoverHandlers = tracks.map((track, index) => {
      const column = track.parentElement!;
      const on = enter(index);
      const off = leave(index);
      const onEnter = (event: PointerEvent) => event.pointerType === "mouse" && on();
      column.addEventListener("pointerenter", onEnter);
      column.addEventListener("pointerleave", off);
      return () => {
        column.removeEventListener("pointerenter", onEnter);
        column.removeEventListener("pointerleave", off);
      };
    });

    const resize = new ResizeObserver(() => {
      measure();
      for (let index = 0; index < state.length; index += 1) {
        const height = copyHeights[index];
        if (height > 0) state[index].offset %= height;
      }
      if (root.dataset.loom === "js") paint();
    });
    for (const track of tracks) if (track.firstElementChild) resize.observe(track.firstElementChild);

    start();
    reduced.addEventListener("change", start);
    return () => {
      stop?.();
      reduced.removeEventListener("change", start);
      resize.disconnect();
      for (const off of hoverHandlers) off();
    };
  }, [paused, speeds]);

  return (
    <div className={styles.wall} ref={wall} role="group" aria-label={label} data-wall data-paused={paused ? "" : undefined}>
      {columns.map((column, columnIndex) => (
        <div className={styles.wallColumn} key={columnIndex} data-column={columnIndex}>
          <div className={styles.wallTrack} data-track>
            {[0, 1].map((copy) => (
              <div className={styles.wallCopy} key={copy} data-copy={copy} aria-hidden={copy === 1 ? true : undefined}>
                {column.map((tile, index) => (
                  <figure key={tile.slug} data-tone={tile.tone} data-slug={tile.slug}>
                    <Photo
                      image={tile.image}
                      alt={copy === 1 ? "" : tile.alt}
                      sizes="(max-width: 1023px) 32vw, 17vw"
                      priority={copy === 0 && index === 0}
                      eager={copy === 0 && index < 2}
                    />
                  </figure>
                ))}
              </div>
            ))}
          </div>
        </div>
      ))}
      {mounted ? (
        <button type="button" className={styles.wallPause} aria-pressed={paused} onClick={() => setPaused((value) => !value)} data-wall-pause data-loop-pause>
          {paused ? "Пуск" : "Пауза"}
          <span className={styles.srOnly}> стены работ</span>
        </button>
      ) : null}
    </div>
  );
}
