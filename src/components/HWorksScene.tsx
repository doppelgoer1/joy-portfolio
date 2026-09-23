"use client";

import { useEffect, useRef } from "react";
import type { Project } from "../data/portfolio";

const clamp = (value: number) => Math.max(0, Math.min(1, value));
const phase = (p: number, start: number, end: number) => {
  const t = clamp((p - start) / (end - start));
  return t * t * (3 - 2 * t);
};

// Pure, reversible keyframes. Exported so tests exercise the actual scene math.
export function hworksFrame(progress: number, mobile = false) {
  const p = clamp(progress);
  const enter = phase(p, 0, mobile ? .2 : .15);
  const split = phase(p, mobile ? .2 : .15, mobile ? .42 : .32);
  const flood = phase(p, mobile ? .32 : .32, mobile ? .58 : .52);
  const dock = phase(p, mobile ? .64 : .52, mobile ? .9 : .72);
  const exit = mobile ? 0 : phase(p, .85, 1);
  return {
    p, enter, split, flood, dock, exit,
    titleScale: .64 + .36 * enter,
    titleY: 24 * (1 - enter),
    titleX: 62 * split,
    slit: .012 * split + .988 * flood,
    titleOpacity: 1 - phase(p, mobile ? .42 : .32, mobile ? .55 : .43),
    domains: [0, 1, 2].map((i) => phase(p, (mobile ? .4 : .33) + i * .045, (mobile ? .62 : .46) + i * .03)),
    copy: mobile ? 1 : phase(p, .6, .72) * (1 - phase(p, .85, .91)),
    readable: mobile || (p >= .72 && p <= .85),
  };
}

export function HWorksScene({ project, next }: { project: Project; next: Project }) {
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const pin = element.querySelector<HTMLElement>(".hworks-pin")!;
    const reading = element.querySelector<HTMLElement>(".hworks-reading")!;
    const links = element.querySelector<HTMLElement>(".hworks-links")!;
    const gate = element.querySelector<HTMLButtonElement>(".hworks-read-gate")!;
    const media = matchMedia("(prefers-reduced-motion: no-preference) and (min-height: 600px)");
    let frame = 0;
    let enhanced = false;
    let mobile = false;
    let travel = 1;
    let anchorFrame = 0;
    let measure = true;
    const header = 72;

    const paint = (progress: number) => {
      const state = hworksFrame(progress, mobile);
      const values = {
        "--hw-enter-y": `${state.titleY}vh`, "--hw-title-scale": state.titleScale,
        "--hw-title-x": `${state.titleX}vw`, "--hw-title-opacity": state.titleOpacity,
        "--hw-slit": state.slit, "--hw-dock": state.dock, "--hw-exit": state.exit,
        "--hw-copy": state.copy, "--hw-ink": 1 - phase(state.p, .85, .91),
      };
      Object.entries(values).forEach(([key, value]) => element.style.setProperty(key, String(value)));
      state.domains.forEach((value, i) => element.style.setProperty(`--hw-domain-${i}`, String(value)));
      element.dataset.readable = String(state.readable);
      links.inert = !state.readable;
      gate.tabIndex = state.readable ? -1 : 0;
    };
    const update = () => {
      frame = 0;
      // All layout reads precede writes. A resize gets one follow-up measurement,
      // never a permanent RAF loop. Tall desktop copy stays in normal flow.
      const rect = element.getBoundingClientRect();
      const readingHeight = reading.offsetHeight;
      const pinHeight = pin.offsetHeight;
      const width = innerWidth;
      const height = innerHeight;
      const nextMobile = width < 900;
      // Read the actual 160svh offset, not dynamic innerHeight on mobile browser chrome changes.
      const mobileTravel = nextMobile ? parseFloat(getComputedStyle(reading).marginTop) : 0;
      const canEnhance = media.matches && (nextMobile || readingHeight + 132 <= height - header);
      const changed = enhanced !== canEnhance || mobile !== nextMobile;
      mobile = nextMobile;
      enhanced = canEnhance;
      travel = mobile ? (mobileTravel > 0 ? mobileTravel : height * 1.6) : Math.max(1, rect.height - pinHeight);
      if (measure || changed) {
        element.dataset.enhanced = String(enhanced);
        measure = false;
      }
      if (enhanced) paint((header - rect.top) / travel);
      else {
        element.dataset.readable = "true";
        links.inert = false;
        gate.tabIndex = -1;
      }
      if (changed) schedule();
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    const resize = () => { measure = true; schedule(); };
    const reveal = (event: FocusEvent | MouseEvent) => {
      if (!enhanced || !(event.target instanceof HTMLElement)) return;
      const onGate = gate.contains(event.target);
      if (!reading.contains(event.target) && !onGate) return;
      const rect = element.getBoundingClientRect();
      const readingRect = reading.getBoundingClientRect();
      const targetRect = event.target.getBoundingClientRect();
      if (mobile && targetRect.top >= header && targetRect.bottom <= innerHeight) return;
      const hidden = !mobile && element.dataset.readable !== "true";
      if (onGate || hidden || readingRect.top < header || readingRect.bottom > innerHeight) {
        const top = mobile ? scrollY + targetRect.top - header - 24 : scrollY + rect.top - header + travel * .76;
        window.scrollTo({ top, behavior: "instant" });
        if (!mobile) paint(.76);
        if (onGate) {
          const fromAfter = event.relatedTarget instanceof HTMLElement
            && Boolean(gate.compareDocumentPosition(event.relatedTarget) & Node.DOCUMENT_POSITION_FOLLOWING);
          links.querySelector<HTMLAnchorElement>(fromAfter ? "a:last-of-type" : "a")?.focus({ preventScroll: true });
        }
      }
    };
    const anchor = () => {
      if (location.hash !== "#h-works" || !enhanced) return;
      const rect = element.getBoundingClientRect();
      const top = mobile ? reading.getBoundingClientRect().top + scrollY - header - 16 : rect.top + scrollY - header + travel * .76;
      window.scrollTo({ top, behavior: "instant" });
      if (!mobile) paint(.76);
    };
    element.addEventListener("focusin", reveal);
    gate.addEventListener("click", reveal);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", resize);
    window.addEventListener("hashchange", anchor);
    media.addEventListener("change", resize);
    const observer = new ResizeObserver(resize);
    observer.observe(reading);
    schedule();
    // Restore detail-page return anchors after enhancement establishes the travel.
    anchorFrame = requestAnimationFrame(() => { anchorFrame = requestAnimationFrame(anchor); });
    return () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(anchorFrame);
      observer.disconnect();
      element.removeEventListener("focusin", reveal);
      gate.removeEventListener("click", reveal);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", resize);
      window.removeEventListener("hashchange", anchor);
      media.removeEventListener("change", resize);
      delete element.dataset.enhanced;
      links.inert = false;
    };
  }, []);

  return (
    <article id={project.id} ref={root} className="hworks-scene" aria-labelledby="h-works-title">
      <div className="hworks-track">
        <div className="hworks-pin">
          <div className="hworks-visual">
            <div className="hworks-handoff" aria-hidden="true"><span className="eyebrow">02 / Selected work</span><strong>{next.name}</strong><span>{next.category}</span></div>
            <div className="hworks-curtain">
              <div className="hworks-red" aria-hidden="true" />
              <div className="hworks-meta eyebrow"><span>01 / Selected work</span><span>{project.company} · {project.period}</span></div>
              <div className="hworks-heading"><h3 id="h-works-title">{project.name}</h3><p>{project.category}</p></div>
              <div className="hworks-giant" aria-hidden="true"><span>H-WORKS</span><span>H-WORKS</span></div>
              <figure className="hworks-domains">
                <div>{project.focus.map((item, i) => <div className={`hworks-domain hworks-domain--${i}`} key={item.label}><span>{item.label}</span><small>{item.value}</small></div>)}</div>
                <figcaption>프로젝트 타이포그래피 · 서비스 화면 아님</figcaption>
              </figure>
            </div>
          </div>
          <div className="hworks-reading">
            <div className="hworks-copy">
              <p className="eyebrow">담당 범위 / Core contribution</p>
              <h4>{project.headline}</h4>
              <p className="hworks-role">{project.role}</p>
              <p className="hworks-summary">{project.summary}</p>
              <ul>{project.contributions.map((item) => <li key={item}>{item}</li>)}</ul>
              <p className="hworks-note">{project.note}</p>
            </div>
            <div className="hworks-links">
              <a className="case-read-link" href={`/projects/${project.id}`}>프로젝트 자세히 보기<span className="sr-only">: {project.name}</span><span aria-hidden="true">↗</span></a>
              <a className="showcase-service" href={project.url} target="_blank" rel="noreferrer">서비스 방문 <span aria-hidden="true">↗</span><span className="sr-only">: {project.name} (새 창)</span></a>
            </div>
          </div>
          <button type="button" className="hworks-read-gate">기여와 링크 보기 <span aria-hidden="true">↓</span></button>
        </div>
      </div>
    </article>
  );
}
