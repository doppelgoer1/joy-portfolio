import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const output = process.env.PORTFOLIO_ARTIFACTS || 'artifacts/t1';
const url = process.env.PORTFOLIO_URL || 'http://127.0.0.1:4175';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH });
const records = [];

// Move the native document scroll position on real animation frames. No ?p= or timeline seeking.
async function scroll(page, to, duration) {
  await page.evaluate(async ({ to, duration }) => {
    const from = scrollY;
    await new Promise(resolve => {
      const start = performance.now();
      const frame = now => {
        const p = Math.min(1, (now - start) / duration);
        scrollTo(0, from + (to - from) * p);
        if (p < 1) requestAnimationFrame(frame); else resolve();
      };
      requestAnimationFrame(frame);
    });
  }, { to, duration });
}
async function record(name, viewport, reducedMotion = 'no-preference') {
  const context = await browser.newContext({ viewport, reducedMotion, isMobile: viewport.width < 780, hasTouch: viewport.width < 780, recordVideo: { dir: join(output, 'raw'), size: viewport } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(900);
  const positions = await page.evaluate(() => ({
    heroEnd: document.querySelector('.joy-stage').offsetHeight - innerHeight,
    start: document.querySelector('.t1').getBoundingClientRect().top + scrollY,
    end: document.querySelector('#work').getBoundingClientRect().top + scrollY,
  }));
  const {heroEnd, start, end} = positions;
  const screenshot = async label => page.screenshot({path:join(output, `${name}-${label}.png`)});
  if (name === 'desktop-forward' || name === 'mobile-forward') {
    await scroll(page, heroEnd - 3, 14000);
    await page.waitForTimeout(900);
    await screenshot('hero-final');
    await scroll(page, start + (end - start) * .5, 4200);
    await page.waitForTimeout(1600);
    await screenshot('red-09');
    await scroll(page, end, 5000);
    await page.waitForTimeout(2200);
    await screenshot('reading');
  } else if (name === 'desktop-reverse-fast') {
    await scroll(page, end, 1100);
    await page.waitForTimeout(1600);
    await scroll(page, start + (end - start) * .5, 4300);
    await page.waitForTimeout(1600);
    await scroll(page, heroEnd - 700, 5000);
    await page.waitForTimeout(700);
    await scroll(page, end + viewport.height * .7, 350);
    await page.waitForTimeout(1400);
    await scroll(page, heroEnd - viewport.height * 1.5, 350);
    await page.waitForTimeout(1400);
    await scroll(page, end, 850);
    await page.waitForTimeout(1900);
    await screenshot('reading');
  } else {
    await scroll(page, start, 800);
    await page.waitForTimeout(1600);
    await screenshot('static-0');
    await scroll(page, start + viewport.height, 3000);
    await page.waitForTimeout(1600);
    await screenshot('static-50');
    await scroll(page, end, 3000);
    await page.waitForTimeout(1800);
    await screenshot('static-100');
    await page.getByRole('button', { name: '다음 프로젝트 선택', exact: true }).click();
    await page.waitForTimeout(900);
  }
  const metrics = await page.evaluate(() => ({
    scrollY, overflow: document.documentElement.scrollWidth - innerWidth,
    scene: { ...document.querySelector('.t1').dataset },
    labels: [...document.querySelectorAll('.stage-index a')].map(a => ({ fontSize: parseFloat(getComputedStyle(a).fontSize), height: a.getBoundingClientRect().height })),
    selected: document.querySelector('.stage-card[aria-selected="true"]').id,
  }));
  const video = page.video();
  await context.close();
  await video.saveAs(join(output, `${name}.webm`));
  records.push({ name, viewport, reducedMotion, positions, metrics, errors });
  console.log(`Recorded ${name}`);
  await writeFile(join(output, 'recordings.json'), JSON.stringify(records, null, 2));
}
try {
  const cases = [
    ['desktop-forward', { width: 1440, height: 900 }],
    ['desktop-reverse-fast', { width: 1440, height: 900 }],
    ['mobile-forward', { width: 390, height: 844 }],
    ['reduced-motion', { width: 1440, height: 900 }, 'reduce'],
  ];
  for (const args of cases) if (!process.env.CAPTURE_CASE || process.env.CAPTURE_CASE === args[0]) await record(...args);
} finally { await browser.close(); }
