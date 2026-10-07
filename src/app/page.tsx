import { JoyHero } from "../components/JoyHero";
import { WorkStage } from "../components/WorkStage";
import { career, githubUrl, previousPortfolio, projectEntries } from "../data/portfolio";
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
              <a href="#work">프로젝트</a><a href="#career">경력</a><a href="#education">교육</a><a href="#contact">연락</a>
            </nav>
          </header>
          <section id="work" className="work-section" aria-labelledby="work-title">
            <span id="archive" className="project-anchor" aria-hidden="true" />
            <div className="section-intro">
              <p className="eyebrow">01 / 프로젝트</p>
              <div className="intro-heading"><h2 id="work-title">직접 참여한<br /><span>아홉 프로젝트</span></h2><p>풀스택 개발자 장준영입니다.<br />프론트엔드·백엔드·DB 설계부터 업무 자동화, 앱 개발, AWS 인프라와 CI/CD 배포 자동화까지 맡았습니다.</p></div>
            </div>
            <WorkStage entries={projectEntries} />
          </section>
          <section className="career-section section-pad" id="career" aria-labelledby="career-title">
            <div className="section-heading"><p className="eyebrow">02 / 경력</p><h2 id="career-title">개발 이력</h2><p>소속과 참여 기간,<br />각 회사에서 맡은 프로젝트입니다.</p></div>
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
          <section className="education-section section-pad" id="education" aria-labelledby="education-title">
            <div className="education"><div><p className="eyebrow">03 / 학력 · 교육</p><h2 id="education-title">학력 · 교육</h2></div><a className="text-link" href={previousPortfolio} target="_blank" rel="noreferrer">기존 이력에서 확인 <span aria-hidden="true">↗</span><span className="sr-only"> (새 창)</span></a></div>
          </section>
          <footer className="contact-section section-pad" id="contact" aria-labelledby="contact-title">
            <p className="eyebrow">04 / 연락</p>
            <h2 id="contact-title">함께할 일을<br /><span>기다립니다.</span></h2>
            <div className="contact-bottom"><p>채용과 프로젝트 협업에 관한<br />이야기를 나누고 싶습니다.</p><div className="contact-links"><a className="text-link" href={githubUrl} target="_blank" rel="noreferrer">GitHub · doppelgoer1 <span aria-hidden="true">↗</span><span className="sr-only"> (새 창)</span></a><a className="text-link" href={previousPortfolio} target="_blank" rel="noreferrer">기존 포트폴리오 · 연락처 <span aria-hidden="true">↗</span><span className="sr-only"> (새 창)</span></a></div></div>
            <div className="footer-line eyebrow"><span>장준영 · 풀스택 개발자</span><a href="#top">처음으로 ↑</a></div>
          </footer>
        </div>
      </main>
    </>
  );
}
