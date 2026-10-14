import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.PORTFOLIO_URL || 'http://127.0.0.1:4381';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  for (const reducedMotion of ['no-preference', 'reduce']) {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion });
    await page.goto(base, { waitUntil: 'networkidle' });
    await page.evaluate(() => {
      window.scrollCalls = [];
      const original = Element.prototype.scrollIntoView;
      Element.prototype.scrollIntoView = function(options) {
        window.scrollCalls.push({ id: this.id, behavior: options?.behavior });
        return original.call(this, options);
      };
      document.getElementById('work').scrollIntoView();
    });
    for (const id of ['career', 'education', 'contact', 'work']) {
      await page.locator(`.site-header a[href="#${id}"]`).click();
      assert.equal(new URL(page.url()).hash, `#${id}`);
      const call = await page.evaluate(() => window.scrollCalls.at(-1));
      assert.deepEqual(call, { id, behavior: reducedMotion === 'reduce' ? 'instant' : 'smooth' });
      await page.waitForFunction(id => {
        const target = document.getElementById(id);
        const expected = Math.min(target.getBoundingClientRect().top + scrollY - parseFloat(getComputedStyle(target).scrollMarginTop || 0), document.documentElement.scrollHeight - innerHeight);
        return Math.abs(scrollY - expected) < 2;
      }, id);
    }
    console.log(`PASS mobile header four links: ${reducedMotion}`);
    await page.close();
  }
} finally { await browser.close(); }
