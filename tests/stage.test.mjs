import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { projects } from "../src/data/portfolio.ts";
const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const home = read("out/index.html").replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, "").replace(/<!--[\s\S]*?-->/g, "");
const stage = home.slice(home.indexOf('class="scroll-showcase"'), home.indexOf('class="career-section'));

test("native showcase: all three semantic articles visible in SSR, no carousel", () => {
  assert.equal((stage.match(/<article /g) || []).length, 3);
  assert.doesNotMatch(stage, /role="tab|\shidden=|<img|<canvas/);
  let previous = -1;
  for (const project of projects) {
    const start = stage.indexOf(`id="${project.id}"`);
    assert.ok(start > previous);
    previous = start;
    const panel = stage.slice(start, stage.indexOf('</article>', start));
    assert.ok(panel.includes(`aria-labelledby="${project.id}-title"`));
    for (const fact of [project.name, project.category, project.role, project.summary, project.note]) assert.ok(panel.includes(fact), fact);
    assert.ok(panel.includes(`href="/projects/${project.id}"`));
    assert.ok(panel.includes(`href="${project.url}" target="_blank" rel="noreferrer"`));
    assert.ok(panel.includes('서비스 화면 아님'));
    assert.doesNotMatch(panel, /chapter-card|contribution-list/);
  }
});
test("scene scroll is passive, frame-coalesced and cleaned up; no blur/elevation kludge", () => {
  const source = read('src/components/HWorksScene.tsx');
  assert.match(source, /passive: true/);
  assert.match(source, /if \(!frame\) frame = requestAnimationFrame/);
  assert.match(source, /cancelAnimationFrame\(frame\)/);
  assert.match(source, /removeEventListener\("scroll"/);
  assert.match(source, /media.removeEventListener/);
  assert.doesNotMatch(source, /preventDefault|setInterval/);
  const panels = read('src/components/WorkStage.tsx');
  assert.match(panels, /addEventListener\("focusin", revealFocus\)/);
  assert.match(panels, /elementFromPoint/);
  assert.match(panels, /siblings.slice\(0, siblings.indexOf\(panel\)\)/);
  assert.doesNotMatch(panels, /\.blur\(|releasePointerFocus|--recede/);
});
test("scoped, measured sticky panels with static/mobile/reduced fallback", () => {
  const css = read('src/app/scroll-showcase.css');
  assert.match(css, /data-sticky="true"/);
  assert.match(css, /min-height: 700px/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.doesNotMatch(css, /:focus-within/);
  assert.match(read('src/components/WorkStage.tsx'), /heights\[index\] <= innerHeight - 80/);
  assert.doesNotMatch(css, /\.joy-|\.stack-|:root|(?:^|})\s*body\s*\{/);
  assert.doesNotMatch(read('src/app/page.tsx'), /className="section-intro"|카드를 골라/);
});
