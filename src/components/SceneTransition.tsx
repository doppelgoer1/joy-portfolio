"use client";

import { useRef, type ReactNode, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);
const easeInOut = (t: number) => t < .5 ? 8 * t ** 4 : 1 - (-2 * t + 2) ** 4 / 2;
const readingProgress = .72;

export type SceneController = { prepareNext: () => void; reveal: (animate: boolean, next?: boolean) => void };

// Only T2 owns a pin. Its mask reveals the original detail document over the
// original stage; both remain at their final size throughout the handoff.
export function SceneTransition({ children, controller }: {
  children: ReactNode;
  controller: RefObject<SceneController | null>;
}) {
  const scope = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    const root = scope.current!;
    const page = root.querySelector<HTMLElement>(".scene-page")!;
    const reading = root.querySelector<HTMLElement>(".scene-reading")!;
    const line = root.querySelector<HTMLElement>(".scene-line")!;
    const work = root.closest<HTMLElement>(".work-stage")!;
    const media = gsap.matchMedia();
    media.add({ mobile: "(max-width: 780px)", desktop: "(min-width: 781px)", reduced: "(prefers-reduced-motion: reduce)" }, context => {
      const { mobile, reduced } = context.conditions!;
      root.dataset.motion = reduced ? "reduced" : "full";
      let playback: gsap.core.Tween | undefined;
      let focusFrame = 0;
      let refreshFrame = 0;
      let alive = true;
      let refreshing = false;
      const timeline = gsap.timeline({ paused: true });
      const distance = () => innerHeight * (root.dataset.next === "true" ? .8 : mobile ? 1.3 : 1.6);
      const ready = (progress: number) => {
        root.dataset.progress = progress.toFixed(4);
        root.dataset.ready = String(progress >= readingProgress - .001);
      };
      const beforeRefresh = () => { refreshing = true; work.dataset.refreshing = "true"; };
      const afterRefresh = () => { delete work.dataset.refreshing; refreshing = false; };
      ScrollTrigger.addEventListener("refreshInit", beforeRefresh);
      ScrollTrigger.addEventListener("refresh", afterRefresh);
      let trigger: ScrollTrigger | undefined;
      if (!reduced) {
        timeline.fromTo(root, { "--wipe-right": "100%" }, { "--wipe-right": "0%", duration: .64, ease: easeInOut }, .08)
          .fromTo(line, { x: 0 }, { x: () => innerWidth, duration: .64, ease: easeInOut }, .08)
          .to({}, { duration: .28 }, readingProgress);
        trigger = ScrollTrigger.create({
          id: "t2", trigger: root, pin: page, start: "top top", end: () => `+=${distance()}`,
          animation: timeline, scrub: .6, anticipatePin: 1, invalidateOnRefresh: true,
          onRefresh: self => {
            ready(self.progress);
            root.dataset.start = String(self.start);
            root.dataset.end = String(self.end);
            root.dataset.distance = String(distance());
          },
        });
        timeline.eventCallback("onUpdate", () => { if (!refreshing) ready(timeline.progress()); });
        ready(trigger.progress);
      } else ready(1);

      const stopPlayback = () => { playback?.kill(); delete root.dataset.playing; };
      const settle = (progress: number) => {
        if (!trigger) return;
        window.scrollTo({ top: trigger.start + (trigger.end - trigger.start) * progress, behavior: "instant" });
        ScrollTrigger.update();
        trigger.getTween()?.progress(1);
        timeline.progress(progress);
        ready(progress);
      };
      const reveal = (animate: boolean, next = false) => {
        stopPlayback();
        root.dataset.next = String(next);
        if (!trigger) { reading.scrollIntoView({ block: "start", behavior: "instant" }); return; }
        ScrollTrigger.refresh();
        if (!animate) { settle(readingProgress); return; }
        settle(0);
        trigger.getTween()?.pause();
        root.dataset.playing = "true";
        playback = gsap.to(timeline, { progress: readingProgress, duration: next ? .8 : 1, ease: "none", onComplete: () => {
          delete root.dataset.playing;
          settle(readingProgress);
          reading.querySelector<HTMLElement>("article:not([hidden])")?.focus({ preventScroll: true });
        } });
      };
      controller.current = { reveal, prepareNext: stopPlayback };
      const cancel = () => {
        cancelAnimationFrame(focusFrame);
        if (!root.dataset.playing) return;
        // Commit the current visual position to native scroll before handing
        // control back, so an interrupt never jumps to the start of the wipe.
        const progress = timeline.progress();
        stopPlayback();
        settle(progress);
      };
      const focusReading = (event: FocusEvent) => {
        const target = event.target as HTMLElement;
        if (root.dataset.playing || root.dataset.ready !== "true") reveal(false);
        const alignFocus = () => {
          if (!target.isConnected || document.activeElement !== target) return;
          const rect = target.getBoundingClientRect();
          const top = document.querySelector<HTMLElement>(".site-header")?.offsetHeight ?? 0;
          if (rect.height <= innerHeight - top) {
            const delta = rect.top < top ? rect.top - top : Math.max(0, rect.bottom - innerHeight);
            if (delta) {
              // Leave the pin before aligning a leaf below the initial fold.
              if (trigger && scrollY < trigger.end) settle(1);
              const box = target.getBoundingClientRect();
              window.scrollBy({ top: box.top < top ? box.top - top : Math.max(0, box.bottom - innerHeight), behavior: "instant" });
            }
          }
          ScrollTrigger.update();
        };
        alignFocus();
        cancelAnimationFrame(focusFrame);
        focusFrame = requestAnimationFrame(alignFocus);
      };
      const keyCancel = (event: KeyboardEvent) => {
        if (["ArrowLeft", "ArrowRight", "ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", "Tab", "Escape", " "].includes(event.key)) cancel();
      };
      let stageFocus: HTMLElement | null = null;
      const rememberFocus = () => {
        const active = document.activeElement as HTMLElement | null;
        stageFocus = active?.closest(".t1-reading") ? active : null;
      };
      const restoreFocus = () => {
        if (stageFocus?.isConnected && document.activeElement === document.body && getComputedStyle(stageFocus).visibility === "visible") stageFocus.focus({ preventScroll: true });
        stageFocus = null;
      };
      ScrollTrigger.addEventListener("refreshInit", rememberFocus);
      ScrollTrigger.addEventListener("refresh", restoreFocus);
      const resize = new ResizeObserver(() => {
        cancelAnimationFrame(refreshFrame);
        refreshFrame = requestAnimationFrame(() => { if (alive) ScrollTrigger.refresh(); });
      });
      if (!reduced) resize.observe(reading);
      document.fonts.ready.then(() => { if (alive && !reduced) ScrollTrigger.refresh(); });
      reading.addEventListener("focusin", focusReading);
      window.addEventListener("wheel", cancel, { passive: true });
      window.addEventListener("touchstart", cancel, { passive: true });
      window.addEventListener("pointerdown", cancel, { passive: true });
      window.addEventListener("keydown", keyCancel);
      return () => {
        alive = false; cancelAnimationFrame(focusFrame); cancelAnimationFrame(refreshFrame);
        stopPlayback(); resize.disconnect();
        reading.removeEventListener("focusin", focusReading);
        ScrollTrigger.removeEventListener("refreshInit", beforeRefresh);
        ScrollTrigger.removeEventListener("refresh", afterRefresh);
        ScrollTrigger.removeEventListener("refreshInit", rememberFocus);
        ScrollTrigger.removeEventListener("refresh", restoreFocus);
        window.removeEventListener("wheel", cancel);
        window.removeEventListener("touchstart", cancel);
        window.removeEventListener("pointerdown", cancel);
        window.removeEventListener("keydown", keyCancel);
        controller.current = null;
        delete root.dataset.motion; delete root.dataset.ready;
      };
    });
    return () => media.revert();
  }, { scope });
  return <div ref={scope} className="motion-scene t2">
    <div className="scene-page">
      <div className="scene-reading">{children}</div>
      <div className="scene-line-track" aria-hidden="true"><div className="scene-line" /></div>
    </div>
  </div>;
}
