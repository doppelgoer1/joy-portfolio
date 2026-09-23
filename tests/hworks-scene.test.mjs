import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import { projects } from '../src/data/portfolio.ts';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const source = read('src/components/HWorksScene.tsx');
const css = read('src/app/hworks-scene.css');
const exports = {};
runInNewContext(ts.transpileModule(source.slice(0, source.indexOf('export function HWorksScene')), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, { exports });
const frame = exports.hworksFrame;
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} ≠ ${b}`);

test('actual desktop keyframes: enormous growth, horizontal split, full flood, staged domains, dock and curtain', () => {
  near(frame(0).titleScale, .64);
  near(frame(.075).titleScale, .82);
  near(frame(.15).titleScale, 1);
  near(frame(.235).titleX, 31);
  near(frame(.32).titleX, 62);
  near(frame(.32).slit, .012);
  near(frame(.42).slit, .506);
  near(frame(.52).slit, 1);
  assert.ok(frame(.42).domains[0] > frame(.42).domains[1]);
  assert.ok(frame(.42).domains[1] > frame(.42).domains[2]);
  assert.ok(frame(.52).domains.every(v => v > .9));
  near(frame(.62).dock, .5);
  near(frame(.72).dock, 1);
  for (const p of [.72, .76, .8, .85]) {
    assert.equal(frame(p).readable, true);
    near(frame(p).copy, 1);
  }
  near(frame(.925).exit, .5);
  near(frame(1).exit, 1);
  near(frame(1).copy, 0);
});
test('actual mobile keyframes animate three phases, then let the full copy scroll normally', () => {
  assert.ok(frame(.1, true).titleScale > frame(0, true).titleScale);
  assert.ok(frame(.31, true).titleX > 20);
  assert.ok(frame(.5, true).slit > .5);
  near(frame(.58, true).slit, 1);
  near(frame(.9, true).dock, 1);
  near(frame(1, true).exit, 0);
  assert.match(css, /margin-top: 160svh/);
  assert.match(css, /height: calc\(390svh - 72px\)/);
});
test('keyframes are bounded, deterministic and exactly reversible at arbitrary progress', () => {
  for (const mobile of [false, true]) {
    const samples = Array.from({ length: 101 }, (_, i) => JSON.stringify(frame(i / 100, mobile)));
    for (let i = 100; i >= 0; i--) {
      const actual = frame(i / 100, mobile);
      assert.equal(JSON.stringify(actual), samples[i]);
      for (const key of ['enter', 'split', 'flood', 'dock', 'exit', 'copy', 'slit']) assert.ok(actual[key] >= 0 && actual[key] <= 1);
    }
    assert.equal(JSON.stringify(frame(-1, mobile)), samples[0]);
    assert.equal(JSON.stringify(frame(2, mobile)), samples[100]);
  }
});
test('SSR is one semantic article with real contributions and links; no enhancement assumed', () => {
  const html = read('out/index.html').replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, '').replace(/<!--[\s\S]*?-->/g, '');
  const scene = html.slice(html.indexOf('<article id="h-works"'), html.indexOf('</article>', html.indexOf('<article id="h-works"')));
  assert.equal((html.match(/id="h-works"/g) || []).length, 1);
  assert.match(scene, /<h3 id="h-works-title">H-Works<\/h3>/);
  assert.match(scene, /class="hworks-giant" aria-hidden="true"/);
  for (const contribution of projects[0].contributions) assert.ok(scene.includes(contribution));
  for (const item of projects[0].focus) assert.ok(scene.includes(item.label) && scene.includes(item.value));
  for (const href of ['/projects/h-works', projects[0].url]) assert.ok(scene.includes(`href="${href}"`));
  assert.doesNotMatch(scene, /data-enhanced|\sinert=|\shidden=|tabindex="-1"/);
  assert.match(css, /@media \(prefers-reduced-motion: no-preference\) and \(min-height: 600px\)/);
  const defaultCss = css.slice(0, css.indexOf('@media'));
  assert.doesNotMatch(defaultCss, /position: sticky|visibility: hidden|opacity: 0/);
  assert.match(source, /readingHeight \+ 132 <= height - header/);
});
test('invisible links are inert, and the visible focus entry scrolls to the reading phase', () => {
  assert.match(source, /links.inert = !state.readable/);
  assert.match(source, /gate.tabIndex = state.readable \? -1 : 0/);
  assert.match(source, /travel \* \.76/);
  assert.match(source, /paint\(\.76\)/);
  assert.match(source, /focus\(\{ preventScroll: true \}\)/);
  assert.match(source, /location.hash !== "#h-works"/);
  assert.match(source, /observer.disconnect\(\)/);
});
test('protected hero, global CSS, navigation, portfolio data and detail route remain byte-identical', () => {
  const hashes = {
    'src/components/JoyHero.tsx': '7689ad941377e0a9678a78c1cf81ae8792fb34f14785d88893021d443d48e28b',
    'src/app/globals.css': 'e48ac536c21c4f06542f7430c3c16514c694263e04cc417fe24d20c5cf8eea28',
    'src/components/GlassNav.tsx': '63010f6ecb51a8b1c9851766294236fa27092ba89068dcb5630f42ea5ef39515',
    'src/components/GlassNav.module.css': '046690a320439b37ceaecce6864aa0bc24d4f6a8eb889f24a21251492b9e0ab0',
    'src/data/portfolio.ts': '6aab4e72152e0785687bb75db2ac351474e8ad9be758761a2fa71164d155340f',
    'src/app/projects/[slug]/page.tsx': 'dc4c07f419ba5e764f47c78cc67c0169c701bb15dcdfc3c7be244f72294fa049',
  };
  for (const [path, hash] of Object.entries(hashes)) assert.equal(createHash('sha256').update(read(path)).digest('hex'), hash, path);
});

// Run the real effect against measured DOM refs, as the existing hero suite does.
function mountScene({ width = 1280, height = 720, contentHeight = 450, motion = true } = {}) {
  let effect;
  let id = 0;
  let disconnected = false;
  let focused = false;
  const frames = new Map();
  const listeners = new Map();
  const rootListeners = new Map();
  const operations = [];
  const media = { matches: motion && height >= 600, addEventListener() {}, removeEventListener() {} };
  class Element {
    dataset = {};
    tabIndex = 0;
    inert = false;
    style = { setProperty: (name, value) => { operations.push('write'); this.style[name] = value; } };
    addEventListener() {}
    removeEventListener() {}
    contains(target) { return target === this; }
    getBoundingClientRect() { return { top: 172, bottom: 172 + contentHeight }; }
  }
  const root = new Element();
  const reading = new Element();
  const links = new Element();
  const gate = new Element();
  const pin = new Element();
  const anchor = new Element();
  anchor.focus = () => { focused = true; };
  links.querySelector = () => anchor;
  root.querySelector = selector => ({ '.hworks-pin': pin, '.hworks-reading': reading, '.hworks-links': links, '.hworks-read-gate': gate })[selector];
  root.addEventListener = (name, callback) => rootListeners.set(name, callback);
  root.removeEventListener = name => rootListeners.delete(name);
  const context = {
    exports: {}, innerWidth: width, innerHeight: height, scrollY: 0,
    location: { hash: '' }, HTMLElement: Element,
    require: () => ({ useRef: () => ({ current: root }), useEffect: callback => { effect = callback; } }),
    matchMedia: () => media,
    getComputedStyle: () => ({ marginTop: `${height * 1.6}px` }),
    requestAnimationFrame: callback => { frames.set(++id, callback); return id; },
    cancelAnimationFrame: key => frames.delete(key),
    ResizeObserver: class { observe() {} disconnect() { disconnected = true; } },
    window: {
      addEventListener: (name, callback) => listeners.set(name, callback),
      removeEventListener: name => listeners.delete(name),
      scrollTo: ({ top }) => { context.scrollY = top; },
    },
  };
  root.getBoundingClientRect = () => {
    operations.push('read');
    return { top: 1000 - context.scrollY, height: root.dataset.enhanced === 'true' ? height * 3.9 - 72 : 1200 };
  };
  Object.defineProperty(reading, 'offsetHeight', { get() { operations.push('read'); return contentHeight; } });
  Object.defineProperty(pin, 'offsetHeight', { get() { operations.push('read'); return root.dataset.enhanced === 'true' ? height - 72 : 1200; } });
  const beforeJsx = source.slice(0, source.indexOf('  return (\n    <article')) + '\n}\nHWorksScene({project: {}, next: {}});';
  runInNewContext(ts.transpileModule(beforeJsx, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, context);
  const cleanup = effect();
  const settle = () => {
    for (let i = 0; frames.size && i < 8; i++) {
      const pending = [...frames.values()]; frames.clear(); pending.forEach(callback => callback());
    }
    assert.equal(frames.size, 0, 'scene leaves no permanent RAF running');
  };
  settle();
  return { root, links, gate, listeners, frames, operations, settle, context,
    focusGate: () => rootListeners.get('focusin')({ target: gate }),
    focused: () => focused,
    cleanup: () => { cleanup(); assert.equal(disconnected, true); assert.equal(listeners.size, 0); assert.equal(frames.size, 0); },
  };
}

test('actual effect: coalesces scroll reads/writes, settles, reveals keyboard links and cleans up', () => {
  const scene = mountScene();
  assert.equal(scene.root.dataset.enhanced, 'true');
  assert.equal(scene.links.inert, true);
  scene.context.scrollY = 1000 - 72 + 720 * 2.9 * .76;
  scene.operations.length = 0;
  for (let i = 0; i < 12; i++) scene.listeners.get('scroll')();
  assert.equal(scene.frames.size, 1);
  scene.settle();
  assert.deepEqual(scene.operations.slice(0, 3), ['read', 'read', 'read']);
  assert.ok(scene.operations.slice(3).every(op => op === 'write'));
  assert.equal(scene.links.inert, false);
  scene.context.scrollY = 1000;
  scene.listeners.get('scroll')(); scene.settle();
  assert.equal(scene.links.inert, true);
  scene.focusGate();
  assert.equal(scene.root.dataset.readable, 'true');
  assert.equal(scene.links.inert, false);
  assert.equal(scene.focused(), true);
  scene.cleanup();
});
test('actual effect: reduced, short and overheight desktop content stay static; tall mobile stays animated', () => {
  for (const options of [{ motion: false }, { height: 580 }, { contentHeight: 1000 }]) {
    const scene = mountScene(options);
    assert.equal(scene.root.dataset.enhanced, 'false');
    assert.equal(scene.links.inert, false);
    scene.cleanup();
  }
  const mobile = mountScene({ width: 320, height: 740, contentHeight: 1100 });
  assert.equal(mobile.root.dataset.enhanced, 'true');
  assert.equal(mobile.links.inert, false);
  mobile.cleanup();
});
