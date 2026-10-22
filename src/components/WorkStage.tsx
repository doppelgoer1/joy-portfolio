"use client";

import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";
import type { ProjectEntry } from "../data/portfolio";
import { SceneTransition, type SceneController } from "./SceneTransition";
import { WorkTransition } from "./WorkTransition";
import { PhaseStrip } from "./PhaseStrip";
import { cardPosition, keyTarget, projectIndexForHash, swipeTarget, wrapIndex } from "./stage-selection";

// All projects share one perspective floor. Only the selection and its neighbours are visible.
// Cards are tabs; the complete index also offers native anchor links without JavaScript.
// Before hydration every panel is visible, so the page reads fully without JavaScript.
export function WorkStage({ entries }: { entries: ProjectEntry[] }) {
  const count = entries.length;
  const detail = useRef<SceneController | null>(null);
  const [opening, setOpening] = useState<{ index: number; next: boolean } | null>(null);
  const [selected, setSelected] = useState(0);
  const [outgoing, setOutgoing] = useState<number | null>(null);
  const [enhanced, setEnhanced] = useState(false);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const indexLinks = useRef<(HTMLAnchorElement | null)[]>([]);
  const pendingFocus = useRef<"card" | "index" | null>(null);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const swallowClick = useRef(false);
  const [scrollTarget, setScrollTarget] = useState<string | null>(null);

  useEffect(() => {
    const fromHash = () => {
      const index = window.location.hash === "#archive" ? entries.findIndex(entry => entry.kind === "archive") : projectIndexForHash(window.location.hash, entries.map(({ project }) => project.id));
      if (index < 0) return;
      setScrollTarget(entries[index].project.id);
      setSelected(index);
    };
    setEnhanced(true);
    fromHash();
    const onAnchor = (event: MouseEvent) => {
      if (event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = (event.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
      if (!link || link.closest(".stage-index, .case-navigation")) return;
      if (link.hash !== "#archive" && projectIndexForHash(link.hash, entries.map(({ project }) => project.id)) < 0) return;
      event.preventDefault();
      history.pushState(null, "", link.hash);
      fromHash();
    };
    window.addEventListener("hashchange", fromHash);
    document.addEventListener("click", onAnchor);
    return () => { window.removeEventListener("hashchange", fromHash); document.removeEventListener("click", onAnchor); };
  }, [entries]);

  // A deep link such as /#fatespoiler selects that project, then realigns after the other panels hide.
  useEffect(() => {
    if (!enhanced || !scrollTarget) return;
    if (detail.current) detail.current.reveal(false);
    else document.getElementById(scrollTarget)?.scrollIntoView();
    setScrollTarget(null);
  }, [selected, enhanced, scrollTarget]);

  useEffect(() => {
    if (!pendingFocus.current) return;
    const targets = pendingFocus.current === "card" ? tabs : indexLinks;
    targets.current[selected]?.focus({ preventScroll: true });
    pendingFocus.current = null;
  }, [selected]);

  useEffect(() => {
    if (!opening) return;
    const hash = `#${entries[opening.index].project.id}`;
    if (window.location.hash !== hash) window.history?.pushState(null, "", hash);
    detail.current?.reveal(true, opening.next);
    setOpening(null);
  }, [opening, entries]);

  const openDetail = (index: number, next = false) => {
    if (next) detail.current?.prepareNext();
    setOutgoing(next ? selected : null);
    setSelected(index);
    setOpening({ index, next });
  };

  const select = (index: number, focus: "card" | "index" | null = null) => {
    const next = wrapIndex(index, count);
    if (next === selected) {
      const targets = focus === "card" ? tabs : indexLinks;
      if (focus) targets.current[next]?.focus({ preventScroll: true });
      return;
    }
    pendingFocus.current = focus;
    setSelected(next);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.currentTarget.classList.contains("stage-index") && !["ArrowLeft", "ArrowRight"].includes(event.key)) return;
    const target = keyTarget(event.key, selected, count);
    if (target === null) return;
    event.preventDefault();
    select(target, event.currentTarget.classList.contains("stage-index") ? "index" : "card");
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    pointerStart.current = { x: event.clientX, y: event.clientY };
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

  const onCardClick = (index: number) => {
    if (swallowClick.current) return;
    openDetail(index);
  };

  return (
    <div className="work-stage">
      <div className="work-stage-backdrop">
      <WorkTransition entries={entries} selected={selected}>
      <div className="stage-index" onKeyDown={onKeyDown}>
        <p className="eyebrow" id="project-index-title">전체 프로젝트 <span>{String(count).padStart(2, "0")}</span></p>
        <nav aria-labelledby="project-index-title">
          {entries.map(({ project }, index) => (
            <a
              key={project.id}
              href={`#${project.id}`}
              aria-current={selected === index ? "true" : undefined}
              aria-controls={project.id}
              ref={(element) => { indexLinks.current[index] = element; }}
              onClick={(event) => {
                if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
                event.preventDefault();
                openDetail(index);
              }}
            >
              <span className="stage-index-number" aria-hidden="true">0{index + 1}</span>
              <span>{project.name}</span>
              <span className="stage-index-mark" aria-hidden="true">{selected === index ? "●" : "↗"}</span>
            </a>
          ))}
        </nav>
      </div>
      <div className="stage-deck">
        <div
          className="stage"
          role="tablist"
          aria-label="프로젝트 선택"
          onKeyDown={onKeyDown}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={() => { pointerStart.current = null; }}
        >
          {entries.map((entry, index) => {
            const { project } = entry;
            const active = index === selected;
            const position = cardPosition(index, selected, count);
            const distant = Math.abs(position) > 1;
            return (
              <button
                key={project.id}
                type="button"
                role="tab"
                id={`${project.id}-tab`}
                aria-selected={active}
                aria-controls={project.id}
                aria-hidden={distant || undefined}
                tabIndex={active ? 0 : -1}
                data-position={position}
                data-distant={distant}
                className={`stage-card stage-card--${project.id}`}
                ref={(element) => { tabs.current[index] = element; }}
                onClick={() => onCardClick(index)}
              >
                <span className="stage-card-meta eyebrow"><span>0{index + 1}</span>{project.period && <span>{project.period}</span>}</span>
                <span className="stage-card-name">{project.name}</span>
                <span className="stage-card-category">{entry.kind === "featured" ? entry.project.category : project.role || entry.project.detail}</span>
                <span className="stage-card-foot eyebrow"><span>{active ? "선택됨" : "선택"}</span><span>프로젝트 타이포그래피 · 서비스 화면 아님</span></span>
              </button>
            );
          })}
        </div>
        <div className="stage-controls">
          <p className="stage-counter eyebrow" aria-live="polite">0{selected + 1} / 0{count} · {entries[selected].project.name}</p>
          <div className="stage-arrows">
            <button type="button" className="stage-arrow" onClick={() => select(selected - 1)} aria-label="이전 프로젝트 선택"><span aria-hidden="true">←</span></button>
            <button type="button" className="stage-arrow" onClick={() => select(selected + 1)} aria-label="다음 프로젝트 선택"><span aria-hidden="true">→</span></button>
          </div>
          <p className="stage-hint eyebrow">카드 선택 · ← → 키 · 좌우 스와이프</p>
        </div>
      </div>
      </WorkTransition>
      </div>
      <SceneTransition controller={detail}>
      <span id="archive" className="project-anchor" aria-hidden="true" />
      <div className="stage-panels">
        {entries.map((entry, index) => {
          const { project } = entry;
          const active = index === selected;
          const affiliation = [project.company, project.period].filter(Boolean).join(" · ");
          return (
            <article
              key={project.id}
              id={project.id}
              tabIndex={-1}
              role="tabpanel"
              aria-labelledby={`${project.id}-tab`}
              hidden={enhanced && !active}
              data-outgoing={outgoing === index && !active}
              aria-hidden={outgoing === index && !active || undefined}
              inert={outgoing === index && !active}
              className={`project-case stage-panel project-case--${project.id}${active ? " is-active" : ""}`}
            >
              {entry.kind === "archive" && <span id={`archive-${project.id}`} className="project-anchor" aria-hidden="true" />}
              <figure className="case-band">
                {entry.kind === "archive" ? <a href={`/projects/${project.id}`}>
                  <img src={entry.project.image.src} alt={entry.project.image.alt} width={entry.project.image.width} height={entry.project.image.height} loading={active ? "eager" : "lazy"} decoding="async" />
                  <span className="sr-only">실제 서비스 화면 · {project.name} 자세히 보기</span>
                </a> : <div className="case-type-plate" aria-label={`${project.name} 프로젝트 타이포그래피`}>
                  <span aria-hidden="true">0{index + 1}</span><strong>{project.name}</strong>
                </div>}
              </figure>
              <div className="case-heading">
                <span className="case-number" aria-hidden="true">0{index + 1}</span>
                <h3 id={`${project.id}-title`}><a href={`/projects/${project.id}`}>{project.name}</a></h3>
                {project.url && <a className="text-link" href={project.url} target="_blank" rel="noreferrer">
                  서비스 방문 <span aria-hidden="true">↗</span><span className="sr-only">: {project.name} (새 창)</span>
                </a>}
              </div>
              <div className="case-meta eyebrow">
                <span>프로젝트 / 0{index + 1}</span>
                {affiliation && <span>{affiliation}</span>}
              </div>
              <div className="case-body">
                <div className="case-content">
                  <h4>{entry.kind === "featured" ? entry.project.headline : "서비스 소개"}</h4>
                  <p className="case-summary">{entry.kind === "featured" ? entry.project.summary : entry.project.description}</p>
                  {(project.role || project.contributions?.length) && <div className="contribution">
                    <h5>담당 범위</h5>
                    {project.role && <p className="case-role">{project.role}</p>}
                    {project.contributions && <ol className="contribution-list">
                      {project.contributions.map((item, itemIndex) => (
                        <li key={item}><span aria-hidden="true">0{itemIndex + 1}</span>{item}</li>
                      ))}
                    </ol>}
                  </div>}
                  {project.stack && <ul className="tech-list" aria-label={`${project.name} 사용 기술`}>
                    {project.stack.map((tech) => <li key={tech}>{tech}</li>)}
                  </ul>}
                  {entry.kind === "featured" && <p className="case-note">{entry.project.note}</p>}
                  {entry.kind === "archive" && entry.project.offline && <p className="case-note">현재 사이트 접속 불가</p>}
                  <a className="case-read-link" href={`/projects/${project.id}`}>
                    <span>프로젝트 자세히 보기<span className="sr-only">: {project.name}</span></span>
                    <span aria-hidden="true">↗</span>
                  </a>
                </div>
                {entry.kind === "featured" ? <ol className="chapter-deck" aria-label={`${project.name} 담당 영역`}>
                  {entry.project.caseStudy.chapters.map((chapter, chapterIndex) => (
                    <li key={chapter.id} className="chapter-card" style={{ "--i": chapterIndex } as CSSProperties}>
                      <span className="eyebrow">0{chapterIndex + 1} / {chapter.label}</span>
                      <h5>{chapter.title}</h5>
                      <p>{chapter.description}</p>
                      <ul className="chapter-items">
                        {chapter.items.map((item) => <li key={item.title}>{item.title}</li>)}
                      </ul>
                    </li>
                  ))}
                </ol> : null}
              </div>
              {entry.kind === "featured" && <div className="case-phases">
                <p className="eyebrow">참여 흐름</p>
                <PhaseStrip project={entry.project} compact />
              </div>}
              <nav className="case-navigation" aria-label={`${project.name} 프로젝트 이동`}>
                <a href="#work">← 무대로</a>
                <a href={`#${entries[(index + 1) % count].project.id}`} onClick={event => {
                  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
                  event.preventDefault(); openDetail((index + 1) % count, true);
                }}>다음 {String((index + 1) % count + 1).padStart(2, "0")} {entries[(index + 1) % count].project.name} →</a>
              </nav>
            </article>
          );
        })}
      </div>
      </SceneTransition>
    </div>
  );
}
