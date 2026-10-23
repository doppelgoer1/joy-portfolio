import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {projectEntries} from '../src/data/portfolio.ts';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'/Users/joy/.npm/_npx/705bc6b22212b352/node_modules/playwright');
const out=process.env.PORTFOLIO_ARTIFACTS||'artifacts/full-motion';fs.mkdirSync(out,{recursive:true});
const url=process.env.PORTFOLIO_URL||'http://127.0.0.1:4600';
const ids=projectEntries.map(({project})=>project.id);
const report={url,anchors:[],geometry:[],routes:[],restoration:[],transitions:[],errors:[]};
const browser=await chromium.launch({channel:'chrome'});
const active=p=>p.locator('.stage-card[data-position="0"]');
async function selected(p,id){await p.waitForFunction(id=>document.querySelector('.stage-card[data-position="0"]')?.dataset.slug===id,id);}
async function ready(p){await p.waitForFunction(()=>document.querySelector('.t1')?.dataset.ready==='true'||document.querySelector('.t1')?.dataset.motion==='reduced');}
async function instrument(p){
 p.setDefaultTimeout(15000);p.setDefaultNavigationTimeout(15000);
 p.on('pageerror',e=>report.errors.push(e.message));
 await p.addInitScript(()=>{
   window.__frames=[];
   let frames=0;
   const sample=()=>{window.__frames.push({y:scrollY,p:Number(document.documentElement.style.getPropertyValue('--p')),visible:document.body?getComputedStyle(document.body).visibility!=='hidden':false});if(frames++<120)requestAnimationFrame(sample)};
   requestAnimationFrame(sample);
   window.addEventListener('pagereveal',e=>{
     window.__transition={present:!!e.viewTransition};
     if(e.viewTransition)e.viewTransition.ready.then(()=>{window.__transition.ready=true;window.__transition.animations=document.getAnimations().map(a=>({duration:a.effect.getTiming().duration,easing:a.effect.getTiming().easing,pseudo:a.effect.pseudoElement}));},error=>{window.__transition.error=error.name});
   });
 });
}
async function restoreMetrics(p,kind,before,id){
 await ready(p);await selected(p,id);await p.waitForTimeout(600);
 const row=await p.evaluate(()=>({y:scrollY,slug:document.querySelector('.stage-card[data-position="0"]').dataset.slug,p:document.documentElement.style.getPropertyValue('--p'),focus:document.activeElement?.id,restoration:history.scrollRestoration,heroEnd:document.querySelector('.joy-stage').offsetHeight-innerHeight,frames:window.__frames,transition:window.__transition}));
 assert.equal(row.slug,id);assert.equal(row.focus,`${id}-tab`);assert.ok(Math.abs(row.y-before)<2,`${kind}: position ${row.y} vs ${before}`);assert.ok(+row.p>.999);
 assert.ok(row.frames.filter(f=>f.visible&&f.p).every(f=>f.y>row.heroEnd&&f.p>.999),`${kind}: first visible frame bypasses hero`);
 report.restoration.push({kind,...row});
}
try {
 for(const reduced of [false,true]){
  console.log("anchors and restoration",{reduced});
  const p=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:reduced?'reduce':'no-preference'});await instrument(p);
  await p.goto(url+'/#work',{waitUntil:'networkidle'});await ready(p);
  assert.equal(await p.locator('.pin-spacer').count(),reduced?0:1);
  assert.equal(await p.locator('.t2,.stage-panels,#career .pin-spacer,#contact .pin-spacer').count(),0);
  for(const hash of [...ids,...ids.slice(3).map(id=>'archive-'+id),'archive']){
   await p.evaluate(hash=>location.hash=hash,hash);const id=hash==='archive'?'eng-spark':hash.replace(/^archive-/,'');await selected(p,id);await ready(p);
   const row=await active(p).evaluate(e=>{const r=e.getBoundingClientRect();return{slug:e.dataset.slug,y:scrollY,top:r.top,bottom:r.bottom,inert:!!e.closest('[inert]'),focus:document.activeElement.id}});
   assert.equal(row.inert,false);assert.ok(row.top>=0&&row.bottom<=900);report.anchors.push({hash,reduced,...row});
  }
  await p.locator('.stage-index a[href="#whaleai"]').click();await p.waitForTimeout(850);
  const before=await p.evaluate(()=>scrollY);await active(p).click();await p.waitForURL('**/projects/whaleai');await p.waitForTimeout(450);
  assert.equal(await p.locator('h1').evaluate(e=>e===document.activeElement),true);
  const transition=await p.evaluate(()=>window.__transition);report.transitions.push({reduced,...transition});
  assert.equal(transition?.present,!reduced);if(!reduced){assert.equal(transition.ready,true);assert.ok(transition.animations.every(a=>a.duration<=400));}
  await p.goBack();await restoreMetrics(p,`Back-${reduced}`,before,'whaleai');
  await p.locator('.stage-open').click().catch(async error=>{console.log('CLICK_STATE',await p.evaluate(()=>{const e=document.querySelector('.stage-open'),r=e.getBoundingClientRect();return {y:scrollY,hash:location.hash,t1:{...document.querySelector('.t1').dataset},reading:document.querySelector('.t1-reading').outerHTML.slice(0,120),focus:document.activeElement.id,rect:r.toJSON(),hit:document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.outerHTML.slice(0,150)}}));await p.screenshot({path:out+'/click-failure.png'});throw error});await p.waitForURL('**/projects/whaleai');await p.locator('.site-header a[href*="?project="]').click();await p.waitForURL(u=>u.pathname==='/'&&u.hash==='#work');await restoreMetrics(p,`return-link-${reduced}`,before,'whaleai');
  await p.evaluate(()=>scrollTo(0,document.documentElement.scrollHeight));await p.waitForTimeout(200);
  assert.equal(await p.locator('.contact-head').evaluate(e=>getComputedStyle(e).position),reduced?'static':'sticky');
  assert.ok(await p.locator('#contact a').evaluateAll(links=>links.every(e=>e.getBoundingClientRect().height>=44)));
  await p.close();
 }
 for(const width of [1440,1200,1100,1024,390]){
  console.log("geometry",width);
  const p=await browser.newPage({viewport:{width,height:width===390?844:900},isMobile:width===390,hasTouch:width===390});await instrument(p);await p.goto(url+'/#work',{waitUntil:'networkidle'});await ready(p);
  for(const id of ids){
   const before=p.url();await p.locator(`.stage-index a[href="#${id}"]`).click();await selected(p,id);assert.equal(p.url(),before);
   await p.waitForTimeout(800);
   const metrics=await p.evaluate(()=>{const rail=document.querySelector('.stage-index').getBoundingClientRect();const cards=[...document.querySelectorAll('.stage-card')].filter(e=>getComputedStyle(e).visibility==='visible').map(e=>e.getBoundingClientRect());const cta=document.querySelector('.stage-open').getBoundingClientRect();const card=document.querySelector('.stage-card[data-position="0"]');return{width:innerWidth,slug:card.dataset.slug,railWidth:rail.width,overflow:document.documentElement.scrollWidth-innerWidth,overlaps:cards.filter(c=>c.left<rail.right&&c.right>rail.left&&c.top<rail.bottom&&c.bottom>rail.top).length,visibleCards:cards.length,cardOverflow:card.scrollHeight-card.clientHeight,cta:{top:cta.top,bottom:cta.bottom,height:cta.height},labels:[...document.querySelectorAll('.stage-index a')].map(e=>({font:parseFloat(getComputedStyle(e).fontSize),line:parseFloat(getComputedStyle(e).lineHeight),height:e.offsetHeight}))}});
   assert.equal(metrics.overflow,0);assert.equal(metrics.overlaps,0);assert.ok(metrics.cardOverflow<=1,JSON.stringify(metrics));assert.ok(metrics.cta.bottom<=p.viewportSize().height&&metrics.cta.height>=44);
   if(width===390){assert.equal(metrics.visibleCards,2);assert.ok(Math.abs(metrics.railWidth-width*.34)<1);assert.ok(metrics.labels.every(l=>l.font>=13&&l.height>=44&&l.line>=20.8-.01));}
   report.geometry.push(metrics);
  }
  await p.screenshot({path:`${out}/width-${width}.png`});
  await p.locator('.stage-index a[href="#h-works"]').click();await p.waitForTimeout(850);
  // A visible neighbour selects; the selected card navigates on the next click/tap.
  const before=p.url();const neighbour=p.locator('.stage-card[data-position="1"]');
  const point=await neighbour.evaluate(e=>{const r=e.getBoundingClientRect();for(let x=Math.min(innerWidth-2,r.right-8);x>r.left;x-=5)if(e.contains(document.elementFromPoint(x,r.y+r.height/2)))return{x,y:r.y+r.height/2};return null});
  assert.ok(point,'visible neighbour has a reachable hit target');if(width===390)await p.touchscreen.tap(point.x,point.y);else await p.mouse.click(point.x,point.y);
  await selected(p,'fatespoiler');assert.equal(p.url(),before);await p.waitForTimeout(850);
  const y=await p.evaluate(()=>scrollY);if(width===390)await active(p).tap();else await active(p).click();await p.waitForURL('**/projects/fatespoiler');await p.goBack();await restoreMetrics(p,`card-Back-${width}`,y,'fatespoiler');
  // Native middle-click opens a separate page without navigating the stage.
  const popupPromise=p.context().waitForEvent('page');await p.locator('.stage-open').click({button:'middle'});const popup=await popupPromise;await popup.waitForLoadState();assert.equal(new URL(popup.url()).pathname,'/projects/fatespoiler');assert.equal(p.url(),before);await popup.close();
  await p.close();
 }
 for(const {project,kind} of projectEntries){
  const p=await browser.newPage({viewport:{width:1440,height:900}});const response=await p.goto(`${url}/projects/${project.id}`,{waitUntil:'networkidle'});assert.equal(response.status(),200);
  assert.equal(await p.locator('h1').textContent(),project.name);const text=await p.locator('main').innerText();assert.ok(text.includes(kind==='featured'?project.summary:project.description));if(project.role)assert.ok(text.includes(project.role));for(const tech of project.stack||[])assert.ok(text.includes(tech));
  assert.equal(await p.locator('img').count(),kind==='featured'?0:1);assert.equal(await p.locator('.detail-other-project').count(),8);assert.equal(await p.locator('.pin-spacer').count(),0);
  if(kind==='archive')assert.ok(await p.locator('img').evaluate(e=>e.complete&&e.naturalWidth>0));
  await p.reload({waitUntil:'networkidle'});assert.equal(await p.locator('h1').evaluate(e=>document.activeElement===e),true);
  await p.screenshot({path:`${out}/detail-${project.id}.png`,fullPage:true});report.routes.push({slug:project.id,status:response.status(),role:!!project.role,stack:!!project.stack,image:kind==='archive',reload:true});await p.close();
 }
 assert.deepEqual(report.errors,[]);
 console.log(JSON.stringify({anchors:report.anchors.length,geometry:report.geometry.length,routes:report.routes.length,restoration:report.restoration.map(({kind,y,slug,p})=>({kind,y,slug,p})),transitions:report.transitions,errors:report.errors}));
}finally{fs.writeFileSync(`${out}/full-verification.json`,JSON.stringify(report,null,2));await browser.close()}
