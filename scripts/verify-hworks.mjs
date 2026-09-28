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
    travel: innerWidth < 900 ? parseFloat(getComputedStyle(el.querySelector(".hworks-reading")).marginTop) : el.offsetHeight - el.querySelector(".hworks-pin").offsetHeight,
  }));
  const jump = async p => {
    await page.evaluate(y => scrollTo({ top: y, behavior: 'instant' }), geometry.start + geometry.travel * p);
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  };
  if (enhanced) {
    assert.equal(await scene.locator('h3').count(), 1);
    assert.equal(await scene.locator('.hworks-giant, .hworks-handoff, .hworks-curtain').count(), 0);
    const samples = [];
    for (const p of [0, .15, .24, .42, .52, .64, .76, .925, 1, .42, 0]) {
      await jump(p);
      samples.push(await scene.evaluate(el => {
        const title = el.querySelector('#h-works-title');
        const style = getComputedStyle(title);
        const box = title.getBoundingClientRect();
        return {
          title: style.transform,
          scale: new DOMMatrixReadOnly(style.transform).m11,
          x: box.x, y: box.y, width: box.width,
          opacity: Number(style.opacity), clip: style.clipPath,
          color: Number(el.style.getPropertyValue('--hw-color')),
          dock: Number(el.style.getPropertyValue('--hw-dock')),
          domains: [...el.querySelectorAll('.hworks-domain')].map(item => ({
            opacity: getComputedStyle(item).opacity, transform: getComputedStyle(item).transform,
          })),
        };
      }));
      await capture(page, `hworks-${viewport.width}-${p}`);
    }
    assert.ok(samples[4].color > .8);
    if (mobile) assert.ok(samples[6].dock > .4 && samples[6].dock < .5, 'mobile .76 is inside the .64–.9 role docking phase');
    else assert.equal(samples[6].dock, 1, 'desktop roles dock completely by .72');
    assert.deepEqual(samples[3], samples[9], 'reverse scroll restores exact composition');
    assert.deepEqual(samples[0], samples[10]);
    assert.ok(samples[0].width > viewport.width * .8, 'opening title is oversized');
    assert.ok(Math.abs(samples[0].x + samples[0].width / 2 - viewport.width / 2) < 1, 'opening title is centered');
    for (let i = 1; i <= 8; i++) {
      assert.ok(samples[i].scale <= samples[i - 1].scale, 'single title shrinks monotonically');
      assert.equal(samples[i].opacity, 1, 'title remains present');
      assert.equal(samples[i].clip, 'none', 'title is never sliced');
    }
    assert.ok(Math.abs(samples[3].scale - (mobile ? .56 : .28)) < .001, 'title reaches its side dock before roles assemble');
    const gutter = await scene.evaluate(el => parseFloat(getComputedStyle(el.querySelector('.hworks-surface')).paddingLeft));
    assert.ok(Math.abs(samples[3].x - gutter) < 1, 'title docks to the left gutter');
    assert.notDeepEqual(samples[3].domains, samples[6].domains, 'role text still stages and rearranges');
    await jump(mobile ? .64 : .52);
    const assembled = await scene.evaluate(el => ({
      categoryBottom: el.querySelector('.hworks-heading p').getBoundingClientRect().bottom,
      rolesTop: el.querySelector('.hworks-domains').getBoundingClientRect().top,
      captionBottom: el.querySelector('.hworks-domains figcaption').getBoundingClientRect().bottom,
      pinBottom: el.querySelector('.hworks-pin').getBoundingClientRect().bottom,
    }));
    assert.ok(assembled.categoryBottom <= assembled.rolesTop, 'assembled roles clear title at short tablet sizes');
    if (!mobile) assert.ok(assembled.captionBottom <= assembled.pinBottom, 'full-size domain composition fits short laptops');
    await jump(mobile ? .9 : .76);
    const composition = await scene.evaluate(el => {
      const title = el.querySelector('h3').getBoundingClientRect();
      const category = el.querySelector('.hworks-heading p').getBoundingClientRect();
      const roles = el.querySelector('.hworks-domains').getBoundingClientRect();
      const copy = el.querySelector('.hworks-reading').getBoundingClientRect();
      return { titleBottom: title.bottom, categoryTop: category.top, categoryBottom: category.bottom, rolesTop: roles.top, rolesRight: roles.right, copyLeft: copy.left };
    });
    assert.ok(composition.titleBottom <= composition.categoryTop, 'category clears the intact title');
    assert.ok(composition.categoryBottom <= composition.rolesTop, 'roles clear the docked heading');
    if (!mobile) {
      assert.ok(composition.rolesRight < composition.copyLeft, 'roles and contributions stay in separate columns');
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
    assert.equal(await scene.locator('#h-works-title').isVisible(), true);
    assert.equal(await scene.locator('#h-works-title').evaluate(el => getComputedStyle(el).transform), 'none');
  }
  // The existing next article, including its real content and links, rises from
  // below while H-Works leaves with the same document-flow boundary.
  const handoffStart = await scene.evaluate(el => el.getBoundingClientRect().bottom + scrollY - innerHeight);
  const boundary = [];
  for (const fraction of [.2, .7, .2]) {
    await page.evaluate(y => scrollTo({ top: y, behavior: 'instant' }), handoffStart + (viewport.height - 72) * fraction);
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    boundary.push(await page.evaluate(() => {
      const current = document.querySelector('#h-works').getBoundingClientRect();
      const next = document.querySelector('#fatespoiler');
      const box = next.getBoundingClientRect();
      return {
        bottom: current.bottom, nextTop: box.top,
        hit: document.elementFromPoint(innerWidth / 2, box.top + 10)?.closest('article')?.id,
        headings: document.querySelectorAll('#fatespoiler-title').length,
        link: next.querySelector('.case-read-link').getAttribute('href'),
      };
    }));
    await capture(page, `hworks-handoff-${viewport.width}-${fraction}`);
  }
  assert.ok(boundary[1].nextTop < boundary[0].nextTop, 'actual next project pushes up from below');
  for (const sample of boundary) {
    assert.ok(Math.abs(sample.bottom - sample.nextTop) < 1, 'native boundary stays joined without a curtain or blank gap');
    assert.equal(sample.hit, 'fatespoiler');
    assert.equal(sample.headings, 1);
    assert.equal(sample.link, '/projects/fatespoiler');
  }
  assert.deepEqual(boundary[0], boundary[2], 'handoff reverses with native scrolling');
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
