"use client";

import { useEffect, type RefObject } from "react";
import { createEqualPhotoBands, photoStepForViewport, smoothstep, type EqualPhotoTiming } from "@/lib/equal-photo-motion";

type Options = {
  sectionRef: RefObject<HTMLElement | null>;
  stageRef?: RefObject<HTMLElement | null>;
  stageSelector?: string;
  frameSelector: string;
  frameCount: number;
  progressProperty: string;
  onFrameChange?: (index: number) => void;
  legacyKind?: "hero" | "dark";
};

const MOTION_QUERY = "(min-width: 1024px) and (min-height: 560px)";
const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";

export function useEqualPhotoMotion({
  sectionRef,
  stageRef,
  stageSelector = "[data-motion-stage]",
  frameSelector,
  frameCount,
  progressProperty,
  onFrameChange,
  legacyKind,
}: Options) {
  useEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef?.current ?? section?.querySelector<HTMLElement>(stageSelector);
    if (!section || !stage) return;

    const motion = window.matchMedia(MOTION_QUERY);
    const reduced = window.matchMedia(REDUCED_QUERY);
    let timing: EqualPhotoTiming | null = null;
    let raf: number | null = null;
    let nearby = false;
    let enhanced = false;
    let listening = false;
    let lastProgress = -1;
    let lastFrame = -1;
    let measuredViewport = "";

    const setDiagnostics = (name: "enhanced" | "listener" | "raf", value: string) => {
      if (name === "enhanced") section.dataset.motionEnhanced = value;
      if (name === "listener") section.dataset.motionListener = value;
      if (name === "raf") section.dataset.motionRaf = value;
      if (legacyKind === "hero") {
        if (name === "enhanced") section.dataset.enhanced = value;
        if (name === "listener") section.dataset.listener = value;
        if (name === "raf") section.dataset.raf = value;
      }
      if (legacyKind === "dark") {
        if (name === "enhanced") section.dataset.darkEnhanced = value;
        if (name === "listener") section.dataset.darkListener = value;
        if (name === "raf") section.dataset.darkRaf = value;
      }
    };

    const measure = () => {
      const viewportKey = `${window.innerWidth}x${window.innerHeight}x${stage.offsetHeight}`;
      if (timing && viewportKey === measuredViewport) return;
      measuredViewport = viewportKey;
      const photoStepPx = photoStepForViewport(window.innerHeight);
      timing = createEqualPhotoBands({ frameCount, photoStepPx });
      section.style.setProperty("--motion-height", `${stage.offsetHeight + timing.totalTravelPx}px`);
      section.dataset.photoStep = String(timing.photoStepPx);
      section.dataset.revealDuration = String(timing.revealPx);
      section.dataset.motionIntro = String(timing.introPx);
      section.dataset.finalHold = String(timing.finalHoldPx);
      section.dataset.motionTravel = String(timing.totalTravelPx);
      const frames = section.querySelectorAll<HTMLElement>(frameSelector);
      timing.bands.forEach((band, index) => {
        const frame = frames.item(index);
        if (!frame) return;
        frame.dataset.motionStartPx = String(band.startPx);
        frame.dataset.motionCompletePx = String(band.completePx);
        frame.dataset.motionStart = band.start.toFixed(6);
        frame.dataset.motionComplete = band.complete.toFixed(6);
      });
    };

    const publishFrame = (frame: number) => {
      section.dataset.currentFrame = String(frame + 1);
      section.dataset.visibleCount = String(frame + 1);
      if (legacyKind === "hero") section.dataset.scene = String(frame + 1);
      if (legacyKind === "dark") section.dataset.darkPhase = frame === 0 ? "start" : frame === frameCount - 1 ? "final" : "mid";
      if (frame === lastFrame) return;
      lastFrame = frame;
      onFrameChange?.(frame);
    };

    const update = () => {
      raf = null;
      setDiagnostics("raf", "idle");
      if (!enhanced) return;
      measure();
      if (!timing) return;
      const stickyTop = Number.parseFloat(getComputedStyle(stage).top) || 0;
      const range = Math.max(1, section.offsetHeight - stage.offsetHeight);
      const scrollPx = Math.min(range, Math.max(0, stickyTop - section.getBoundingClientRect().top));
      const rawProgress = scrollPx / range;
      const progress = rawProgress <= 0.001 ? 0 : rawProgress >= 0.999 ? 1 : rawProgress;
      const terminal = progress === 0 || progress === 1;
      if (!terminal && Math.abs(progress - lastProgress) < 0.0005) return;
      if (progress === lastProgress) return;
      lastProgress = progress;

      section.style.setProperty("--motion-progress", progress.toFixed(4));
      section.style.setProperty(progressProperty, progress.toFixed(4));
      const lastComplete = timing.bands.at(-1)?.completePx ?? 1;
      section.style.setProperty("--motion-line", Math.min(1, scrollPx / Math.max(1, lastComplete)).toFixed(4));

      let currentFrame = 0;
      timing.bands.forEach((band, index) => {
        const value = index === 0 ? 1 : smoothstep(scrollPx, band.startPx, band.completePx);
        section.style.setProperty(`--photo-${index + 1}`, value.toFixed(4));
        if (scrollPx + 0.5 >= band.completePx) currentFrame = index;
      });
      section.dataset.motionProgress = progress.toFixed(4);
      section.dataset.motionScrollPx = scrollPx.toFixed(1);
      publishFrame(currentFrame);
    };

    const requestUpdate = () => {
      if (!nearby || !enhanced || raf !== null) return;
      setDiagnostics("raf", "scheduled");
      raf = window.requestAnimationFrame(update);
    };

    const stopListening = () => {
      if (listening) {
        window.removeEventListener("scroll", requestUpdate);
        window.removeEventListener("resize", requestUpdate);
      }
      listening = false;
      setDiagnostics("listener", "inactive");
      if (raf !== null) window.cancelAnimationFrame(raf);
      raf = null;
      setDiagnostics("raf", "idle");
    };

    const syncDrive = () => {
      const shouldListen = enhanced && nearby;
      if (!shouldListen) {
        stopListening();
        return;
      }
      if (!listening) {
        listening = true;
        window.addEventListener("scroll", requestUpdate, { passive: true });
        window.addEventListener("resize", requestUpdate, { passive: true });
        setDiagnostics("listener", "active");
      }
      measuredViewport = "";
      requestUpdate();
    };

    const clearMotionStyles = () => {
      section.style.removeProperty("--motion-height");
      section.style.removeProperty("--motion-progress");
      section.style.removeProperty("--motion-line");
      section.style.removeProperty(progressProperty);
      for (let index = 1; index <= frameCount; index += 1) section.style.removeProperty(`--photo-${index}`);
    };

    const applyMode = () => {
      enhanced = motion.matches && !reduced.matches;
      section.dataset.motionReady = "true";
      setDiagnostics("enhanced", String(enhanced));
      lastProgress = -1;
      lastFrame = -1;
      measuredViewport = "";
      if (enhanced) {
        measure();
      } else {
        stopListening();
        clearMotionStyles();
        section.dataset.motionProgress = "1.0000";
        section.dataset.motionScrollPx = "0.0";
        section.dataset.currentFrame = "1";
        section.dataset.visibleCount = String(frameCount);
        if (legacyKind === "hero") section.dataset.scene = String(frameCount);
        if (legacyKind === "dark") section.dataset.darkPhase = "final";
        lastFrame = 0;
        onFrameChange?.(0);
      }
      syncDrive();
    };

    const observer = new IntersectionObserver(([entry]) => {
      nearby = entry.isIntersecting;
      syncDrive();
    }, { threshold: 0 });

    motion.addEventListener("change", applyMode);
    reduced.addEventListener("change", applyMode);
    observer.observe(section);
    applyMode();

    return () => {
      motion.removeEventListener("change", applyMode);
      reduced.removeEventListener("change", applyMode);
      observer.disconnect();
      stopListening();
      clearMotionStyles();
    };
  }, [frameCount, frameSelector, legacyKind, onFrameChange, progressProperty, sectionRef, stageRef, stageSelector]);
}
