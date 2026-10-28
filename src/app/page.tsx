import { JoyHero } from "../components/JoyHero";
import { SmoothHeader } from "../components/SmoothHeader";
import { WorkStage } from "../components/WorkStage";
import { career, contactEmail, education, githubUrl, previousPortfolio, projectEntries, technologyGroups } from "../data/portfolio";
import "./portfolio-editorial.css";
import "./work-transition.css";
import "./full-motion.css";
import "./project-navigation.css";

export default function Home() {
  return (
    <>
      <a className="skip-link" href="#work">프로젝트로 바로가기</a>
      <main id="top">
        <JoyHero />
        <div className="portfolio-content">
          <SmoothHeader>
            <a className="wordmark" href="#top" aria-label="Joy 포트폴리오 처음으로"><span aria-hidden="true">[ + ]</span> Joy</a>
            <nav aria-label="주요 메뉴">
              <a href="#work">프로젝트</a><a href="#career">경력</a><a href="#education">교육</a><a href="#contact">연락</a>
            </nav>
          </SmoothHeader>
          <section className="work-section" aria-labelledby="work-title">
            <WorkStage entries={projectEntries} />
          </section>
          <section tabIndex={-1} className="career-section section-pad" id="career" aria-labelledby="career-title">
            <div className="section-heading"><p className="eyebrow">02 / 경력</p><h2 id="career-title">개발 이력</h2><p>재직 기간과<br />회사별 참여 프로젝트입니다.</p></div>
            <div className="section-heading" aria-labelledby="technology-title">
              <h3 className="eyebrow" id="technology-title">사용 기술</h3>
              {[technologyGroups.slice(0, 3), technologyGroups.slice(3)].map((groups, index) => (
                <dl className="detail-facts" key={index}>
                  {groups.map((group) => <div key={group.category}><dt className="eyebrow">{group.category}</dt><dd><ul className="tech-list">{group.items.map((item) => <li key={item}>{item}</li>)}</ul></dd></div>)}
                </dl>
              ))}
            </div>
            <ol className="career-list">
              {career.map((job) => (
                <li key={job.company}>
                  <div className="career-date"><span className="career-year" aria-hidden="true">{job.period.slice(0, 7)}</span><p className="career-period eyebrow">{job.period}</p></div>
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
          <div className="education-section section-pad" id="education" aria-labelledby="education-title">
            <div className="education"><div><p className="eyebrow">03 / 학력 · 교육</p><h2 id="education-title">학력 · 교육</h2></div></div>
            <ol className="career-list">
              {education.map((item) => <li key={item.school}><div><p className="eyebrow">{item.period}</p></div><div><h3>{item.school}</h3><p>{item.course}</p></div></li>)}
            </ol>
          </div>
          </section>
          <section tabIndex={-1} className="contact-section section-pad" id="contact" aria-labelledby="contact-title">
            <div className="contact-heading-space"><div className="contact-head">
              <p className="eyebrow">04 / 연락</p>
              <h2 id="contact-title">연락</h2>
              <p>채용이나 프로젝트 협업에 관한 문의는 이메일로 보내 주세요.</p>
            </div></div>
            <nav className="contact-rows" aria-label="연락 및 외부 링크">
              <a href={githubUrl} target="_blank" rel="noreferrer"><span>GitHub · doppelgoer1</span><span aria-hidden="true">↗</span><span className="sr-only"> (새 창)</span></a>
              <a href={previousPortfolio} target="_blank" rel="noreferrer"><span>이전 포트폴리오</span><span aria-hidden="true">↗</span><span className="sr-only"> (새 창)</span></a>
              <a href={`mailto:${contactEmail}`}><span>{contactEmail}</span><span aria-hidden="true">↗</span></a>
              <a href="#top"><span>처음으로</span><span aria-hidden="true">↑</span></a>
            </nav>
          </section>
          <footer className="footer-line eyebrow"><span>장준영 · 풀스택 개발자</span><span>04 / 연락</span></footer>
        </div>
      </main>
    </>
  );
}
