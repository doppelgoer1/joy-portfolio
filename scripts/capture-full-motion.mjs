import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'/Users/joy/.npm/_npx/705bc6b22212b352/node_modules/playwright');
const out=process.env.PORTFOLIO_ARTIFACTS||'/Users/joy/code/joy-motion-v3-evidence';
const url=process.env.PORTFOLIO_URL||'http://127.0.0.1:4600';
const browser=await chromium.launch({channel:'chrome'});
fs.mkdirSync(`${out}/raw`,{recursive:true});fs.mkdirSync(`${out}/stills`,{recursive:true});
async function scroll(p,to,duration){return p.evaluate(async({to,duration})=>{const from=scrollY,samples=[];await new Promise(resolve=>{const began=performance.now();const frame=now=>{const progress=Math.min(1,(now-began)/duration);scrollTo(0,from+(to-from)*progress);samples.push({t:Math.round(now-began),y:Math.round(scrollY),t2:document.querySelector('.t2').dataset.progress});if(progress<1)requestAnimationFrame(frame);else resolve()};requestAnimationFrame(frame)});return samples},{to,duration})}
async function bounds(p){return p.evaluate(()=>{const top=e=>e.getBoundingClientRect().top+scrollY;const t2=document.querySelector('.t2'),career=document.querySelector('#career'),contact=document.querySelector('#contact');return{heroEnd:document.querySelector('.joy-stage').offsetHeight-innerHeight,t1:{start:top(document.querySelector('.t1')),end:top(document.querySelector('#work'))},scenes:[{name:'t2',start:+t2.dataset.start,end:+t2.dataset.end},{name:'t3',start:top(career)-innerHeight,end:top(contact)-innerHeight},{name:'t4',start:top(contact)-innerHeight,end:document.documentElement.scrollHeight-innerHeight}],bottom:document.documentElement.scrollHeight-innerHeight}})}
try{
if(process.env.CAPTURE_MODE!=='stills'){
const report={url,method:'native requestAnimationFrame scrollTo; no timeline seek or debug progress',cases:[]};
for(const config of [{name:'desktop-forward',width:1440,height:900},{name:'desktop-reverse',width:1440,height:900,reverse:true},{name:'mobile-forward',width:390,height:844},{name:'mobile-reverse',width:390,height:844,reverse:true},{name:'reduced-motion',width:1440,height:900,reduced:true},{name:'intermediate-1100',width:1100,height:900}]){
const viewport={width:config.width,height:config.height};const context=await browser.newContext({viewport,deviceScaleFactor:1,isMobile:config.width<780,hasTouch:config.width<780,reducedMotion:config.reduced?'reduce':'no-preference',recordVideo:{dir:out+'/raw',size:viewport}});const p=await context.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(url,{waitUntil:'networkidle'});await p.waitForTimeout(800);const pos=await bounds(p);const record={...config,pos,errors,samples:[]};
let stops=config.reduced?[[pos.bottom,45000]]:[[pos.heroEnd,13000],[pos.t1.end,7000],[pos.scenes[0].end,6000],[pos.scenes[1].start,4000],[pos.scenes[1].end,7000],[pos.bottom,7000]];
if(config.reverse){await p.evaluate(y=>scrollTo(0,y),pos.bottom);await p.waitForTimeout(900);stops=[[pos.scenes[1].end,7000],[pos.scenes[1].start,7000],[pos.scenes[0].end,4000],[pos.t1.end,6000],[pos.heroEnd,7000],[0,13000]];}
for(const [to,duration] of stops){record.samples.push(...await scroll(p,to,duration));await p.waitForTimeout(700)}
await p.screenshot({path:`${out}/${config.name}-final.png`});const video=p.video();await context.close();await video.saveAs(`${out}/${config.name}.webm`);report.cases.push(record);fs.writeFileSync(`${out}/capture-metrics.json`,JSON.stringify(report,null,2));console.log('CAPTURED',config.name,record.samples.length,errors);
}
}
if(process.env.CAPTURE_MODE!=='videos'){
const report=process.env.CAPTURE_PROJECT ? JSON.parse(fs.readFileSync(`${out}/stills-metrics.json`)).filter(row=>row.selected!==process.env.CAPTURE_PROJECT) : [];
for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
const p=await browser.newPage({viewport,deviceScaleFactor:1,isMobile:viewport.width<780,hasTouch:viewport.width<780});await p.goto(url,{waitUntil:'networkidle'});await p.waitForTimeout(800);
for(const selected of ['h-works','whaleai'].filter(id=>!process.env.CAPTURE_PROJECT||process.env.CAPTURE_PROJECT===id)){
if(selected!=='h-works'){await p.evaluate(id=>location.hash=id,selected);await p.waitForTimeout(900);}
const pos=await bounds(p);const scenes=selected==='h-works'?pos.scenes:pos.scenes.slice(0,1);
for(const scene of scenes){let samples=[];for(let step=0;step<=50;step++){
const progress=step/50;await p.evaluate(y=>scrollTo(0,y),scene.start+(scene.end-scene.start)*progress);await p.waitForTimeout(700);
const file=`${viewport.width}-${selected}-${scene.name}-${String(step*2).padStart(3,'0')}.png`;await p.screenshot({path:`${out}/stills/${file}`});samples.push({file,progress,...await p.evaluate(()=>{const panel=document.querySelector('.stage-panel:not([hidden])'),band=panel.querySelector('.case-band'),img=band.querySelector('img'),contact=document.querySelector('.contact-head');return{y:scrollY,t2:{...document.querySelector('.t2').dataset},overflow:document.documentElement.scrollWidth-innerWidth,band:band.getBoundingClientRect().toJSON(),image:img?{fit:getComputedStyle(img).objectFit,position:getComputedStyle(img).objectPosition,naturalWidth:img.naturalWidth}:null,contact:contact.getBoundingClientRect().toJSON(),pins:document.querySelectorAll('.pin-spacer').length}})});
}
// 25% is additional to the requested 2% grid.
await p.evaluate(y=>scrollTo(0,y),scene.start+(scene.end-scene.start)*.25);await p.waitForTimeout(700);await p.screenshot({path:`${out}/${viewport.width}-${selected}-${scene.name}-25.png`});
for(const percent of [0,50,72,100])fs.copyFileSync(`${out}/stills/${viewport.width}-${selected}-${scene.name}-${String(percent).padStart(3,'0')}.png`,`${out}/${viewport.width}-${selected}-${scene.name}-${percent}.png`);
report.push({viewport,selected,scene,samples});fs.writeFileSync(`${out}/stills-metrics.json`,JSON.stringify(report,null,2));console.log('STILLS',viewport.width,selected,scene.name,samples.length);
}
}
await p.close();
}
}
}finally{await browser.close()}
