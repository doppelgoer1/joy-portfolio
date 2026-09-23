import assert from "node:assert/strict";
import { verifyHWorks } from "./verify-hworks.mjs";
import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

// Install with `npm exec --package=playwright -- playwright --version`, or set
// PLAYWRIGHT_MODULE to an already installed Playwright package directory.
const require = createRequire(import.meta.url);
const output = process.env.PORTFOLIO_ARTIFACTS || "artifacts/motion-restoration/browser";
const url = process.env.PORTFOLIO_URL || "http://127.0.0.1:3000";
await mkdir(output, { recursive: true });
const results = [];
let browser;

async function capture(page, name) {
  await page.screenshot({ path: join(output, `${name}.png`), fullPage: false });
}

async function checkPage(page, name) {
  await page.evaluate(async () => {
    await Promise.all([...document.images].map(image => { image.loading = 'eager'; return image.decode().catch(() => {}); }));
  });
  const metrics = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth - innerWidth,
    headings: document.querySelectorAll("h1").length,
    brokenImages: [...document.images].filter((image) => !image.complete || !image.naturalWidth).length,
    anchorErrors: [...document.querySelectorAll('a[href^="#"]')].filter((link) => !document.getElementById(link.hash.slice(1))).length,
  }));
  assert.ok(metrics.overflow <= 1, `${name}: horizontal overflow ${metrics.overflow}px`);
  assert.equal(metrics.headings, 1);
  assert.equal(metrics.brokenImages, 0);
  assert.equal(metrics.anchorErrors, 0);
  results.push({ name, ...metrics });
}

async function checkHero(page, name) {
  assert.equal(await page.locator(".stack-card").count(), 7);
  assert.deepEqual(await page.locator(".stack-card").evaluateAll((cards) => cards.map((card) => card.dataset.stack)), ["React", "Next.js", "TypeScript", "NestJS", "MariaDB", "CSS", "CSS1"]);
  assert.deepEqual(await page.locator(".stack-text .split-text").allTextContents(), ["CSS1", "CSS1"]);
  assert.equal(await page.locator(".stack-text").count(), 7);
  // Keep the production hero in both motion preferences; only new content adapts.

  assert.equal(await page.locator(".joy-pin").evaluate((element) => getComputedStyle(element).position), "sticky");
  assert.ok(await page.locator(".joy-stage").evaluate((element) => Math.abs(element.getBoundingClientRect().height - innerHeight * 8.2) < 1));
  assert.ok(await page.locator(".site-header").evaluate((element) => element.getBoundingClientRect().top >= innerHeight), `${name}: navigation remains below the original hero`);
  for (const progress of [0.11, 0.23, 0.34, 0.44, 0.68, 0.78, 0.88, 1]) {
    await page.evaluate((p) => history.replaceState(null, "", `?p=${p}`), progress);
    await page.waitForFunction((p) => Math.abs(Number(document.documentElement.style.getPropertyValue("--p")) - p) < 0.00005, progress);
    const state = await page.evaluate(() => ({
      curtainOpen: Number(document.documentElement.style.getPropertyValue("--curtain-open")),
      doorOpen: Number(document.documentElement.style.getPropertyValue("--css1-door-open")),
      reveal: Number(document.documentElement.style.getPropertyValue("--css1-reveal-opacity")),
      splitX: ["left", "right"].map((side) => parseFloat(document.documentElement.style.getPropertyValue(`--css1-text-${side}-x`))),
      doorWidth: ["::before", "::after"].map((pseudo) => parseFloat(getComputedStyle(document.querySelector('[data-stack="CSS1"]'), pseudo).width)),
      doorX: ["::before", "::after"].map((pseudo) => new DOMMatrixReadOnly(getComputedStyle(document.querySelector('[data-stack="CSS1"]'), pseudo).transform).m41),
      textX: [...document.querySelectorAll(".split-text")].map((text) => new DOMMatrixReadOnly(getComputedStyle(text).transform).m41),
      revealOpacity: Number(getComputedStyle(document.querySelector(".door-reveal-layer")).opacity),
      cards: [...document.querySelectorAll(".stack-card")].map((card) => card.style.getPropertyValue("--panel-width")),
      text: [...document.querySelectorAll(".stack-text")].map((text) => ({
        x: Number(text.style.getPropertyValue("--text-x")),
        y: Number(text.style.getPropertyValue("--text-y")),
        scale: Number(text.style.getPropertyValue("--text-scale")),
        opacity: Number(text.style.getPropertyValue("--text-opacity")),
      })),
      width: innerWidth,
    }));
    if (progress === 0.34) assert.ok(Math.abs(state.curtainOpen - 0.5) < 0.003);
    if (progress >= 0.68) {
      const expectedDoor = progress === 0.68 ? 0 : progress === 0.78 ? 0.5 : 1;
      const expectedReveal = progress === 0.68 ? 0 : progress === 0.78 ? 0.9047 : 1;
      assert.ok(Math.abs(state.doorOpen - expectedDoor) < 0.002);
      assert.ok(Math.abs(state.reveal - expectedReveal) < 0.002);
      assert.equal(state.revealOpacity, state.reveal);
      const shift = state.doorOpen * 1.12 * state.width * 0.51;
      for (const [index, direction] of [-1, 1].entries()) {
        // Root variables are rounded to four decimals; pseudo doors are 50.1% wide.
        assert.ok(Math.abs(state.splitX[index] - direction * shift) < 0.1);
        assert.ok(Math.abs(state.textX[index] - state.splitX[index]) < 0.02);
        assert.ok(Math.abs(state.doorX[index] - direction * state.doorOpen * state.doorWidth[index] * 1.02) < 0.15);
      }
      assert.equal(state.text[6].x, 0);
      assert.equal(state.text[6].y, 0);
      assert.equal(state.text[6].scale, 1);
    }
    if (progress === 1) {
      assert.deepEqual(state.cards, Array(7).fill("112.00vw"));
      const y = state.width <= 780 ? [-230, -146, -62, 22, 106, 190, 0] : [-300, -190, -80, 30, 140, 250, 0];
      state.text.forEach((text, index) => {
        assert.ok(Math.abs(text.x - (index === 6 ? 0 : -state.width * (state.width <= 780 ? 0.68 : 0.66))) < 0.02);
        assert.equal(text.y, y[index]);
        assert.equal(text.scale, index === 6 ? 1 : 0.34);
        assert.equal(text.opacity, 0.38);
      });
    }
    results.push({ name: `${name}-hero-p-${progress}`, ...state });
    await capture(page, `${name}-hero-p-${progress}`);
  }

  await page.evaluate(() => {
    history.replaceState(null, "", location.pathname);
    const stage = document.querySelector(".joy-stage");
    scrollTo(0, (stage.getBoundingClientRect().height - innerHeight) * 0.34);
  });
  await page.waitForFunction(() => Math.abs(Number(document.documentElement.style.getPropertyValue("--p")) - 0.34) < 0.001);
  await capture(page, `${name}-hero-native-scroll`);
}

try {
  const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
  browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || "chrome", headless: true });
  for (const config of [
    { name: "desktop", viewport: { width: 1440, height: 1100 }, reducedMotion: "no-preference" },
    { name: "laptop", viewport: { width: 1366, height: 768 }, reducedMotion: "no-preference" },
    { name: "short-laptop", viewport: { width: 1366, height: 700 }, reducedMotion: "no-preference" },
    { name: "desktop-1280", viewport: { width: 1280, height: 720 }, reducedMotion: "no-preference" },
    { name: "desktop-1024", viewport: { width: 1024, height: 700 }, reducedMotion: "no-preference" },
    { name: "short-fallback", viewport: { width: 1280, height: 580 }, reducedMotion: "no-preference" },
    { name: "tablet", viewport: { width: 820, height: 1180 }, reducedMotion: "no-preference" },
    { name: "mobile", viewport: { width: 390, height: 844 }, reducedMotion: "no-preference", isMobile: true, hasTouch: true },
    { name: "small-mobile", viewport: { width: 320, height: 740 }, reducedMotion: "no-preference", isMobile: true, hasTouch: true },
    { name: "reduced-motion", viewport: { width: 1440, height: 1100 }, reducedMotion: "reduce" },
  ].filter(config => !process.env.PORTFOLIO_VIEWPORTS || process.env.PORTFOLIO_VIEWPORTS.split(',').includes(config.name))) {
    const { name, ...options } = config;
    const page = await browser.newPage(options);
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
    await page.goto(url, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await checkPage(page, name);
    await capture(page, `${name}-hero`);

    await checkHero(page, name);
    await page.evaluate(() => scrollTo(0, 0));
    const compact = await page.evaluate(() => document.querySelector('#h-works').getBoundingClientRect().top - document.querySelector('#work').getBoundingClientRect().top);
    assert.ok(compact < 110, `${name}: compact intro ${compact}`);
    await verifyHWorks(page, options.viewport, options.reducedMotion === 'reduce', capture);
    const animated = options.viewport.width >= 1000 && options.viewport.height >= 700 && options.reducedMotion !== 'reduce';
    for (const id of ['fatespoiler', 'moduerp']) {
      await page.locator(`#${id}`).evaluate(el => { const root = el.parentElement; const siblings = [...root.children]; const before = siblings.slice(0, siblings.indexOf(el)).reduce((sum, item) => sum + item.offsetHeight, 0); scrollTo({ top: root.getBoundingClientRect().top + scrollY + before - 80, behavior: 'instant' }); });
      await page.waitForTimeout(120);
      assert.equal(await page.locator(`#${id}`).isVisible(), true);
      await checkPage(page, `${name}-${id}`);
      await capture(page, `${name}-${id}`);
      for (const selector of ['.case-read-link', '.showcase-service']) {
        const link = page.locator(`#${id} ${selector}`);
        await link.focus();
        assert.equal(await link.evaluate(el => { const r=el.getBoundingClientRect(); return el.contains(document.elementFromPoint(r.x+r.width/2, r.y+r.height/2)); }), true, `${name}: ${id} ${selector} unobscured`);
      }
    }
    if (animated) {
      await page.locator('#fatespoiler .showcase-service').focus();
      // Scrollbar/programmatic scroll and PageDown must work without wheel/blur.
      await page.locator('#moduerp').evaluate(el => { const root = el.parentElement; const siblings = [...root.children]; const before = siblings.slice(0, siblings.indexOf(el)).reduce((sum, item) => sum + item.offsetHeight, 0); scrollTo({ top: root.getBoundingClientRect().top + scrollY + before - 80, behavior: 'instant' }); });
      await page.waitForTimeout(100);
      assert.equal(await page.evaluate(() => document.elementFromPoint(innerWidth / 2, 300)?.closest('article')?.id), 'moduerp', `${name}: no stale focus elevation`);
      await page.keyboard.press('PageDown');
      await page.waitForTimeout(150);
      assert.notEqual(await page.evaluate(() => document.elementFromPoint(innerWidth / 2, 300)?.closest('article')?.id), 'fatespoiler');
    }
    for (const id of ['career', 'archive', 'contact']) {
      await page.locator(`#${id}`).evaluate(el => el.scrollIntoView());
      await page.waitForTimeout(120);
      await checkPage(page, `${name}-${id}`);
    }
    if (animated) {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      assert.equal(await page.locator('.showcase-panel').first().evaluate(el => getComputedStyle(el).position), 'relative');
      assert.equal(await page.locator('.showcase-surface').first().evaluate(el => getComputedStyle(el).transform), 'none');
    }
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => document.activeElement.className), 'skip-link');
    await page.keyboard.press('Enter');
    assert.ok(page.url().endsWith('#work'));
    await page.goto(`${url}/#fatespoiler`, { waitUntil: 'networkidle' });
    assert.equal(await page.locator('#fatespoiler').isVisible(), true);
    await page.locator('#fatespoiler .case-read-link').click();
    await page.waitForURL('**/projects/fatespoiler');
    assert.equal(await page.locator('h1').textContent(), 'FateSpoiler');
    await page.goBack({ waitUntil: 'networkidle' });
    assert.ok(page.url().endsWith('#fatespoiler'));
    assert.deepEqual(errors, [], `${name}: console errors`);
    await page.close();
  }

  for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 1100 }]) {
    const page = await browser.newPage({ javaScriptEnabled: false, viewport });
    await page.goto(url);
    assert.equal(await page.locator('.scroll-showcase > article').count(), 3);
    assert.equal(await page.locator('.hworks-pin').evaluate(el => getComputedStyle(el).position), 'static');
    assert.equal(await page.locator('.hworks-links').evaluate(el => el.inert), false);
    assert.equal(await page.locator('.hworks-copy li').count(), 4);
    for (const id of ['h-works', 'fatespoiler', 'moduerp']) {
      await page.locator(`#${id}`).evaluate(el => el.scrollIntoView());
      assert.equal(await page.locator(`#${id}`).isVisible(), true);
      await capture(page, `no-javascript-${viewport.width}-${id}`);
    }
    await checkPage(page, `no-javascript-${viewport.width}`);
    await page.close();
  }
  await writeFile(join(output, "results.json"), JSON.stringify({ status: "passed", results }, null, 2));
  console.log(`Browser checks passed. Screenshots: ${output}`);
} catch (error) {
  await writeFile(join(output, "results.json"), JSON.stringify({ status: "failed", error: error.message, results }, null, 2));
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await browser?.close();
}
