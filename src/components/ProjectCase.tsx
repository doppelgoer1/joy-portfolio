import type { Project } from "../data/portfolio";
import { ProjectPlate } from "./ProjectPlate";

export function ProjectCase({ project, index }: { project: Project; index: number }) {
  return (
    <article className={`project-case project-case--${project.id}`} id={project.id} aria-labelledby={`${project.id}-title`}>
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
        <ProjectPlate project={project} index={index} />
        <div className="case-content">
          <h4>{project.headline}</h4>
          <p className="case-summary">{project.summary}</p>
          <div className="contribution">
            <h5>담당 범위</h5>
            <p className="case-role">{project.role}</p>
            <ul>{project.contributions.map((item) => <li key={item}>{item}</li>)}</ul>
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
      </div>
    </article>
  );
}
