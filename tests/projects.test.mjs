import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { archive, projectEntries, projects, returnAnchor } from "../src/data/portfolio.ts";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const hash = (content) => createHash("sha256").update(content).digest("hex");
const baseline = JSON.parse(read("tests/fixtures/hero-preservation.json"));
// React separates adjacent text nodes with <!-- --> markers; drop them so text reads as rendered.
const rendered = (path) => read(path).replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, "").replace(/<!--[\s\S]*?-->/g, "");
const pages = new Map([
  ["/", rendered("out/index.html")],
  ...projectEntries.map(({ project }) => [`/projects/${project.id}`, rendered(`out/projects/${project.id}.html`)]),
]);
const textOf = (html) => html.replace(/<[^>]*>/g, " ");

test("9a4ec88 기준 JoyHero 전체·CSS prefix·갱신한 모션 테스트 snapshot 보존", () => {
  assert.equal(baseline.sourceCommit, "9a4ec88fabe7159458a33848d320cae911a4e130");
  assert.equal(hash(read("src/components/JoyHero.tsx")), baseline.heroSha256);
  const css = Buffer.from(read("src/app/globals.css"));
  assert.equal(hash(css.subarray(0, baseline.cssPrefixBytes)), baseline.cssPrefixSha256);
  assert.equal(hash(read("tests/motion.test.mjs")), baseline.motionTestSha256);
});

test("WorkStage는 이전 프로젝트 상세 추가 이전과 바이트 단위로 동일, 주요 프로젝트는 여전히 셋", () => {
  assert.equal(hash(read("src/components/WorkStage.tsx")), "7e35aea19ead15d089d9d497feca56288ba05b2a4abc28dc273a39e6a0c369af");
  assert.deepEqual(projects.map(({ id }) => id), ["h-works", "fatespoiler", "moduerp"]);
  assert.match(pages.get("/"), /class="stage-counter eyebrow" aria-live="polite">01 \/ 03 · H-Works</);
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

test("아홉 프로젝트가 모두 개별 제목·설명을 가진 정적 페이지로 생성", () => {
  assert.equal(projectEntries.length, 9);
  assert.deepEqual(projectEntries.map(({ project }) => project.id), ["h-works", "fatespoiler", "moduerp", "eng-spark", "whaleai", "myro", "bull-finder", "guidy-gaime", "onbooth"]);
  for (const [index, entry] of projectEntries.entries()) {
    const { project } = entry;
    const html = pages.get(`/projects/${project.id}`);
    const summary = entry.kind === "featured" ? project.summary : project.description;
    assert.equal((html.match(/<h1\b/g) || []).length, 1);
    assert.ok(html.includes(`<h1>${project.name}</h1>`));
    assert.ok(html.includes(`<title>${project.name} | 장준영 · Joy 프로젝트 기록</title>`));
    assert.ok(html.includes(`name="description" content="${summary}"`));
    assert.ok(html.includes(`property="og:title" content="${project.name} | 장준영 · Joy 프로젝트 기록"`));
    assert.ok(html.includes(`Project notes / 0${index + 1}<`), `${project.id} 번호는 아홉 중 순서`);
    assert.ok(html.includes(`class="portfolio-content project-detail project-detail--${entry.kind} project-detail--${project.id}"`));
    assert.doesNotMatch(html, /class="joy-stage"|class="stack-card"/);
    assert.doesNotMatch(html, /href="mailto:/);
  }
});

test("주요 세 프로젝트의 상세 본문(장·항목·흐름)은 그대로 유지", () => {
  for (const project of projects) {
    const html = pages.get(`/projects/${project.id}`);
    assert.ok(html.includes(project.role));
    assert.ok(html.includes(project.caseStudy.introduction));
    assert.ok(html.includes(`H-Solution · ${project.period}`));
    assert.ok(html.includes("Selected work / H-Solution"));
    for (const chapter of project.caseStudy.chapters) {
      assert.ok(html.includes(`id="${chapter.id}"`));
      assert.ok(html.includes(chapter.description));
      for (const item of chapter.items) assert.ok(html.includes(item.description));
    }
    for (const phase of project.caseStudy.phases) assert.ok(html.includes(phase.period));
    assert.match(html, /aria-label="프로젝트 목차"/);
    assert.match(html, /class="skip-link" href="#case-overview"/);
  }
  assert.doesNotMatch(read("src/app/projects/[slug]/page.tsx"), /"H-Solution"/, "레이아웃에 소속 하드코딩 없음");
  assert.doesNotMatch(read("src/components/ProjectPlate.tsx"), /H-Solution/);
});

test("이전 프로젝트 상세: 실제 스크린샷 한 장을 자르지 않고 원본 링크와 함께 표시", () => {
  for (const project of archive) {
    const html = pages.get(`/projects/${project.id}`);
    assert.ok(existsSync(new URL(`../out${project.image.src}`, import.meta.url)), project.image.src);
    assert.equal((html.match(/<img\b/g) || []).length, 1, `${project.id}: 이미지 한 장`);
    assert.ok(html.includes(`<img src="${project.image.src}" alt="${project.image.alt}" width="${project.image.width}" height="${project.image.height}"`));
    assert.ok(html.includes(`class="archive-shot archive-shot--detail" href="${project.image.src}" target="_blank" rel="noreferrer"`), `${project.id}: 화면 크게 보기`);
    assert.ok(html.includes("화면 크게 보기"));
    assert.ok(html.includes("기존 포트폴리오에서 내려받은 스크린샷"));
    assert.doesNotMatch(html, /<iframe\b|<canvas\b|<svg\b|서비스 화면 아님/);
    assert.ok(html.includes(project.description));
    assert.ok(html.includes(`<h2 id="overview-title">서비스 소개.</h2>`));
    assert.ok(html.includes(`href="${project.image.src}"`));
  }
  const css = read("src/app/portfolio-editorial.css");
  assert.match(css, /\.portfolio-content \.archive-shot--detail img \{ object-fit: contain; \}/);
  assert.match(css, /\.portfolio-content \.archive-shot img \{[^}]*width: 100%; height: auto;/);
});

test("운영 링크 정책: ENG-SPARK·WhaleAI만 외부 링크, 접속 불가 세 건은 상태 문구, 온부스는 상태 없음", () => {
  const external = (html) => [...html.matchAll(/href="(https?:[^"]+)"/g)].map((match) => match[1]);
  for (const project of archive) {
    const html = pages.get(`/projects/${project.id}`);
    const text = textOf(html);
    if (project.url) {
      assert.deepEqual([...new Set(external(html))], [project.url], `${project.id}: 서비스 URL만 외부 링크`);
      assert.ok(html.includes(`href="${project.url}" target="_blank" rel="noreferrer"`));
      assert.match(text, /서비스 방문/);
      assert.match(text, /운영 상태\s+운영 중/);
      assert.doesNotMatch(text, /접속 불가|운영 종료/);
    } else {
      assert.deepEqual(external(html), [], `${project.id}: 외부 링크 없음`);
      assert.doesNotMatch(text, /서비스 방문/);
    }
    if (project.offline) {
      assert.equal((text.match(/현재 사이트 접속 불가/g) || []).length, 2, `${project.id}: 표지와 사실 표에 상태 표기`);
      assert.doesNotMatch(text, /영구|폐쇄|서비스 종료|운영 종료/);
    }
  }
  assert.deepEqual(archive.filter(({ url }) => url).map(({ id }) => id), ["eng-spark", "whaleai"]);
  assert.deepEqual(archive.filter(({ offline }) => offline).map(({ id }) => id), ["myro", "bull-finder", "guidy-gaime"]);
  assert.ok(archive.every((project) => !(project.url && project.offline)));
  const onbooth = textOf(pages.get("/projects/onbooth"));
  assert.doesNotMatch(onbooth, /접속 불가|운영 상태|운영 중|소속 · 기간|담당 범위|사용 기술|담당한 일|BFAI|H-Solution|MYRO|20\d\d\.\d\d|명함|business card|1115/i);
  assert.match(onbooth, /Previous project/);
  assert.ok(onbooth.includes("기업에 다양한 워크샵 프로그램을 제공하는 서비스"));
});

test("선택 항목만 표시: 확인된 소속·기간·담당·기술만 행으로 두고 없는 항목은 비움", () => {
  const rows = (html) => [...html.matchAll(/<dt>([^<]+)<\/dt>/g)].map((match) => match[1]);
  assert.deepEqual(rows(pages.get("/projects/eng-spark")), ["소속 · 기간", "담당 범위", "사용 기술", "운영 상태"]);
  assert.deepEqual(rows(pages.get("/projects/whaleai")), ["소속 · 기간", "담당 범위", "사용 기술", "운영 상태"]);
  assert.deepEqual(rows(pages.get("/projects/myro")), ["소속 · 기간", "담당 범위", "사용 기술", "운영 상태"]);
  assert.deepEqual(rows(pages.get("/projects/bull-finder")), ["소속 · 기간", "사용 기술", "운영 상태"]);
  assert.deepEqual(rows(pages.get("/projects/guidy-gaime")), ["소속 · 기간", "사용 기술", "운영 상태"]);
  assert.deepEqual(rows(pages.get("/projects/onbooth")), []);
  for (const project of archive) {
    const html = pages.get(`/projects/${project.id}`);
    const text = textOf(html);
    assert.equal(html.includes('id="contributions"'), Boolean(project.contributions), `${project.id}: 담당 내역이 있을 때만 장 표시`);
    for (const item of project.contributions ?? []) assert.ok(text.includes(item), item);
    for (const tech of project.stack ?? []) assert.ok(html.includes(`<li>${tech}</li>`), tech);
    if (project.role) assert.ok(text.includes(project.role));
    assert.doesNotMatch(text, /담당 범위\s+(?:미확인|확인 중|-)|추후|placeholder|TBD/i);
    assert.doesNotMatch(text, /\d+\s*%|\d+배|\d+개 이상|\d+개 프로젝트|\d+가지|Lighthouse|총괄|Gemini|Claude API/);
  }
});

test("BFAI 기록의 '~ 현재'를 옮기지 않고, Guidy/Gaime은 Azure OpenAI 하나의 경로", () => {
  for (const project of archive) {
    assert.doesNotMatch(JSON.stringify(project), /현재/, `${project.id}: 재직 중으로 읽히는 기간 없음`);
    assert.doesNotMatch(textOf(pages.get(`/projects/${project.id}`)), /~ 현재/);
  }
  assert.deepEqual(archive.filter(({ name }) => /Guidy|Gaime/.test(name)).map(({ id }) => id), ["guidy-gaime"]);
  const gaime = textOf(pages.get("/projects/guidy-gaime"));
  assert.match(gaime, /Azure OpenAI/);
  assert.match(gaime, /하나의 서비스/);
  assert.match(textOf(pages.get("/projects/eng-spark")), /Azure OpenAI/);
  assert.match(textOf(pages.get("/projects/bull-finder")), /2025\.03 ~ 2025\.05/);
  assert.match(textOf(pages.get("/projects/myro")), /2021\.09 ~ 2024\.02/);
  assert.ok(archive.find(({ id }) => id === "eng-spark").period.startsWith("2025.08"));
  assert.ok(archive.find(({ id }) => id === "guidy-gaime").period.startsWith("2025.06"));
});

test("홈·상세 페이지의 모든 내부 경로와 fragment가 export 결과에 존재", () => {
  for (const [path, html] of pages) {
    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
    assert.equal(new Set(ids).size, ids.length, `${path}: 중복 ID`);
    for (const [, href] of html.matchAll(/<a\b[^>]*\bhref="([^"]*)"/g)) {
      assert.ok(href && href !== "#" && !href.startsWith("javascript:"));
      if (/^https?:/.test(href)) continue;
      const target = new URL(href, `https://portfolio.test${path}`);
      if (/\.\w+$/.test(target.pathname)) {
        assert.ok(existsSync(new URL(`../out${target.pathname}`, import.meta.url)), `${path} → ${href}: 누락된 정적 파일`);
        continue;
      }
      const targetPage = pages.get(target.pathname);
      assert.ok(targetPage, `${path} → ${href}: 누락된 경로`);
      if (target.hash) assert.ok(targetPage.includes(`id="${target.hash.slice(1)}"`), `${path} → ${href}: 누락된 앵커`);
    }
  }
});

test("홈에서 상세 진입, 종류별 복귀 앵커, 아홉 프로젝트 순환 연결", () => {
  const home = pages.get("/");
  for (const [index, entry] of projectEntries.entries()) {
    const { project } = entry;
    const html = pages.get(`/projects/${project.id}`);
    const next = projectEntries[(index + 1) % projectEntries.length];
    const back = entry.kind === "featured" ? `/#${project.id}` : `/#archive-${project.id}`;
    assert.equal(returnAnchor(entry), back);
    if (entry.kind === "featured") assert.ok(home.includes(`class="case-read-link" href="/projects/${project.id}"`));
    else assert.ok(home.includes(`class="archive-shot" href="/projects/${project.id}"`));
    assert.equal((html.match(new RegExp(`href="${back}"`, "g")) || []).length, 2, `${project.id}: 머리글과 바닥글의 복귀 링크`);
    assert.ok(html.includes(`class="detail-next-project" href="/projects/${next.project.id}"`), `${project.id} → ${next.project.id}`);
    assert.ok(html.includes(`Next project / 0${(index + 1) % projectEntries.length + 1}<`));
    assert.doesNotMatch(html, new RegExp(`href="/#archive-${project.id}"[^>]*>[^<]*(?:주요|Selected)`));
  }
  assert.ok(pages.get("/projects/moduerp").includes('href="/projects/eng-spark"'), "주요 마지막 → 이전 첫 번째");
  assert.ok(pages.get("/projects/onbooth").includes('href="/projects/h-works"'), "이전 마지막 → 주요 첫 번째");
  assert.match(read("src/app/projects/[slug]/page.tsx"), /export const dynamicParams = false/);
  assert.match(read("src/app/projects/[slug]/page.tsx"), /if \(!entry\) notFound\(\)/);
  assert.match(rendered("out/404.html"), /404/);
});

test("주요 프로젝트 상세에서 기술·담당 범위·등록 사실의 과장과 가짜 화면을 방지", () => {
  for (const project of projects) {
    const html = pages.get(`/projects/${project.id}`);
    const text = textOf(html);
    assert.doesNotMatch(text, /침투|RDS|무중단|자동 롤백|공식 API|정책 준수|심사 승인|스토어 출시|전체 웹서비스.*단독|\d+\s*%|\d+배/);
    assert.doesNotMatch(html, /<img\b|<iframe\b|<canvas\b/);
    assert.ok(text.includes("서비스 화면 아님"));
    assert.ok(html.includes(`href="${project.url}"`));
  }
  const hworks = pages.get("/projects/h-works");
  for (const fact of ["프론트엔드·백엔드·DB", "네이버 블로그", "당근 비즈니스", "카페 댓글", "이미지 크롤링", "EC2", "Amplify", "Systems Manager", "GitHub Actions", "Docker", "CI/CD"]) assert.ok(hworks.includes(fact), fact);
  const fate = pages.get("/projects/fatespoiler");
  for (const fact of ["2026.08", "Capacitor", "Apple 로그인", "앱 등록", "단독"]) assert.ok(fate.includes(fact), fact);
  const erp = pages.get("/projects/moduerp");
  assert.ok(erp.includes("기본 기능 개발 이후"));
  assert.ok(erp.includes("Spring Boot 기반 백엔드의 유지보수"));
});

test("모든 상세 페이지의 skip link·다른 프로젝트 내비게이션·새 창 링크에 접근성 정보 제공", () => {
  for (const { project } of projectEntries) {
    const html = pages.get(`/projects/${project.id}`);
    assert.match(html, /<html lang="ko"/);
    assert.match(html, /class="skip-link" href="#case-overview"/);
    assert.match(html, /id="case-overview"/);
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
