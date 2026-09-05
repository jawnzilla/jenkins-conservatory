import { chromium } from 'playwright';
import fs from 'node:fs';
const browser = await chromium.launch({headless:true});
const page = await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[]; page.on('pageerror',e=>errors.push(e.message));
await page.route('**/src/main.js*',async route=>{ const r=await route.fetch(); let s=await r.text(); s+=`\nwindow.qa={enterZone,world,player,get interactables(){return interactables;},createResearchSkiffModel,enterLakeBoat,exitLakeBoat,updateLakeBoatMovement,cycleLakeBoatSpeed,getBoat:()=>lakeBoat,getPilot:()=>lakeBoatPilot,talkToCharacter}; const originalRender=renderer.render.bind(renderer); renderer.render=(s,c)=>{if(window.qa.view){camera.position.set(...window.qa.view.from);camera.lookAt(...window.qa.view.to);}originalRender(s,c);};`; await route.fulfill({response:r,body:s}); });
await page.goto('http://127.0.0.1:5193/jenkins-conservatory/');
await page.waitForFunction(()=>window.qa); await page.waitForTimeout(1500);
fs.mkdirSync('artifacts',{recursive:true});
for(const [name,x,z] of [['brynlee',-14.8,-3.8],['brooks',14.8,-3.8],['grayson',0,-5.4]]){
 await page.evaluate(({x,z})=>{qa.enterZone('zoo'); qa.view={from:[x+(x===0?3.2:1.7),2.15,z+(x===0?1.6:3.4)],to:[x,1.0,z]};}, {x,z});
 await page.waitForTimeout(500); await page.screenshot({path:`artifacts/${name}.png`});
}
await page.evaluate(()=>{qa.enterZone('forest');qa.view={from:[3.8,2.5,-13.8],to:[0,0.55,-16.7]};});
await page.waitForTimeout(600);await page.screenshot({path:'artifacts/skiff.png'});
const result=await page.evaluate(()=>{qa.enterZone('zoo');const characters=qa.interactables.filter(e=>e.type==='character').map(e=>e.character).sort(); for(const id of characters)qa.talkToCharacter(id); qa.enterZone('lake'); const b=qa.getBoat(); const before=b.group.position.clone(); qa.enterLakeBoat(b); qa.cycleLakeBoatSpeed(1);qa.updateLakeBoatMovement(0.1); const moved=b.group.position.distanceTo(before);qa.exitLakeBoat();return {moved,pilotExited:!qa.getPilot(),characters};});
await page.screenshot({path:'artifacts/lake.png'});
console.log(JSON.stringify({errors,result},null,2)); await browser.close();
if(errors.length||!result.moved||!result.pilotExited||result.characters.join(',')!=='brooks,brynlee,grayson')process.exitCode=1;
