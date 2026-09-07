import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { projects } from "../src/data/portfolio.ts";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const hash = (content) => createHash("sha256").update(content).digest("hex");
const baseline = JSON.parse(read("tests/fixtures/hero-preservation.json"));
const rendered = (path) => read(path).replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, "");
const pages = new Map([
  ["/", rendered("out/index.html")],
  ...projects.map((project) => [`/projects/${project.id}`, rendered(`out/projects/${project.id}.html`)]),
]);

test("복원된 JoyHero 전체·원본 CSS prefix·기존 모션 테스트를 바이트 단위로 보존", () => {
  assert.equal(hash(read("src/components/JoyHero.tsx")), baseline.heroSha256);
  const css = Buffer.from(read("src/app/globals.css"));
  assert.equal(hash(css.subarray(0, baseline.cssPrefixBytes)), baseline.cssPrefixSha256);
  assert.equal(hash(read("tests/motion.test.mjs")), baseline.motionTestSha256);
});

test("신규 CSS의 모든 일반 선택자는 portfolio-content 하위에만 적용", () => {
  const css = read("src/app/portfolio-editorial.css").replace(/\/\*[\s\S]*?\*\//g, "");
  assert.doesNotMatch(css, /\.(?:joy-stage|joy-pin|joy-nav|stack-card|stack-text|portfolio-title|dock-copy|vertical-curtain|curtain-split|scroll-progress)\b|--p\s*:/);
  for (const [, prelude] of css.matchAll(/([^{}]+)\{/g)) {
    const rule = prelude.trim();
    if (rule.startsWith("@") || rule === "from" || rule === "to") continue;
    for (const selector of rule.split(",")) {
      assert.match(selector.trim(), /^\.portfolio-content(?:\.[\w-]+)?(?:\s|$)/, selector);
    }
  }
  assert.match(css, /prefers-reduced-motion: no-preference/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(css, /@supports \(animation-timeline: view\(\)\)/);
});

test("선택한 세 프로젝트가 개별 제목·설명·전체 본문을 갖는 정적 페이지로 생성", () => {
  for (const project of projects) {
    const html = pages.get(`/projects/${project.id}`);
    assert.equal((html.match(/<h1\b/g) || []).length, 1);
    assert.ok(html.includes(`<h1>${project.name}</h1>`));
    assert.ok(html.includes(`<title>${project.name} | 장준영 · Joy 프로젝트 기록</title>`));
    assert.ok(html.includes(`name="description" content="${project.summary}"`));
    assert.ok(html.includes(`property="og:title" content="${project.name} | 장준영 · Joy 프로젝트 기록"`));
    assert.ok(html.includes(project.role));
    assert.ok(html.includes(project.caseStudy.introduction));
    assert.doesNotMatch(html, /class="joy-stage"|class="stack-card"/);
    for (const chapter of project.caseStudy.chapters) {
      assert.ok(html.includes(`id="${chapter.id}"`));
      assert.ok(html.includes(chapter.description));
      for (const item of chapter.items) assert.ok(html.includes(item.description));
    }
    for (const phase of project.caseStudy.phases) assert.ok(html.includes(phase.period));
  }
});

test("홈·상세 페이지의 모든 내부 경로와 fragment가 export 결과에 존재", () => {
  for (const [path, html] of pages) {
    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
    assert.equal(new Set(ids).size, ids.length, `${path}: 중복 ID`);
    for (const [, href] of html.matchAll(/<a\b[^>]*\bhref="([^"]*)"/g)) {
      assert.ok(href && href !== "#" && !href.startsWith("javascript:"));
      if (/^https?:/.test(href)) continue;
      const target = new URL(href, `https://portfolio.test${path}`);
      const targetPage = pages.get(target.pathname);
      assert.ok(targetPage, `${path} → ${href}: 누락된 경로`);
      if (target.hash) assert.ok(targetPage.includes(`id="${target.hash.slice(1)}"`), `${path} → ${href}: 누락된 앵커`);
    }
  }
});

test("홈에서 상세 진입·해당 프로젝트 복귀·다음 프로젝트 순환 연결", () => {
  for (const [index, project] of projects.entries()) {
    const home = pages.get("/");
    const html = pages.get(`/projects/${project.id}`);
    const next = projects[(index + 1) % projects.length];
    assert.ok(home.includes(`class="case-read-link" href="/projects/${project.id}"`));
    assert.ok(html.includes(`href="/#${project.id}"`));
    assert.ok(html.includes(`href="/projects/${next.id}"`));
    assert.ok(html.includes(`href="${project.url}"`));
  }
  assert.match(read("src/app/projects/[slug]/page.tsx"), /export const dynamicParams = false/);
  assert.match(read("src/app/projects/[slug]/page.tsx"), /if \(!project\) notFound\(\)/);
  assert.match(rendered("out/404.html"), /404/);
});

test("상세 페이지에서 기술·담당 범위·등록 사실의 과장과 가짜 화면을 방지", () => {
  for (const project of projects) {
    const html = pages.get(`/projects/${project.id}`);
    const text = html.replace(/<[^>]*>/g, " ");
    assert.doesNotMatch(text, /침투|RDS|무중단|자동 롤백|공식 API|정책 준수|심사 승인|스토어 출시|전체 웹서비스.*단독|\d+\s*%|\d+배/);
    assert.doesNotMatch(html, /<img\b|<iframe\b|<canvas\b/);
    assert.ok(text.includes("서비스 화면 아님"));
    assert.doesNotMatch(html, /href="mailto:/);
  }
  const hworks = pages.get("/projects/h-works");
  for (const fact of ["프론트엔드·백엔드·DB", "네이버 블로그", "당근 비즈니스", "카페 댓글", "이미지 크롤링", "EC2", "Amplify", "Systems Manager", "GitHub Actions", "Docker", "CI/CD"]) assert.ok(hworks.includes(fact), fact);
  const fate = pages.get("/projects/fatespoiler");
  for (const fact of ["2026.08", "Capacitor", "Apple 로그인", "앱 등록", "단독"]) assert.ok(fate.includes(fact), fact);
  const erp = pages.get("/projects/moduerp");
  assert.ok(erp.includes("기본 기능 개발 이후"));
  assert.ok(erp.includes("Spring Boot 기반 백엔드의 유지보수"));
});

test("상세 페이지의 JS 없는 목차·skip link·새 창 링크에 접근성 정보 제공", () => {
  for (const project of projects) {
    const html = pages.get(`/projects/${project.id}`);
    assert.match(html, /<html lang="ko"/);
    assert.match(html, /class="skip-link" href="#case-overview"/);
    assert.match(html, /aria-label="프로젝트 목차"/);
    assert.match(html, /aria-label="다른 프로젝트"/);
    for (const [, attributes, content] of html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)) {
      assert.ok(content.replace(/<[^>]*>/g, "").trim());
      if (attributes.includes('target="_blank"')) {
        assert.match(attributes, /rel="[^"]*noreferrer/);
        assert.match(content, /새 창/);
      }
    }
  }
});
