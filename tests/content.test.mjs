import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { archive, career, projectEntries, projects } from "../src/data/portfolio.ts";

const html = readFileSync(new URL("../out/index.html", import.meta.url), "utf8");
// React separates adjacent text nodes with <!-- --> markers; drop them so text reads as rendered.
const rendered = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, "").replace(/<!--[\s\S]*?-->/g, "");
const details = projectEntries.map(({ project }) => readFileSync(new URL(`../out/projects/${project.id}.html`, import.meta.url), "utf8").replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, "").replace(/<!--[\s\S]*?-->/g, "")).join(" ");
const text = (rendered + details).replace(/<[^>]+>/g, " ");

test("선택 작업 순서와 실제 서비스 URL", () => {
  assert.deepEqual(projects.map(({ id, url }) => [id, url]), [
    ["h-works", "https://h-works.cloud"],
    ["fatespoiler", "https://www.fatespoiler.com/home"],
    ["moduerp", "https://mdm.club"],
  ]);
  for (const project of projects) {
    assert.ok(details.includes(`href="${project.url}"`));
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

test("아홉 프로젝트를 한 무대에서 제공하고 기존 화면·역할·앵커를 유지", () => {
  assert.equal((rendered.match(/class="work-stage"/g) || []).length, 1);
  assert.doesNotMatch(rendered, /archive-grid|archive-title|Previous projects|이전 프로젝트\./);
  for (const { project } of projectEntries) {
    assert.ok(rendered.includes(`id="${project.id}"`));
    assert.ok(rendered.includes(`href="/projects/${project.id}"`));
    if (project.role) assert.ok(text.includes(project.role), project.id);
    for (const item of project.contributions ?? []) assert.ok(text.includes(item), item);
  }
  for (const project of archive) {
    assert.ok(existsSync(new URL(`../public${project.image.src}`, import.meta.url)));
    assert.ok(existsSync(new URL(`../out${project.image.src}`, import.meta.url)));
    assert.ok(rendered.includes(`id="archive-${project.id}"`));
    assert.ok(rendered.includes(`src="${project.image.src}"`));
    assert.ok(rendered.includes(`alt="${project.image.alt}"`));
  }
  const onbooth = archive.find(({ id }) => id === "onbooth");
  assert.equal(onbooth.url, undefined);
  assert.doesNotMatch(JSON.stringify(onbooth), /BFAI|H-Solution|20\d\d\./);
  assert.doesNotMatch(text, /명함|business card|010-|@h-solution/i);
});

test("소개와 메타데이터가 확인된 풀스택 범위를 전달", () => {
  for (const fact of ["풀스택 개발자 장준영", "프론트엔드·백엔드·DB 설계", "업무 자동화", "앱 개발", "AWS 인프라", "CI/CD 배포 자동화"]) {
    assert.ok(text.includes(fact), fact);
    for (const attribute of ['name="description"', 'property="og:description"']) {
      const meta = rendered.match(new RegExp(`<meta ${attribute} content="([^\"]*)"`))?.[1];
      assert.ok(meta?.includes(fact), `${attribute}: ${fact}`);
    }
  }
  assert.doesNotMatch(rendered, /Selected Product Work|Project cases start here|Fullscreen stack reveal|Scroll scrub|Six years|backend fluency|만들고[, ]*운영합니다/i);
});

test("최신 prod의 CSS1 라벨·분할 마크업을 유지하고 새 본문의 과장 방지", () => {
  const labels = [...rendered.matchAll(/class="stack-card" data-stack="([^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual(labels, ["React", "Next.js", "TypeScript", "NestJS", "MariaDB", "CSS", "CSS1"]);
  assert.equal((rendered.match(/class="stack-text"/g) || []).length, 7);
  for (const side of ["left", "right"]) {
    assert.ok(rendered.includes(`<span class="split-text split-text--${side}">CSS1</span>`));
  }
  assert.match(rendered, /class="door-reveal-layer" aria-hidden="true"/);
  assert.match(text, /설계부터\s+개발까지/);
  const portfolioText = rendered.slice(rendered.indexOf('<div class="portfolio-content">')).replace(/<[^>]+>/g, " ");
  assert.doesNotMatch(portfolioText, /fullscreen stack reveal|scroll scrub|CSS1|project cases start here/i);
  assert.doesNotMatch(text, /six years|frontend\s+product\s+builder/i);
  assert.doesNotMatch(text, /침투|RDS|무중단|자동 롤백|공식 API|정책 준수|심사 승인|스토어 출시|전체 웹서비스.*단독/);
  assert.match(text, /장준영 · 풀스택 개발자/);
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
