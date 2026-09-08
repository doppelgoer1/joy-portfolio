import type { Project } from "../data/portfolio";

// A horizontal reading of the verified participation phases. Segments are equal:
// nothing about duration or effort is inferred beyond the recorded periods.
export function PhaseStrip({ project, compact = false, titleTag = "p" }: { project: Project; compact?: boolean; titleTag?: "p" | "h3" }) {
  const Title = titleTag;
  return (
    <ol className={`phase-strip${compact ? " phase-strip--compact" : ""}`} aria-label={`${project.name} 참여 흐름`}>
      {project.caseStudy.phases.map((phase, index) => (
        <li key={phase.period} className={phase.period.includes("현재") ? "phase--ongoing" : undefined}>
          <span className="phase-index" aria-hidden="true">0{index + 1}</span>
          <p className="eyebrow">{phase.period}</p>
          <Title className="phase-title">{phase.title}</Title>
          {!compact && <p className="phase-description">{phase.description}</p>}
        </li>
      ))}
    </ol>
  );
}
