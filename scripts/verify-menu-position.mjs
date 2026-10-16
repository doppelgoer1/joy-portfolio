import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ channel: 'chrome' });
try {
  for (const width of [1440, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, isMobile: width < 780, hasTouch: width < 780 });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(process.env.PORTFOLIO_URL || 'http://127.0.0.1:4318');
    const nav = page.locator('nav[data-glass="true"]');
    await nav.waitFor();
    for (const label of ['작업', '경력', '이전 프로젝트', '연락', '작업']) {
      if (width < 780) await nav.getByRole('button').tap();
      else { await page.mouse.move(5, 600); await nav.hover(); }
      await page.waitForTimeout(450);
      await nav.getByRole('link', { name: label, exact: true }).click();
      await page.waitForFunction(() => {
        const heading = document.querySelector(location.hash)?.querySelector('h2');
        const menu = document.querySelector('nav[data-glass="true"]');
        return heading && menu && Math.abs(heading.getBoundingClientRect().top - menu.getBoundingClientRect().bottom - 24) < 1;
      }, null, { timeout: 10000 });
      await page.waitForTimeout(250);
      const delta = await page.evaluate(() => document.querySelector(location.hash).querySelector('h2').getBoundingClientRect().top - document.querySelector('nav[data-glass="true"]').getBoundingClientRect().bottom);
      assert.ok(Math.abs(delta - 24) < 1, `${width}/${label}: gap ${delta}`);
      assert.equal(await nav.locator(':focus-visible').count(), 0);
      console.log(JSON.stringify({ width, label, headingGap: delta }));
      if (process.env.MENU_SCREENSHOTS && ['작업', '연락'].includes(label)) await page.screenshot({ path: `/tmp/menu-position-${width}-${label}.png` });
    }
    assert.deepEqual(errors, []);
    await page.close();
  }
} finally { await browser.close(); }
