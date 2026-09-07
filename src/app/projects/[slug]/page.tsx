import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProjectPlate } from "../../../components/ProjectPlate";
import { projects } from "../../../data/portfolio";
import "../../portfolio-editorial.css";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = projects.find((item) => item.id === slug);
  if (!project) notFound();
  return {
    title: `${project.name} | 장준영 · Joy 프로젝트 기록`,
    description: project.summary,
    openGraph: {
      title: `${project.name} | 장준영 · Joy 프로젝트 기록`,
      description: project.summary,
      locale: "ko_KR",
      type: "article",
    },
  };
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  const project = projects.find((item) => item.id === slug);
  if (!project) notFound();
  const index = projects.indexOf(project);
  const next = projects[(index + 1) % projects.length];

  return (
    <div className={`portfolio-content project-detail project-detail--${project.id}`}>
      <a className="skip-link" href="#case-overview">프로젝트 본문으로 바로가기</a>
      <header className="site-header">
        <a className="wordmark" href="/#work" aria-label="Joy 포트폴리오 작업 목록"><span aria-hidden="true">[ + ]</span> Joy</a>
        <nav aria-label="프로젝트 메뉴"><a href={`/#${project.id}`}>← 작업 목록</a><a href="/#contact">연락</a></nav>
      </header>
      <main id="case-top">
        <header className="detail-cover">
          <div className="detail-kicker eyebrow"><span>Project notes / 0{index + 1}</span><span>H-Solution · {project.period}</span></div>
          <h1>{project.name}</h1>
          <div className="detail-cover-bottom">
            <p>{project.headline}</p>
            <a className="text-link" href={project.url} target="_blank" rel="noreferrer">서비스 방문<span aria-hidden="true">↗</span><span className="sr-only">: {project.name} (새 창)</span></a>
          </div>
        </header>
        <section id="case-overview" className="detail-overview" aria-labelledby="overview-title">
          <div className="detail-overview-copy">
            <p className="eyebrow">Overview</p>
            <h2 id="overview-title">{project.category}</h2>
            <p className="detail-lead">{project.caseStudy.introduction}</p>
            <dl className="detail-facts">
              <div><dt>소속 · 기간</dt><dd>H-Solution · {project.period}</dd></div>
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
                <p className="eyebrow">0{chapterIndex + 1} / {chapter.label}</p>
                <h2 id={`${chapter.id}-title`}>{chapter.title}</h2>
                <p className="chapter-description">{chapter.description}</p>
                <dl className="responsibility-list">
                  {chapter.items.map((item) => <div key={item.title}><dt>{item.title}</dt><dd>{item.description}</dd></div>)}
                </dl>
              </section>
            ))}
            <section className="detail-chapter detail-timeline" id="timeline" aria-labelledby="timeline-title">
              <p className="eyebrow">Project timeline</p>
              <h2 id="timeline-title">참여의 흐름.</h2>
              <ol>
                {project.caseStudy.phases.map((phase) => (
                  <li key={phase.period}><p className="eyebrow">{phase.period}</p><h3>{phase.title}</h3><p>{phase.description}</p></li>
                ))}
              </ol>
            </section>
          </div>
        </div>
        <nav className="detail-next" aria-label="다른 프로젝트">
          <a className="detail-next-project" href={`/projects/${next.id}`}>
            <span className="eyebrow">Next project / 0{projects.indexOf(next) + 1}</span>
            <span className="next-project-name">{next.name}<span aria-hidden="true">↗</span></span>
            <span className="next-project-category">{next.category}</span>
          </a>
          <div className="detail-return"><a className="text-link" href={`/#${project.id}`}>← 작업 목록으로 돌아가기</a><a className="text-link" href="#case-top">위로 ↑</a></div>
        </nav>
      </main>
      <footer className="detail-footer eyebrow"><span>장준영 · Fullstack developer</span><a href="/#contact">함께 일하기 ↗</a></footer>
    </div>
  );
}
