"use client";

import { useRef, type ReactNode, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import type { ProjectEntry } from "../data/portfolio";

gsap.registerPlugin(ScrollTrigger, useGSAP);
const easeSoft = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t: number) => t < .5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
const comfortRatio = 3.6 / 2.2;

// An inert visual echo uses the existing DOM and its computed layout, never an
// invented screenshot. Strip identifiers and semantics so links remain unique.
const echoStyles = ["display", "box-sizing", "width", "height", "min-width", "min-height", "max-width", "max-height", "padding", "margin", "border", "background", "color", "font-family", "font-size", "font-weight", "font-style", "line-height", "letter-spacing", "text-align", "text-transform", "text-decoration", "white-space", "word-break", "overflow-wrap", "position", "top", "right", "bottom", "left", "z-index", "transform", "transform-origin", "perspective", "perspective-origin", "opacity", "visibility", "overflow", "clip-path", "grid-template-columns", "grid-template-rows", "grid-column", "grid-row", "grid-auto-flow", "grid-auto-columns", "gap", "flex", "flex-direction", "flex-wrap", "align-items", "align-self", "align-content", "justify-content", "justify-items", "justify-self", "list-style", "box-shadow", "filter"];
function echoDocument(original: HTMLElement, container: HTMLElement, tail: boolean) {
  const copy = original.cloneNode(true) as HTMLElement;
  const originals = [original, ...original.querySelectorAll<HTMLElement>("*")];
  const copies = [copy, ...copy.querySelectorAll<HTMLElement>("*")];
  originals.forEach((element, index) => {
    const clone = copies[index];
    const style = getComputedStyle(element);
    clone.removeAttribute("id"); clone.removeAttribute("class"); clone.removeAttribute("role");
    clone.removeAttribute("href"); clone.removeAttribute("tabindex");
    for (const attribute of [...clone.attributes]) if (attribute.name.startsWith("aria-") || attribute.name.startsWith("data-")) clone.removeAttribute(attribute.name);
    clone.style.cssText = echoStyles.map(property => `${property}:${style.getPropertyValue(property)}`).join(";");
    clone.style.animation = "none"; clone.style.transition = "none";
    if (element.matches(".stage-index, .stage-deck")) clone.style.opacity = "1";
    if (original.matches(".t1-reading")) {
      // The real T1 viewport is hidden before the hero ends. That inherited
      // visibility must not become an inline override inside this future echo.
      clone.style.visibility = "visible";
      if (element.matches('.stage-card[data-distant="true"]') || (innerWidth <= 780 && element.matches('.stage-card[data-position="-1"]'))) clone.style.display = "none";
    }
  });
  copy.inert = true;
  copy.style.position = "absolute"; copy.style.margin = "0";
  copy.style.top = tail ? `${Math.min(0, innerHeight - original.offsetHeight)}px` : "0";
  copy.style.left = "0"; copy.style.opacity = "1";
  container.replaceChildren(copy);
}

export type SceneController = { prepareNext: () => void; reveal: (animate: boolean, next?: boolean) => void };

// Each scene pins the actual document once. At the endpoint it resumes normal
// document flow, including the portion below the fold; only originals are interactive.
export function SceneTransition({ kind, children, entries, selected = 0, controller }: {
  kind: "t2" | "t3" | "t4";
  children: ReactNode;
  entries?: ProjectEntry[];
  selected?: number;
  controller?: RefObject<SceneController | null>;
}) {
  const scope = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    const root = scope.current!;
    const page = root.querySelector<HTMLElement>(".scene-page")!;
    const reading = root.querySelector<HTMLElement>(".scene-reading")!;
    const source = root.querySelector<HTMLElement>(".scene-source")!;
    const echo = root.querySelector<HTMLElement>(".scene-echo")!;
    const front = root.querySelector<HTMLElement>(".scene-front")!;
    const doors = [...root.querySelectorAll<HTMLElement>(".scene-door")];
    const media = gsap.matchMedia();
    media.add({ mobile: "(max-width: 780px)", desktop: "(min-width: 781px)", reduced: "(prefers-reduced-motion: reduce)" }, context => {
      const { mobile, reduced } = context.conditions!;
      root.dataset.motion = reduced ? "reduced" : "full";
      let playback: gsap.core.Tween | undefined;
      let frame = 0;
      let focusFrame = 0;
      let alive = true;
      let refreshing = false;
      let echoKey = "";
      const captureSource = () => {
        const original = document.querySelector<HTMLElement>(kind === "t2" ? ".t1-reading" : kind === "t3" ? ".stage-panel:not([hidden])" : ".career-section");
        const key = `${innerWidth}:${innerHeight}:${document.querySelector(".stage-panel:not([hidden])")?.id}`;
        if (original && root.dataset.next !== "true" && key !== echoKey) {
          echoDocument(original, echo, kind !== "t2");
          echoKey = key;
        }
      };
      const plate = () => {
        const card = document.querySelector<HTMLElement>('.stage-card[data-position="0"]')!;
        const stage = document.querySelector<HTMLElement>(".stage")!.getBoundingClientRect();
        const view = document.querySelector<HTMLElement>(".t1-viewport")!.getBoundingClientRect();
        return { sx: card.offsetWidth / (innerWidth * 1.12), sy: card.offsetHeight / (innerHeight * 1.12), x: stage.left + stage.width / 2 - view.left - innerWidth / 2, y: stage.top + stage.height / 2 - view.top - innerHeight / 2 };
      };
      const timeline = gsap.timeline({ paused: true });
      const distance = () => innerHeight * (kind === "t2" ? (root.dataset.next === "true" ? .8 : 1.2) : 1) * comfortRatio * (mobile ? .8 : 1);
      const ready = (p: number) => {
        root.dataset.progress = p.toFixed(4);
        root.dataset.ready = String(p >= .999);
        // Keyboard focus may bypass a decorative transition into real content.
        reading.inert = false;
      };
      if (!reduced) {
        if (kind === "t2") {
          timeline.fromTo(front, { scaleX: () => root.dataset.next === "true" ? .002 : plate().sx, scaleY: () => root.dataset.next === "true" ? .002 : plate().sy, x: () => root.dataset.next === "true" ? 0 : plate().x, y: () => root.dataset.next === "true" ? 0 : plate().y },
            { scaleX: 1, scaleY: 1, x: 0, y: 0, duration: .4, ease: easeSoft }, 0)
            .fromTo(".scene-name", { scaleX: () => .5 / plate().sx, scaleY: () => .5 / plate().sy }, { scaleX: 1, scaleY: 1, duration: .4, ease: easeSoft }, 0)
            .fromTo(front, { opacity: 0 }, { opacity: 1, duration: .025, ease: "none" }, 0)
            .to(echo, { opacity: .38, duration: .4, ease: easeSoft }, 0)
            .to(source, { opacity: 0, duration: 0 }, .4)
            .to(doors[0], { yPercent: -100, duration: .4, ease: easeInOut }, .4)
            .to(doors[1], { yPercent: 100, duration: .4, ease: easeInOut }, .4);
        } else if (kind === "t3") {
          timeline.to(echo, { opacity: .38, duration: .25, ease: easeSoft }, 0)
            .fromTo(front, { scaleX: .012, scaleY: .02 }, { scaleY: 1, duration: .25, ease: easeSoft }, 0)
            .to(front, { scaleX: 1, duration: .2, ease: easeSoft }, .2)
            .to(source, { opacity: 0, duration: 0 }, .4)
            .to(doors[0], { xPercent: -100, duration: .4, ease: easeInOut }, .4)
            .to(doors[1], { xPercent: 100, duration: .4, ease: easeInOut }, .4);
        } else {
          timeline.fromTo(reading, { y: () => innerHeight }, { y: 0, duration: .75, ease: easeInOut }, 0)
            .to(source, { opacity: 0, duration: 0 }, .75);
        }
        // Keep the final frame still before the pin releases.
        timeline.to({}, { duration: .2 }, .8);
      }
      let trigger: ScrollTrigger | undefined;
      if (!reduced) {
        trigger = ScrollTrigger.create({
          id: kind, trigger: root, pin: page, start: "top top", end: () => `+=${distance()}`,
          animation: timeline, scrub: .6, anticipatePin: 1, invalidateOnRefresh: true,
          onRefreshInit: () => { refreshing = true; },
          onRefresh: self => { refreshing = false; ready(self.progress); captureSource(); root.dataset.start = String(self.start); root.dataset.end = String(self.end); root.dataset.distance = String(distance()); },
        });
        timeline.eventCallback("onUpdate", () => { if (!refreshing) ready(timeline.progress()); });
        ready(trigger.progress);
      } else ready(1);

      const reveal = (animate: boolean, next = false) => {
        playback?.kill();
        delete root.dataset.playing;
        if (!trigger) { reading.scrollIntoView({ block: "start", behavior: "instant" }); return; }
        root.dataset.next = String(next);
        if (!next) echoKey = "";
        timeline.invalidate();
        ScrollTrigger.refresh();
        captureSource();
        if (!animate) {
          window.scrollTo({ top: trigger.end, behavior: "instant" });
          ScrollTrigger.update(); trigger.getTween()?.progress(1); timeline.progress(1); ready(1);
          return;
        }
        // One explicit selection plays the same scene in 1.2s. Native input
        // cancels playback immediately; it never starts another scroll tween.
        window.scrollTo({ top: trigger.start, behavior: "instant" });
        ScrollTrigger.update(); trigger.getTween()?.pause(); timeline.progress(0);
        root.dataset.playing = "true";
        root.dataset.next = String(next);
        playback = gsap.to(timeline, { progress: 1, duration: next ? .8 : 1.2, ease: "none", onComplete: () => {
          delete root.dataset.playing;
          window.scrollTo({ top: trigger!.end, behavior: "instant" });
          ScrollTrigger.update(); trigger!.getTween()?.progress(1); timeline.progress(1); ready(1);
          reading.querySelector<HTMLElement>("article:not([hidden]), section, footer")?.focus({ preventScroll: true });
        } });
      };
      if (controller) controller.current = { reveal, prepareNext: () => {
        const current = reading.querySelector<HTMLElement>(".stage-panel:not([hidden])");
        if (current) echoDocument(current, echo, true);
      } };
      const cancel = () => {
        cancelAnimationFrame(focusFrame);
        if (!root.dataset.playing) return;
        playback?.kill(); delete root.dataset.playing;
        trigger?.update(); timeline.progress(trigger?.progress ?? 1);
      };
      const focusReading = (event: FocusEvent) => {
        const target = event.target as HTMLElement;
        if (root.dataset.playing || root.dataset.ready !== "true") reveal(false);
        const alignFocus = () => {
          if (!target.isConnected || document.activeElement !== target) return;
          const rect = target.getBoundingClientRect();
          const top = document.querySelector<HTMLElement>(".site-header")?.offsetHeight ?? 0;
          // Pin spacers can make native scrollIntoView treat an offscreen link
          // as visible. Align only the focused leaf against the real viewport.
          if (rect.height <= innerHeight - top) {
            const delta = rect.top < top ? rect.top - top : Math.max(0, rect.bottom - innerHeight);
            if (delta) window.scrollBy({ top: delta, behavior: "instant" });
          }
          if (trigger) ScrollTrigger.update();
        };
        alignFocus();
        // Native focus scrolling can finish after the pin's synchronous reflow.
        // Align once on the next frame; new user input cancels this pending work.
        cancelAnimationFrame(focusFrame);
        focusFrame = requestAnimationFrame(alignFocus);
      };
      reading.addEventListener("focusin", focusReading);
      const keyCancel = (event: KeyboardEvent) => { if (["ArrowLeft", "ArrowRight", "ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", "Tab", "Escape", " "].includes(event.key)) cancel(); };
      let stageFocus: HTMLElement | null = null;
      const rememberFocus = () => {
        const active = document.activeElement as HTMLElement | null;
        stageFocus = active?.closest(".t1-reading") ? active : null;
      };
      const restoreFocus = () => {
        // Refresh temporarily reverts the T1 pin. Preserve native keyboard focus
        // if that temporary visibility change caused the browser to blur it.
        if (stageFocus?.isConnected && document.activeElement === document.body && getComputedStyle(stageFocus).visibility === "visible") stageFocus.focus({ preventScroll: true });
        stageFocus = null;
      };
      if (kind === "t2" && !reduced) {
        ScrollTrigger.addEventListener("refreshInit", rememberFocus);
        ScrollTrigger.addEventListener("refresh", restoreFocus);
      }
      const anchor = () => {
        if (kind === "t2") return; // WorkStage resolves project selection before measuring.
        const target = document.getElementById(location.hash.slice(1));
        if (!target || !reading.contains(target)) return;
        reveal(false);
        if (target.id === "education") target.scrollIntoView({ block: "start", behavior: "instant" });
      };
      const click = (event: MouseEvent) => {
        if (kind === "t2" || event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        const link = (event.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
        const target = link && document.getElementById(link.hash.slice(1));
        if (!target || !reading.contains(target)) return;
        event.preventDefault(); event.stopPropagation(); history.pushState(null, "", link!.hash); anchor();
      };
      const refresh = () => {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => { if (alive) ScrollTrigger.refresh(); });
      };
      const resize = new ResizeObserver(refresh);
      if (!reduced) resize.observe(reading);
      document.fonts.ready.then(() => { if (alive) { if (!reduced) ScrollTrigger.refresh(); anchor(); } });
      window.addEventListener("wheel", cancel, { passive: true });
      window.addEventListener("touchstart", cancel, { passive: true });
      window.addEventListener("pointerdown", cancel, { passive: true });
      window.addEventListener("keydown", keyCancel);
      window.addEventListener("hashchange", anchor);
      document.addEventListener("click", click, true);
      return () => {
        alive = false; cancelAnimationFrame(frame); cancelAnimationFrame(focusFrame); playback?.kill(); resize.disconnect();
        reading.removeEventListener("focusin", focusReading);
        ScrollTrigger.removeEventListener("refreshInit", rememberFocus);
        ScrollTrigger.removeEventListener("refresh", restoreFocus);
        window.removeEventListener("pointerdown", cancel);
        window.removeEventListener("wheel", cancel); window.removeEventListener("touchstart", cancel);
        window.removeEventListener("keydown", keyCancel); window.removeEventListener("hashchange", anchor);
        document.removeEventListener("click", click, true);
        reading.inert = false;
        if (controller) controller.current = null;
        delete root.dataset.motion; delete root.dataset.ready; delete root.dataset.playing;
      };
    });
    return () => media.revert();
  }, { scope });
  const name = entries?.[selected].project.name;
  return <div ref={scope} className={`motion-scene ${kind}`}>
    <div className="scene-static-curtain" aria-hidden="true" />
    <div className="scene-page">
      <div className="scene-reading">{children}</div>
      <div className="scene-effects" aria-hidden="true" inert>
      <div className="scene-source" aria-hidden="true" inert><div className="scene-echo" /></div>
      <div className="scene-front" aria-hidden="true">
        {[0, 1].map(i => <div className={`scene-door scene-door-${i}`} key={i}>{name && <div className="scene-door-content"><span className="scene-number">0{selected + 1}</span><span className="scene-name">{name}</span></div>}</div>)}
      </div>
      </div>
    </div>
  </div>;
}
