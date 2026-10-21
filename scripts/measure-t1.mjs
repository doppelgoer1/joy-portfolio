import { createRequire } from 'node:module';
import { writeFile } from 'node:fs/promises';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH });
const results = [];
try {
  for (const rate of [1, 4]) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate });
    await cdp.send('Performance.enable');
    await page.goto(process.env.PORTFOLIO_URL || 'http://127.0.0.1:4175', { waitUntil: 'networkidle' });
    const end = await page.locator('#work').evaluate(e => e.getBoundingClientRect().top + scrollY);
    for (const [name, from, to, duration] of [['hero', 0, 6475, 9000], ['t1-with-hero-raf', 6480, end, 6000]]) {
      await page.evaluate(y => scrollTo(0, y), from);
      const before = await cdp.send('Performance.getMetrics');
      const frames = await page.evaluate(async ({ from, to, duration }) => {
        const frames = [];
        await new Promise(resolve => {
          let previous = performance.now();
          const start = previous;
          const sample = now => {
            frames.push(now - previous); previous = now;
            const p = Math.min(1, (now - start) / duration);
            scrollTo(0, from + (to - from) * p);
            if (p < 1) requestAnimationFrame(sample); else resolve();
          };
          requestAnimationFrame(sample);
        });
        return frames;
      }, { from, to, duration });
      const after = await cdp.send('Performance.getMetrics');
      const delta = key => after.metrics.find(m => m.name === key).value - before.metrics.find(m => m.name === key).value;
      const sorted = frames.slice(1).sort((a,b) => a-b);
      results.push({ rate, name, frames: frames.length, medianMs: sorted[Math.floor(sorted.length * .5)], p95Ms: sorted[Math.floor(sorted.length * .95)], over33ms: sorted.filter(n => n > 33.4).length, over50ms: sorted.filter(n => n > 50).length, scriptSeconds: delta('ScriptDuration'), taskSeconds: delta('TaskDuration'), layoutSeconds: delta('LayoutDuration'), styleSeconds: delta('RecalcStyleDuration') });
    }
    await page.close();
  }
  await writeFile(process.env.PERFORMANCE_OUTPUT || '/tmp/t1-performance.json', JSON.stringify({ browser: browser.version(), results }, null, 2));
  console.log(JSON.stringify(results));
} finally { await browser.close(); }
