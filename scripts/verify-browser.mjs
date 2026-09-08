import assert from "node:assert/strict";
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
        assert.ok(Math.abs(state.doorX[index] - direction * state.doorOpen * 1.12 * state.width * 0.501 * 1.02) < 0.15);
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
    { name: "tablet", viewport: { width: 820, height: 1180 }, reducedMotion: "no-preference" },
    { name: "mobile", viewport: { width: 390, height: 844 }, reducedMotion: "no-preference", isMobile: true, hasTouch: true },
    { name: "small-mobile", viewport: { width: 320, height: 740 }, reducedMotion: "no-preference", isMobile: true, hasTouch: true },
    { name: "reduced-motion", viewport: { width: 1440, height: 1100 }, reducedMotion: "reduce" },
  ]) {
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
    for (const id of ["work", "h-works", "fatespoiler", "moduerp", "career", "archive", "contact"]) {
      const tab = page.locator(`#${id}-tab`);
      if (await tab.count()) {
        await tab.click();
        await page.waitForTimeout(900);
        assert.equal(await tab.getAttribute("aria-selected"), "true");
        assert.equal(await tab.getAttribute("data-position"), "0");
      }
      await page.locator(`#${id}`).evaluate((element) => element.scrollIntoView());
      await page.waitForTimeout(150);
      await checkPage(page, `${name}-${id}`);
      await capture(page, `${name}-${id}`);
    }
    if (name === "desktop") {
      await page.locator("#fatespoiler").evaluate((element) => {
        scrollTo(0, scrollY + element.getBoundingClientRect().top - innerHeight * 0.6);
      });
      await capture(page, "desktop-project-overlap");
      await page.emulateMedia({ reducedMotion: "reduce" });
      assert.equal(await page.locator(".joy-pin").evaluate((element) => getComputedStyle(element).position), "sticky");
      assert.equal(await page.locator(".project-case").first().evaluate((element) => getComputedStyle(element).position), "relative");
      await page.emulateMedia({ reducedMotion: "no-preference" });
      assert.equal(await page.locator(".joy-pin").evaluate((element) => getComputedStyle(element).position), "sticky");
    }
    if (name.includes("mobile") || name === "reduced-motion") {
      assert.equal(await page.locator(".project-case").first().evaluate((element) => getComputedStyle(element).position), "relative");
    }
    await page.goto(url, { waitUntil: "networkidle" });
    await page.keyboard.press("Tab");
    assert.equal(await page.evaluate(() => document.activeElement.className), "skip-link");
    await page.keyboard.press("Enter");
    assert.ok(page.url().endsWith("#work"));
    // Arrow keys move both selection and focus between the stage cards; only the selected panel stays visible.
    await page.locator("#h-works-tab").focus();
    await page.keyboard.press("ArrowRight");
    assert.equal(await page.evaluate(() => document.activeElement.id), "fatespoiler-tab");
    assert.equal(await page.locator("#fatespoiler").isVisible(), true);
    assert.equal(await page.locator("#h-works").isHidden(), true);
    await page.keyboard.press("End");
    assert.equal(await page.evaluate(() => document.activeElement.id), "moduerp-tab");
    assert.equal(await page.locator("#moduerp-tab").getAttribute("data-position"), "0");
    for (const project of ["h-works", "fatespoiler", "moduerp"]) {
      await page.locator(`#${project}-tab`).click();
      await page.waitForTimeout(600);
      const link = page.locator(`#${project} a[target="_blank"]`);
      await link.focus();
      assert.equal(await link.evaluate((element) => {
        const rect = element.getBoundingClientRect();
        const point = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
        return element.contains(point);
      }), true, `${name}: ${project} link must be unobscured on focus`);
    }
    assert.deepEqual(errors, [], `${name}: console errors`);
    await page.close();
  }

  const page = await browser.newPage({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  await page.goto(url);
  assert.equal(await page.locator(".project-case").count(), 3);
  await checkPage(page, "no-javascript");
  await capture(page, "no-javascript-hero");
  await page.close();
  await writeFile(join(output, "results.json"), JSON.stringify({ status: "passed", results }, null, 2));
  console.log(`Browser checks passed. Screenshots: ${output}`);
} catch (error) {
  await writeFile(join(output, "results.json"), JSON.stringify({ status: "failed", error: error.message, results }, null, 2));
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await browser?.close();
}
