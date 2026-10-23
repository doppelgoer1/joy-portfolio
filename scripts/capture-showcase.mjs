import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'/Users/joy/.npm/_npx/705bc6b22212b352/node_modules/playwright');
const out=process.env.PORTFOLIO_ARTIFACTS||'/Users/joy/code/joy-motion-v4-evidence';
const url=process.env.PORTFOLIO_URL||'http://127.0.0.1:4600';
fs.mkdirSync(out+'/raw',{recursive:true});
const browser=await chromium.launch({channel:'chrome'});
const report={url,method:'native wheel, click/touch and browser Back; no seek, debug progress or scripted scroll position',cases:[]};
async function wheelTo(p,target){
 for(let i=0;i<180;i++){
  const y=await p.evaluate(()=>scrollY);if(y>=target-2)break;
  await p.mouse.wheel(0,Math.min(120,target-y));await p.waitForTimeout(80);
 }
 await p.waitForTimeout(800);
}
try{
 for(const config of [
  {name:'desktop-continuous',width:1440,height:900},
  {name:'desktop-detail-back',width:1440,height:900,detail:true},
  {name:'mobile-continuous',width:390,height:844},
  {name:'mobile-detail-back',width:390,height:844,detail:true},
  {name:'reduced-motion',width:1440,height:900,reduced:true,detail:true},
 ]){
  const viewport={width:config.width,height:config.height};
  const context=await browser.newContext({viewport,deviceScaleFactor:1,isMobile:config.width===390,hasTouch:config.width===390,reducedMotion:config.reduced?'reduce':'no-preference',recordVideo:{dir:out+'/raw',size:viewport}});
  const p=await context.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto(url,{waitUntil:'networkidle'});await p.waitForTimeout(600);
  const bounds=await p.evaluate(()=>({stage:document.querySelector('#work').getBoundingClientRect().top+scrollY,career:document.querySelector('#career').getBoundingClientRect().top+scrollY,bottom:document.documentElement.scrollHeight-innerHeight}));
  await wheelTo(p,bounds.stage);await p.waitForTimeout(900);
  const row={...config,bounds,errors};
  if(config.detail){
   const rail=p.locator('.stage-index a[href="#whaleai"]');if(config.width===390)await rail.tap();else await rail.click();await p.waitForTimeout(1000);
   row.before=await p.evaluate(()=>({y:scrollY,slug:document.querySelector('.stage-card[data-position="0"]').dataset.slug,p:document.documentElement.style.getPropertyValue('--p')}));
   const card=await p.locator('.stage-card[data-position="0"]').boundingBox();
   if(config.width===390)await p.touchscreen.tap(card.x+card.width/2,card.y+card.height/2);else await p.mouse.click(card.x+card.width/2,card.y+card.height/2);
   await p.waitForURL('**/projects/whaleai');await p.waitForTimeout(1200);
   await p.mouse.wheel(0,360);await p.waitForTimeout(800);await p.mouse.wheel(0,360);await p.waitForTimeout(1000);
   await p.goBack();await p.waitForTimeout(1500);
   row.after=await p.evaluate(()=>({y:scrollY,slug:document.querySelector('.stage-card[data-position="0"]').dataset.slug,p:document.documentElement.style.getPropertyValue('--p'),focus:document.activeElement.id}));
   if(config.reduced)await wheelTo(p,bounds.bottom);
  }else{
   await wheelTo(p,bounds.career);await p.waitForTimeout(1000);await wheelTo(p,bounds.bottom);await p.waitForTimeout(1200);
  }
  await p.screenshot({path:`${out}/${config.name}-final.png`});const video=p.video();await context.close();await video.saveAs(`${out}/${config.name}.webm`);report.cases.push(row);fs.writeFileSync(`${out}/capture-metrics.json`,JSON.stringify(report,null,2));console.log('CAPTURED',config.name,row.before,row.after,errors);
 }
}finally{await browser.close()}
