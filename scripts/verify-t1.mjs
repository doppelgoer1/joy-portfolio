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
  assert.ok(Math.abs(end - start - 900 * 2.2) < 2, '220vh pin, work anchor at the reading endpoint');
  for (const offset of [0, 30, 100, 300]) {
    await page.evaluate(y => scrollTo(0, y), start + offset);
    await page.waitForTimeout(90);
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
  for (const [progress, expected] of [[.32, .5], [.84, 1], [.67, .5]]) {
    await page.evaluate(y => scrollTo(0, y), start + (end - start) * progress);
    await page.waitForTimeout(1900);
    assert.ok(Math.abs(await page.evaluate(() => scrollY) - (start + (end - start) * expected)) < 2, `snap ${progress} → ${expected}`);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(700);
  await page.evaluate(() => { location.hash = 'archive'; });
  await page.waitForTimeout(800);
  assert.equal(await page.locator('.pin-spacer').count(), 1, 'one pin after breakpoint change');
  const mobile = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth - innerWidth,
    labels: [...document.querySelectorAll('.stage-index a')].map(a => ({ font: parseFloat(getComputedStyle(a).fontSize), height: a.getBoundingClientRect().height })),
  }));
  assert.equal(mobile.overflow, 0);
  assert.ok(mobile.labels.every(label => label.font >= 13 && label.height >= 44));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForTimeout(700);
  assert.equal(await page.locator('.pin-spacer').count(), 0, 'reduced motion reverts only T1 pin');
  assert.equal(await page.locator('.t1-intro').evaluate(e => e.offsetHeight), 844);
  assert.equal(await page.locator('.t1-ceremony').evaluate(e => e.offsetHeight), 844);
  for (const hash of ['work','archive','h-works','fatespoiler','moduerp','eng-spark','whaleai','myro','bull-finder','guidy-gaime','onbooth','archive-eng-spark','archive-whaleai','archive-myro','archive-bull-finder','archive-guidy-gaime','archive-onbooth']) {
    await page.evaluate(hash => { location.hash = hash; }, hash);
    await page.waitForTimeout(350);
    const id = hash === 'archive' ? 'work' : hash.replace(/^archive-/, '');
    const rect = await page.locator(`#${id}`).boundingBox();
    assert.ok(rect && rect.y >= -2 && rect.y < 844, `reduced anchor #${hash}`);
  }
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.waitForTimeout(700);
  assert.equal(await page.locator('.pin-spacer').count(), 1, 'motion preference restores one T1 context');
  assert.deepEqual(errors, [], 'no browser errors throughout anchor, resize, and preference changes');
  console.log('T1 browser contract passed: pin, full red, anchor, 50/100 snap, mobile sizes, reduced anchors, context cleanup');
} finally {
  await browser.close();
}
