import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);
const source = readFileSync(new URL("../src/components/GlassNav.tsx", import.meta.url), "utf8");
const css = readFileSync(new URL("../src/components/GlassNav.module.css", import.meta.url), "utf8");
const page = readFileSync(new URL("../src/app/page.tsx", import.meta.url), "utf8");

function render(search, server = false) {
  const listeners = new Map();
  const context = {
    exports: {},
    URLSearchParams,
    ...(server ? {} : { window: {
      location: { search },
      addEventListener: (name, listener) => listeners.set(name, listener),
      removeEventListener: (name) => listeners.delete(name),
    } }),
    require: (name) => name === "react" ? {
      useState: () => [false, () => {}],
      useRef: () => ({ current: null }),
      useEffect: () => {},
      useSyncExternalStore: (subscribe, snapshot, serverSnapshot) => {
        if (server) return serverSnapshot();
        const cleanup = subscribe(() => {});
        assert.ok(listeners.has("popstate"));
        cleanup();
        assert.equal(listeners.size, 0);
        return snapshot();
      },
    } : name === "./menu-scroll" ? { animateMenuScroll: () => () => {} } : name.endsWith(".css") ? { default: { pill: "pill", link: "link" } } : require(name),
  };
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: {
    jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS,
  } }).outputText, context);
  return context.exports.GlassNav();
}

test("glass preview: SSR never reads window or flashes the original variant", () => {
  assert.equal(render("", true).props.className, undefined);
});

test("glass preview: default on, exact nav=original off, hero debug query independent", () => {
  for (const search of ["", "?p=0.78", "?nav=glass", "?nav=originally"]) {
    const nav = render(search);
    assert.equal(nav.type, "nav");
    assert.equal(nav.props["aria-label"], "주요 메뉴");
    assert.deepEqual(Array.from(nav.props.children[1].props.children, (link) => [link.props.href, link.props.children]), [
      ["#work", "작업"], ["#career", "경력"], ["#archive", "이전 프로젝트"], ["#contact", "연락"],
    ]);
  }
  for (const search of ["?nav=original", "?p=0.78&nav=original"]) assert.equal(render(search).props.className, undefined);
});

test("glass preview: isolated CSS, accessible targets and reduced motion", () => {
  assert.match(css, /position: fixed/);
  assert.match(css, /backdrop-filter: blur\(/);
  assert.match(css, /min-height: 44px/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.doesNotMatch(css, /scroll-behavior|\.joy-|\bhtml\b|\bbody\b|:root/);
  assert.match(page, /<GlassNav \/>/);
  assert.match(page, /<header className="site-header">/);
});

test("header owns exactly one menu, no duplicate standalone nav", () => {
 assert.equal((page.match(/<GlassNav \/>/g) || []).length, 1);
 assert.match(page, /<header className="site-header">[\s\S]*?<GlassNav \/>[\s\S]*?<\/header>/);
 assert.doesNotMatch(page, /<nav aria-label="주요 메뉴">/);
});

test("collapsed disclosure and local smooth navigation contracts", () => {
 const nav = render("");
 assert.equal(nav.props["data-open"], false);
 assert.equal(nav.props.children[0].props["aria-expanded"], false);
 assert.equal(nav.props.children[1].props.inert, true);
 assert.match(source, /animateMenuScroll\(top\)/);
 assert.match(source, /cancelScroll.current\?\.\(\)/);
 assert.match(source, /event.metaKey/);
 assert.match(source, /onPointerLeave/);
 assert.match(source, /"Escape"/);
});

test("pointer navigation releases focus but keyboard activation retains it", () => {
 assert.match(source, /event.detail === 0 && keyboard.current/);
 assert.match(source, /document.activeElement/);
 assert.match(source, /\?\.blur\(\)/);
});
test("preview removes duplicate slate and its scroll hold without editing original hero", () => {
 const css = readFileSync(new URL("../src/app/preview-transitions.css", import.meta.url), "utf8");
 assert.match(css, /body:has\(nav\[data-glass="true"\]\)/);
 assert.match(css, /\.door-reveal-layer/);
 assert.match(css, /\.dock-copy/);
 assert.match(css, /margin-top: -180dvh/);
});
