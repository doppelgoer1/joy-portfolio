import type { Project } from "../data/portfolio";

export function ProjectPlate({ project, index }: { project: Project; index: number }) {
  return (
    <figure className="project-poster work-plate">
      <div className="plate-heading">
        <p className="eyebrow">Selected work / H-Solution</p>
        <span className="plate-number" aria-hidden="true">0{index + 1}</span>
        <p className="plate-name">{project.name}</p>
      </div>
      <dl className="plate-scope">
        {project.focus.map((item) => (
          <div key={item.label}><dt className="eyebrow">{item.label}</dt><dd>{item.value}</dd></div>
        ))}
      </dl>
      <figcaption>프로젝트 타이포그래피 · 서비스 화면 아님</figcaption>
    </figure>
  );
}
