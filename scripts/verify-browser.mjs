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

async function checkHero(page, name, reducedMotion) {
  assert.equal(await page.locator(".stack-card").count(), 6);
  assert.equal(await page.locator(".stack-text").count(), 6);
  if (reducedMotion === "reduce") {
    assert.equal(await page.locator(".joy-pin").evaluate((element) => getComputedStyle(element).position), "relative");
    assert.equal(await page.locator(".stack-text").first().evaluate((element) => getComputedStyle(element).transform), "none");
    return;
  }

  assert.equal(await page.locator(".joy-pin").evaluate((element) => getComputedStyle(element).position), "sticky");
  assert.ok(await page.locator(".joy-stage").evaluate((element) => Math.abs(element.getBoundingClientRect().height - innerHeight * 8.2) < 1));
  assert.ok(await page.locator(".site-header").evaluate((element) => element.getBoundingClientRect().top >= innerHeight), `${name}: navigation remains below the original hero`);
  for (const progress of [0.11, 0.23, 0.34, 0.44, 1]) {
    await page.evaluate((p) => history.replaceState(null, "", `?p=${p}`), progress);
    await page.waitForFunction((p) => Math.abs(Number(document.documentElement.style.getPropertyValue("--p")) - p) < 0.00005, progress);
    const state = await page.evaluate(() => ({
      curtainOpen: Number(document.documentElement.style.getPropertyValue("--curtain-open")),
      cards: [...document.querySelectorAll(".stack-card")].map((card) => card.style.getPropertyValue("--panel-width")),
      text: [...document.querySelectorAll(".stack-text")].map((text) => ({
        x: Number(text.style.getPropertyValue("--text-x")),
        y: Number(text.style.getPropertyValue("--text-y")),
        scale: Number(text.style.getPropertyValue("--text-scale")),
      })),
      width: innerWidth,
    }));
    if (progress === 0.34) assert.ok(Math.abs(state.curtainOpen - 0.5) < 0.003);
    if (progress === 1) {
      assert.deepEqual(state.cards, Array(6).fill("112.00vw"));
      const y = state.width <= 780 ? [-230, -146, -62, 22, 106, 190] : [-300, -190, -80, 30, 140, 250];
      state.text.forEach((text, index) => {
        assert.ok(Math.abs(text.x + state.width * (state.width <= 780 ? 0.34 : 0.36)) < 0.01);
        assert.equal(text.y, y[index]);
        assert.equal(text.scale, 0.34);
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

    await checkHero(page, name, options.reducedMotion);
    for (const id of ["work", "h-works", "fatespoiler", "moduerp", "career", "archive", "contact"]) {
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
      assert.equal(await page.locator(".joy-pin").evaluate((element) => getComputedStyle(element).position), "relative");
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
    for (const project of ["h-works", "fatespoiler", "moduerp"]) {
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
