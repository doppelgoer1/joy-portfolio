import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

// Uses the same external Playwright installation as the existing browser checks.
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.PORTFOLIO_URL || 'http://127.0.0.1:4390';
const output = process.env.PORTFOLIO_ARTIFACTS || '/tmp/joy585-artifacts/lower-motion';
await mkdir(output, { recursive: true });
const results = [];
const failures = [];
const targets = [
  '.section-intro .eyebrow', '.intro-heading h2', '.intro-heading > p',
  '.stage-index nav a', '.stage', '.stage-controls',
  '.stage-panel:not([hidden]) .case-meta', '.stage-panel:not([hidden]) .case-heading h3',
  '.stage-panel:not([hidden]) .case-content h4', '.stage-panel:not([hidden]) .case-summary',
  '.stage-panel:not([hidden]) .case-body > :last-child', '.stage-panel:not([hidden]) .case-read-link',
  '.stage-panel:not([hidden]) .archive-shot img', '.career-index', '.career-company h3',
  '.education', '.contact-section > p.eyebrow', '.contact-section h2', '.contact-bottom', '.footer-line',
];
const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome', headless: true });

async function check(name, run) {
  try { const evidence = await run(); results.push({ name, status: 'PASS', evidence }); console.log(`PASS ${name}: ${JSON.stringify(evidence)}`); }
  catch (error) { failures.push({ name, error: error.message }); console.error(`FAIL ${name}: ${error.message}`); }
}
async function settle(page, y) {
  if (y !== undefined) await page.evaluate(y => scrollTo(0, y), y);
  // Browser-frame callbacks are disabled with JavaScript off; wait through the driver.
  await page.waitForTimeout(150);
}
async function layout(page, selector) {
  return page.locator(selector).first().evaluate(e => {
    let top = 0;
    for (let n = e; n; n = n.offsetParent) top += n.offsetTop;
    return { top, height: e.offsetHeight, viewport: innerHeight };
  });
}
async function sample(page) {
  return page.evaluate(selectors => {
    const values = [];
    function add(e, selector, pseudo) {
      const s = getComputedStyle(e, pseudo), m = new DOMMatrixReadOnly(s.transform);
      values.push({ selector, pseudo, opacity: Number(s.opacity), matrix: Array.from(m.toFloat64Array()), animation: s.animationName, range: s.animationRange, color: s.color });
    }
    for (const selector of selectors) for (const e of document.querySelectorAll(selector)) add(e, selector);
    for (const e of document.querySelectorAll('.career-list li')) add(e, '.career-list li', '::after');
    add(document.querySelector('.stage'), '.stage', '::before');
    return values;
  }, targets);
}
async function glide(page, y, duration = 1000) {
  await page.evaluate(({ y, duration }) => new Promise(resolve => {
    const start = performance.now(), from = scrollY;
    function tick(now) {
      const p = Math.min((now - start) / duration, 1);
      scrollTo(0, from + (y - from) * p);
      if (p < 1) requestAnimationFrame(tick); else resolve();
    }
    requestAnimationFrame(tick);
  }), { y, duration });
  await settle(page);
}
function sameState(a, b, name) {
  assert.equal(a.length, b.length, `${name} sample count`);
  a.forEach((v, i) => {
    assert.ok(Math.abs(v.opacity - b[i].opacity) <= .01, `${name} ${v.selector} opacity ${v.opacity}/${b[i].opacity}`);
    v.matrix.forEach((n, j) => assert.ok(Math.abs(n - b[i].matrix[j]) <= .5, `${name} ${v.selector} matrix[${j}]`));
  });
}
async function newPage(viewport, extra = {}) {
  const context = await browser.newContext({ viewport, ...(viewport.width <= 600 ? {isMobile: true, hasTouch: true} : {}), ...extra });
  const page = await context.newPage();
  if (extra.recordVideo) {
    // Match Chrome's capture surface to the emulated viewport; window limits can pad recordings.
    const capture = await context.newCDPSession(page);
    await capture.send('Emulation.setVisibleSize', viewport);
    await capture.detach();
  }
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1100); // Let the existing selection entrance finish.
  return { context, page, errors };
}

async function verifyTimelineSources(page, name, id) {
  await check(`${name} R-2 ${id} document scrollers`, async () => {
    const animations = await page.evaluate(() => document.getAnimations()
      .filter(a => a.timeline instanceof ScrollTimeline)
      .map(a => ({
        animation: a.animationName,
        target: `${a.effect.target.tagName}.${a.effect.target.className}${a.effect.pseudoElement || ''}`,
        source: a.timeline.source === document.documentElement ? 'document' : a.timeline.source?.className,
      })));
    assert.ok(animations.length > 0, 'No scroll-driven animations inspected');
    assert.deepEqual(animations.filter(a => a.source !== 'document'), [], JSON.stringify(animations));
    return animations;
  });
}

async function verifyArchiveMotion(page, viewport, errors) {
  const name = `${viewport.width}x${viewport.height}`;
  const ids = await page.locator('.stage-panel:has(.archive-shot img)').evaluateAll(es => es.map(e => e.id));
  await check(`${name} A-5 six archive panels`, async () => { assert.equal(ids.length, 6); return ids; });
  for (const id of ids) {
    await page.locator(`.stage-index a[href="#${id}"]`).click();
    await page.mouse.move(0, 0);
    await page.waitForTimeout(1100);
    const shot = page.locator(`#${id} .archive-shot`);
    await shot.locator('img').scrollIntoViewIfNeeded();
    await shot.locator('img').evaluate(e => e.decode());
    await verifyTimelineSources(page, name, id);
    await check(`${name} A-5 ${id} parallax progress and coverage`, async () => {
      const { top, height, viewport: h } = await layout(page, `#${id} .archive-shot`);
      const records = [];
      const forwardStates = new Map();
      for (const direction of ['forward', 'reverse']) {
        await settle(page, direction === 'forward' ? top - h - 100 : 1e9);
        for (const cover of direction === 'forward' ? [0, 25, 50, 75, 100] : [100, 75, 50, 25, 0]) {
          await settle(page, top - h + (h + height) * cover / 100);
          const value = await shot.evaluate(e => {
            const img = e.querySelector('img'), animation = img.getAnimations()[0];
            const style = getComputedStyle(img), matrix = new DOMMatrixReadOnly(style.transform);
            const rect = e.getBoundingClientRect(), imageRect = img.getBoundingClientRect();
            return {
              scrollY, progress: animation?.currentTime?.value,
              source: animation?.timeline?.source === document.documentElement ? 'document' : animation?.timeline?.source?.className,
              imageHeight: parseFloat(style.height), translateY: matrix.m42,
              translatePercent: matrix.m42 / parseFloat(style.height) * 100,
              scale: matrix.m22,
              topGap: imageRect.top - (rect.top + e.clientTop),
              bottomGap: e.querySelector('.archive-shot-bar').getBoundingClientRect().top - imageRect.bottom,
              overflow: document.documentElement.scrollWidth - innerWidth,
            };
          });
          records.push({ direction, cover, ...value });
          const state = await sample(page);
          if (direction === 'forward') forwardStates.set(cover, state);
          else sameState(forwardStates.get(cover), state, `${id} cover ${cover} reverse`);
          if (direction === 'forward' && cover === 50) {
            await page.waitForTimeout(350);
            sameState(state, await sample(page), `${id} stopped scrub`);
          }
        }
      }
      // Persist measurements even when an assertion below catches a regression.
      await writeFile(join(output, `${name}-${id}-parallax.json`), JSON.stringify(records, null, 2));
      const shift = viewport.width <= 999 ? 2 : 3;
      for (const record of records) {
        const detail = JSON.stringify(record);
        assert.equal(record.source, 'document', detail);
        assert.ok(Math.abs(record.progress - record.cover) <= 3, detail);
        assert.ok(Math.abs(record.translatePercent - shift * (record.cover / 50 - 1)) <= .1, detail);
        if (record.cover === 0 || record.cover === 100) {
          assert.ok(record.topGap <= 0, detail);
          assert.ok(record.bottomGap <= 0, detail);
        }
        assert.equal(record.overflow, 0, detail);
      }
      assert.deepEqual(errors, []);
      return records;
    });
  }
}
try {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    const name = `${viewport.width}x${viewport.height}`;
    if (process.env.MOTION_ONLY_ARCHIVE === '1') {
      const { context, page, errors } = await newPage(viewport);
      await verifyArchiveMotion(page, viewport, errors);
      await context.close();
      continue;
    }
    if (process.env.MOTION_ONLY_PERF !== '1') {
    if (process.env.MOTION_ONLY_STATIC !== '1') {
    const states = new Map();
    const coordinates = [];
    for (const direction of ['forward', 'reverse']) {
      const { context, page, errors } = await newPage(viewport, { recordVideo: { dir: output, size: viewport } });
      const video = page.video();
      if (direction === 'forward') {
        for (const [scene, selector, kind, progress] of [
          ['S1', '.intro-heading h2', 'entry', .35],
          ['S2', '.stage', 'entry', .325],
          ['S3', '.stage-panel:not([hidden]) .case-body > :last-child', 'cover', .5],
          ['S4', '.career-list li:nth-child(2)', 'cover', .29],
          ['S5-half', '.contact-section', 'cover', .15],
        ]) {
          const { top, height, viewport: h } = await layout(page, selector);
          coordinates.push({ scene, y: Math.round(top - h + (kind === 'entry' ? Math.min(h, height) : h + height) * progress) });
        }
        coordinates.push({ scene: 'S5-end', y: await page.evaluate(() => document.documentElement.scrollHeight - innerHeight) });
        coordinates.sort((a,b) => a.y-b.y);
        const hero = await layout(page, '.joy-stage');
        await settle(page, hero.height - viewport.height - 300);
      } else await settle(page, 1e9);
      for (const { scene, y } of direction === 'forward' ? coordinates : [...coordinates].reverse()) {
        await glide(page, y, 1200);
        const state = await sample(page);
        if (direction === 'forward') {
          states.set(scene, state);
          await page.screenshot({ path: join(output, `${name}-${scene}.png`) });
          await page.waitForTimeout(350);
          const stopped = await sample(page);
          await check(`${name} ${scene} stopped scrub`, async () => { sameState(state, stopped, scene); return { y }; });
        } else await check(`${name} A-2 ${scene} reverse`, async () => { sameState(states.get(scene), state, scene); return { y }; });
        await check(`${name} A-9 ${scene} ${direction}`, async () => {
          const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
          assert.ok(overflow <= 1); assert.deepEqual(errors, []); return { overflow, errors };
        });
      }
      if (direction === 'reverse') {
        const hero = await layout(page, '.joy-stage');
        await glide(page, hero.height - viewport.height - 300, 1200);
      }
      await context.close();
      await video.saveAs(join(output, `${name}-${direction}.webm`));
    }

    if (process.env.MOTION_ONLY_VIDEO === '1') continue;

    const { context, page, errors } = await newPage(viewport);
    await check(`${name} A-3 finale complete`, async () => {
      await settle(page, 1e9);
      const values = (await sample(page)).filter(v => ['.contact-section h2', '.contact-bottom', '.footer-line'].includes(v.selector));
      for (const v of values) { assert.equal(v.opacity, 1); assert.deepEqual(v.matrix, [1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]); }
      return values;
    });
    for (const rowNumber of [1, 2, 3]) {
      await check(`${name} A-4 row ${rowNumber} progress`, async () => {
        const row = `.career-list li:nth-child(${rowNumber})`;
        const { top } = await layout(page, row);
        const values = [];
        // Approach both endpoints from each direction in the approved reading band.
        await settle(page, top - viewport.height);
        for (const direction of ['forward', 'reverse']) {
          if (direction === 'reverse') await settle(page, top - viewport.height * .3);
          for (const fraction of direction === 'forward' ? [.85, .4] : [.4, .85]) {
            await settle(page, top - viewport.height * fraction);
            const value = await page.locator(row).evaluate(e => {
              const style = getComputedStyle(e);
              const color = getComputedStyle(e.querySelector('.career-index')).color;
              const canvas = document.createElement('canvas').getContext('2d');
              function rgb(color) {
                canvas.clearRect(0, 0, 1, 1);
                canvas.fillStyle = color;
                canvas.fillRect(0, 0, 1, 1);
                return [...canvas.getImageData(0, 0, 1, 1).data].slice(0, 3);
              }
              return {
                fill: new DOMMatrixReadOnly(getComputedStyle(e, '::after').transform).m22,
                opacity: Number(getComputedStyle(e.querySelector('.career-company h3')).opacity),
                color, rgb: rgb(color),
                muted: rgb(style.getPropertyValue('--muted')),
                accent: rgb(style.getPropertyValue('--accent')),
              };
            });
            const end = fraction === .4;
            assert.ok(Math.abs(value.fill - (end ? 1 : 0)) <= .05, JSON.stringify(value));
            assert.ok(Math.abs(value.opacity - (end ? 1 : .45)) <= .03, JSON.stringify(value));
            const expectedColor = end ? value.accent : value.muted;
            value.rgb.forEach((channel, i) => assert.ok(Math.abs(channel - expectedColor[i]) <= 5, JSON.stringify(value)));
            if (direction === 'reverse') {
              const forward = values.find(v => v.fraction === fraction);
              assert.ok(Math.abs(forward.fill - value.fill) <= .05);
              assert.ok(Math.abs(forward.opacity - value.opacity) <= .01);
              assert.equal(forward.color, value.color);
            }
            values.push({ direction, fraction, ...value });
          }
        }
        return values;
      });
    }
    await check(`${name} A-9 career track unclipped`, async () => {
      const row = '.career-list li:nth-child(2)';
      const { top } = await layout(page, row);
      await settle(page, top - viewport.height * .5);
      const line = await page.locator(row).evaluate(e => {
        const r = e.getBoundingClientRect(), s = getComputedStyle(e, '::after');
        const x = parseFloat(s.left), width = parseFloat(s.width);
        const left = r.left + x, right = left + width;
        const top = r.top + parseFloat(s.top), bottom = top + parseFloat(s.height);
        const ancestors = [];
        for (let n = e; n; n = n.parentElement) {
          const cs = getComputedStyle(n), rect = n.getBoundingClientRect();
          ancestors.push({ tag: n.tagName, className: n.className,
            clipX: ['hidden', 'clip', 'auto', 'scroll'].includes(cs.overflowX),
            clipY: ['hidden', 'clip', 'auto', 'scroll'].includes(cs.overflowY),
            left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom });
        }
        return { x, width, left, right, top, bottom, bodyX: e.querySelector(':scope > div').getBoundingClientRect().left, ancestors };
      });
      assert.ok(line.right < line.bodyX);
      assert.ok(line.left >= 0 && line.right <= viewport.width);
      for (const ancestor of line.ancestors) {
        if (ancestor.clipX) assert.ok(line.left >= ancestor.left && line.right <= ancestor.right, JSON.stringify(ancestor));
        if (ancestor.clipY) assert.ok(line.top >= ancestor.top && line.bottom <= ancestor.bottom, JSON.stringify(ancestor));
      }
      await page.screenshot({ path: join(output, `${name}-career-track.png`) });
      return line;
    });
    await check(`${name} A-5 all nine equal`, async () => {
      const ids = await page.locator('.stage-index nav a').evaluateAll(es=>es.map(e=>e.hash.slice(1)));
      assert.equal(ids.length,9); const records=[];
      for (const id of ids) {
        await page.locator(`.stage-index a[href="#${id}"]`).click();
        await page.waitForTimeout(1100);
        const record = await page.locator(`#${id}`).evaluate(e=>({id:e.id,height:e.offsetHeight,heading:getComputedStyle(e.querySelector('.case-heading h3')).animationName,column:getComputedStyle(e.querySelector('.case-body > :last-child')).animationName,range:getComputedStyle(e.querySelector('.case-body > :last-child')).animationRange,image:e.querySelector('img') ? getComputedStyle(e.querySelector('img')).animationName:null}));
        assert.equal(record.heading,'scene-rise');
        assert.equal(record.column,viewport.width>999?'scene-drift':'none');
        if(viewport.width>999)assert.ok(['cover', 'cover 0% cover 100%'].includes(record.range));
        if(record.image)assert.equal(record.image,'scene-shot');
        const img=page.locator(`#${id} img`);
        if(await img.count()) {await img.scrollIntoViewIfNeeded();await img.evaluate(e=>e.decode());assert.ok(await img.evaluate(e=>e.naturalWidth>0));}
        await verifyTimelineSources(page, name, id);
        records.push(record);
      }
      return records;
    });
    await verifyArchiveMotion(page, viewport, errors);
    await check(`${name} A-6 selection transforms`, async () => {
      await page.mouse.move(0,0);
      const values=await page.locator('.stage-card').evaluateAll(es=>es.filter(e=>e.dataset.position==='-1'||e.dataset.position==='1').map(e=>({position:e.dataset.position,ry:getComputedStyle(e).getPropertyValue('--ry').trim(),duration:getComputedStyle(e).transitionDuration})));
      for(const v of values) {assert.ok(v.duration.startsWith('0.76s'));assert.equal(Number(v.ry), (v.position==='-1'?1:-1)*(viewport.width<=600?42:36));}
      await page.locator('.stage-index a[href="#h-works"]').click();await page.locator('#h-works-tab').focus();
      for(const [key,id] of [['ArrowRight','fatespoiler'],['End','onbooth'],['Home','h-works']]) {await page.keyboard.press(key);assert.equal(await page.locator(`#${id}-tab`).getAttribute('aria-selected'),'true');}
      return values;
    });
    await check(`${name} A-7 header anchors`, async () => {
      const records=[];
      await page.locator('#work').scrollIntoViewIfNeeded();
      for(const id of ['work','career','education','contact']) {
        await page.locator(`.site-header a[href="#${id}"]`).click();
        await page.waitForFunction(id=>{const e=document.getElementById(id),target=e.getBoundingClientRect().top+scrollY-parseFloat(getComputedStyle(e).scrollMarginTop);return Math.abs(scrollY-Math.min(target,document.documentElement.scrollHeight-innerHeight))<1;},id);
        const record = await page.locator(`#${id}`).evaluate(e => {
          const r = e.getBoundingClientRect(), margin = parseFloat(getComputedStyle(e).scrollMarginTop);
          const maxScroll = document.documentElement.scrollHeight - innerHeight;
          return { id: e.id, top: r.top, bottom: r.bottom, margin, scrollY, maxScroll,
            expected: Math.min(r.top + scrollY - margin, maxScroll),
            headerBottom: document.querySelector('.site-header').getBoundingClientRect().bottom, viewport: innerHeight };
        });
        assert.ok(Math.abs(record.scrollY - record.expected) <= 1, JSON.stringify(record));
        if (id === 'contact') {
          assert.ok(record.top >= record.headerBottom, JSON.stringify(record));
          assert.ok(record.bottom <= record.viewport + 1, JSON.stringify(record));
        } else assert.ok(Math.abs(record.top - (viewport.width <= 600 ? 84 : 92)) <= 1, JSON.stringify(record));
        records.push(record);
      }
      return records;
    });
    await check(`${name} A-8 hidden panel height refresh`, async () => {
      const records=[];
      for(const id of ['h-works','onbooth']) {
        await page.locator('.stage-index').scrollIntoViewIfNeeded();
        const before=await page.evaluate(()=>scrollY);
        await page.locator(`.stage-index a[href="#${id}"]`).click();await page.waitForTimeout(1100);
        const after=await page.evaluate(()=>scrollY);
        const r=await page.locator(`#${id}`).evaluate(e=>({id:e.id,h:e.offsetHeight,opacity:getComputedStyle(e.querySelector('.case-heading h3')).opacity,progress:document.querySelector('.site-header').getAnimations({subtree:true}).map(a=>String(a.currentTime))}));
        assert.ok(Math.abs(before-after)<1);assert.equal(r.opacity,'0');records.push({...r,before,after});
      }
      assert.notEqual(records[0].h,records[1].h);return records;
    });
    await check(`${name} A-9 live resize`, async () => {
      await page.goto(`${base}/#archive-myro`, {waitUntil:'networkidle'});
      const records=[];
      for (const size of [{width:820,height:1180}, {width:390,height:844}, viewport]) {
        await page.setViewportSize(size); await page.waitForTimeout(300);
        const r=await page.evaluate(()=>({width:innerWidth,overflow:document.documentElement.scrollWidth-innerWidth,selected:document.querySelector('.stage-panel:not([hidden])').id,drift:getComputedStyle(document.querySelector('.stage-panel:not([hidden]) .case-body > :last-child')).animationName}));
        assert.ok(r.overflow<=1);assert.equal(r.selected,'myro');assert.equal(r.drift,size.width>999?'scene-drift':'none');records.push(r);
      }
      return records;
    });
    await check(`${name} A-9 errors`, async()=>{assert.deepEqual(errors,[]);return errors;});
    await context.close();

    }
    for (const mode of ['reduce','no-js','unsupported']) {
      const extra=mode==='reduce'?{reducedMotion:'reduce'}:mode==='no-js'?{javaScriptEnabled:false}:{};
      const {context:c,page:p}=await newPage(viewport,extra);
      if(mode==='unsupported') await p.evaluate(()=>{
        // Emulate a browser rejecting the feature query: remove only the two guarded blocks.
        function remove(sheet) {for(let i=sheet.cssRules.length-1;i>=0;i--){const r=sheet.cssRules[i];if(r instanceof CSSSupportsRule && r.conditionText.includes('animation-timeline'))sheet.deleteRule(i);}}
        for(const sheet of document.styleSheets)remove(sheet);
      });
      await check(`${name} ${mode==='reduce'?'A-10':mode==='no-js'?'A-11':'fallback'} ${mode}`, async()=>{
        if(mode==='no-js')assert.equal(await p.locator('.stage-panel:visible').count(),9);
        if(mode==='reduce')assert.equal(await p.locator('.stage-card:visible').count(),1);
        for(const selector of targets) {
          for(const e of await p.locator(selector).all()) {
            await e.evaluate(e => e.scrollIntoView({block:'center',behavior:'instant'}));await settle(p);
            const s=await e.evaluate(e=>{let opacity=1;for(let n=e;n;n=n.parentElement)opacity*=Number(getComputedStyle(n).opacity);return {animation:getComputedStyle(e).animationName,opacity};});
            if(mode==='reduce')assert.equal(s.animation,'none',selector);
            assert.ok(mode==='no-js' ? s.opacity>0 : s.opacity>.99,`${mode} ${selector}: ${s.opacity}`);
          }
        }
        if(mode==='reduce'){
          assert.equal(await p.locator('.site-header').evaluate(e=>getComputedStyle(e,'::after').display),'none');
          assert.deepEqual(await p.locator('.career-list li').evaluateAll(es => es.map(e => new DOMMatrixReadOnly(getComputedStyle(e, '::after').transform).m22)), [1, 1, 1]);
        }
        await p.screenshot({path:join(output,`${name}-${mode}.png`)});return {readable:true};
      });
      await c.close();
    }
    }
    if (process.env.MOTION_SKIP_PERF === '1') continue;
    const {context:pc,page:pp}=await newPage(viewport);
    await check(`${name} A-12 performance ten seconds`,async()=>{
      await pp.locator('.stage-index a[href="#onbooth"]').click();
      await pp.locator('#onbooth img').scrollIntoViewIfNeeded();await pp.locator('#onbooth img').evaluate(e=>e.decode());
      await pp.locator('.stage-index a[href="#h-works"]').click();await pp.waitForTimeout(1300);
      const start=(await layout(pp,'.joy-stage')).height-viewport.height;
      const end=await pp.evaluate(()=>document.documentElement.scrollHeight-innerHeight);
      await settle(pp,start);
      const cdp=await pc.newCDPSession(pp);
      await cdp.send('Tracing.start',{categories:'devtools.timeline',transferMode:'ReturnAsStream'});
      await pp.evaluate(()=>{window.motionPerf={longTasks:[],shifts:[]};new PerformanceObserver(l=>window.motionPerf.longTasks.push(...l.getEntries().map(e=>({start:e.startTime,duration:e.duration})))).observe({type:'longtask'});new PerformanceObserver(l=>window.motionPerf.shifts.push(...l.getEntries().map(e=>({value:e.value,recentInput:e.hadRecentInput})))).observe({type:'layout-shift'});});
      await glide(pp,end,5000);await glide(pp,start,5000);
      const metrics=await pp.evaluate(()=>window.motionPerf);
      const completed=new Promise(resolve=>cdp.once('Tracing.tracingComplete',resolve));await cdp.send('Tracing.end');
      const {stream}=await completed;let trace='';while(true){const r=await cdp.send('IO.read',{handle:stream});trace+=r.data;if(r.eof)break;}await cdp.send('IO.close',{handle:stream});
      await writeFile(join(output,`${name}-performance-trace.json`),trace);
      await writeFile(join(output,`${name}-performance.json`),JSON.stringify(metrics,null,2));
      assert.equal(metrics.longTasks.length,0,JSON.stringify(metrics));assert.equal(metrics.shifts.length,0,JSON.stringify(metrics));return metrics;
    });
    await pc.close();
  }
} finally {
  await browser.close();
  await writeFile(join(output,'results.json'),JSON.stringify({status:failures.length?'failed':'passed',results,failures},null,2));
}
console.log(`${results.length} checks passed; ${failures.length} failed. Artifacts: ${output}`);
if(failures.length)process.exitCode=1;
