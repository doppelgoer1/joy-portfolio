import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";

const baseline = "9a4ec88fabe7159458a33848d320cae911a4e130";
const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const original = (path) => execFileSync("git", ["show", `${baseline}:${path}`], { encoding: "utf8" });
const hero = read("src/components/JoyHero.tsx");
const originalHero = original("src/components/JoyHero.tsx");
const css = read("src/app/globals.css");
const originalCss = original("src/app/globals.css");
const motionCode = (source) => source.slice(source.indexOf("const clamp"), source.indexOf("  return (\n    <section"));

test("최신 prod 히어로 전체는 승인된 풀스택 사실 문구 외에 원문과 동일", () => {
  const expected = originalHero
    .replace("            Frontend\n", "            Fullstack\n")
    .replace(
      "            Six years building React and Next.js products with TypeScript,\n            backend fluency, and motion-focused interface craft.",
      "            서비스와 데이터베이스 설계부터 프론트엔드·백엔드 개발,\n            업무 자동화, 배포와 운영까지.",
    );
  assert.equal(hero, expected);
});

test("최신 prod CSS1 문·텍스트 분할·퇴장·0.12 보간·resize·p 로직 전체 보존", () => {
  assert.equal(motionCode(hero), motionCode(originalHero));
  assert.doesNotMatch(hero, /matchMedia|is-animated|--hero-progress/);
});

test("최신 prod CSS 전체와 CSS1·780px·1023px 반응형 규칙 보존", () => {
  assert.ok(css.startsWith(originalCss));
  const additions = css.slice(originalCss.length);
  assert.doesNotMatch(additions, /\.(?:joy-stage|joy-pin|joy-nav|portfolio-title|stack-card|stack-text|dock-copy|vertical-curtain|curtain-split|door-reveal-layer|split-text|scroll-progress)\b|--css1-/);
  assert.doesNotMatch(additions, /(?:^|[},]\s*)(?::root|html|body)\s*\{/m);
});

test("최신 prod의 프로토타입 index.html 삭제 및 App Router 진입점 유지", () => {
  assert.equal(existsSync(new URL("../index.html", import.meta.url)), false);
  assert.match(read("src/app/page.tsx"), /<JoyHero\s*\/>\s*<div className="portfolio-content">\s*<header className="site-header">/);
});

// Execute the actual component with controlled DOM refs and animation frames.
// This verifies the original loop independently of browser launch availability.
function mount(source, width = 1440, height = 1100, search = "?p=0") {
  const makeElement = () => ({ style: { setProperty(name, value) { this[name] = value; } } });
  const root = makeElement();
  const cards = Array.from({ length: 7 }, makeElement);
  const texts = Array.from({ length: 7 }, makeElement);
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
      getPropertyValue: () => String((window.innerWidth <= 780 ? [-230, -146, -62, 22, 106, 190, 0] : [-300, -190, -80, 30, 140, 250, 0])[texts.indexOf(element)]),
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

test("7개 카드·분할 텍스트·커튼의 프레임 출력이 최신 prod의 모든 분기에서 동일", () => {
  for (const [width, height] of [[1440, 1100], [1366, 700], [1023, 768], [781, 700], [780, 844], [390, 844], [320, 740]]) {
    const current = mount(hero, width, height);
    const reference = mount(originalHero, width, height);
    for (const p of [0, 0.06, 0.11, 0.16, 0.2, 0.214, 0.23, 0.24, 0.28, 0.3, 0.34, 0.36, 0.4, 0.44, 0.47, 0.514, 0.59, 0.62, 0.63, 0.67, 0.68, 0.7, 0.72, 0.78, 0.88, 0.9, 0.95, 1, 0.78, 0.68, 0.62, 0.34, 0]) {
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
  assert.equal(scene.cards[6].style["--card-opacity"], "0.000");
  scene.cleanup();
});

test("최종 7개 112% 카드·기존 스택 퇴장·CSS1 중앙 분할 좌표·소개 표시", () => {
  for (const width of [1440, 1366, 780, 390, 320]) {
    const scene = mount(hero, width, 740, "?p=1");
    scene.tick();
    const y = width <= 780 ? [-230, -146, -62, 22, 106, 190, 0] : [-300, -190, -80, 30, 140, 250, 0];
    scene.cards.forEach((card) => {
      assert.equal(card.style["--panel-width"], "112.00vw");
      assert.equal(card.style["--panel-height"], "112.00dvh");
      assert.equal(card.style["--card-opacity"], "1.000");
    });
    scene.texts.forEach((text, index) => {
      assert.equal(text.style["--text-x"], index === 6 ? "0.00" : (-width * (width <= 780 ? 0.68 : 0.66)).toFixed(2));
      assert.equal(text.style["--text-y"], y[index].toFixed(2));
      assert.equal(text.style["--text-scale"], index === 6 ? "1.0000" : "0.3400");
      assert.equal(text.style["--text-opacity"], "0.3800");
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


test("CSS1 문 열림·내용 표시·텍스트 양쪽 이동의 새 타이밍 기준", () => {
  // Explicit samples from production 9a4ec88, including the opening midpoint.
  const samples = [
    [0.68, "0.0000", "0.0000"],
    [0.7, "0.0008", "0.0000"],
    [0.72, "0.0128", "0.3757"],
    [0.78, "0.5000", "0.9047"],
    [0.88, "1.0000", "1.0000"],
    [1, "1.0000", "1.0000"],
  ];
  for (const width of [1440, 780, 390]) {
    for (const [p, door, reveal] of samples) {
      const scene = mount(hero, width, 844, `?p=${p}`);
      scene.tick();
      assert.equal(scene.root.style["--css1-door-open"], door, `p=${p}`);
      assert.equal(scene.root.style["--css1-reveal-opacity"], reveal, `p=${p}`);
      const shift = Number(door) * 1.12 * width * 0.51;
      assert.equal(scene.root.style["--css1-text-left-x"], `${(-shift).toFixed(2)}px`);
      assert.equal(scene.root.style["--css1-text-right-x"], `${shift.toFixed(2)}px`);
      assert.equal(scene.texts[6].style["--text-x"], "0.00");
      assert.equal(scene.texts[6].style["--text-y"], "0.00");
      assert.equal(scene.texts[6].style["--text-scale"], "1.0000");
      scene.cleanup();
    }
  }
});

test("CSS1 직전 스택의 불투명도 감소와 중앙 텍스트 크기 보존", () => {
  for (const [p, opacity] of [[0.62, "1.0000"], [0.67, "0.4187"], [0.72, "0.3800"]]) {
    const scene = mount(hero, 1440, 1100, `?p=${p}`);
    scene.tick();
    for (const text of scene.texts) assert.equal(text.style["--text-opacity"], opacity);
    assert.equal(scene.texts[6].style["--text-scale"], "1.0000");
    scene.cleanup();
  }
});

test("CSS1 도중 실제 resize와 역스크롤 출력도 최신 prod와 동일", () => {
  const current = mount(hero, 1440, 1100, "");
  const reference = mount(originalHero, 1440, 1100, "");
  for (const [width, height, p] of [[1440, 1100, 0.78], [780, 844, 0.88], [390, 844, 1], [1023, 768, 0.7], [1440, 1100, 0]]) {
    for (const scene of [current, reference]) {
      scene.window.innerWidth = width;
      scene.window.innerHeight = height;
      scene.stageRect.height = height * 8.2;
      scene.stageRect.top = -(scene.stageRect.height - height) * p;
      scene.listeners.get("resize")();
    }
    for (let frame = 0; frame < 100; frame++) {
      current.tick();
      reference.tick();
      assert.equal(current.snapshot(), reference.snapshot(), `${width}x${height}, p=${p}, frame=${frame}`);
    }
  }
  current.cleanup();
  reference.cleanup();
});
