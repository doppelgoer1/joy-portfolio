import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'/Users/joy/.npm/_npx/705bc6b22212b352/node_modules/playwright');
const browser=await chromium.launch({channel:'chrome'});
try {
 const page=await browser.newPage({viewport:{width:1440,height:900}});
 await page.goto((process.env.PORTFOLIO_URL||'http://127.0.0.1:4600')+'/#work');
 await page.waitForFunction(()=>document.querySelector('.t1')?.dataset.ready==='true');
 const before=page.url();
 await page.locator('.stage-index a[href="#whaleai"]').click();
 assert.equal(page.url(),before,'rail selects without navigation');
 assert.equal(await page.locator('.stage-card[data-position="0"]').getAttribute('data-slug'),'whaleai');
 assert.equal(await page.locator('.t2, .stage-panels').count(),0,'home has no inline detail');
 assert.equal(await page.locator('.stage-card[data-position="0"]').evaluate(e=>e.tagName),'A');
 await page.locator('.stage-card[data-position="0"]').click();
 await page.waitForURL('**/projects/whaleai');
 assert.equal(await page.locator('h1').evaluate(e=>document.activeElement===e),true);
 await page.goBack();
 await page.waitForFunction(()=>document.querySelector('.stage-card[data-position="0"]')?.dataset.slug==='whaleai');
 assert.ok(await page.evaluate(()=>scrollY>document.querySelector('.joy-stage').offsetHeight-innerHeight));
 console.log('showcase navigation PASS');
}finally{await browser.close()}
