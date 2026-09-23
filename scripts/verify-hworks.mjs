import assert from 'node:assert/strict';

// Shared by the full browser suite. Samples native scroll, never a debug override.
export async function verifyHWorks(page, viewport, reduced, capture = async () => {}) {
  const scene = page.locator('#h-works');
  const mobile = viewport.width < 900;
  const enhanced = !reduced && viewport.height >= 600;
  await page.waitForFunction(() => document.querySelector('#h-works').dataset.enhanced !== undefined);
  assert.equal(await scene.getAttribute('data-enhanced'), String(enhanced), 'H-Works fits the requested viewport');
  const geometry = await scene.evaluate(el => ({
    start: el.getBoundingClientRect().top + scrollY - 72,
    travel: innerWidth < 900 ? innerHeight * 1.6 : el.offsetHeight - (innerHeight - 72),
  }));
  const jump = async p => {
    await page.evaluate(y => scrollTo({ top: y, behavior: 'instant' }), geometry.start + geometry.travel * p);
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  };
  if (enhanced) {
    const samples = [];
    for (const p of [0, .15, .24, .42, .52, .64, .76, .925, 1, .42, 0]) {
      await jump(p);
      samples.push(await scene.evaluate(el => ({
        title: getComputedStyle(el.querySelector('.hworks-giant')).transform,
        slit: Number(el.style.getPropertyValue('--hw-slit')),
        dock: Number(el.style.getPropertyValue('--hw-dock')),
        exit: Number(el.style.getPropertyValue('--hw-exit')),
      })));
      await capture(page, `hworks-${viewport.width}-${p}`);
    }
    assert.ok(samples[4].slit > .8);
    if (mobile) assert.ok(samples[6].dock > .4 && samples[6].dock < .5, 'mobile .76 is inside the .64–.9 docking phase');
    else assert.equal(samples[6].dock, 1, 'desktop docks completely by .72');
    assert.deepEqual(samples[3], samples[9], 'reverse scroll restores exact composition');
    assert.deepEqual(samples[0], samples[10]);
    assert.notEqual(samples[0].title, samples[1].title, 'large title actually grows');
    if (!mobile) {
      assert.equal(samples[8].exit, 1, 'curtain hands off to next project');
      await jump(.1);
      assert.equal(await page.locator('.hworks-links').evaluate(el => el.inert), true);
      assert.equal(await page.locator('.hworks-links a').first().isVisible(), false);
      // Clicking the arrow child must behave exactly like clicking the button text.
      await page.locator('.hworks-read-gate span').dispatchEvent('click');
      assert.equal(await scene.getAttribute('data-readable'), 'true');
      await page.evaluate(() => document.activeElement?.blur());
      await jump(.1);
      // A visible focus entry hands focus to the real detail link in its reading phase.
      await page.locator('.hworks-read-gate').focus();
      assert.equal(await page.evaluate(() => document.activeElement?.getAttribute('href')), '/projects/h-works');
      assert.equal(await scene.getAttribute('data-readable'), 'true');
      const box = await page.locator('.hworks-reading').boundingBox();
      assert.ok(box.y >= 72 && box.y + box.height <= viewport.height, 'all contribution content fits');
    }
  } else {
    assert.equal(await page.locator('.hworks-pin').evaluate(el => getComputedStyle(el).position), 'static');
    assert.equal(await page.locator('.hworks-giant').isVisible(), false);
  }
  for (const selector of ['.case-read-link', '.showcase-service']) {
    const link = scene.locator(selector);
    await link.focus();
    assert.equal(await link.evaluate(el => {
      const r = el.getBoundingClientRect();
      return el.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2));
    }), true, 'focused real link is visible and unobscured');
  }
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
}
