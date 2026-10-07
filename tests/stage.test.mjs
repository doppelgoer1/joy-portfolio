import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import * as selection from "../src/components/stage-selection.ts";
import { projects, projectEntries } from "../src/data/portfolio.ts";
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

test("아홉 탭·패널과 전체 목록: 동일한 구조, ARIA 연결, JS 없는 접근", () => {
  const tabs = [...stage.matchAll(/<button\b[^>]*\brole="tab"[^>]*>/g)].map((match) => match[0]);
  const panels = [...stage.matchAll(/<article\b[^>]*\brole="tabpanel"[^>]*>/g)].map((match) => match[0]);
  assert.equal(tabs.length, 9);
  assert.equal(panels.length, 9);
  const indexHtml = stage.slice(stage.indexOf('class="stage-index"'), stage.indexOf('class="stage-deck"'));
  assert.equal((indexHtml.match(/<a\b/g) || []).length, 9);
  for (const [index, project] of allProjects.entries()) {
    assert.equal(attribute(tabs[index], "aria-controls"), project.id);
    assert.equal(attribute(tabs[index], "id"), `${project.id}-tab`);
    assert.equal(attribute(tabs[index], "aria-selected"), String(index === 0));
    assert.equal(attribute(tabs[index], "tabindex"), index === 0 ? "0" : "-1");
    const position = cardPosition(index, 0, 9);
    assert.equal(attribute(tabs[index], "data-position"), String(position));
    assert.equal(attribute(tabs[index], "data-distant"), String(Math.abs(position) > 1));
    assert.equal(attribute(panels[index], "id"), project.id);
    assert.equal(attribute(panels[index], "aria-labelledby"), `${project.id}-tab`);
    assert.doesNotMatch(panels[index], /\bhidden\b/, "JS 없이 모든 패널 접근 가능");
    assert.ok(indexHtml.includes(`href="#${project.id}"`));
    assert.ok(indexHtml.includes(project.name));
  }
  assert.match(stage, /class="stage-counter eyebrow" aria-live="polite">01 \/ 09 · H-Works</);
});

test("아홉 카드의 동일한 활자 구조와 확인된 내용, 선택 패널에만 선택적 정보", () => {
  for (const [index, entry] of projectEntries.entries()) {
    const { project } = entry;
    const start = stage.indexOf(`id="${project.id}-tab"`);
    const card = stage.slice(start, stage.indexOf("</button>", start));
    assert.ok(card.includes(`<span>0${index + 1}</span>`));
    assert.ok(card.includes(`<span class="stage-card-name">${project.name}</span>`));
    assert.ok(card.includes(entry.kind === "featured" ? project.category : project.role || project.detail));
    if (project.period) assert.ok(card.includes(project.period));
    assert.doesNotMatch(card, /<img\b|<svg\b|<a\b/);
    const panelStart = stage.indexOf(`<article id="${project.id}"`);
    const panel = stage.slice(panelStart, stage.indexOf("</article>", panelStart));
    assert.ok(panel.includes(`class="case-read-link" href="/projects/${project.id}"`));
    assert.equal(panel.includes('class="case-role"'), Boolean(project.role));
    assert.equal(panel.includes('class="tech-list"'), Boolean(project.stack));
    if (project.role) assert.ok(panel.includes(project.role));
    for (const contribution of project.contributions ?? []) assert.ok(panel.includes(contribution));
    if (entry.kind === "archive") {
      assert.ok(panel.includes(project.description));
      assert.ok(panel.includes(`src="${project.image.src}"`));
      assert.ok(panel.includes(`id="archive-${project.id}"`));
    }
  }
  assert.equal((stage.match(/서비스 화면 아님/g) || []).length, 9);
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
  assert.match(reduced, /\.portfolio-content \.stage \{[^}]*perspective: none;[^}]*grid-template-columns: minmax\(0, 1fr\)/);
  assert.match(reduced, /\.portfolio-content \.stage-card \{[^}]*position: static;[^}]*transform: none;/);
  assert.match(reduced, /\.portfolio-content \.chapter-card \{ animation: none; opacity: 1; transform: none; \}/);
});

test("WorkStage 컴포넌트가 선택 헬퍼·해시 진입·클라이언트 경계를 연결", () => {
  const source = read("src/components/WorkStage.tsx");
  assert.ok(source.startsWith('"use client";'));
  for (const wiring of ["keyTarget(event.key, selected, count)", "swipeTarget(event.clientX - start.x", "cardPosition(index, selected, count)", 'addEventListener("hashchange"', "onKeyDown={onKeyDown}", "onPointerUp={onPointerUp}", "targets.current[selected]?.focus({ preventScroll: true })", "hidden={enhanced && !active}"]) {
    assert.ok(source.includes(wiring), wiring);
  }
  assert.match(read("src/app/page.tsx"), /<WorkStage entries={projectEntries}/);
  assert.match(read("src/app/portfolio-editorial.css"), /\.stage-card\[data-distant="true"\] \{[^}]*visibility: hidden; pointer-events: none;/);
});

// Exercise the actual component's handlers/effects when a DOM browser is unavailable.
// Layout, native touch and scroll geometry are verified separately by verify-browser.mjs.
function mountStage(hash = "") {
  const slots = [];
  const effects = [];
  const listeners = new Map();
  const cleanups = [];
  const scrolls = [];
  let cursor = 0;
  let dirty = false;
  let nodes = [];
  let focused;
  const window = {
    location: { hash },
    addEventListener: (name, callback) => listeners.set(name, callback),
    removeEventListener: (name) => listeners.delete(name),
  };
  const exports = {};
  const code = ts.transpileModule(read("src/components/WorkStage.tsx"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  runInNewContext(code, {
    exports, window, setTimeout,
    document: { getElementById: (id) => ({ scrollIntoView: () => scrolls.push({ id, hidden: nodes.find((node) => node.props.id === id)?.props.hidden }) }) },
    require: (name) => {
      if (name === "./stage-selection") return selection;
      if (name === "./PhaseStrip") return { PhaseStrip: () => null };
      if (name === "react/jsx-runtime") return { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) };
      if (name === "react") return {
        useState: (initial) => {
          const index = cursor++;
          slots[index] ??= { value: initial };
          return [slots[index].value, (value) => {
            if (slots[index].value !== value) { slots[index].value = value; dirty = true; }
          }];
        },
        useRef: (initial) => { const index = cursor++; return slots[index] ??= { current: initial }; },
        useEffect: (callback, deps) => {
          const index = cursor++;
          if (!slots[index] || deps.some((dep, i) => dep !== slots[index][i])) effects.push(callback);
          slots[index] = deps;
        },
      };
      throw new Error(`Unexpected import: ${name}`);
    },
  });
  function render() {
    cursor = 0;
    dirty = false;
    nodes = [];
    const visit = (node) => {
      if (Array.isArray(node)) return node.forEach(visit);
      if (!node?.props) return;
      nodes.push(node);
      node.props.ref?.({ focus: () => {
        assert.notEqual(node.props["data-distant"], true, "Focus must follow the new visible card render");
        focused = node.props.id || node.props.href;
      } });
      visit(node.props.children);
    };
    visit(exports.WorkStage({ entries: projectEntries }));
  }
  function flush() {
    for (let pass = 0; pass < 10; pass++) {
      if (dirty) render();
      for (const effect of effects.splice(0)) {
        const cleanup = effect();
        if (cleanup) cleanups.push(cleanup);
      }
      if (!dirty && !effects.length) return;
    }
    throw new Error("Effects did not settle");
  }
  render();
  return {
    flush, scrolls,
    get nodes() { return nodes; },
    get focused() { return focused; },
    hash: (value) => { window.location.hash = value; listeners.get("hashchange")(); flush(); },
    key: (key, index = false) => {
      nodes.find((node) => node.props.className === (index ? "stage-index" : "stage")).props.onKeyDown({ key, preventDefault() {}, currentTarget: { classList: { contains: () => index } } });
      flush();
    },
    close: () => { cleanups.forEach((cleanup) => cleanup()); assert.equal(listeners.size, 0); },
  };
}

test("실제 WorkStage의 전체 선택·키보드 포커스·해시 복귀 상태 전환", () => {
  const scene = mountStage("#archive-myro");
  assert.equal(scene.nodes.filter((node) => node.props.role === "tabpanel" && !node.props.hidden).length, 9);
  scene.flush();
  const selected = () => scene.nodes.find((node) => node.props.role === "tab" && node.props["aria-selected"]).props.id;
  assert.equal(selected(), "myro-tab");
  assert.deepEqual(scene.scrolls.at(-1), { id: "myro", hidden: false });
  for (const project of allProjects) {
    scene.nodes.find((node) => node.type === "a" && node.props.href === `#${project.id}`).props.onClick({ preventDefault() {} });
    scene.flush();
    assert.equal(selected(), `${project.id}-tab`);
    assert.equal(scene.nodes.filter((node) => node.props.role === "tabpanel" && !node.props.hidden).length, 1);
    assert.equal(scene.nodes.filter((node) => node.props.role === "tab" && !node.props["data-distant"]).length, 3);
  }
  scene.key("Home");
  assert.equal(scene.focused, "h-works-tab");
  scene.key("End");
  assert.equal(scene.focused, "onbooth-tab");
  scene.key("ArrowRight");
  assert.equal(scene.focused, "h-works-tab");
  scene.key("End", true);
  assert.equal(selected(), "h-works-tab");
  scene.key("ArrowLeft", true);
  assert.equal(scene.focused, "#onbooth");
  for (const hash of ["#eng-spark", "#archive-eng-spark", "#archive-myro", "#myro"]) {
    scene.hash(hash);
    const id = hash.replace(/^#(?:archive-)?/, "");
    assert.equal(selected(), `${id}-tab`);
    assert.deepEqual(scene.scrolls.at(-1), { id, hidden: false });
  }
  scene.hash("#unknown");
  assert.equal(selected(), "myro-tab");
  scene.close();
});
