import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const out=process.env.PORTFOLIO_ARTIFACTS || 'artifacts/full-motion';fs.mkdirSync(out,{recursive:true});
const url=process.env.PORTFOLIO_URL||'http://127.0.0.1:4599';
const ids=['h-works','fatespoiler','moduerp','eng-spark','whaleai','myro','bull-finder','guidy-gaime','onbooth'];
const b=await chromium.launch({channel:'chrome'});const report={url,anchors:[],scenes:[],geometry:[],errors:[]};
try{
for(const reduced of [false,true]){
const p=await b.newPage({viewport:{width:1440,height:900},reducedMotion:reduced?'reduce':'no-preference'});p.on('pageerror',e=>report.errors.push(e.message));p.setDefaultTimeout(15000);
await p.goto(url,{waitUntil:'networkidle'});
await p.waitForTimeout(800);
assert.equal(await p.locator('.pin-spacer').count(),reduced?0:2);
for(const hash of [...ids,...ids.slice(3).map(id=>'archive-'+id),'archive']){
 await p.evaluate(hash=>location.hash=hash,hash);const id=hash==='archive'?'eng-spark':hash.replace(/^archive-/,'');
 await p.waitForFunction(id=>document.querySelector('.stage-panel:not([hidden])')?.id===id&&document.querySelector('.t2').dataset.ready==='true',id);
 const row=await p.evaluate(id=>{const e=document.getElementById(id),meta=e.querySelector('.case-meta').getBoundingClientRect();return{id,y:scrollY,top:e.getBoundingClientRect().top,contentTop:meta.top,inert:e.closest('.scene-reading').inert,progress:document.querySelector('.t2').dataset.progress}},id);
 assert.equal(row.inert,false);assert.ok(row.contentTop>=0&&row.contentTop<900);report.anchors.push({hash,reduced,...row});
}
if(!reduced){
for(const id of ids){await p.locator('.site-header a[href="#work"]').click();await p.locator(`.stage-index a[href="#${id}"]`).click();await p.waitForFunction(()=>document.querySelector('.t2').dataset.playing==='true');await p.waitForFunction(()=>!document.querySelector('.t2').dataset.playing);assert.equal(await p.locator('.t2').getAttribute('data-ready'),'true');assert.equal(await p.locator('.stage-panel:not([hidden])').getAttribute('id'),id);}
await p.mouse.wheel(0, await p.locator('.stage-panel:not([hidden]) .case-navigation').evaluate(e=>e.getBoundingClientRect().bottom-innerHeight+(+document.querySelector('.t2').dataset.end-scrollY)+100));
await p.waitForTimeout(800);
await p.locator('.stage-panel:not([hidden]) .case-navigation a').last().click();await p.waitForFunction(()=>document.querySelector('.t2').dataset.next==='true'&&!document.querySelector('.t2').dataset.playing);assert.equal(await p.locator('.pin-spacer').count(),2);assert.equal(await p.locator('.stage-panel:not([hidden])').getAttribute('id'),'h-works');
await p.locator('.site-header a[href="#work"]').click();
await p.locator('.stage-index a[href="#h-works"]').click();
await p.waitForFunction(()=>document.querySelector('.t2').dataset.playing==='true');
await p.mouse.wheel(0,80);
await p.waitForFunction(()=>!document.querySelector('.t2').dataset.playing);
await p.waitForTimeout(800);const stopped=await p.evaluate(()=>scrollY);
await p.waitForTimeout(500);assert.ok(Math.abs(await p.evaluate(()=>scrollY)-stopped)<2,'native input cancels selection playback without a later pull');
await p.locator('.site-header a[href="#work"]').click();
await p.locator('.stage-index a[href="#h-works"]').click();
await p.waitForFunction(()=>document.querySelector('.t2').dataset.playing==='true');
await p.locator('#h-works .case-read-link').focus();
assert.equal(await p.locator('.t2').getAttribute('data-playing'),null,'keyboard focus clears playback state');
assert.ok(await p.locator('#h-works .case-read-link').evaluate(e=>{const r=e.getBoundingClientRect();return e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))}),'keyboard skips directly to an unobscured link');
await p.evaluate(()=>location.hash='fatespoiler');await p.waitForFunction(()=>document.querySelector('.t2').dataset.next==='false');
for(const scene of ['t2']){
 const bounds=await p.locator('.'+scene).evaluate(e=>({start:+e.dataset.start,end:+e.dataset.end,distance:+e.dataset.distance}));
 for(const at of [.36,.41,.36,1]){await p.evaluate(y=>scrollTo(0,y),bounds.start+(bounds.end-bounds.start)*at);await p.waitForTimeout(800);const y=await p.evaluate(()=>scrollY);await p.waitForTimeout(300);assert.ok(Math.abs(await p.evaluate(()=>scrollY)-y)<2,'no idle snap');const progress=+(await p.locator('.'+scene).getAttribute('data-progress'));assert.ok(Math.abs(progress-at)<.004,`${scene} follows native input ${at}: ${progress}`)}
 const box=await p.locator('.'+scene+' .scene-reading').boundingBox();await p.mouse.wheel(0,120);await p.waitForTimeout(500);const box2=await p.locator('.'+scene+' .scene-reading').boundingBox();if(scene!=='t4')assert.ok(Math.abs(box.y-box2.y-120)<2,'document unpinned after transition');report.scenes.push({scene,...bounds,readingHeight:box.height});
}
assert.equal(await p.locator('#career .pin-spacer, #contact .pin-spacer').count(),0);
await p.evaluate(()=>scrollTo(0,document.documentElement.scrollHeight));
await p.waitForTimeout(500);
assert.equal(await p.locator('.contact-head').evaluate(e=>getComputedStyle(e).position),'sticky');
assert.ok(await p.locator('#contact a').evaluateAll(links=>links.every(e=>{const r=e.getBoundingClientRect();return r.height>=44&&e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))})),'footer links stay exposed with 44px targets');
}else{assert.equal(await p.locator('.t1-intro').evaluate(e=>e.offsetHeight),0);assert.equal(await p.locator('.t1-ceremony').evaluate(e=>e.offsetHeight),900);assert.equal(await p.locator('.scene-line-track:visible').count(),0);assert.equal(await p.locator('.contact-head').evaluate(e=>getComputedStyle(e).position),'static')}
await p.close();}
for(const width of [1440,1200,1100,1024,390]){
const p=await b.newPage({viewport:{width,height:width===390?844:900}});p.on('pageerror',e=>report.errors.push(e.message));await p.goto(url+'/#work',{waitUntil:'networkidle'});await p.waitForFunction(()=>document.querySelector('.t1').dataset.ready==='true');
const metrics=await p.evaluate(()=>{const rail=document.querySelector('.stage-index').getBoundingClientRect();const cards=[...document.querySelectorAll('.stage-card')].filter(e=>getComputedStyle(e).visibility==='visible').map(e=>e.getBoundingClientRect());return{width:innerWidth,railWidth:rail.width,overflow:document.documentElement.scrollWidth-innerWidth,overlaps:cards.filter(c=>c.left<rail.right&&c.right>rail.left&&c.top<rail.bottom&&c.bottom>rail.top).length,visibleCards:cards.length,labels:[...document.querySelectorAll('.stage-index a')].map(e=>({font:parseFloat(getComputedStyle(e).fontSize),line:parseFloat(getComputedStyle(e).lineHeight),height:e.offsetHeight}))}});
assert.equal(metrics.overflow,0);assert.equal(metrics.overlaps,0);if(width===390){assert.equal(metrics.visibleCards,2);assert.ok(Math.abs(metrics.railWidth-width*.34)<1);assert.ok(metrics.labels.every(l=>l.font>=13&&l.height>=44&&l.line>=20.8-.01));}
await p.screenshot({path:`${out}/width-${width}.png`});report.geometry.push(metrics);
if(width===390){
 await p.locator('.stage-index a[href="#fatespoiler"]').click();
 await p.evaluate(()=>scrollTo(0,+document.querySelector('.t2').dataset.end+500));
 await p.waitForTimeout(100);
 const link=p.locator('#fatespoiler .case-read-link');await link.focus();
 await p.waitForFunction(()=>{const e=document.querySelector('#fatespoiler .case-read-link'),r=e.getBoundingClientRect();return e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))});
 const focusY=await p.evaluate(()=>scrollY);await p.waitForTimeout(1300);
 assert.ok(Math.abs(await p.evaluate(()=>scrollY)-focusY)<2,'mobile focus has no delayed playback pull');
 assert.ok(await link.evaluate(e=>{const r=e.getBoundingClientRect();return document.activeElement===e&&e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))}),'mobile focused link stays visible after pin release');
}
await p.close();}
assert.deepEqual(report.errors,[]);fs.writeFileSync(out+'/full-verification.json',JSON.stringify(report,null,2));console.log(JSON.stringify({anchors:report.anchors.length,scenes:report.scenes,geometry:report.geometry,errors:report.errors}));
}finally{await b.close()}
