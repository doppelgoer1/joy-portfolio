import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { archive, career, projects } from "../src/data/portfolio.ts";

const html = readFileSync(new URL("../out/index.html", import.meta.url), "utf8");
// React separates adjacent text nodes with <!-- --> markers; drop them so text reads as rendered.
const rendered = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, "").replace(/<!--[\s\S]*?-->/g, "");
const text = rendered.replace(/<[^>]+>/g, " ");

test("선택 작업 순서와 실제 서비스 URL", () => {
  assert.deepEqual(projects.map(({ id, url }) => [id, url]), [
    ["h-works", "https://h-works.cloud"],
    ["fatespoiler", "https://www.fatespoiler.com/home"],
    ["moduerp", "https://mdm.club"],
  ]);
  for (const project of projects) {
    assert.ok(rendered.includes(`href="${project.url}"`));
    assert.ok(rendered.includes(`id="${project.id}"`));
    assert.ok(project.contributions.length >= 3);
    assert.ok(project.stack.length >= 3);
  }
});

test("H-Works의 확정 담당 범위·기술·초기 기간", () => {
  const project = projects[0];
  const content = JSON.stringify(project);
  for (const fact of ["2025.12 ~ 2026.02", "프론트엔드·백엔드·DB", "네이버 블로그", "당근 비즈니스", "카페 댓글 관련", "이미지 크롤링", "EC2", "Amplify", "S3", "Systems Manager", "Docker", "GitHub Actions", "CI/CD"]) {
    assert.ok(content.includes(fact), fact);
    assert.ok(text.includes(fact), `정적 HTML에서 누락: ${fact}`);
  }
  assert.deepEqual(project.stack.slice(0, 3), ["Next.js", "NestJS", "MariaDB"]);
  assert.equal(project.period, "2025.12 ~ 현재");
});

test("FateSpoiler의 단독 담당 범위와 앱 개발 시작일", () => {
  const project = projects[1];
  assert.equal(project.period, "2026.06 ~ 현재");
  assert.equal(project.role, "이메일 자동화·Apple 로그인·앱 개발 및 등록 단독 수행");
  assert.ok(project.contributions.some((item) => item.includes("2026.08") && item.includes("Capacitor")));
  assert.deepEqual(project.stack.slice(0, 4), ["Node.js", "Express", "Next.js", "MariaDB"]);
});

test("모두ERP의 초기 프론트 개발과 이후 유지보수 구분", () => {
  const project = projects[2];
  assert.equal(project.period, "2026.02 ~ 현재");
  assert.match(project.summary, /기본 기능 개발 이후/);
  assert.equal(project.role, "프론트엔드 개발 → 프론트엔드·백엔드 유지보수");
  assert.deepEqual(project.stack, ["Spring Boot", "Next.js", "PostgreSQL"]);
});

test("회사 기간, Bull-Finder 기간, Azure OpenAI, 이름 변경의 단일 기록", () => {
  assert.deepEqual(career.map(({ period }) => period), ["2025.12 ~ 현재", "2024.09 ~ 2025.12", "2021.09 ~ 2024.02"]);
  assert.equal(archive.find(({ name }) => name === "Bull-Finder").period, "2025.03 ~ 2025.05");
  assert.match(archive.find(({ name }) => name === "ENG-SPARK").detail, /Azure OpenAI/);
  assert.equal(archive.filter(({ name }) => /Guidy|Gaime/.test(name)).length, 1);
  assert.match(archive.find(({ name }) => name.includes("Guidy")).detail, /하나의 서비스/);
});

test("이전 프로젝트 카드: 실제 스크린샷, 카드마다 내부 상세 링크 하나, 외부 링크 없음", () => {
  assert.deepEqual(archive.map(({ id }) => id), ["eng-spark", "whaleai", "myro", "bull-finder", "guidy-gaime", "onbooth"]);
  assert.deepEqual(archive.filter(({ url }) => url).map(({ id, url }) => [id, url]), [
    ["eng-spark", "https://eng-spark.com"],
    ["whaleai", "https://whaleai.ai"],
  ]);
  const archiveHtml = rendered.slice(rendered.indexOf('id="archive"'), rendered.indexOf('id="education"'));
  assert.match(archiveHtml, /<h2 id="archive-title">이전 프로젝트\.<\/h2>/);
  assert.doesNotMatch(archiveHtml, /기존 포트폴리오에서 이어집니다|Earlier work|그동안의 기록/);
  assert.match(rendered, /href="#archive">이전 프로젝트</);
  for (const [index, project] of archive.entries()) {
    assert.ok(existsSync(new URL(`../public${project.image.src}`, import.meta.url)), project.image.src);
    assert.ok(existsSync(new URL(`../out${project.image.src}`, import.meta.url)), `export 누락: ${project.image.src}`);
    assert.ok(project.image.alt.startsWith(project.name.split(" ")[0]), project.id);
    assert.ok(archiveHtml.includes(`id="archive-${project.id}"`));
    assert.ok(archiveHtml.includes(`src="${project.image.src}"`));
    assert.ok(archiveHtml.includes(`alt="${project.image.alt}"`));
    assert.ok(archiveHtml.includes(`class="archive-shot" href="/projects/${project.id}"`), `${project.id} 내부 상세 링크`);
    assert.ok(archiveHtml.includes(`aria-hidden="true">0${projects.length + index + 1}</span>`), `${project.id} 번호는 주요 프로젝트 다음부터`);
  }
  assert.equal((archiveHtml.match(/<img\b/g) || []).length, archive.length);
  assert.equal((archiveHtml.match(/<a\b/g) || []).length, archive.length, "카드마다 링크 하나, 죽은 버튼 없음");
  assert.doesNotMatch(archiveHtml, /target="_blank"|href="https?:|서비스 방문|화면 크게 보기|<button\b/);
  assert.equal((archiveHtml.match(/프로젝트 보기/g) || []).length, archive.length);
  const careerHtml = rendered.slice(rendered.indexOf('id="career"'), rendered.indexOf('id="archive"'));
  for (const id of ["eng-spark", "whaleai", "bull-finder", "guidy-gaime", "myro"]) assert.ok(careerHtml.includes(`href="/projects/${id}"`), `경력에서 ${id} 상세로`);
  assert.doesNotMatch(careerHtml, /href="#archive-/);
  const onbooth = archive.find(({ id }) => id === "onbooth");
  assert.equal(onbooth.name, "온부스");
  assert.equal(onbooth.detail, "기업에 다양한 워크샵 프로그램을 제공하는 서비스");
  assert.equal(onbooth.url, undefined);
  assert.doesNotMatch(JSON.stringify(onbooth), /BFAI|H-Solution|20\d\d\./);
  assert.ok(archiveHtml.includes("기존 포트폴리오 기록"), "온부스 카드는 소속·기간 대신 출처만 표기");
  const gaime = archive.find(({ id }) => id === "guidy-gaime");
  assert.ok(gaime.name.includes("Gaime") && gaime.name.includes("Guidy"));
  assert.match(archive.find(({ id }) => id === "whaleai").detail, /B2B 프로젝트 매칭/);
  assert.match(archive.find(({ id }) => id === "bull-finder").detail, /영업 리드/);
  assert.match(archive.find(({ id }) => id === "myro").detail, /여행 일정/);
  assert.match(gaime.detail, /게임 가이드/);
  assert.doesNotMatch(text, /명함|business card|010-|@h-solution/i);
});

test("최신 prod의 CSS1 라벨·분할 마크업을 유지하고 새 본문의 과장 방지", () => {
  const labels = [...rendered.matchAll(/class="stack-card" data-stack="([^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual(labels, ["React", "Next.js", "TypeScript", "NestJS", "MariaDB", "CSS", "CSS1"]);
  assert.equal((rendered.match(/class="stack-text"/g) || []).length, 7);
  for (const side of ["left", "right"]) {
    assert.ok(rendered.includes(`<span class="split-text split-text--${side}">CSS1</span>`));
  }
  assert.match(rendered, /class="door-reveal-layer" aria-hidden="true"/);
  assert.match(text, /Selected\s+Product Work/);
  const portfolioText = rendered.slice(rendered.indexOf('<div class="portfolio-content">')).replace(/<[^>]+>/g, " ");
  assert.doesNotMatch(portfolioText, /fullscreen stack reveal|scroll scrub|CSS1|project cases start here/i);
  assert.doesNotMatch(text, /six years|frontend\s+product\s+builder/i);
  assert.doesNotMatch(text, /침투|RDS|무중단|자동 롤백|공식 API|정책 준수|심사 승인|스토어 출시|전체 웹서비스.*단독/);
  assert.match(text, /장준영 · Fullstack developer/);
  assert.equal((rendered.match(/서비스 화면 아님/g) || []).length, 3);
  assert.doesNotMatch(rendered, /href="mailto:/);
});

test("정적 내비게이션·헤딩·키보드 링크의 접근성 구조", () => {
  assert.match(html, /<html lang="ko"/);
  assert.equal((rendered.match(/<h1\b/g) || []).length, 1);
  assert.match(rendered, /class="skip-link" href="#work"/);
  const ids = [...rendered.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(new Set(ids).size, ids.length, "중복 ID 없음");
  for (const match of rendered.matchAll(/href="#([^"]*)"/g)) {
    assert.ok(match[1] && ids.includes(match[1]), `존재하는 앵커: ${match[1]}`);
  }
  for (const match of rendered.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)) {
    assert.doesNotMatch(match[1], /href="(?:|#|javascript:[^"]*)"/);
    assert.ok(match[2].replace(/<[^>]*>/g, "").trim(), "모든 링크에 텍스트 제공");
    if (match[1].includes('target="_blank"')) {
      assert.match(match[1], /rel="[^"]*noreferrer/);
      assert.match(match[2], /새 창/);
    }
  }
  for (const id of ["work", "career", "archive", "education", "contact"]) assert.ok(ids.includes(id));
});
