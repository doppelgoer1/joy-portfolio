"use client";

import { useEffect, useRef } from "react";
import { HWorksScene } from "./HWorksScene";
import type { Project } from "../data/portfolio";

// All projects are ordinary document content. Sticky/RAF are progressive decoration only.
export function WorkStage({ projects }: { projects: Project[] }) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const panels = Array.from(element.querySelectorAll<HTMLElement>(".showcase-panel"));
    const media = matchMedia("(min-width: 1000px) and (min-height: 700px) and (prefers-reduced-motion: no-preference)");
    let frame = 0;
    const update = () => {
      frame = 0;
      const heights = panels.map((panel) => panel.offsetHeight);
      panels.forEach((panel, index) => {
        panel.dataset.sticky = String(media.matches && heights[index] <= innerHeight - 80 + 1);
      });
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    const revealFocus = (event: FocusEvent) => {
      if (!(event.target instanceof HTMLElement)) return;
      const panel = event.target.closest<HTMLElement>(".showcase-panel");
      if (!panel) return;
      const bounds = event.target.getBoundingClientRect();
      const visible = document.elementFromPoint(bounds.left + bounds.width / 2, bounds.top + bounds.height / 2);
      if (bounds.top < 80 || bounds.bottom > innerHeight || !visible || !panel.contains(visible)) {
        // Sum the preceding flow boxes; sticky offsets can already be displaced.
        const siblings = Array.from(element.children) as HTMLElement[];
        const before = siblings.slice(0, siblings.indexOf(panel)).reduce((sum, sibling) => sum + sibling.offsetHeight, 0);
        const top = element.getBoundingClientRect().top + scrollY + before - 80;
        window.scrollTo({ top, behavior: "instant" });
        if (panel.dataset.sticky !== "true") event.target.scrollIntoView({ block: "center", behavior: "instant" });
      }
    };
    element.addEventListener("focusin", revealFocus);
    window.addEventListener("resize", schedule);
    media.addEventListener("change", schedule);
    const observer = new ResizeObserver(schedule);
    panels.forEach((panel) => observer.observe(panel));
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      element.removeEventListener("focusin", revealFocus);
      window.removeEventListener("resize", schedule);
      media.removeEventListener("change", schedule);
    };
  }, [projects]);

  return (
    <div className="scroll-showcase" ref={root}>
      {projects.map((project, index) => project.id === "h-works" ? (
        <HWorksScene key={project.id} project={project} next={projects[index + 1]} />
      ) : (
        <article key={project.id} id={project.id} aria-labelledby={`${project.id}-title`} className={`showcase-panel showcase-panel--${project.id}`}>
          <div className="showcase-surface">
            <div className="showcase-meta eyebrow"><span>0{index + 1} / Selected work</span><span>{project.company} · {project.period}</span></div>
            <div className="showcase-title"><h3 id={`${project.id}-title`}>{project.name}</h3><p>{project.category}</p></div>
            <div className="showcase-body">
              <figure className="showcase-visual">
                <div className="showcase-type" aria-hidden="true">{project.focus.map((item) => <span key={item.label}>{item.label}</span>)}</div>
                <figcaption>프로젝트 타이포그래피 · 서비스 화면 아님</figcaption>
              </figure>
              <div className="showcase-copy">
                <p className="eyebrow">담당 범위 / Core contribution</p>
                <h4>{project.headline}</h4>
                <p className="showcase-role">{project.role}</p>
                <p className="showcase-summary">{project.summary}</p>
                <ul className="showcase-focus">{project.focus.map((item) => <li key={item.label}>{item.value}</li>)}</ul>
                <div className="showcase-links">
                  <a className="case-read-link" href={`/projects/${project.id}`}>프로젝트 자세히 보기<span className="sr-only">: {project.name}</span><span aria-hidden="true">↗</span></a>
                  <a className="showcase-service" href={project.url} target="_blank" rel="noreferrer">서비스 방문 <span aria-hidden="true">↗</span><span className="sr-only">: {project.name} (새 창)</span></a>
                </div>
              </div>
            </div>
            <div className="showcase-foot"><p>{project.note}</p><span className="eyebrow">0{index + 1} / 0{projects.length}</span></div>
          </div>
        </article>
      ))}
    </div>
  );
}
