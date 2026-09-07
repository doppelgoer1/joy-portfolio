import type { Project } from "../data/portfolio";

// Typographic plate: number, name and the verified scope split into cells.
// Each cell is one item of the recorded focus value; no service screen is imitated.
export function ProjectPlate({ project, index }: { project: Project; index: number }) {
  return (
    <figure className="project-poster work-plate">
      <div className="plate-heading">
        <p className="eyebrow">Selected work / H-Solution</p>
        <span className="plate-number" aria-hidden="true">0{index + 1}</span>
        <p className="plate-name">{project.name}</p>
      </div>
      <dl className="plate-scope">
        {project.focus.map((item, itemIndex) => (
          <div key={item.label}>
            <dt className="eyebrow"><span aria-hidden="true">0{itemIndex + 1}</span>{item.label}</dt>
            <dd>
              <ul className="scope-cells">
                {item.value.split(" · ").map((cell) => <li key={cell}>{cell}</li>)}
              </ul>
            </dd>
          </div>
        ))}
      </dl>
      <figcaption>프로젝트 타이포그래피 · 서비스 화면 아님</figcaption>
    </figure>
  );
}
