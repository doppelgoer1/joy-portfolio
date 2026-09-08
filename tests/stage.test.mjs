import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { projects } from "../src/data/portfolio.ts";
import { cardPosition, keyTarget, swipeTarget, swipeThreshold, wrapIndex } from "../src/components/stage-selection.ts";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
// React separates adjacent text nodes with <!-- --> markers; drop them so text reads as rendered.
const home = read("out/index.html").replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, "").replace(/<!--[\s\S]*?-->/g, "");
const stage = home.slice(home.indexOf('class="work-stage"'), home.indexOf('class="career-section'));
const attribute = (tag, name) => tag.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1];

test("세 장 카드의 원형 순서: 선택 카드는 중앙, 나머지는 양옆에 연속 배치", () => {
  const count = projects.length;
  for (let selected = 0; selected < count; selected++) {
    const positions = projects.map((_, index) => cardPosition(index, selected, count));
    assert.equal(positions[selected], 0);
    assert.deepEqual([...positions].sort(), [-1, 0, 1]);
  }
  // 다음 카드를 고르면 모든 카드가 한 칸씩 왼쪽으로 이동한다.
  for (let index = 0; index < count; index++) {
    const shifted = wrapIndex(cardPosition(index, 0, count), count) - 1;
    assert.equal(cardPosition(index, 1, count), shifted);
  }
  assert.equal(wrapIndex(-1, count), count - 1);
  assert.equal(wrapIndex(count, count), 0);
});

test("키보드 선택: 좌우·상하 화살표 순환, Home/End, 그 외 키는 무시", () => {
  assert.equal(keyTarget("ArrowRight", 0, 3), 1);
  assert.equal(keyTarget("ArrowDown", 2, 3), 0);
  assert.equal(keyTarget("ArrowLeft", 0, 3), 2);
  assert.equal(keyTarget("ArrowUp", 1, 3), 0);
  assert.equal(keyTarget("Home", 2, 3), 0);
  assert.equal(keyTarget("End", 0, 3), 2);
  for (const key of ["Enter", " ", "Tab", "Escape", "a"]) assert.equal(keyTarget(key, 1, 3), null);
});

test("스와이프: 임계값 이상의 가로 드래그만 한 장씩 이동", () => {
  assert.equal(swipeTarget(-swipeThreshold, 0, 0, 3), 1);
  assert.equal(swipeTarget(120, 10, 0, 3), 2);
  assert.equal(swipeTarget(-(swipeThreshold - 1), 0, 0, 3), null);
  assert.equal(swipeTarget(-80, -90, 0, 3), null, "세로 스크롤이 우세하면 선택하지 않음");
  assert.equal(swipeTarget(0, 0, 0, 3), null);
});

test("정적 HTML: 탭 카드와 패널이 ARIA로 연결되고 첫 프로젝트가 정면", () => {
  const tabs = [...stage.matchAll(/<button\b[^>]*\brole="tab"[^>]*>/g)].map((match) => match[0]);
  assert.equal(tabs.length, projects.length);
  assert.match(stage, /<div class="stage" role="tablist" aria-label="프로젝트 선택"/);
  assert.deepEqual(tabs.map((tag) => attribute(tag, "aria-controls")), projects.map((project) => project.id));
  assert.deepEqual(tabs.map((tag) => attribute(tag, "aria-selected")), ["true", "false", "false"]);
  assert.deepEqual(tabs.map((tag) => attribute(tag, "tabindex")), ["0", "-1", "-1"]);
  assert.deepEqual(tabs.map((tag) => attribute(tag, "data-position")), ["0", "1", "-1"]);
  for (const [index, tag] of tabs.entries()) {
    assert.equal(attribute(tag, "type"), "button");
    assert.equal(attribute(tag, "id"), `${projects[index].id}-tab`);
    assert.match(tag, new RegExp(`class="stage-card stage-card--${projects[index].id}"`));
  }
  const panels = [...stage.matchAll(/<article\b[^>]*\brole="tabpanel"[^>]*>/g)].map((match) => match[0]);
  assert.equal(panels.length, projects.length);
  for (const [index, tag] of panels.entries()) {
    assert.equal(attribute(tag, "id"), projects[index].id);
    assert.equal(attribute(tag, "aria-labelledby"), `${projects[index].id}-tab`);
    assert.doesNotMatch(tag, /\bhidden\b/, "JS 없이도 모든 패널을 읽을 수 있어야 함");
    assert.equal(/\bis-active\b/.test(tag), index === 0);
  }
  assert.match(stage, /aria-label="이전 프로젝트 선택"/);
  assert.match(stage, /aria-label="다음 프로젝트 선택"/);
  assert.match(stage, /class="stage-counter eyebrow" aria-live="polite">01 \/ 03 · H-Works</);
});

test("카드 본문은 확인된 프로젝트명·기간·범위 라벨만 담고 가짜 화면을 넣지 않음", () => {
  for (const [index, project] of projects.entries()) {
    const card = stage.slice(stage.indexOf(`id="${project.id}-tab"`), stage.indexOf("</button>", stage.indexOf(`id="${project.id}-tab"`)));
    assert.ok(card.includes(`<span>0${index + 1}</span><span>${project.period}</span>`));
    assert.ok(card.includes(`<span class="stage-card-name">${project.name}</span>`));
    assert.ok(card.includes(project.category));
    for (const item of project.focus) assert.ok(card.includes(`<span>${item.label}</span>`));
    assert.ok(card.includes("프로젝트 타이포그래피 · 서비스 화면 아님"));
    assert.doesNotMatch(card, /<img\b|<svg\b|<a\b/);
  }
  assert.equal((stage.match(/서비스 화면 아님/g) || []).length, 3);
});

test("패널마다 담당 범위·기술·명확한 상세 링크·펼침 업무 카드가 존재", () => {
  for (const project of projects) {
    const start = stage.indexOf(`<article id="${project.id}"`);
    const panel = stage.slice(start, stage.indexOf("</article>", start));
    assert.ok(panel.includes(project.role));
    assert.ok(panel.includes(`class="case-read-link" href="/projects/${project.id}"`));
    assert.ok(panel.includes(`href="${project.url}" target="_blank" rel="noreferrer"`));
    for (const item of project.contributions) assert.ok(panel.includes(item), item);
    for (const tech of project.stack) assert.ok(panel.includes(`<li>${tech}</li>`), tech);
    const cards = [...panel.matchAll(/<li class="chapter-card" style="--i:(\d+)">/g)].map((match) => Number(match[1]));
    assert.deepEqual(cards, project.caseStudy.chapters.map((_, index) => index));
    for (const chapter of project.caseStudy.chapters) {
      assert.ok(panel.includes(`<h5>${chapter.title}</h5>`), chapter.title);
      assert.ok(panel.includes(chapter.description));
      for (const item of chapter.items) assert.ok(panel.includes(`<li>${item.title}</li>`), item.title);
    }
  }
  const hworks = stage.slice(stage.indexOf('<article id="h-works"'), stage.indexOf("</article>", stage.indexOf('<article id="h-works"')));
  assert.equal((hworks.match(/class="chapter-card"/g) || []).length, 3);
});

test("무대 CSS: 원근·rotateY·터치·키보드 포커스·reduced-motion 정적 대안이 portfolio-content 안에 존재", () => {
  const css = read("src/app/portfolio-editorial.css");
  assert.match(css, /\.portfolio-content \.stage \{[^}]*perspective: 1500px;[^}]*touch-action: pan-y;/);
  assert.match(css, /\.portfolio-content \.stage-card\[data-position="-1"\] \{[^}]*--ry: 36;/);
  assert.match(css, /\.portfolio-content \.stage-card\[data-position="1"\] \{[^}]*--ry: -36;/);
  assert.match(css, /\.portfolio-content \.stage-card \{[^}]*rotateY\(calc\(var\(--ry\) \* 1deg\)\)/);
  assert.match(css, /\.portfolio-content \.stage-card:focus-visible \{ outline: 3px solid/);
  assert.match(css, /@keyframes chapter-unfold \{ from \{ opacity: 0; transform: rotateY\(-26deg\)/);
  assert.match(css, /\.portfolio-content \.stage-panel\.is-active \.chapter-card \{[^}]*animation-delay: calc\(180ms \+ var\(--i, 0\) \* 120ms\)/);
  const reduced = css.slice(css.indexOf("@media (prefers-reduced-motion: reduce) {"));
  assert.match(reduced, /\.portfolio-content \.stage \{[^}]*perspective: none;[^}]*grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(reduced, /\.portfolio-content \.stage-card \{[^}]*position: static;[^}]*transform: none;/);
  assert.match(reduced, /\.portfolio-content \.chapter-card \{ animation: none; opacity: 1; transform: none; \}/);
});

test("WorkStage 컴포넌트가 선택 헬퍼·해시 진입·클라이언트 경계를 연결", () => {
  const source = read("src/components/WorkStage.tsx");
  assert.ok(source.startsWith('"use client";'));
  for (const wiring of ["keyTarget(event.key, selected, count)", "swipeTarget(event.clientX - start.x", "cardPosition(index, selected, count)", 'addEventListener("hashchange"', "onKeyDown={onKeyDown}", "onPointerUp={onPointerUp}", "tabs.current[next]?.focus()", "hidden={enhanced && !active}"]) {
    assert.ok(source.includes(wiring), wiring);
  }
  assert.doesNotMatch(read("src/app/page.tsx"), /ProjectCase|work-index/);
});
