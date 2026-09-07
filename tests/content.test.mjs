import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { archive, career, projects } from "../src/data/portfolio.ts";

const html = readFileSync(new URL("../out/index.html", import.meta.url), "utf8");
const rendered = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, "");
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
  assert.equal(archive.find(({ name }) => name === "Bull-Finder").meta, "2025.03 ~ 2025.05");
  assert.match(archive.find(({ name }) => name === "ENG-SPARK").detail, /Azure OpenAI/);
  assert.equal(archive.filter(({ name }) => /Guidy|Gaime/.test(name)).length, 1);
  assert.match(archive.find(({ name }) => name.includes("Guidy")).detail, /하나의 서비스/);
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
