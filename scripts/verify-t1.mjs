import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.setDefaultTimeout(15000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(process.env.PORTFOLIO_URL || 'http://127.0.0.1:4173', { waitUntil: 'networkidle' });
  assert.equal(await page.locator('.t1').count(), 1, 'HERO → WORK has a single transition scene');
  const start = await page.locator('.joy-stage').evaluate(e => e.offsetHeight - innerHeight);
  const end = await page.locator('#work').evaluate(e => e.getBoundingClientRect().top + scrollY);
  assert.ok(Math.abs(end - start - 900 * 3.6) < 2, '360vh pin, work anchor at the reading endpoint');
  for (const offset of [0, 30, 100, 300]) {
    await page.evaluate(y => scrollTo(0, y), start + offset);
    await page.waitForFunction(() => Math.abs(document.querySelector(".t1-viewport").getBoundingClientRect().top) < 1);
    assert.ok(Math.abs((await page.locator('.t1-viewport').boundingBox()).y) < 1, 'scene never slides up as a document');
  }
  await page.evaluate(y => scrollTo(0, y), start + (end - start) * .5);
  await page.waitForTimeout(1800);
  const poster = await page.locator('.t1-poster').boundingBox();
  assert.ok(poster.width >= 1440 * 1.11 && poster.height >= 900, '112vw full red poster');
  assert.equal(await page.locator('.site-header').evaluate(e => getComputedStyle(e).visibility), 'hidden');
  await page.evaluate(() => { location.hash = 'work'; });
  await page.waitForTimeout(1200);
  assert.ok(Math.abs(await page.evaluate(() => scrollY) - end) < 2, 'hash lands at the pin endpoint');
  assert.equal(await page.locator('.t1-reading').evaluate(e => e.inert), false);
  await page.getByRole('button', { name: '다음 프로젝트 선택', exact: true }).click();
  assert.equal(await page.locator('#fatespoiler-tab').getAttribute('aria-selected'), 'true');
  for (const progress of [.32, .15, .3, .84, .67, .45]) {
    await page.evaluate(y => scrollTo(0, y), start + (end - start) * progress);
    await page.waitForTimeout(1900);
    assert.ok(Math.abs(await page.evaluate(() => scrollY) - (start + (end - start) * progress)) < 2, `native stop remains at ${progress}`);
  }
  await page.evaluate(() => { location.hash = 'archive'; });
  await page.waitForTimeout(1000);
  const rail = await page.evaluate(() => [...document.querySelectorAll('.stage-index a > span:nth-child(2)')].map(label => {
    const box = label.getBoundingClientRect();
    const style = getComputedStyle(label);
    return { x: box.x, y: box.y, font: parseFloat(style.fontSize), weight: style.fontWeight };
  }));
  assert.equal(rail.length, 9);
  assert.ok(rail.every(label => label.font >= 26 && label.font <= 28 && label.weight === '800' && Math.abs(label.x - 100) < 2));
  assert.ok(rail.slice(1).every((label, i) => Math.abs(label.y - rail[i].y - 64) < .1), '64px rail pitch');
  assert.equal(await page.locator('.stage-index > p').isVisible(), false, 'desktop eyebrow removed');
  // Observe actual native scroll frames, including reverse docking; never seek the timeline.
  const docking = await page.evaluate(async ({ start, end }) => {
    const result = { frames: 0, overlaps: 0, splits: 0, minContrast: Infinity, failures: [], names: new Set() };
    const rgb = value => value.match(/[\d.]+/g).slice(0, 3).map(Number);
    const luminance = color => color.map(value => {
      const channel = value / 255;
      return channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4;
    }).reduce((sum, channel, i) => sum + channel * [.2126, .7152, .0722][i], 0);
    const contrast = (a, b) => (Math.max(luminance(a), luminance(b)) + .05) / (Math.min(luminance(a), luminance(b)) + .05);
    for (const destination of [start, end]) {
      const from = scrollY;
      await new Promise(resolve => {
        let began;
        const frame = now => {
          began ??= now;
          const progress = Math.min(1, (now - began) / 4000);
          const panel = document.querySelector('.t1-poster');
          const p = panel.getBoundingClientRect();
          for (const label of document.querySelectorAll('.t1-label')) {
            const box = label.getBoundingClientRect();
            const style = getComputedStyle(label);
            if (+style.opacity > .05 && +getComputedStyle(panel).opacity > .9 && box.left < p.right && box.right > p.left && box.top < p.bottom && box.bottom > p.top) {
              result.overlaps++;
              const name = label.querySelector('.t1-label-ink')?.textContent || label.textContent;
              result.names.add(name);
              const split = box.left < p.left || box.right > p.right || box.top < p.top || box.bottom > p.bottom;
              if (split) result.splits++;
              const ink = label.querySelector('.t1-label-ink');
              const paper = label.querySelector('.t1-label-paper');
              if (!ink || !paper) {
                result.failures.push({ label: name, reason: 'missing separate brand-color layers' });
                continue;
              }
              const inkStyle = getComputedStyle(ink), paperStyle = getComputedStyle(paper);
              const groupStyle = getComputedStyle(label.parentElement);
              const panelColor = rgb(getComputedStyle(panel).backgroundColor);
              const background = rgb(getComputedStyle(document.querySelector('.t1-viewport')).backgroundColor);
              const minimum = Math.min(contrast(rgb(paperStyle.color), panelColor), contrast(rgb(inkStyle.color), background));
              result.minContrast = Math.min(result.minContrast, minimum);
              const expectedInk = label.dataset.current === 'true' ? 'rgb(122, 12, 7)' : 'rgb(5, 5, 5)';
              if (minimum < 4.5 || +style.opacity < .99 || inkStyle.color !== expectedInk || paperStyle.color !== 'rgb(242, 242, 242)' || groupStyle.mixBlendMode !== 'normal' || inkStyle.clipPath === 'none' || paperStyle.clipPath === 'none') {
                result.failures.push({ label: name, ink: inkStyle.color, paper: paperStyle.color, contrast: minimum, blend: groupStyle.mixBlendMode });
              }
            }
          }
          result.frames++;
          scrollTo(0, from + (destination - from) * progress);
          if (progress < 1) requestAnimationFrame(frame); else resolve();
        };
        requestAnimationFrame(frame);
      });
      await new Promise(resolve => setTimeout(resolve, 1200));
    }
    return { ...result, names: [...result.names] };
  }, { start, end });
  assert.ok(docking.overlaps > 0, 'docking overlap was observed');
  assert.equal(docking.names.length, 9, 'all nine names crossed the red panel');
  assert.ok(docking.splits > 0, 'labels straddled the panel edge');
  assert.deepEqual(docking.failures, [], 'each visible part of a crossing label has at least 4.5:1 contrast');
  console.log(JSON.stringify({ rail, docking }));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(700);
  await page.evaluate(() => { location.hash = 'archive'; });
  await page.waitForTimeout(800);
  assert.equal(await page.locator('.pin-spacer').count(), 4, 'one pin after breakpoint change');
  const mobile = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth - innerWidth,
    labels: [...document.querySelectorAll('.stage-index a')].map(a => ({ font: parseFloat(getComputedStyle(a).fontSize), height: a.getBoundingClientRect().height })),
  }));
  assert.equal(mobile.overflow, 0);
  assert.ok(mobile.labels.every(label => label.font >= 13 && label.height >= 44));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForTimeout(700);
  assert.equal(await page.locator('.pin-spacer').count(), 0, 'reduced motion reverts only T1 pin');
  assert.equal(await page.locator('.t1-intro').evaluate(e => e.offsetHeight), 0);
  assert.equal(await page.locator('.t1-ceremony').evaluate(e => e.offsetHeight), 844);
  for (const hash of ['work','archive','h-works','fatespoiler','moduerp','eng-spark','whaleai','myro','bull-finder','guidy-gaime','onbooth','archive-eng-spark','archive-whaleai','archive-myro','archive-bull-finder','archive-guidy-gaime','archive-onbooth']) {
    await page.evaluate(hash => { location.hash = hash; }, hash);
    await page.waitForTimeout(350);
    const id = hash === 'archive' ? 'eng-spark' : hash.replace(/^archive-/, '');
    await page.waitForFunction(id => { const e = document.getElementById(id); const r = e.getBoundingClientRect(); return !e.hidden && r.top >= -2 && r.top < innerHeight; }, id);
    const rect = await page.locator(`#${id}`).boundingBox();
    assert.ok(rect && rect.y >= -2 && rect.y < 844, `reduced anchor #${hash}`);
  }
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.waitForTimeout(700);
  assert.equal(await page.locator('.pin-spacer').count(), 4, 'motion preference restores one T1 context');
  assert.deepEqual(errors, [], 'no browser errors throughout anchor, resize, and preference changes');
  console.log('T1 browser contract passed: pin, full red, anchor, native stop/reverse without snap, mobile sizes, reduced anchors, context cleanup');
} finally {
  await browser.close();
}
