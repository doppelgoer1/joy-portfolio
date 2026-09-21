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
      useSyncExternalStore: (subscribe, snapshot, serverSnapshot) => {
        if (server) return serverSnapshot();
        const cleanup = subscribe(() => {});
        assert.ok(listeners.has("popstate"));
        cleanup();
        assert.equal(listeners.size, 0);
        return snapshot();
      },
    } : name.endsWith(".css") ? { default: { pill: "pill", link: "link" } } : require(name),
  };
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: {
    jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS,
  } }).outputText, context);
  return context.exports.GlassNav();
}

test("glass preview: SSR never reads window or flashes the original variant", () => {
  assert.equal(render("", true), null);
});

test("glass preview: default on, exact nav=original off, hero debug query independent", () => {
  for (const search of ["", "?p=0.78", "?nav=glass", "?nav=originally"]) {
    const nav = render(search);
    assert.equal(nav.type, "nav");
    assert.equal(nav.props["aria-label"], "빠른 메뉴");
    assert.deepEqual(Array.from(nav.props.children, (link) => [link.props.href, link.props.children]), [
      ["#work", "프로젝트"], ["#career", "경력"], ["#contact", "연락"],
    ]);
  }
  for (const search of ["?nav=original", "?p=0.78&nav=original"]) assert.equal(render(search), null);
});

test("glass preview: isolated CSS, accessible targets and reduced motion", () => {
  assert.match(css, /position: fixed/);
  assert.match(css, /backdrop-filter: blur\(/);
  assert.match(css, /min-height: 44px/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.doesNotMatch(css, /scroll-behavior|\.joy-|\.site-header|\bhtml\b|\bbody\b|:root/);
  assert.match(page, /<GlassNav \/>/);
  assert.match(page, /<header className="site-header">/);
});
