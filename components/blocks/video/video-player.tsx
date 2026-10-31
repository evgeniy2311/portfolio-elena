"use client";

import { useEffect, useRef, useState } from "react";
import type { Vars } from "@/components/ui/css-vars";
import { responsivePath } from "@/lib/media-path";
import type { VideoClip } from "@/lib/site";

const PHONE = "(max-width: 767px)";
const REDUCED = "(prefers-reduced-motion: reduce)";

type TileState = "idle" | "playing" | "paused" | "blocked";

type Props = { clips: VideoClip[]; rowClassName: string; tileClassName: string; barClassName: string; toggleClassName: string };

/**
 * Ролики «видео из фото». Играют только плитки, видимые не меньше чем наполовину, по порядку и не больше
 * 1 на телефоне и 2 на компьютере. Скрытая вкладка, уход с экрана и reduced motion ставят паузу; при
 * reduced motion автозапуска нет, ролик включается кнопкой. Если браузер запретил автозапуск, плитка
 * остаётся с постером и кнопкой «Смотреть ролик». Пауза кнопкой держится, пока её не снимут.
 */
export function VideoPlayers({ clips, rowClassName, tileClassName, barClassName, toggleClassName }: Props) {
  const videoRefs = useRef<Array<HTMLVideoElement | null>>([]);
  const [states, setStates] = useState<TileState[]>(() => clips.map(() => "idle"));
  // Высокочастотное состояние — в ref: видимость, ручная пауза, ручной запуск.
  const control = useRef({ visible: clips.map(() => false), userPaused: clips.map(() => false), userPlay: clips.map(() => false), sync: () => {} });

  useEffect(() => {
    const videos = videoRefs.current;
    const phone = window.matchMedia(PHONE);
    const reduced = window.matchMedia(REDUCED);
    const current = control.current;
    const setState = (index: number, state: TileState) => setStates((prev) => (prev[index] === state ? prev : prev.map((item, i) => (i === index ? state : item))));

    function start(index: number) {
      const video = videos[index];
      if (!video || !video.paused) return;
      video.play().then(
        () => setState(index, "playing"),
        (error: unknown) => {
          // AbortError: запуск прервала наша же пауза (ролик ушёл с экрана) или новая загрузка. Это не запрет
          // браузера; вид уже выставит событие pause или следующий sync.
          if (error instanceof DOMException && error.name === "AbortError") return;
          // Браузер не дал включить: остаётся постер и кнопка.
          current.userPlay[index] = false;
          setState(index, "blocked");
        },
      );
    }

    function stop(index: number, state: TileState) {
      const video = videos[index];
      if (video && !video.paused) video.pause();
      setState(index, state);
    }

    function sync() {
      const limit = phone.matches ? 1 : 2;
      const active = document.visibilityState === "visible";
      const wanted: number[] = [];
      // Сначала ролики, включённые вручную, затем автозапуск по порядку (без reduced motion).
      clips.forEach((_, index) => {
        if (active && current.visible[index] && current.userPlay[index]) wanted.push(index);
      });
      if (!reduced.matches)
        clips.forEach((_, index) => {
          if (active && current.visible[index] && !current.userPaused[index] && !wanted.includes(index)) wanted.push(index);
        });
      const chosen = new Set(wanted.slice(0, limit));
      clips.forEach((_, index) => {
        if (chosen.has(index)) start(index);
        else stop(index, current.userPaused[index] ? "paused" : "idle");
      });
    }
    current.sync = sync;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const index = videos.indexOf(entry.target as HTMLVideoElement);
          if (index >= 0) current.visible[index] = entry.isIntersecting && entry.intersectionRatio >= 0.5;
        }
        sync();
      },
      { threshold: [0, 0.5, 1] },
    );
    for (const video of videos) if (video) observer.observe(video);
    // Вид следует настоящему состоянию ролика: его может запустить или остановить и не этот компонент
    // (браузер ставит паузу сам, системные кнопки медиа).
    const media = videos.map((video, index) => {
      if (!video) return () => {};
      const onPlay = () => setState(index, "playing");
      const onPause = () => setState(index, current.userPaused[index] ? "paused" : "idle");
      video.addEventListener("playing", onPlay);
      video.addEventListener("pause", onPause);
      return () => {
        video.removeEventListener("playing", onPlay);
        video.removeEventListener("pause", onPause);
      };
    });
    document.addEventListener("visibilitychange", sync);
    phone.addEventListener("change", sync);
    reduced.addEventListener("change", sync);
    return () => {
      observer.disconnect();
      for (const off of media) off();
      document.removeEventListener("visibilitychange", sync);
      phone.removeEventListener("change", sync);
      reduced.removeEventListener("change", sync);
      current.sync = () => {};
      for (const video of videos) video?.pause();
    };
  }, [clips]);

  function toggle(index: number) {
    const current = control.current;
    const video = videoRefs.current[index];
    if (video && !video.paused) {
      current.userPaused[index] = true;
      current.userPlay[index] = false;
    } else {
      current.userPaused[index] = false;
      current.userPlay[index] = true;
    }
    current.sync();
  }

  return (
    <ul className={rowClassName} data-video-row="" aria-label="Ролики из фото" tabIndex={0}>
      {clips.map((clip, index) => {
        const state = states[index];
        const poster = responsivePath(clip.poster.src, 640, "webp") ?? clip.poster.src;
        const playingNow = state === "playing";
        return (
          <li key={clip.label} className={tileClassName} data-video-tile="" data-state={state} data-reveal="letterbox" style={{ "--d": `${index * 120}ms` } as Vars}>
            <video
              ref={(element) => {
                videoRefs.current[index] = element;
              }}
              muted
              loop
              playsInline
              preload="none"
              poster={poster}
              width={clip.poster.width}
              height={clip.poster.height}
              aria-label={clip.label}
            >
              {clip.sources.map((source) => (
                <source key={source.src} src={source.src} type={source.type} />
              ))}
            </video>
            <button type="button" className={toggleClassName} data-video-toggle="" aria-label={playingNow ? `Пауза: ${clip.label}` : `Смотреть ролик: ${clip.label}`} onClick={() => toggle(index)}>
              <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                {playingNow ? <path d="M7 5h3v14H7zM14 5h3v14h-3z" fill="currentColor" /> : <path d="M8 5v14l11-7z" fill="currentColor" />}
              </svg>
            </button>
            <span className={barClassName} data-bar="top" aria-hidden="true" />
            <span className={barClassName} data-bar="bottom" aria-hidden="true" />
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Точки под лентой на телефоне: показывают текущую плитку и прокручивают к выбранной.
 * Без JS не показываются (лента листается пальцем); на широком экране скрыты стилями.
 */
export function SnapDots({ count, className }: { count: number; className: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const row = ref.current?.parentElement?.querySelector<HTMLElement>("[data-video-row]");
    if (!row) return;
    setReady(true);
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const tiles = Array.from(row.children) as HTMLElement[];
        const center = row.scrollLeft + row.clientWidth / 2;
        let best = 0;
        tiles.forEach((tile, index) => {
          const distance = Math.abs(tile.offsetLeft + tile.offsetWidth / 2 - center);
          const bestDistance = Math.abs(tiles[best].offsetLeft + tiles[best].offsetWidth / 2 - center);
          if (distance < bestDistance) best = index;
        });
        setActive(best);
      });
    };
    row.addEventListener("scroll", update, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      row.removeEventListener("scroll", update);
    };
  }, []);

  function go(index: number) {
    const row = ref.current?.parentElement?.querySelector<HTMLElement>("[data-video-row]");
    const tile = row?.children[index] as HTMLElement | undefined;
    if (!row || !tile) return;
    const reduced = window.matchMedia(REDUCED).matches;
    row.scrollTo({ left: tile.offsetLeft, behavior: reduced ? "auto" : "smooth" });
    setActive(index);
  }

  if (count < 2) return null;
  return (
    <div ref={ref} className={className} data-video-dots="" hidden={!ready}>
      {Array.from({ length: count }, (_, index) => (
        <button key={index} type="button" aria-label={`Плитка ${index + 1} из ${count}`} aria-current={index === active ? "true" : undefined} onClick={() => go(index)} />
      ))}
    </div>
  );
}
