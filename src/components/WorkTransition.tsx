"use client";

import { useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import type { ProjectEntry } from "../data/portfolio";

gsap.registerPlugin(ScrollTrigger, useGSAP);

// The same cubic growth and quartic docking curves as the untouched JoyHero.
const easeSoft = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t: number) =>
  t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;

export function WorkTransition({ entries, selected, children }: { entries: ProjectEntry[]; selected: number; children: ReactNode }) {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const root = scope.current!;
    const viewport = root.querySelector<HTMLElement>(".t1-viewport")!;
    const reading = root.querySelector<HTMLElement>(".t1-reading")!;
    const anchor = root.querySelector<HTMLElement>("#work")!;
    const media = gsap.matchMedia();
    media.add({
      mobile: "(max-width: 780px)",
      desktop: "(min-width: 781px)",
      reduced: "(prefers-reduced-motion: reduce)",
    }, (context) => {
      const { mobile, reduced } = context.conditions!;
      if (reduced) {
        root.dataset.motion = "reduced";
        const updateHeader = () => { root.dataset.staticReady = String(anchor.getBoundingClientRect().top <= 1); };
        updateHeader();
        window.addEventListener("scroll", updateHeader, { passive: true });
        return () => {
          window.removeEventListener("scroll", updateHeader);
          delete root.dataset.motion;
          delete root.dataset.staticReady;
        };
      }

      root.dataset.motion = "full";
      const distance = () => window.innerHeight * (mobile ? 1.76 : 2.2);
      const local = (selector: string) => root.querySelector<HTMLElement>(selector)!;
      const poster = local(".t1-poster");
      const number = local(".t1-number");
      const intro = local(".t1-intro");
      const rail = local(".stage-index");
      const deck = local(".stage-deck");
      const labels = [...root.querySelectorAll<HTMLElement>(".t1-label")];
      const labelLayers = labels.map(label => ({
        label,
        ink: label.querySelector<HTMLElement>(".t1-label-ink")!,
        paper: label.querySelector<HTMLElement>(".t1-label-paper")!,
      }));
      const updateLabelClips = () => {
        const panel = poster.getBoundingClientRect();
        // Read after GSAP renders the panel and labels; batch all reads before clip writes.
        const bounds = labelLayers.map(({ label }) => label.getBoundingClientRect());
        labelLayers.forEach(({ label, ink, paper }, index) => {
          const box = bounds[index];
          const scale = Number(gsap.getProperty(label, "scaleX"));
          const width = box.width / scale, height = box.height / scale;
          const left = Math.max(0, Math.min(width, (panel.left - box.left) / scale));
          const right = Math.max(0, Math.min(width, (panel.right - box.left) / scale));
          const top = Math.max(0, Math.min(height, (panel.top - box.top) / scale));
          const bottom = Math.max(0, Math.min(height, (panel.bottom - box.top) / scale));
          paper.style.clipPath = `inset(${top}px ${width - right}px ${height - bottom}px ${left}px)`;
          if (left >= right || top >= bottom) {
            ink.style.clipPath = "inset(0)";
          } else if (top === 0 && bottom === height && right === width) {
            // Desktop docking crosses the panel's left edge, even within a single glyph.
            ink.style.clipPath = `inset(0 ${width - left}px 0 0)`;
          } else if (top === 0 && bottom === height && left === 0) {
            ink.style.clipPath = `inset(0 0 0 ${right}px)`;
          } else if (left === 0 && right === width && bottom === height) {
            ink.style.clipPath = `inset(0 0 ${height - top}px 0)`;
          } else if (left === 0 && right === width && top === 0) {
            ink.style.clipPath = `inset(${bottom}px 0 0 0)`;
          } else {
            // A corner/interior intersection needs a rectangular hole, not one inset.
            ink.style.clipPath = `polygon(evenodd, 0 0, ${width}px 0, ${width}px ${height}px, 0 ${height}px, 0 0, ${left}px ${top}px, ${right}px ${top}px, ${right}px ${bottom}px, ${left}px ${bottom}px, ${left}px ${top}px, 0 0)`;
          }
        });
      };
      const destinations = [...root.querySelectorAll<HTMLElement>(".stage-index a > span:nth-child(2)")];
      const panelName = local(".t1-plate-name");
      const rect = (element: HTMLElement) => {
        const box = element.getBoundingClientRect();
        const base = viewport.getBoundingClientRect();
        return { x: box.x + box.width / 2 - base.x, y: box.y + box.height / 2 - base.y, width: box.width, height: box.height };
      };
      const cardRect = () => rect(local('.stage-card[data-position="0"]'));
      const origin = () => rect(local(".t1-intro-left > span"));
      let refreshing = false;
      const setAvailability = (progress: number, start: number) => {
        if (refreshing) return;
        const entered = window.scrollY >= start - 1;
        if (root.dataset.entered !== String(entered)) root.dataset.entered = String(entered);
        const ready = progress >= .999;
        if (root.dataset.ready !== String(ready)) {
          root.dataset.ready = String(ready);
          reading.inert = !ready;
        }
        root.dataset.progress = progress.toFixed(4);
      };
      const timeline = gsap.timeline({ paused: true });
      gsap.set([rail, deck], { opacity: 0 });
      gsap.set(labels, { opacity: 0, xPercent: -50, yPercent: -50 });
      gsap.set(poster, { xPercent: -50, yPercent: -50 });
      gsap.set(number, { xPercent: -50, yPercent: -50 });
      timeline
        .fromTo(poster, { x: () => origin().x, y: () => origin().y, scaleX: .002, scaleY: .002 },
          { x: () => window.innerWidth * .21, y: () => window.innerHeight * .43, scaleX: .38 / 1.12, scaleY: .38 / 1.12, duration: .25, ease: easeSoft }, 0)
        .to(poster, { x: () => window.innerWidth / 2, y: () => window.innerHeight / 2, scaleX: 1, scaleY: 1, duration: .21, ease: easeSoft }, .25)
        .to(poster, { x: () => window.innerWidth * (mobile ? .5 : .56), y: () => window.innerHeight * .5, scaleX: (mobile ? .78 : .58) / 1.12, scaleY: .75 / 1.12, duration: .21, ease: easeInOut }, .54)
        .to(poster, { x: () => cardRect().x, y: () => cardRect().y, scaleX: () => cardRect().width / (window.innerWidth * 1.12), scaleY: () => cardRect().height / (window.innerHeight * 1.12), duration: .19, ease: easeInOut }, .75)
        .to(poster, { opacity: 0, duration: .04, ease: "none" }, .94)
        .fromTo(number, { x: () => origin().x, y: () => origin().y, scale: .002, opacity: 0 },
          { x: () => window.innerWidth * .21, y: () => window.innerHeight * .43, scale: .34, opacity: 1, duration: .25, ease: easeSoft }, 0)
        .to(number, { x: () => window.innerWidth / 2, y: () => window.innerHeight / 2, scale: 1, duration: .21, ease: easeSoft }, .25)
        .to(number, { x: () => window.innerWidth * (mobile ? .5 : .56), y: () => window.innerHeight * .5, scale: .6, opacity: .25, duration: .16, ease: easeInOut }, .54)
        .to(number, { opacity: 0, duration: .08 }, .7)
        .to(intro, { opacity: .38, duration: .25, ease: easeSoft }, 0)
        .to(intro, { opacity: 0, duration: .18 }, .25)
        .fromTo(".t1-poster-caption", { opacity: 0 }, { opacity: 1, duration: .05 }, .4)
        .to(".t1-poster-caption", { opacity: 0, duration: .04 }, .55)
        .fromTo(panelName, { opacity: 0 }, { opacity: 1, duration: .08 }, .67)
        .to(panelName, { opacity: 0, duration: .07 }, .87)
        .to(deck, { opacity: 1, duration: .06, ease: "none" }, .92)
        .to(rail, { opacity: 1, duration: .02 }, .98)
        .to(".t1-ceremony, .t1-labels", { opacity: 0, duration: .02 }, .98);

      labels.forEach((label, index) => {
        const target = () => rect(destinations[index]);
        const start = .56 + index * .04;
        timeline.fromTo(label, {
          x: () => window.innerWidth / 2,
          y: () => window.innerHeight * .38,
          scale: 1,
          opacity: 0,
        }, { opacity: 1, duration: 0 }, start)
          .to(label, { x: () => target().x, y: () => target().y, scale: .34, duration: .1, ease: easeInOut }, start)
          .to(label, { opacity: 0, duration: .02 }, .98);
      });

      const trigger = ScrollTrigger.create({
        trigger: root,
        pin: viewport,
        start: "top top",
        end: () => `+=${distance()}`,
        animation: timeline,
        scrub: 0.6,
        snap: {
          // Let reverse input leave red, while keeping near-complete reading/focus landings at 1.
          snapTo: (progress, self) => progress < .5 && self?.direction === -1 ? 0 : gsap.utils.snap([0, .5, 1], progress),
          duration: { min: .2, max: .6 }, delay: .25, inertia: false,
        },
        anticipatePin: 1,
        refreshPriority: 1,
        invalidateOnRefresh: true,
        onRefreshInit: () => { refreshing = true; },
        onRefresh: (self) => {
          root.style.setProperty("--t1-distance", `${distance()}px`);
          refreshing = false;
          setAvailability(self.progress, self.start);
        },
        onUpdate: (self) => {
          if (!refreshing) root.dataset.entered = String(window.scrollY >= self.start - 1);
        },
      });
      timeline.eventCallback("onUpdate", () => {
        updateLabelClips();
        setAvailability(timeline.progress(), trigger.start);
      });
      root.style.setProperty("--t1-distance", `${distance()}px`);
      updateLabelClips();
      setAvailability(trigger.progress, trigger.start);

      // Native links stay native. Resolve the pinned endpoint before focus or scrolling.
      const settleReading = () => {
        const snapTween = trigger.getTween(true);
        if (snapTween) snapTween.kill();
        window.scrollTo({ top: trigger.end, behavior: "instant" });
        trigger.update();
        const scrubTween = trigger.getTween();
        if (scrubTween) scrubTween.progress(1);
        timeline.progress(1);
        setAvailability(1, trigger.start);
      };
      let pointerSelecting = false;
      const beginPointer = () => { pointerSelecting = true; };
      const endPointer = () => { pointerSelecting = false; };
      const keepReadingFocus = () => {
        if (!pointerSelecting && window.scrollY < trigger.end) settleReading();
      };
      const settleAnchor = () => {
        if (!["#work", "#archive"].includes(window.location.hash)) return;
        settleReading();
        anchor.focus({ preventScroll: true });
      };
      const clickAnchor = (event: MouseEvent) => {
        if (event.button || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
        const link = (event.target as Element).closest<HTMLAnchorElement>('a[href="#work"], a[href="#archive"]');
        if (!link) return;
        event.preventDefault();
        if (location.hash !== link.hash) history.pushState(null, "", link.hash);
        settleAnchor();
      };
      let alive = true;
      let refreshFrame = 0;
      const refresh = () => {
        cancelAnimationFrame(refreshFrame);
        refreshFrame = requestAnimationFrame(() => {
          if (!alive) return;
          ScrollTrigger.refresh();
        });
      };
      document.fonts.ready.then(() => {
        if (!alive) return;
        ScrollTrigger.refresh();
        settleAnchor();
      });
      const content = root.parentElement;
      content?.addEventListener("load", refresh, true);
      reading.addEventListener("focusin", keepReadingFocus);
      reading.addEventListener("pointerdown", beginPointer);
      reading.addEventListener("pointerup", endPointer);
      reading.addEventListener("pointercancel", endPointer);
      reading.addEventListener("click", keepReadingFocus);
      window.addEventListener("hashchange", settleAnchor);
      document.addEventListener("click", clickAnchor, true);
      return () => {
        alive = false;
        cancelAnimationFrame(refreshFrame);
        content?.removeEventListener("load", refresh, true);
        reading.removeEventListener("focusin", keepReadingFocus);
        reading.removeEventListener("pointerdown", beginPointer);
        reading.removeEventListener("pointerup", endPointer);
        reading.removeEventListener("pointercancel", endPointer);
        reading.removeEventListener("click", keepReadingFocus);
        window.removeEventListener("hashchange", settleAnchor);
        document.removeEventListener("click", clickAnchor, true);
        reading.inert = false;
        root.style.removeProperty("--t1-distance");
        delete root.dataset.motion;
        delete root.dataset.ready;
        delete root.dataset.entered;
        delete root.dataset.progress;
      };
    });
    return () => media.revert();
  }, { scope });

  return (
    <div className="t1" ref={scope}>
      <span id="work" className="t1-work-anchor" tabIndex={-1} />
      <span id="archive" className="t1-work-anchor" aria-hidden="true" />
      <div className="t1-viewport">
        <div className="t1-intro" aria-hidden="true">
          <div className="t1-intro-left">
            <span>프로젝트 / 09</span>
            <h2>설계부터<br />개발까지</h2>
            <p>각 프로젝트에서 맡은 업무와 개발 기록을 소개합니다.</p>
          </div>
          <div className="t1-intro-right">
            <h2>풀스택<br /><span>개발자</span><br />장준영</h2>
            <p>프론트엔드·백엔드·DB 설계, 업무 자동화와 앱 개발, AWS 인프라와 CI/CD 배포 자동화까지 맡았습니다.</p>
          </div>
          <div className="t1-intro-nav"><span>[ + ] Joy</span><span>장준영 · 풀스택 개발자</span><span>개발 기록</span></div>
          <div className="t1-intro-progress" />
        </div>
        <div className="t1-ceremony" aria-hidden="true">
          <div className="t1-poster" />
          <span className="t1-number">09</span>
          <span className="t1-poster-caption t1-chapter">02 / 프로젝트 무대</span>
          <span className="t1-poster-caption t1-subtitle">직접 참여한 아홉 프로젝트</span>
          <span className="t1-plate-name">{String(selected + 1).padStart(2, "0")}&nbsp; {entries[selected].project.name}</span>
        </div>
        <div className="t1-labels" aria-hidden="true">{entries.map(({ project }, index) => <span className="t1-label" data-current={index === selected} key={project.id}><span className="t1-label-ink">{project.name}</span><span className="t1-label-paper">{project.name}</span></span>)}</div>
        <div className="t1-reading">
          <div className="section-intro sr-only">
            <p className="eyebrow">01 / 프로젝트</p>
            <div className="intro-heading"><h2 id="work-title">직접 참여한<br /><span>아홉 프로젝트</span></h2><p>풀스택 개발자 장준영입니다.<br />프론트엔드·백엔드·DB 설계부터 업무 자동화, 앱 개발, AWS 인프라와 CI/CD 배포 자동화까지 맡았습니다.</p></div>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
