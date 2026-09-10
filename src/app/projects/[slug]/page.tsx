import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { PhaseStrip } from "../../../components/PhaseStrip";
import { ProjectPlate } from "../../../components/ProjectPlate";
import { projectEntries, returnAnchor, type ArchiveProject, type Project, type ProjectEntry } from "../../../data/portfolio";
import "../../portfolio-editorial.css";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return projectEntries.map(({ project }) => ({ slug: project.id }));
}

const summaryOf = (entry: ProjectEntry) => (entry.kind === "featured" ? entry.project.summary : entry.project.description);
const categoryOf = (entry: ProjectEntry) => (entry.kind === "featured" ? entry.project.category : entry.project.detail);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const entry = projectEntries.find(({ project }) => project.id === slug);
  if (!entry) notFound();
  const title = `${entry.project.name} | 장준영 · Joy 프로젝트 기록`;
  return {
    title,
    description: summaryOf(entry),
    openGraph: { title, description: summaryOf(entry), locale: "ko_KR", type: "article" },
  };
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  const entry = projectEntries.find(({ project }) => project.id === slug);
  if (!entry) notFound();
  const index = projectEntries.indexOf(entry);
  const next = projectEntries[(index + 1) % projectEntries.length];
  const { project } = entry;

  return (
    <div className={`portfolio-content project-detail project-detail--${entry.kind} project-detail--${project.id}`}>
      <a className="skip-link" href="#case-overview">프로젝트 본문으로 바로가기</a>
      <header className="site-header">
        <a className="wordmark" href="/#work" aria-label="Joy 포트폴리오 작업 목록"><span aria-hidden="true">[ + ]</span> Joy</a>
        <nav aria-label="프로젝트 메뉴"><a href={returnAnchor(entry)}>← 작업 목록</a><a href="/#contact">연락</a></nav>
      </header>
      <main id="case-top">
        {entry.kind === "featured" ? <FeaturedBody project={entry.project} index={index} /> : <ArchiveBody project={entry.project} index={index} />}
        <nav className="detail-next" aria-label="다른 프로젝트">
          <a className="detail-next-project" href={`/projects/${next.project.id}`}>
            <span className="eyebrow">Next project / 0{projectEntries.indexOf(next) + 1}</span>
            <span className="next-project-name">{next.project.name}<span aria-hidden="true">↗</span></span>
            <span className="next-project-category">{categoryOf(next)}</span>
          </a>
          <div className="detail-return"><a className="text-link" href={returnAnchor(entry)}>← 작업 목록으로 돌아가기</a><a className="text-link" href="#case-top">위로 ↑</a></div>
        </nav>
      </main>
      <footer className="detail-footer eyebrow"><span>장준영 · Fullstack developer</span><a href="/#contact">함께 일하기 ↗</a></footer>
    </div>
  );
}

// H-Solution 프로젝트: 확인된 담당 범위를 장으로 나눠 읽는 본문.
function FeaturedBody({ project, index }: { project: Project; index: number }) {
  return (
    <>
      <header className="detail-cover">
        <div className="detail-kicker eyebrow"><span>Project notes / 0{index + 1}</span><span>{project.company} · {project.period}</span></div>
        <div className="detail-cover-title">
          <span className="detail-cover-index" aria-hidden="true">0{index + 1}</span>
          <h1>{project.name}</h1>
        </div>
        <div className="detail-cover-bottom">
          <p>{project.headline}</p>
          <a className="text-link" href={project.url} target="_blank" rel="noreferrer">서비스 방문<span aria-hidden="true">↗</span><span className="sr-only">: {project.name} (새 창)</span></a>
        </div>
        <ol className="detail-cover-scope" aria-label="담당 범위 요약">
          {project.focus.map((item) => <li key={item.label}><span className="eyebrow">{item.label}</span><span>{item.value}</span></li>)}
        </ol>
      </header>
      <section id="case-overview" className="detail-overview" aria-labelledby="overview-title">
        <div className="detail-overview-copy">
          <p className="eyebrow">Overview</p>
          <h2 id="overview-title">{project.category}</h2>
          <p className="detail-lead">{project.caseStudy.introduction}</p>
          <dl className="detail-facts">
            <div><dt>소속 · 기간</dt><dd>{project.company} · {project.period}</dd></div>
            <div><dt>담당 범위</dt><dd>{project.role}</dd></div>
            <div><dt>사용 기술</dt><dd><ul className="tech-list">{project.stack.map((tech) => <li key={tech}>{tech}</li>)}</ul></dd></div>
          </dl>
        </div>
        <ProjectPlate project={project} index={index} />
      </section>
      <div className="detail-reading">
        <aside className="detail-contents">
          <p className="eyebrow">In this project</p>
          <nav aria-label="프로젝트 목차">
            {project.caseStudy.chapters.map((chapter, chapterIndex) => (
              <a href={`#${chapter.id}`} key={chapter.id}><span>0{chapterIndex + 1}</span>{chapter.label}</a>
            ))}
            <a href="#timeline"><span>↘</span>Project timeline</a>
          </nav>
        </aside>
        <div className="detail-chapters">
          {project.caseStudy.chapters.map((chapter, chapterIndex) => (
            <section className="detail-chapter" id={chapter.id} key={chapter.id} aria-labelledby={`${chapter.id}-title`}>
              <span className="detail-chapter-index" aria-hidden="true">0{chapterIndex + 1}</span>
              <p className="eyebrow">0{chapterIndex + 1} / {chapter.label}</p>
              <h2 id={`${chapter.id}-title`}>{chapter.title}</h2>
              <p className="chapter-description">{chapter.description}</p>
              <dl className="responsibility-list">
                {chapter.items.map((item, itemIndex) => (
                  <div key={item.title}><dt><span aria-hidden="true">0{itemIndex + 1}</span>{item.title}</dt><dd>{item.description}</dd></div>
                ))}
              </dl>
            </section>
          ))}
          <section className="detail-chapter detail-timeline" id="timeline" aria-labelledby="timeline-title">
            <span className="detail-chapter-index" aria-hidden="true">↘</span>
            <p className="eyebrow">Project timeline</p>
            <h2 id="timeline-title">참여의 흐름.</h2>
            <PhaseStrip project={project} titleTag="h3" />
          </section>
        </div>
      </div>
    </>
  );
}

// 이전 프로젝트: 실제 화면과 확인된 사실만. 없는 항목은 행 자체를 두지 않는다.
function ArchiveBody({ project, index }: { project: ArchiveProject; index: number }) {
  const affiliation = [project.company, project.period].filter(Boolean).join(" · ");
  const facts: [string, ReactNode][] = [];
  if (affiliation) facts.push(["소속 · 기간", affiliation]);
  if (project.role) facts.push(["담당 범위", project.role]);
  if (project.stack) facts.push(["사용 기술", <ul className="tech-list">{project.stack.map((tech) => <li key={tech}>{tech}</li>)}</ul>]);
  if (project.url) facts.push(["운영 상태", <>운영 중 · <a className="text-link" href={project.url} target="_blank" rel="noreferrer">{project.url.replace(/^https?:\/\//, "")}<span aria-hidden="true">↗</span><span className="sr-only"> (새 창)</span></a></>]);
  if (project.offline) facts.push(["운영 상태", "현재 사이트 접속 불가 · 화면은 기존 포트폴리오 스크린샷"]);
  return (
    <>
      <header className="detail-cover">
        <div className="detail-kicker eyebrow"><span>Project notes / 0{index + 1}</span><span>{affiliation || "Previous project"}</span></div>
        <div className="detail-cover-title">
          <span className="detail-cover-index" aria-hidden="true">0{index + 1}</span>
          <h1>{project.name}</h1>
        </div>
        <div className="detail-cover-bottom">
          <p>{project.detail}</p>
          {project.url && <a className="text-link" href={project.url} target="_blank" rel="noreferrer">서비스 방문<span aria-hidden="true">↗</span><span className="sr-only">: {project.name} (새 창)</span></a>}
          {project.offline && <p className="detail-status eyebrow">현재 사이트 접속 불가</p>}
        </div>
      </header>
      <section className="detail-shot-section" aria-label={`${project.name} 서비스 화면`}>
        <figure className="detail-shot">
          <a className="archive-shot archive-shot--detail" href={project.image.src} target="_blank" rel="noreferrer">
            <img src={project.image.src} alt={project.image.alt} width={project.image.width} height={project.image.height} decoding="async" />
            <span className="archive-shot-bar eyebrow">
              <span>실제 서비스 화면</span>
              <span className="archive-shot-cta">화면 크게 보기 <span aria-hidden="true">↗</span></span>
            </span>
            <span className="sr-only">: {project.name} 스크린샷 원본 (새 창)</span>
          </a>
          <figcaption className="eyebrow">기존 포트폴리오에서 내려받은 스크린샷 · 가공하지 않은 원본</figcaption>
        </figure>
      </section>
      <section id="case-overview" className="detail-overview detail-overview--archive" aria-labelledby="overview-title">
        <div className="detail-overview-copy">
          <p className="eyebrow">Overview</p>
          <h2 id="overview-title">서비스 소개.</h2>
          <p className="detail-lead">{project.description}</p>
        </div>
        {facts.length > 0 && (
          <dl className="detail-facts">
            {facts.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
          </dl>
        )}
      </section>
      {project.contributions && (
        <div className="detail-reading detail-reading--archive">
          <section className="detail-chapter" id="contributions" aria-labelledby="contributions-title">
            <span className="detail-chapter-index" aria-hidden="true">01</span>
            <p className="eyebrow">01 / Contributions</p>
            <h2 id="contributions-title">담당한 일.</h2>
            <ol className="contribution-list" aria-label={`${project.name} 담당 내역`}>
              {project.contributions.map((item, itemIndex) => <li key={item}><span aria-hidden="true">0{itemIndex + 1}</span>{item}</li>)}
            </ol>
          </section>
        </div>
      )}
    </>
  );
}
