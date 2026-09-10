import { JoyHero } from "../components/JoyHero";
import { WorkStage } from "../components/WorkStage";
import { archive, career, githubUrl, previousPortfolio, projects } from "../data/portfolio";
import "./portfolio-editorial.css";

export default function Home() {
  return (
    <>
      <a className="skip-link" href="#work">프로젝트로 바로가기</a>
      <main id="top">
        <JoyHero />
        <div className="portfolio-content">
          <header className="site-header">
            <a className="wordmark" href="#top" aria-label="Joy 포트폴리오 처음으로"><span aria-hidden="true">[ + ]</span> Joy</a>
            <nav aria-label="주요 메뉴">
              <a href="#work">작업</a><a href="#career">경력</a><a href="#archive">이전 프로젝트</a><a href="#contact">연락</a>
            </nav>
          </header>
          <section id="work" className="work-section" aria-labelledby="work-title">
            <div className="section-intro">
              <p className="eyebrow">01 / Selected work</p>
              <div className="intro-heading"><h2 id="work-title">주요<br /><span>프로젝트</span></h2><p>H-Solution에서 맡은<br />세 가지 프로젝트입니다.<br />카드를 골라 담당 업무를 확인하세요.</p></div>
            </div>
            <WorkStage projects={projects} />
          </section>
          <section className="career-section section-pad" id="career" aria-labelledby="career-title">
            <div className="section-heading"><p className="eyebrow">02 / Career</p><h2 id="career-title">이어온 일.</h2><p>새로운 기능을 만들고,<br />서비스의 다음 단계를 함께합니다.</p></div>
            <ol className="career-list">
              {career.map((job, index) => (
                <li key={job.company}>
                  <span className="career-index" aria-hidden="true">0{index + 1}</span>
                  <p className="career-period eyebrow">{job.period}</p>
                  <div>
                    <div className="career-company"><h3>{job.company}</h3><span>{job.title}</span></div>
                    <p>{job.description}</p>
                    <nav className="career-work-links" aria-label={`${job.company} 프로젝트 기록`}>
                      {job.links.map((link) => <a href={link.href} key={link.href}>{link.label}<span aria-hidden="true">↗</span></a>)}
                    </nav>
                  </div>
                </li>
              ))}
            </ol>
          </section>
          <section className="archive-section section-pad" id="archive" aria-labelledby="archive-title">
            <div className="section-heading"><p className="eyebrow">03 / Previous projects</p><h2 id="archive-title">이전 프로젝트.</h2><p>이전에 참여한 서비스의 실제 화면입니다.<br />카드를 눌러 프로젝트 기록을 확인하세요.</p></div>
            <ul className="archive-list archive-grid">
              {archive.map((project, index) => (
                <li key={project.id} id={`archive-${project.id}`} className="archive-card">
                  <a className="archive-shot" href={`/projects/${project.id}`}>
                    <img src={project.image.src} alt={project.image.alt} width={project.image.width} height={project.image.height} loading="lazy" decoding="async" />
                    <span className="archive-shot-bar eyebrow">
                      <span>실제 서비스 화면</span>
                      <span className="archive-shot-cta">프로젝트 보기 <span aria-hidden="true">↗</span></span>
                    </span>
                    <span className="sr-only">: {project.name} 프로젝트 기록</span>
                  </a>
                  <div className="archive-copy">
                    <span className="archive-number eyebrow" aria-hidden="true">0{projects.length + index + 1}</span>
                    <div className="archive-text"><h3>{project.name}</h3><p>{project.detail}</p></div>
                    <span className="archive-meta">{[project.company, project.period].filter(Boolean).join(" · ") || "기존 포트폴리오 기록"}</span>
                  </div>
                </li>
              ))}
            </ul>
            <div className="education" id="education"><div><p className="eyebrow">Education</p><h3>학력 · 교육</h3></div><a className="text-link" href={previousPortfolio} target="_blank" rel="noreferrer">기존 이력에서 확인 <span aria-hidden="true">↗</span><span className="sr-only"> (새 창)</span></a></div>
          </section>
          <footer className="contact-section section-pad" id="contact" aria-labelledby="contact-title">
            <p className="eyebrow">04 / Contact</p>
            <h2 id="contact-title">Let&apos;s build<br /><span>what&apos;s next.</span></h2>
            <div className="contact-bottom"><p>다음 서비스를 함께 만들어 갈<br />동료와 팀을 기다립니다.</p><div className="contact-links"><a className="text-link" href={githubUrl} target="_blank" rel="noreferrer">GitHub · doppelgoer1 <span aria-hidden="true">↗</span><span className="sr-only"> (새 창)</span></a><a className="text-link" href={previousPortfolio} target="_blank" rel="noreferrer">기존 포트폴리오 · 연락처 <span aria-hidden="true">↗</span><span className="sr-only"> (새 창)</span></a></div></div>
            <div className="footer-line eyebrow"><span>장준영 · Fullstack developer</span><a href="#top">처음으로 ↑</a></div>
          </footer>
        </div>
      </main>
    </>
  );
}
