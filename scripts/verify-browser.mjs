import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { projectEntries } from "../src/data/portfolio.ts";

// Install with `npm exec --package=playwright -- playwright --version`, or set
// PLAYWRIGHT_MODULE to an already installed Playwright package directory.
const require = createRequire(import.meta.url);
const output = process.env.PORTFOLIO_ARTIFACTS || "artifacts/motion-restoration/browser";
const url = process.env.PORTFOLIO_URL || "http://127.0.0.1:3000";
await mkdir(output, { recursive: true });
const results = [];
const projects = projectEntries.map(({ project }) => project);
let browser;

async function capture(page, name) {
  // CI can omit diagnostic screenshots; all behavioral assertions still run.
  if (process.env.PORTFOLIO_SCREENSHOTS === "0") return;
  await page.screenshot({ path: join(output, `${name}.png`), fullPage: false });
}

async function checkPage(page, name) {
  const metrics = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth - innerWidth,
    headings: document.querySelectorAll("h1").length,
    brokenImages: [...document.images].filter((image) => image.complete && !image.naturalWidth).length,
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
    console.log(`${name}: hero debug ${progress}`);
    await page.evaluate((p) => history.replaceState(null, "", `?p=${p}`), progress);
    await page.waitForFunction((p) => Math.abs(Number(document.documentElement.style.getPropertyValue("--p")) - p) < 0.00005, progress);
    const state = await page.evaluate(() => ({
      curtainOpen: Number(document.documentElement.style.getPropertyValue("--curtain-open")),
      doorOpen: Number(document.documentElement.style.getPropertyValue("--css1-door-open")),
      reveal: Number(document.documentElement.style.getPropertyValue("--css1-reveal-opacity")),
      splitX: ["left", "right"].map((side) => parseFloat(document.documentElement.style.getPropertyValue(`--css1-text-${side}-x`))),
      doorX: ["::before", "::after"].map((pseudo) => new DOMMatrixReadOnly(getComputedStyle(document.querySelector('[data-stack="CSS1"]'), pseudo).transform).m41),
      doorWidths: ["::before", "::after"].map((pseudo) => parseFloat(getComputedStyle(document.querySelector('[data-stack="CSS1"]'), pseudo).width)),
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
        assert.ok(Math.abs(state.doorX[index] - direction * state.doorOpen * state.doorWidths[index] * 1.02) < 0.15);
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

  // Native scrolling must reverse every scene, including after entering the work section.
  await page.evaluate(() => history.replaceState(null, "", location.pathname));
  for (const progress of [0.34, 0.78, 1, 0.78, 0.34, 0]) {
    console.log(`${name}: hero native ${progress}`);
    await page.evaluate((p) => {
      const stage = document.querySelector(".joy-stage");
      scrollTo(0, stage.getBoundingClientRect().top + scrollY + (stage.getBoundingClientRect().height - innerHeight) * p);
    }, progress);
    await page.waitForFunction((p) => Math.abs(Number(document.documentElement.style.getPropertyValue("--p")) - p) < 0.001, progress);
    results.push({ name: `${name}-hero-native-scroll-${progress}`, progress });
  }
  await capture(page, `${name}-hero-reversed`);
}

async function assertSelected(page, id) {
  await page.waitForFunction((id) => document.getElementById(`${id}-tab`)?.getAttribute("aria-selected") === "true", id);
  assert.equal(await page.locator(".stage-panel:visible").count(), 1);
  assert.equal(await page.locator(`#${id}`).isVisible(), true);
  assert.equal(await page.locator(`#${id}-tab`).getAttribute("data-position"), "0");
  assert.equal(await page.locator(`.stage-index a[href="#${id}"]`).getAttribute("aria-current"), "true");
}

async function checkSelection(page, name, reduced) {
  assert.equal(await page.locator(".stage-card").count(), 9);
  assert.equal(await page.locator(".stage-index a").count(), 9);
  assert.equal(await page.locator(".stage-panel").count(), 9);
  let cardSize;
  for (const project of projects) {
    await page.locator(`.stage-index a[href="#${project.id}"]`).click();
    await assertSelected(page, project.id);
    await page.locator(".stage").scrollIntoViewIfNeeded();
    await page.waitForTimeout(800);
    assert.equal(await page.locator(".stage-card:visible").count(), reduced ? 1 : (page.viewportSize().width <= 780 ? 2 : 3));
    assert.equal(await page.locator('.stage-card[data-distant="true"]:visible').count(), 0);
    const size = await page.locator(`#${project.id}-tab`).evaluate((card) => {
      const style = getComputedStyle(card);
      return { width: card.offsetWidth, height: card.offsetHeight, fontSize: getComputedStyle(card.querySelector(".stage-card-name")).fontSize, fontFamily: style.fontFamily };
    });
    if (cardSize) assert.deepEqual(size, cardSize, `${name}: equal card dimensions and type hierarchy`);
    cardSize = size;
    await checkPage(page, `${name}-${project.id}-stage`);
    if (["h-works", "eng-spark", "onbooth"].includes(project.id)) await capture(page, `${name}-${project.id}-stage`);
    await page.locator(`#${project.id}`).scrollIntoViewIfNeeded();
    const image = page.locator(`#${project.id} img`);
    if (await image.count()) {
      await image.scrollIntoViewIfNeeded();
      await image.evaluate((element) => element.decode());
      assert.ok(await image.evaluate((element) => element.naturalWidth > 0));
    }
    const detail = page.locator(`#${project.id} .case-read-link`);
    assert.equal(await detail.getAttribute("href"), `/projects/${project.id}`);
    await detail.focus();
    await page.waitForFunction(id => {
      const link = document.querySelector(`#${id} .case-read-link`), rect = link.getBoundingClientRect();
      return link.contains(document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2));
    }, project.id).catch(async (error) => {
      const state = await detail.evaluate(element => {
        const rect = element.getBoundingClientRect();
        return { scrollY, rect: rect.toJSON(), active: document.activeElement?.outerHTML.slice(0, 240), hit: document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2)?.outerHTML.slice(0, 240), scene: document.querySelector(".t2")?.dataset };
      });
      throw new Error(`${name}: ${project.id} focused link obscured: ${JSON.stringify(state)}`, { cause: error });
    });
    assert.equal(await detail.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return element.contains(document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2));
    }), true, `${name}: ${project.id} detail link is unobscured on focus`);
    await checkPage(page, `${name}-${project.id}-panel`);
    await capture(page, `${name}-${project.id}-panel`);
    // Return through visible navigation, rather than auto-scrolling a click into an inert pin.
    await page.locator('.site-header a[href="#work"]').click();
  }
  await page.locator('.stage-index a[href="#h-works"]').click();
  await page.locator("#h-works-tab").focus();
  for (const [key, id] of [["ArrowRight", "fatespoiler"], ["End", "onbooth"], ["ArrowRight", "h-works"], ["ArrowLeft", "onbooth"], ["Home", "h-works"]]) {
    await page.keyboard.press(key);
    await assertSelected(page, id);
    await page.waitForFunction((id) => document.activeElement.id === `${id}-tab`, id);
  }
  await page.locator('.stage-index a[href="#h-works"]').focus();
  await page.keyboard.press("ArrowLeft");
  await assertSelected(page, "onbooth");
  assert.equal(await page.evaluate(() => document.activeElement.getAttribute("href")), "#onbooth");
  await page.keyboard.press("ArrowRight");
  await assertSelected(page, "h-works");

  await page.getByRole("button", { name: "이전 프로젝트 선택", exact: true }).click();
  await assertSelected(page, "onbooth");
  await page.getByRole("button", { name: "다음 프로젝트 선택", exact: true }).click();
  await assertSelected(page, "h-works");
  await page.locator(".stage").scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);
  const box = await page.locator(".stage").boundingBox();
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  if (name.includes("mobile")) {
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: cx + 65, y: cy }] });
    for (let step = 1; step <= 8; step++) {
      await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: cx + 65 - step * 16, y: cy }] });
    }
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await cdp.detach();
  } else {
    await page.mouse.move(cx + 65, cy);
    await page.mouse.down();
    await page.mouse.move(cx - 65, cy, { steps: 8 });
    await page.mouse.up();
  }
  await assertSelected(page, "fatespoiler");
  results.push({ name: `${name}-selection`, projects: 9, keyboard: true, swipe: true });
}

async function checkAnchorsAndDetails(page, name) {
  for (const entry of projectEntries) {
    const { project } = entry;
    const anchors = [project.id, ...(entry.kind === "archive" ? [`archive-${project.id}`] : [])];
    for (const anchor of anchors) {
      await page.goto(`${url}/#${anchor}`, { waitUntil: "networkidle" });
      await assertSelected(page, project.id);
      await page.waitForFunction((id) => {
        const target = document.getElementById(id);
        const rect = (target.querySelector(".case-meta") || target).getBoundingClientRect();
        const header = document.querySelector(".site-header").getBoundingClientRect();
        return rect.top >= header.bottom - 1 && rect.top < innerHeight;
      }, project.id);
    }
    await page.locator(`#${project.id} .case-read-link`).click();
    await page.waitForURL(`**/projects/${project.id}`);
    assert.equal(await page.locator("h1").textContent(), project.name);
    const image = page.locator(".detail-shot img");
    if (await image.count()) {
      await image.scrollIntoViewIfNeeded();
      await image.evaluate((element) => element.decode());
    }
    await checkPage(page, `${name}-detail-${project.id}`);
    await capture(page, `${name}-detail-${project.id}`);
    await page.locator(".detail-return a").first().click();
    await page.waitForURL(`**/#${project.id}`);
    await assertSelected(page, project.id);
  }
  await page.goto(`${url}/#archive`, { waitUntil: "networkidle" });
  await page.waitForFunction(() => {
    const rect = document.querySelector("#archive").getBoundingClientRect();
    // ScrollTrigger rounds its endpoint to an integer scroll offset; the
    // zero-height anchor can land a fraction of a CSS pixel above zero.
    return rect.top >= -1 && rect.top < innerHeight
      && document.querySelector(".stage-panel:not([hidden])")?.id === "eng-spark"
      && document.querySelector(".t2").dataset.ready === "true";
  });
  // Changing an old alias after hydration also selects the corresponding panel.
  await page.evaluate(() => { location.hash = "archive-myro"; });
  await assertSelected(page, "myro");
  await page.evaluate(() => { location.hash = "eng-spark"; });
  await assertSelected(page, "eng-spark");
  await page.goBack();
  await assertSelected(page, "myro");
  results.push({ name: `${name}-anchors-and-details`, routes: 9, aliases: 6, historyBack: true });
}

try {
  const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
  browser = await chromium.launch({ ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : { channel: process.env.BROWSER_CHANNEL || "chrome" }), headless: true });
  for (const config of [
    { name: "desktop", viewport: { width: 1440, height: 1100 }, reducedMotion: "no-preference" },
    { name: "laptop", viewport: { width: 1366, height: 768 }, reducedMotion: "no-preference" },
    { name: "short-laptop", viewport: { width: 1366, height: 700 }, reducedMotion: "no-preference" },
    { name: "tablet", viewport: { width: 820, height: 1180 }, reducedMotion: "no-preference" },
    { name: "mobile", viewport: { width: 390, height: 844 }, reducedMotion: "no-preference", isMobile: true, hasTouch: true },
    { name: "small-mobile", viewport: { width: 320, height: 740 }, reducedMotion: "no-preference", isMobile: true, hasTouch: true },
    { name: "reduced-motion", viewport: { width: 1440, height: 1100 }, reducedMotion: "reduce" },
  ].filter(config => !process.env.PORTFOLIO_VIEWPORTS || process.env.PORTFOLIO_VIEWPORTS.split(",").includes(config.name))) {
    const { name, ...options } = config;
    console.log(`Checking ${name}`);
    const page = await browser.newPage(options);
    page.setDefaultTimeout(20000);
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("response", (response) => { if (response.status() >= 400) console.error(`HTTP ${response.status()} ${response.url()}`); });
    page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
    await page.goto(url, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await checkPage(page, name);
    await capture(page, `${name}-hero`);
    await checkHero(page, name);
    await page.evaluate(() => { location.hash = "work"; });
    await page.waitForTimeout(700);
    await capture(page, `${name}-work-intro`);
    await checkSelection(page, name, options.reducedMotion === "reduce");
    for (const id of ["career", "education", "contact"]) {
      await page.locator(`#${id}`).scrollIntoViewIfNeeded();
      await checkPage(page, `${name}-${id}`);
      await capture(page, `${name}-${id}`);
    }
    // Reverse from below the entire collection back into the original hero.
    await page.evaluate(() => scrollTo(0, 0));
    await page.waitForFunction(() => Number(document.documentElement.style.getPropertyValue("--p")) < 0.001);
    await page.goto(url, { waitUntil: "networkidle" });
    await page.keyboard.press("Tab");
    assert.equal(await page.evaluate(() => document.activeElement.className), "skip-link");
    await page.keyboard.press("Enter");
    assert.ok(page.url().endsWith("#work"));
    if (["desktop", "mobile"].includes(name)) await checkAnchorsAndDetails(page, name);
    assert.deepEqual(errors, [], `${name}: console errors`);
    results.push({ name: `${name}-errors`, errors });
    await page.close();
  }

  const page = await browser.newPage({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  await page.goto(url);
  assert.equal(await page.locator(".stage-panel:visible").count(), 9);
  for (const project of projects) {
    await page.locator(`.stage-index a[href="#${project.id}"]`).click();
    assert.equal(await page.locator(`#${project.id}`).isVisible(), true);
    const image = page.locator(`#${project.id} img`);
    if (await image.count()) {
      await image.scrollIntoViewIfNeeded();
      await image.evaluate((element) => element.decode());
    }
    assert.equal(await page.locator(`#${project.id} .case-read-link`).getAttribute("href"), `/projects/${project.id}`);
    await checkPage(page, `no-javascript-${project.id}`);
  }
  await capture(page, "no-javascript-project");
  await page.close();
  await writeFile(join(output, "results.json"), JSON.stringify({ status: "passed", results }, null, 2));
  console.log(`Browser checks passed. Screenshots: ${output}`);
} catch (error) {
  await writeFile(join(output, "results.json"), JSON.stringify({ status: "failed", error: error.message, results }, null, 2));
  console.error(error.stack);
  process.exitCode = 1;
} finally {
  await browser?.close();
}
