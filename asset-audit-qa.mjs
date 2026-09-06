import { chromium } from 'playwright';
import fs from 'node:fs';
const phase=process.argv[2]||'before';
const dir=`artifacts/asset-audit/${phase}`; fs.mkdirSync(dir,{recursive:true});
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1200,height:800}});
const errors=[];page.on('pageerror',e=>{errors.push(e.message);console.error(e.message);});
await page.route('**/src/main.js*',async route=>{const r=await route.fetch();let s=await r.text();s+=`\nwindow.audit={enterZone,world,createAnimalModel,SPECIES,createHeldToolModel,updateJenkinsLakeArrival,get colliders(){return colliders;},get interactables(){return interactables;}};const auditRender=renderer.render.bind(renderer);renderer.render=(s,c)=>{if(window.audit.view){camera.position.set(...audit.view.from);camera.lookAt(...audit.view.to);}auditRender(s,c);};`;await route.fulfill({response:r,body:s});});
await page.route('**/@vite/client',route=>route.fulfill({contentType:'application/javascript',body:'export const createHotContext=()=>({on(){},accept(){},dispose(){},prune(){}}); export const updateStyle=()=>{}; export const removeStyle=()=>{};'}));
await page.goto('http://127.0.0.1:5193/jenkins-conservatory/');await page.waitForFunction(()=>window.audit);await page.waitForTimeout(800);
// Hide DOM overlays only in test browser; no production changes.
await page.addStyleTag({content:'body > :not(canvas):not(script):not(style) {visibility:hidden!important} canvas {visibility:visible!important}'});
const views=[
['store-wide','store',[13,11,15],[0,1,-3]],['mara','store',[2.2,2.8,-2.8],[0,2,-6.45]],['car','store',[4.8,3.4,14.2],[0,1.1,10]],['crates','store',[-1.9,1.8,0.2],[-3.6,0.5,-1.9]],['shop','store',[3,3,-1],[7,1.7,-4]],
['forest-wide','forest',[27,22,22],[0,0,-10]],['forest-nature','forest',[-7,5,1],[-13,1,-5]],['forest-pond','forest',[13,9,-5],[0,0,-18]],
['zoo-wide','zoo',[30,29,24],[0,0,-13]],['zoo-garden','zoo',[-22,10,1],[-12,0,-13]],['zoo-aquarium','zoo',[9,6,-13],[0,2,-22]],['zoo-rear','zoo',[25,22,-24],[0,0,-43]],
['lake-road','lake',[22,20,-2],[0,0,-37]],['lake-barn','lake',[-1,10,-11],[-18,2,-28]],['lake-shack','lake',[29,8,-17],[17,1.6,-31]],['lake-cabin','lake',[7,10,-55],[-9.5,1.8,-72]],['lake-garage','lake',[-10,9,-90],[-25,1.5,-108]],['lake-meadow','lake',[10,30,-68],[-28,0,-99]],['lake-water','lake',[70,55,-96],[0,0,-150]]];
const results=[];
for(const [name,zone,from,to] of views){if(phase==='after'&&!['mara','car','crates','store-wide','lake-road'].includes(name))continue;await page.evaluate(({zone,from,to})=>{audit.enterZone(zone);if(zone==='lake')audit.updateJenkinsLakeArrival(11);audit.view={from,to};},{zone,from,to});await page.waitForTimeout(250);await page.screenshot({path:`${dir}/${name}.png`});results.push({name,zone,colliders:await page.evaluate(()=>audit.colliders.map(c=>({...c}))),interactables:await page.evaluate(()=>audit.interactables.map(({type,label,position,radius,itemKey})=>({type,label,position,radius,itemKey})))});
}
if(phase==='before'){
const species=await page.evaluate(()=>Object.keys(audit.SPECIES));
for(let i=0;i<species.length;i+=6){const batch=species.slice(i,i+6);await page.evaluate(batch=>{audit.enterZone('store');audit.world.clear();batch.forEach((name,i)=>{const g=audit.createAnimalModel(name,1.6);g.position.set((i%3-1)*3,0,-Math.floor(i/3)*3);audit.world.add(g);});audit.view={from:[5,7,-11],to:[0,0.7,-1.5]};},batch);await page.waitForTimeout(200);await page.screenshot({path:`${dir}/species-${i}.png`});results.push({name:`species-${i}`,species:batch,mode:'isolated model gallery; not natural placement'});}
}
fs.writeFileSync(`${dir}/results.json`,JSON.stringify({errors,results},null,2)); console.log(JSON.stringify({phase,errors,captures:results.length}));await browser.close();if(errors.length)process.exitCode=1;
