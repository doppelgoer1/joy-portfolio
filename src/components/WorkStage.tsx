"use client";

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { ProjectEntry } from "../data/portfolio";
import { WorkTransition } from "./WorkTransition";
import { cardPosition, keyTarget, projectIndexForHash, swipeTarget, wrapIndex } from "./stage-selection";
import { readWorkReturn, rememberWork } from "./work-return";

export function WorkStage({ entries }: { entries: ProjectEntry[] }) {
  const count = entries.length;
  const [selected, setSelected] = useState(0);
  const [restored, setRestored] = useState(false);
  const cards = useRef<(HTMLElement | null)[]>([]);
  const indexLinks = useRef<(HTMLAnchorElement | null)[]>([]);
  const pendingFocus = useRef<"card" | "index" | null>(null);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const swallowClick = useRef(false);

  useLayoutEffect(() => {
    let alive = true;
    let focusFrame = 0;
    const ids = entries.map(({ project }) => project.id);
    let focusedBeforeRefresh: HTMLElement | null = null;
    const rememberFocus = () => {
      const element = document.activeElement as HTMLElement | null;
      focusedBeforeRefresh = element?.closest(".t1-reading") ? element : null;
    };
    const alignAliases = () => {
      const root = document.querySelector<HTMLElement>(".t1");
      const work = root?.closest<HTMLElement>(".work-stage");
      const anchor = document.getElementById("work");
      if (root && work && anchor) work.style.setProperty("--project-anchor-offset", `${anchor.getBoundingClientRect().top - work.getBoundingClientRect().top}px`);
      if (focusedBeforeRefresh?.isConnected && document.activeElement === document.body) focusedBeforeRefresh.focus({ preventScroll: true });
      focusedBeforeRefresh = null;
    };
    alignAliases();
    ScrollTrigger.addEventListener("refreshInit", rememberFocus);
    ScrollTrigger.addEventListener("refresh", alignAliases);
    const land = (index: number, y?: number) => {
      setRestored(true);
      setSelected(index);
      const root = document.querySelector<HTMLElement>(".t1")!;
      const trigger = ScrollTrigger.getAll().find(item => item.trigger === root);
      const endpoint = trigger?.end ?? (document.getElementById("work")!.getBoundingClientRect().top + scrollY);
      const destination = typeof y === "number" ? Math.max(endpoint, Math.min(y, endpoint + innerHeight - 1)) : endpoint;
      window.scrollTo({ top: destination, behavior: "instant" });
      trigger?.update();
      trigger?.getTween()?.progress(1);
      trigger?.animation?.progress(1);
      cancelAnimationFrame(focusFrame);
      focusFrame = requestAnimationFrame(() => {
        cards.current[index]?.focus({ preventScroll: true });
        document.documentElement.removeAttribute("data-work-restoring");
      });
    };
    const fromHash = () => {
      const index = location.hash === "#archive" ? entries.findIndex(entry => entry.kind === "archive") : projectIndexForHash(location.hash, ids);
      if (index >= 0) land(index);
    };
    const restore = () => {
      const saved = readWorkReturn(ids);
      if (saved) land(ids.indexOf(saved.slug), saved.y);
      else fromHash();
      document.documentElement.removeAttribute("data-work-restoring");
    };
    restore();
    document.fonts.ready.then(() => { if (alive) restore(); });
    const onAnchor = (event: MouseEvent) => {
      if (event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = (event.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
      if (!link || link.closest(".stage-index")) return;
      if (link.hash !== "#archive" && projectIndexForHash(link.hash, ids) < 0) return;
      event.preventDefault();
      history.pushState(null, "", link.hash);
      fromHash();
    };
    const onShow = () => restore();
    window.addEventListener("pageshow", onShow);
    window.addEventListener("hashchange", fromHash);
    document.addEventListener("click", onAnchor);
    return () => {
      alive = false; cancelAnimationFrame(focusFrame);
      ScrollTrigger.removeEventListener("refreshInit", rememberFocus);
      ScrollTrigger.removeEventListener("refresh", alignAliases);
      window.removeEventListener("pageshow", onShow);
      window.removeEventListener("hashchange", fromHash);
      document.removeEventListener("click", onAnchor);
    };
  }, [entries]);

  useEffect(() => {
    if (!pendingFocus.current) return;
    const targets = pendingFocus.current === "card" ? cards : indexLinks;
    targets.current[selected]?.focus({ preventScroll: true });
    pendingFocus.current = null;
  }, [selected]);

  const select = (index: number, focus: "card" | "index" | null = null) => {
    const next = wrapIndex(index, count);
    if (next === selected) {
      if (focus) (focus === "card" ? cards : indexLinks).current[next]?.focus({ preventScroll: true });
      return;
    }
    setRestored(false);
    pendingFocus.current = focus;
    setSelected(next);
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = event.currentTarget.classList.contains("stage-index");
    if (index && !["ArrowLeft", "ArrowRight"].includes(event.key)) return;
    const target = keyTarget(event.key, selected, count);
    if (target === null) return;
    event.preventDefault();
    select(target, index ? "index" : "card");
  };
  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const start = pointerStart.current;
    pointerStart.current = null;
    if (!start) return;
    const target = swipeTarget(event.clientX - start.x, event.clientY - start.y, selected, count);
    if (target === null) return;
    swallowClick.current = true;
    setTimeout(() => { swallowClick.current = false; }, 0);
    select(target);
  };
  const current = entries[selected].project;

  return (
    <div className="work-stage" data-restored={restored}>
      <span id="archive" className="project-anchor" aria-hidden="true" />
      {entries.map(({ project }) => <span key={project.id} id={project.id} className="project-anchor" aria-hidden="true"><span id={`archive-${project.id}`} /></span>)}
      <div className="work-stage-backdrop">
        <WorkTransition entries={entries} selected={selected}>
          <div className="stage-index" onKeyDown={onKeyDown}>
            <p className="eyebrow" id="project-index-title">전체 프로젝트 <span>{String(count).padStart(2, "0")}</span></p>
            <nav aria-labelledby="project-index-title">
              {entries.map(({ project }, index) => <a key={project.id} href={`#${project.id}`} aria-current={selected === index ? "true" : undefined}
                ref={element => { indexLinks.current[index] = element; }}
                onClick={event => {
                  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
                  event.preventDefault(); select(index);
                }}>
                <span className="stage-index-number" aria-hidden="true">0{index + 1}</span><span>{project.name}</span>
                <span className="stage-index-mark" aria-hidden="true">{selected === index ? "●" : "○"}</span>
              </a>)}
            </nav>
          </div>
          <div className="stage-deck">
            <div className="stage" role="group" aria-label="프로젝트 선택" onKeyDown={onKeyDown}
              onPointerDown={event => { pointerStart.current = { x: event.clientX, y: event.clientY }; }} onPointerUp={onPointerUp}
              onPointerCancel={() => { pointerStart.current = null; }}>
              {entries.map((entry, index) => {
                const { project } = entry;
                const active = index === selected;
                const position = cardPosition(index, selected, count);
                const distant = Math.abs(position) > 1;
                const Card = active ? "a" : "button";
                return <Card key={project.id} id={`${project.id}-tab`} href={active ? `/projects/${project.id}` : undefined} type={active ? undefined : "button"}
                  aria-label={`${project.name} ${active ? "자세히 보기" : "선택"}`} aria-hidden={distant || undefined} tabIndex={active ? 0 : -1}
                  draggable={false} data-position={position} data-distant={distant} data-slug={project.id} className={`stage-card stage-card--${project.id}`}
                  ref={(element: HTMLAnchorElement | HTMLButtonElement | null) => { cards.current[index] = element; }}
                  onClick={event => {
                    if (swallowClick.current) { event.preventDefault(); return; }
                    if (!active) { select(index, "card"); return; }
                    rememberWork(project.id);
                  }} onAuxClick={() => { if (active) rememberWork(project.id); }}>
                  <span className="stage-card-meta eyebrow"><span>0{index + 1}</span>{project.period && <span>{project.period}</span>}</span>
                  {entry.kind === "archive" && <img className="stage-card-image" src={entry.project.image.src} alt={entry.project.image.alt} width={entry.project.image.width} height={entry.project.image.height} draggable={false}
                    style={{ viewTransitionName: active ? `project-image-${project.id}` : "none" } as CSSProperties} />}
                  <span className="stage-card-name" style={{ viewTransitionName: active ? `project-title-${project.id}` : "none" } as CSSProperties}>{project.name}</span>
                  <span className="stage-card-category">{entry.kind === "featured" ? entry.project.category : entry.project.detail}</span>
                  <span className="stage-card-foot eyebrow"><span>{active ? "자세히 보기 →" : "선택"}</span><span>{entry.kind === "archive" ? "실제 서비스 화면" : "프로젝트 타이포그래피 · 서비스 화면 아님"}</span></span>
                </Card>;
              })}
            </div>
            <div className="stage-controls">
              <p className="stage-counter eyebrow" aria-live="polite">0{selected + 1} / 0{count} · {current.name}</p>
              <div className="stage-arrows">
                <button type="button" className="stage-arrow" onClick={() => select(selected - 1)} aria-label="이전 프로젝트 선택"><span aria-hidden="true">←</span></button>
                <button type="button" className="stage-arrow" onClick={() => select(selected + 1)} aria-label="다음 프로젝트 선택"><span aria-hidden="true">→</span></button>
              </div>
              <a className="stage-open text-link" href={`/projects/${current.id}`} onClick={() => rememberWork(current.id)} onAuxClick={() => rememberWork(current.id)}>자세히 보기 →<span className="sr-only">: {current.name}</span></a>
              <p className="stage-hint eyebrow">← → 선택 · 선택한 카드로 상세 보기</p>
            </div>
          </div>
        </WorkTransition>
      </div>
      <noscript><nav className="stage-fallback" aria-label="전체 프로젝트 상세">{entries.map(({ project }) => <a key={project.id} href={`/projects/${project.id}`}>{project.name} →</a>)}</nav></noscript>
    </div>
  );
}
