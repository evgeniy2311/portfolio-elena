"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowIcon } from "@/components/arrow-icon";
import { subscribeWhileVisible } from "@/components/fx/ticker";
import { useMotionAllowed, useMounted } from "@/components/fx/use-client-state";
import { Photo } from "@/components/ui/photo";
import type { CategoryTile } from "./data";
import styles from "./categories.module.css";
import { AXIS_LOCK, CLICK_SLOP, HOVER_LERP, IDLE_SPEED, approach, canLoop, copiesFor, decay, nearestToCenter, releaseVelocity, skewFor, wrap } from "./ribbon-math";

/*
 * «Silk Ribbon»: лента категорий сама дрейфует влево, при наведении плавно останавливается,
 * тянется пальцем или мышью 1:1 и после броска катится по инерции. Вертикальный жест уходит
 * странице (touch-action: pan-y, фиксация оси после 8 px). Клавиатура: стрелки на ленте и кнопки
 * «назад/вперёд», фокус останавливает дрейф. Отдельная кнопка «Пауза» для бесконечного движения.
 * Без JS, при reduced motion и для ленты из одной плитки — обычная горизонтальная прокрутка
 * со snap и одной копией.
 */

const STEP_MS = 480;

type Props = { tiles: CategoryTile[]; heading: ReactNode; label: string };

function easeOut(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

export function Ribbon({ tiles, heading, label }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const mounted = useMounted();
  const motion = useMotionAllowed() && canLoop(tiles.length);
  const [copies, setCopies] = useState(tiles.length > 1 ? 2 : tiles.length);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  const stepRef = useRef<(direction: 1 | -1) => void>(() => {});
  const wakeRef = useRef<() => void>(() => {});

  useEffect(() => {
    pausedRef.current = paused;
    wakeRef.current();
  }, [paused]);

  // Обычная прокрутка (без движения): кнопки листают на одну плитку.
  useEffect(() => {
    if (motion) return;
    stepRef.current = (direction) => {
      const element = viewport.current;
      const tile = element?.querySelector<HTMLElement>("[data-tile]");
      if (!element || !tile) return;
      const gap = parseFloat(getComputedStyle(tile.parentElement!).columnGap) || 0;
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      element.scrollBy({ left: direction * (tile.offsetWidth + gap), behavior: reducedMotion ? "auto" : "smooth" });
    };
  }, [motion]);

  useEffect(() => {
    const element = viewport.current;
    const strip = track.current;
    const host = root.current;
    if (!motion || !element || !strip || !host) return;
    const count = tiles.length;
    let width = 0;
    let step = 0;
    let x = 0;
    let drift = IDLE_SPEED;
    let momentum = 0;
    let hover = false;
    let focus = false;
    let dragging = false;
    let dragVelocity = 0;
    let tween: { delta: number; done: number; start: number } | null = null;
    let centre = -1;
    let gesture: { id: number; startX: number; startY: number; lastX: number; axis: "x" | "y" | null; moved: number; samples: { t: number; x: number }[] } | null = null;
    let suppressClick = false;

    function measure() {
      const sets = strip!.querySelectorAll<HTMLElement>("[data-copy]");
      if (sets.length > 1) width = sets[1].offsetLeft - sets[0].offsetLeft;
      else width = sets[0]?.offsetWidth ?? 0;
      step = count > 0 ? width / count : 0;
      const needed = copiesFor(count, width, element!.clientWidth);
      if (needed !== copies) setCopies(needed);
      x = wrap(x, width);
    }

    function paint(velocity: number) {
      strip!.style.transform = `translate3d(${x.toFixed(2)}px, 0, 0) skewX(${skewFor(velocity).toFixed(2)}deg)`;
      const all = strip!.querySelectorAll<HTMLElement>("[data-tile]");
      const next = nearestToCenter(x, step, all.length, 0, element!.clientWidth);
      if (next !== centre) {
        all[centre]?.removeAttribute("data-center");
        all[next]?.setAttribute("data-center", "");
        centre = next;
      }
    }

    let lastNow = 0;
    function tick(dt: number, now: number) {
      if (!(width > 0)) measure();
      // Первый кадр после перерыва (лента была за экраном): если она должна стоять, плавно тормозить уже некому смотреть.
      const fresh = now - lastNow > 100;
      lastNow = now;
      if (fresh && !dragging && !tween && (hover || focus || pausedRef.current)) {
        drift = 0;
        momentum = 0;
      }
      let velocity = 0;
      if (dragging) {
        velocity = dragVelocity;
      } else if (tween) {
        const t = Math.min(1, (now - tween.start) / STEP_MS);
        const done = tween.delta * easeOut(t);
        x += done - tween.done;
        velocity = dt > 0 ? ((done - tween.done) / dt) * 1000 : 0;
        tween.done = done;
        if (t >= 1) tween = null;
      } else {
        const still = hover || focus || pausedRef.current;
        drift = approach(drift, still ? 0 : IDLE_SPEED, HOVER_LERP, dt);
        if (Math.abs(drift) < 0.01) drift = still ? 0 : drift;
        momentum = decay(momentum, dt);
        if (Math.abs(momentum) < 1) momentum = 0;
        velocity = drift + momentum;
        x += (velocity * dt) / 1000;
        // Лента стоит (пауза, наведение или фокус) и успокоилась: кадры больше не нужны до следующего действия.
        // Пока кнопка нажата (жест ещё не стал перетаскиванием), цикл не засыпает: после отпускания нужна инерция.
        if (still && drift === 0 && momentum === 0 && !gesture) {
          x = wrap(x, width);
          paint(0);
          sleep();
          return;
        }
      }
      x = wrap(x, width);
      paint(velocity);
    }

    let stop: (() => void) | null = null;
    function wake() {
      if (!stop) stop = subscribeWhileVisible(element!, tick, "100px 0px");
    }
    function sleep() {
      stop?.();
      stop = null;
    }
    wakeRef.current = wake;

    stepRef.current = (direction) => {
      momentum = 0;
      tween = { delta: -direction * step, done: 0, start: performance.now() };
      wake();
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0 || gesture) return;
      wake();
      gesture = { id: event.pointerId, startX: event.clientX, startY: event.clientY, lastX: event.clientX, axis: null, moved: 0, samples: [{ t: event.timeStamp, x: event.clientX }] };
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!gesture || event.pointerId !== gesture.id) return;
      const dx = event.clientX - gesture.startX;
      const dy = event.clientY - gesture.startY;
      if (gesture.axis === null) {
        if (Math.abs(dx) < AXIS_LOCK && Math.abs(dy) < AXIS_LOCK) return;
        gesture.axis = Math.abs(dx) >= Math.abs(dy) ? "x" : "y";
        if (gesture.axis === "y") {
          gesture = null;
          return;
        }
        dragging = true;
        tween = null;
        momentum = 0;
        host!.dataset.dragging = "";
        try {
          element!.setPointerCapture(event.pointerId);
        } catch {
          // Указатель уже отпущен: захват не нужен.
        }
      }
      const shift = event.clientX - gesture.lastX;
      gesture.lastX = event.clientX;
      gesture.moved = Math.max(gesture.moved, Math.abs(dx));
      gesture.samples.push({ t: event.timeStamp, x: event.clientX });
      if (gesture.samples.length > 12) gesture.samples.shift();
      dragVelocity = releaseVelocity(gesture.samples, event.timeStamp);
      x = wrap(x + shift, width);
      paint(dragVelocity);
    };
    const finish = (cancelled: boolean) => (event: PointerEvent) => {
      if (!gesture || event.pointerId !== gesture.id) return;
      if (dragging) {
        momentum = cancelled ? 0 : releaseVelocity(gesture.samples, event.timeStamp);
        suppressClick = !cancelled && gesture.moved > CLICK_SLOP;
        // Бросок катится и тогда, когда курсор остаётся над лентой: цикл будится, а первый кадр после
        // отпускания не считается «после перерыва» (иначе он обнулил бы инерцию как у стоящей ленты).
        lastNow = performance.now();
        wake();
      }
      dragging = false;
      dragVelocity = 0;
      delete host!.dataset.dragging;
      if (element!.hasPointerCapture(event.pointerId)) element!.releasePointerCapture(event.pointerId);
      gesture = null;
    };
    const onPointerUp = finish(false);
    const onPointerCancel = finish(true);
    const onClick = (event: MouseEvent) => {
      if (!suppressClick) return;
      suppressClick = false;
      event.preventDefault();
      event.stopPropagation();
    };
    const onEnter = (event: PointerEvent) => {
      if (event.pointerType === "mouse") hover = true;
    };
    const onLeave = () => {
      hover = false;
      wake();
    };
    // Останавливает дрейф только фокус с клавиатуры: щелчок мышью по ленте ради перетаскивания её не замораживает.
    const onFocusIn = (event: FocusEvent) => {
      const target = event.target as Element | null;
      focus = Boolean(target?.matches(":focus-visible"));
    };
    const onFocusOut = (event: FocusEvent) => {
      if (host!.contains(event.relatedTarget as Node | null)) return;
      focus = false;
      wake();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") stepRef.current(1);
      else if (event.key === "ArrowLeft") stepRef.current(-1);
      else return;
      event.preventDefault();
    };
    const onDragStart = (event: DragEvent) => event.preventDefault();

    element.addEventListener("pointerdown", onPointerDown);
    element.addEventListener("pointermove", onPointerMove);
    element.addEventListener("pointerup", onPointerUp);
    element.addEventListener("pointercancel", onPointerCancel);
    element.addEventListener("click", onClick, true);
    element.addEventListener("pointerenter", onEnter);
    element.addEventListener("pointerleave", onLeave);
    element.addEventListener("keydown", onKey);
    element.addEventListener("dragstart", onDragStart);
    host.addEventListener("focusin", onFocusIn);
    host.addEventListener("focusout", onFocusOut);

    const resize = new ResizeObserver(() => measure());
    resize.observe(element);
    measure();
    x = wrap(0, width);
    paint(0);
    wake();

    return () => {
      sleep();
      wakeRef.current = () => {};
      resize.disconnect();
      element.removeEventListener("pointerdown", onPointerDown);
      element.removeEventListener("pointermove", onPointerMove);
      element.removeEventListener("pointerup", onPointerUp);
      element.removeEventListener("pointercancel", onPointerCancel);
      element.removeEventListener("click", onClick, true);
      element.removeEventListener("pointerenter", onEnter);
      element.removeEventListener("pointerleave", onLeave);
      element.removeEventListener("keydown", onKey);
      element.removeEventListener("dragstart", onDragStart);
      host.removeEventListener("focusin", onFocusIn);
      host.removeEventListener("focusout", onFocusOut);
      strip.style.removeProperty("transform");
      strip.querySelector("[data-center]")?.removeAttribute("data-center");
      delete host.dataset.dragging;
      stepRef.current = () => {};
    };
  }, [motion, copies, tiles.length]);

  if (tiles.length === 0) return <div className={styles.head}>{heading}</div>;

  return (
    <div className={styles.ribbon} ref={root} data-ribbon={motion ? "on" : "native"}>
      <div className={`shell ${styles.head}`}>
        {heading}
        {mounted && tiles.length > 1 ? (
          <div className={styles.controls}>
            <button type="button" className={styles.control} aria-label="Предыдущая категория" onClick={() => stepRef.current(-1)}>
              <ArrowIcon direction="left" />
            </button>
            <button type="button" className={styles.control} aria-label="Следующая категория" onClick={() => stepRef.current(1)}>
              <ArrowIcon />
            </button>
            {motion ? (
              <button type="button" className={`${styles.control} ${styles.pause}`} aria-pressed={paused} onClick={() => setPaused((value) => !value)} data-loop-pause>
                {paused ? "Пуск" : "Пауза"}
                <span className={styles.srOnly}> ленты категорий</span>
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
      <div className={styles.viewport} ref={viewport} role="region" aria-label={label} tabIndex={0} data-ribbon-viewport>
        <div className={styles.track} ref={track} data-ribbon-track>
          {Array.from({ length: Math.max(1, copies) }, (_, copy) => (
            <ul className={styles.set} key={copy} data-copy={copy} aria-hidden={copy > 0 ? true : undefined}>
              {tiles.map((tile) => (
                <li key={tile.label} className={tile.image ? styles.tile : `${styles.tile} ${styles.tileText}`} data-tile data-temp={tile.temp}>
                  <figure>
                    {tile.image ? (
                      <Photo image={tile.image} alt="" sizes="(max-width: 767px) 200px, (max-width: 1023px) 240px, 300px" eager={copy === 0} />
                    ) : (
                      // TEMP: типографическая плитка вместо кадра обуви, пока владелец не одобрит изображение.
                      <span className={styles.tileWord} aria-hidden="true">
                        и обувь
                      </span>
                    )}
                    <figcaption className={styles.chip}>{tile.label}</figcaption>
                  </figure>
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </div>
  );
}
