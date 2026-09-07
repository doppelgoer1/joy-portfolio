import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";

const baseline = "7e12d415220f3a70563b61b21cc1e0e3875b33fe";
const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const original = (path) => execFileSync("git", ["show", `${baseline}:${path}`], { encoding: "utf8" });
const hero = read("src/components/JoyHero.tsx");
const originalHero = original("src/components/JoyHero.tsx");
const css = read("src/app/globals.css");
const originalCss = original("src/app/globals.css");
const motionCode = (source) => source.slice(source.indexOf("const clamp"), source.indexOf("  return (\n    <section"));

test("itemMotion·커튼·도킹·easing·0.12 보간·resize·p 코드 전체가 원본과 동일", () => {
  assert.equal(motionCode(hero), motionCode(originalHero));
  assert.doesNotMatch(hero, /matchMedia|is-animated|--hero-progress/);
});

test("원본 CSS 전체와 780px·1023px 반응형 규칙 보존", () => {
  assert.ok(css.startsWith(originalCss));
  const additions = css.slice(originalCss.length);
  const normalStyles = additions.split("@media (prefers-reduced-motion: reduce)")[0];
  assert.doesNotMatch(normalStyles, /\.(?:joy-stage|joy-pin|portfolio-title|stack-card|stack-text|dock-copy|vertical-curtain|curtain-split)\b/);
  assert.doesNotMatch(additions, /(?:^|[},]\s*)(?::root|html|body)\s*\{/m);
});

test("원본 참고용 index.html 복원 및 App Router 진입점 유지", () => {
  assert.equal(read("index.html"), original("index.html"));
  assert.match(read("src/app/page.tsx"), /<JoyHero\s*\/>\s*<div className="portfolio-content">\s*<header className="site-header">/);
});

// Execute the actual component with controlled DOM refs and animation frames.
// This verifies the original loop independently of browser launch availability.
function mount(source, width = 1440, height = 1100, search = "?p=0") {
  const makeElement = () => ({ style: { setProperty(name, value) { this[name] = value; } } });
  const root = makeElement();
  const cards = Array.from({ length: 6 }, makeElement);
  const texts = Array.from({ length: 6 }, makeElement);
  const stageRect = { top: 0, height: height * 8.2 };
  const refs = [{ getBoundingClientRect: () => stageRect }, cards, texts, 0, 0];
  let refIndex = 0;
  let effect;
  let frame;
  const listeners = new Map();
  const window = {
    innerWidth: width, innerHeight: height, location: { search },
    addEventListener: (name, callback) => listeners.set(name, callback),
    removeEventListener: (name) => listeners.delete(name),
  };
  const sourceWithoutJsx = source.slice(0, source.indexOf("  return (\n    <section")) + "}\nJoyHero();";
  const code = ts.transpileModule(sourceWithoutJsx, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  runInNewContext(code, {
    exports: {}, window, URLSearchParams,
    document: { documentElement: root },
    require: () => ({
      useRef: () => ({ current: refs[refIndex++] }),
      useEffect: (callback) => { effect = callback; },
    }),
    requestAnimationFrame: (callback) => { frame = callback; return 1; },
    cancelAnimationFrame: () => { frame = null; },
    getComputedStyle: (element) => ({
      getPropertyValue: () => String((window.innerWidth <= 780 ? [-230, -146, -62, 22, 106, 190] : [-300, -190, -80, 30, 140, 250])[texts.indexOf(element)]),
    }),
  });
  const cleanup = effect();
  return {
    root, cards, texts, window, stageRect, listeners, cleanup,
    tick: () => { assert.equal(typeof frame, "function"); frame(); },
    hasFrame: () => frame !== null,
    snapshot: () => JSON.stringify([root.style, ...cards.map((card) => card.style), ...texts.map((text) => text.style)]),
  };
}

test("6개 카드·텍스트·커튼의 프레임 출력이 모든 원본 분기에서 동일", () => {
  for (const [width, height] of [[1440, 1100], [1366, 700], [1023, 768], [781, 700], [780, 844], [390, 844], [320, 740]]) {
    const current = mount(hero, width, height);
    const reference = mount(originalHero, width, height);
    for (const p of [0, 0.06, 0.11, 0.16, 0.2, 0.214, 0.23, 0.24, 0.28, 0.3, 0.34, 0.36, 0.4, 0.44, 0.59, 0.9, 0.95, 1, 0.34, 0]) {
      current.window.location.search = reference.window.location.search = `?p=${p}`;
      for (let frame = 0; frame < 12; frame++) {
        current.tick();
        reference.tick();
        assert.equal(current.snapshot(), reference.snapshot(), `${width}x${height}, p=${p}, frame=${frame}`);
      }
    }
    current.cleanup();
    reference.cleanup();
  }
});

test("p=0.34에서 붉은 커튼이 절반 열리고 카드가 순차 확장", () => {
  const scene = mount(hero, 1440, 1100, "?p=0.34");
  scene.tick();
  assert.equal(scene.root.style["--curtain-open"], "0.5000");
  assert.equal(scene.root.style["--curtain-height"], "100.00dvh");
  assert.equal(scene.root.style["--curtain-width"], "1440.00px");
  assert.equal(scene.root.style["--split-opacity"], "1.0000");
  const widths = scene.cards.map((card) => parseFloat(card.style["--panel-width"]));
  assert.ok(widths[0] > widths[1] && widths[1] > widths[2] && widths[2] > widths[3]);
  assert.equal(scene.cards[4].style["--card-opacity"], "0.000");
  assert.equal(scene.cards[5].style["--card-opacity"], "0.000");
  scene.cleanup();
});

test("최종 112% 카드 확장·원본 데스크톱/모바일 도킹 좌표·소개 표시", () => {
  for (const width of [1440, 1366, 780, 390, 320]) {
    const scene = mount(hero, width, 740, "?p=1");
    scene.tick();
    const y = width <= 780 ? [-230, -146, -62, 22, 106, 190] : [-300, -190, -80, 30, 140, 250];
    scene.cards.forEach((card) => {
      assert.equal(card.style["--panel-width"], "112.00vw");
      assert.equal(card.style["--panel-height"], "112.00dvh");
      assert.equal(card.style["--card-opacity"], "1.000");
    });
    scene.texts.forEach((text, index) => {
      assert.equal(text.style["--text-x"], (-width * (width <= 780 ? 0.34 : 0.36)).toFixed(2));
      assert.equal(text.style["--text-y"], y[index].toFixed(2));
      assert.equal(text.style["--text-scale"], "0.3400");
      assert.equal(text.style["--text-opacity"], "1.0000");
    });
    assert.equal(scene.root.style["--dock-copy-opacity"], "1.0000");
    scene.cleanup();
  }
});

test("네이티브 스크롤의 0.12 보간, 역방향 스크롤과 이벤트 정리", () => {
  const scene = mount(hero, 1366, 700, "");
  scene.tick();
  scene.stageRect.top = -(scene.stageRect.height - scene.window.innerHeight);
  scene.tick();
  assert.equal(scene.root.style["--p"], "0.1200");
  scene.tick();
  assert.equal(scene.root.style["--p"], "0.2256");
  scene.stageRect.top = 0;
  scene.tick();
  assert.equal(scene.root.style["--p"], "0.1985");
  assert.equal(scene.listeners.has("resize"), true);
  scene.cleanup();
  assert.equal(scene.listeners.size, 0);
  assert.equal(scene.hasFrame(), false);
});

test("debug p가 스크롤 위치를 우선하고 0~1로 제한", () => {
  for (const [search, expected] of [["?p=-1", "0.0000"], ["?p=2", "1.0000"], ["?p=0.34", "0.3400"]]) {
    const scene = mount(hero, 390, 844, search);
    scene.stageRect.top = -10000;
    scene.tick();
    assert.equal(scene.root.style["--p"], expected);
    scene.cleanup();
  }
});
