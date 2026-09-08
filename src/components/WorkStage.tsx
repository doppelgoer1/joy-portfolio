"use client";

import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";
import type { Project } from "../data/portfolio";
import { PhaseStrip } from "./PhaseStrip";
import { cardPosition, keyTarget, swipeTarget, wrapIndex } from "./stage-selection";

// Three typographic cards on one perspective floor. The selected card faces the reader and the
// other two keep their circular order at the sides. Cards are tabs; the reading area is the panel.
// Before hydration every panel is visible, so the page reads fully without JavaScript.
export function WorkStage({ projects }: { projects: Project[] }) {
  const count = projects.length;
  const [selected, setSelected] = useState(0);
  const [enhanced, setEnhanced] = useState(false);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const swallowClick = useRef(false);
  const scrollTarget = useRef<string | null>(null);

  useEffect(() => {
    const fromHash = () => {
      const id = window.location.hash.slice(1);
      const index = projects.findIndex((project) => project.id === id);
      if (index < 0) return;
      scrollTarget.current = id;
      setSelected(index);
    };
    setEnhanced(true);
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, [projects]);

  // A deep link such as /#fatespoiler selects that project, then realigns after the other panels hide.
  useEffect(() => {
    if (!scrollTarget.current) return;
    document.getElementById(scrollTarget.current)?.scrollIntoView();
    scrollTarget.current = null;
  }, [selected, enhanced]);

  const select = (index: number, focus = false) => {
    const next = wrapIndex(index, count);
    setSelected(next);
    if (focus) tabs.current[next]?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const target = keyTarget(event.key, selected, count);
    if (target === null) return;
    event.preventDefault();
    select(target, true);
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
    select(index);
  };

  return (
    <div className="work-stage">
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
          {projects.map((project, index) => {
            const active = index === selected;
            return (
              <button
                key={project.id}
                type="button"
                role="tab"
                id={`${project.id}-tab`}
                aria-selected={active}
                aria-controls={project.id}
                tabIndex={active ? 0 : -1}
                data-position={cardPosition(index, selected, count)}
                className={`stage-card stage-card--${project.id}`}
                ref={(element) => { tabs.current[index] = element; }}
                onClick={() => onCardClick(index)}
              >
                <span className="stage-card-meta eyebrow"><span>0{index + 1}</span><span>{project.period}</span></span>
                <span className="stage-card-name">{project.name}</span>
                <span className="stage-card-category">{project.category}</span>
                <span className="stage-card-scope">{project.focus.map((item) => <span key={item.label}>{item.label}</span>)}</span>
                <span className="stage-card-foot eyebrow"><span>{active ? "선택됨" : "선택"}</span><span>프로젝트 타이포그래피 · 서비스 화면 아님</span></span>
              </button>
            );
          })}
        </div>
        <div className="stage-controls">
          <p className="stage-counter eyebrow" aria-live="polite">0{selected + 1} / 0{count} · {projects[selected].name}</p>
          <div className="stage-arrows">
            <button type="button" className="stage-arrow" onClick={() => select(selected - 1)} aria-label="이전 프로젝트 선택"><span aria-hidden="true">←</span></button>
            <button type="button" className="stage-arrow" onClick={() => select(selected + 1)} aria-label="다음 프로젝트 선택"><span aria-hidden="true">→</span></button>
          </div>
          <p className="stage-hint eyebrow">카드 선택 · ← → 키 · 좌우 스와이프</p>
        </div>
      </div>
      <div className="stage-panels">
        {projects.map((project, index) => {
          const active = index === selected;
          return (
            <article
              key={project.id}
              id={project.id}
              role="tabpanel"
              aria-labelledby={`${project.id}-tab`}
              hidden={enhanced && !active}
              className={`project-case stage-panel project-case--${project.id}${active ? " is-active" : ""}`}
            >
              <div className="case-meta eyebrow">
                <span>0{index + 1} / {project.category}</span>
                <span>H-Solution · {project.period}</span>
              </div>
              <div className="case-heading">
                <h3 id={`${project.id}-title`}><a href={`/projects/${project.id}`}>{project.name}</a></h3>
                <a className="text-link" href={project.url} target="_blank" rel="noreferrer">
                  서비스 방문 <span aria-hidden="true">↗</span><span className="sr-only">: {project.name} (새 창)</span>
                </a>
              </div>
              <div className="case-body">
                <div className="case-content">
                  <h4>{project.headline}</h4>
                  <p className="case-summary">{project.summary}</p>
                  <div className="contribution">
                    <h5>담당 범위</h5>
                    <p className="case-role">{project.role}</p>
                    <ol className="contribution-list">
                      {project.contributions.map((item, itemIndex) => (
                        <li key={item}><span aria-hidden="true">0{itemIndex + 1}</span>{item}</li>
                      ))}
                    </ol>
                  </div>
                  <ul className="tech-list" aria-label={`${project.name} 사용 기술`}>
                    {project.stack.map((tech) => <li key={tech}>{tech}</li>)}
                  </ul>
                  <p className="case-note">{project.note}</p>
                  <a className="case-read-link" href={`/projects/${project.id}`}>
                    <span>프로젝트 자세히 보기<span className="sr-only">: {project.name}</span></span>
                    <span aria-hidden="true">↗</span>
                  </a>
                </div>
                <ol className="chapter-deck" aria-label={`${project.name} 담당 영역`}>
                  {project.caseStudy.chapters.map((chapter, chapterIndex) => (
                    <li key={chapter.id} className="chapter-card" style={{ "--i": chapterIndex } as CSSProperties}>
                      <span className="eyebrow">0{chapterIndex + 1} / {chapter.label}</span>
                      <h5>{chapter.title}</h5>
                      <p>{chapter.description}</p>
                      <ul className="chapter-items">
                        {chapter.items.map((item) => <li key={item.title}>{item.title}</li>)}
                      </ul>
                    </li>
                  ))}
                </ol>
              </div>
              <div className="case-phases">
                <p className="eyebrow">참여 흐름</p>
                <PhaseStrip project={project} compact />
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
