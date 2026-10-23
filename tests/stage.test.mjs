import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { projectEntries } from "../src/data/portfolio.ts";
import { cardPosition, keyTarget, projectIndexForHash, swipeTarget, swipeThreshold, wrapIndex } from "../src/components/stage-selection.ts";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
// React separates adjacent text nodes with <!-- --> markers; drop them so text reads as rendered.
const home = read("out/index.html").replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, "").replace(/<!--[\s\S]*?-->/g, "");
const stage = home.slice(home.indexOf('class="work-stage"'), home.indexOf('class="career-section'));
const allProjects = projectEntries.map(({ project }) => project);
const attribute = (tag, name) => tag.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1];

test("세 장·아홉 장의 원형 순서: 중앙과 양옆만 표시하고 먼 카드는 별도 위치", () => {
  for (const count of [3, 9]) {
    for (let selected = 0; selected < count; selected++) {
      const positions = Array.from({ length: count }, (_, index) => cardPosition(index, selected, count));
      assert.equal(positions[selected], 0);
      assert.equal(new Set(positions).size, count);
      assert.deepEqual(positions.filter((p) => Math.abs(p) <= 1).sort(), [-1, 0, 1]);
      assert.equal(cardPosition(wrapIndex(selected + 1, count), selected, count), 1);
      assert.equal(cardPosition(wrapIndex(selected - 1, count), selected, count), -1);
    }
    assert.equal(wrapIndex(-1, count), count - 1);
    assert.equal(wrapIndex(count, count), 0);
    assert.equal(keyTarget("ArrowLeft", 0, count), count - 1);
    assert.equal(keyTarget("ArrowRight", count - 1, count), 0);
    assert.equal(keyTarget("End", 0, count), count - 1);
    assert.equal(keyTarget("Home", count - 1, count), 0);
    assert.equal(swipeTarget(120, 0, 0, count), count - 1);
  }
});

test("아홉 프로젝트 앵커와 기존 archive 별칭이 동일한 항목을 선택", () => {
  const ids = allProjects.map(({ id }) => id);
  for (const [index, id] of ids.entries()) {
    assert.equal(projectIndexForHash(`#${id}`, ids), index);
    assert.equal(projectIndexForHash(`#archive-${id}`, ids), index);
  }
  for (const hash of ["", "#work", "#archive", "#unknown"]) assert.equal(projectIndexForHash(hash, ids), -1);
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

test("쇼케이스는 인라인 상세 없이 실물 이미지 6장과 기본 네이티브 링크를 제공", () => {
  assert.equal((stage.match(/data-slug=/g) || []).length, 9);
  assert.doesNotMatch(stage, /role="tab|stage-panel|case-read-link/);
  assert.equal((stage.match(/<img\b/g) || []).length, 6);
  assert.equal((stage.match(/서비스 화면 아님/g) || []).length, 3);
  assert.match(stage, /<a[^>]*href="\/projects\/h-works"[^>]*data-position="0"/);
  assert.equal((stage.match(/class="stage-card /g) || []).length, 9);
  for (const { project } of projectEntries) {
    assert.ok(stage.includes(`id="${project.id}"`));
    assert.ok(stage.includes(`href="/projects/${project.id}"`), 'no-JS fallback');
  }
});

test("무대 CSS: 원근·rotateY·터치·키보드 포커스·reduced-motion 정적 대안이 portfolio-content 안에 존재", () => {
  const css = read("src/app/portfolio-editorial.css");
  assert.match(css, /\.portfolio-content \.stage \{[^}]*perspective: 1500px;[^}]*touch-action: pan-y;/);
  assert.match(css, /\.portfolio-content \.stage-card\[data-position="-1"\] \{[^}]*--ry: 36;/);
  assert.match(css, /\.portfolio-content \.stage-card\[data-position="1"\] \{[^}]*--ry: -36;/);
  assert.match(css, /\.portfolio-content \.stage-card \{[^}]*rotateY\(calc\(var\(--ry\) \* 1deg\)\)/);
  assert.match(css, /\.portfolio-content \.stage-card:focus-visible \{ outline: 3px solid/);
  assert.doesNotMatch(css, /chapter-unfold|stage-panel-in|animation-timeline: view/);
  const reduced = css.slice(css.indexOf("@media (prefers-reduced-motion: reduce) {"));
  assert.match(reduced, /\.portfolio-content \.stage \{[^}]*perspective: none;[^}]*grid-template-columns: minmax\(0, 1fr\)/);
  assert.match(reduced, /\.portfolio-content \.stage-card \{[^}]*position: static;[^}]*transform: none;/);
  assert.match(reduced, /\.portfolio-content \.chapter-card \{ animation: none; opacity: 1; transform: none; \}/);
});
