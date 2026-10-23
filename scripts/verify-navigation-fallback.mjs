import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'/Users/joy/.npm/_npx/705bc6b22212b352/node_modules/playwright');
const url=process.env.PORTFOLIO_URL||'http://127.0.0.1:4600';
const out=process.env.PORTFOLIO_ARTIFACTS||'/Users/joy/code/joy-motion-v4-evidence';
const browser=await chromium.launch({channel:'chrome',args:['--disable-blink-features=ViewTransition,ViewTransitionOnNavigation']});
const rows=[];
try{
 for(const storageDisabled of [false,true]){
  const p=await browser.newPage({viewport:{width:390,height:844}});p.setDefaultTimeout(15000);
  await p.addInitScript(storageDisabled=>{window.__transition=false;addEventListener('pagereveal',e=>window.__transition=!!e.viewTransition);if(storageDisabled)Object.defineProperty(window,'sessionStorage',{get(){throw new DOMException('disabled','SecurityError')}});},storageDisabled);
  await p.goto(url+'/#work',{waitUntil:'networkidle'});await p.locator('.stage-index a[href="#myro"]').click();await p.waitForTimeout(900);
  await p.locator('.stage-open').focus();await p.keyboard.press('Enter');await p.waitForURL('**/projects/myro');await p.waitForTimeout(200);
  assert.equal(await p.evaluate(()=>window.__transition),false);assert.equal(await p.locator('h1').evaluate(e=>e===document.activeElement),true);
  await p.goBack();await p.waitForFunction(()=>document.activeElement.id==='myro-tab');assert.ok(await p.evaluate(()=>scrollY>8000));
  // Standalone details and explicit return also work when storage is unavailable.
  await p.goto(url+'/projects/onbooth',{waitUntil:'networkidle'});await p.locator('.site-header a[href*="?project="]').click();await p.waitForFunction(()=>document.querySelector('.stage-card[data-position="0"]')?.dataset.slug==='onbooth');
  rows.push({storageDisabled,transition:await p.evaluate(()=>window.__transition),y:await p.evaluate(()=>scrollY),slug:await p.locator('.stage-card[data-position="0"]').getAttribute('data-slug')});await p.close();
 }
 fs.writeFileSync(out+'/fallback-verification.json',JSON.stringify(rows,null,2));console.log(rows);
}finally{await browser.close()}
