import { chromium } from 'playwright';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const browser = await chromium.launch({headless:true});
fs.mkdirSync('artifacts/feedback',{recursive:true});
const results=[];
for(const [width,height] of [[1440,1000],[390,844],[320,568],[844,390],[568,320],[667,375]]) {
 const page=await browser.newPage({viewport:{width,height}}); const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/src/main.js*',async route=>{
  const response=await route.fetch();const source=await response.text();
  await route.fulfill({response,body:source+`\nwindow.feedbackQA={toast,setStatus,enterZone,openShop,closeAllModals,fishing,updateFishingCallout,getElapsed:()=>elapsed,approach(id){const e=interactables.find(e=>e.character===id || e.type===id);player.set(e.position.x,1.72,e.position.z+2);yaw=0;pitch=0;camera.position.copy(player);camera.lookAt(e.position);updatePrompt();},getTarget:()=>getInteractionTarget()?.label};`});
 });
 await page.goto('http://127.0.0.1:5193/jenkins-conservatory/');
 await page.waitForFunction(()=>window.feedbackQA);
 await page.evaluate(()=>{feedbackQA.enterZone('zoo');feedbackQA.approach('brynlee');});
 await page.waitForTimeout(400);
 assert.match(await page.locator('#prompt-text').innerText(),/Brynlee/);
 assert.equal(await page.locator('#prompt-card').isVisible(),true);
 await page.keyboard.press('e');
 await page.waitForTimeout(100);
 assert.equal(await page.locator('#toast-stack .toast').count(),1);
 await page.screenshot({path:`artifacts/feedback/${width}-character.png`});
 const measure=()=>page.evaluate(()=>{
  const r=id=>{const e=document.getElementById(id),b=e.getBoundingClientRect();return {left:b.left,right:b.right,top:b.top,bottom:b.bottom,width:b.width,visible:getComputedStyle(e).display!=='none'};};
  return {width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth,hub:r('interaction-hub'),prompt:r('prompt-card'),toast:r('toast-stack'),dock:r('action-dock'),crosshair:r('crosshair'),textSize:getComputedStyle(document.querySelector('.toast')).fontSize};
 });
 const layout=await measure();
 assert.equal(layout.width,width);assert.equal(layout.overflow,false);assert(layout.hub.left>=0 && layout.hub.right<=width);assert(layout.hub.bottom<=layout.dock.top);
 await page.evaluate(()=>{feedbackQA.toast('Not enough supplies. Visit the field store.','warning');feedbackQA.toast('Not enough supplies. Visit the field store.','warning');feedbackQA.setStatus('Persistent next step.');});
 assert.equal(await page.locator('.toast').count(),1);
 assert.equal(await page.locator('.feedback-label').innerText(),'ATTENTION');
 assert.equal(await page.locator('#status-message').isVisible(),false);
 // A stale timeout must not remove a newer message; literal strings never become HTML.
 await page.evaluate(()=>feedbackQA.toast('<img src=x onerror=alert(1)> & keep this literal','danger'));
 assert.equal(await page.locator('.toast img').count(),0);
 await page.evaluate(()=>{
  Object.assign(feedbackQA.fishing,{phase:'reeling',tensionState:'stop',tensionEndsAt:feedbackQA.getElapsed()+100,fishWeight:1});
  feedbackQA.toast('Let the fish run — do not reel during the surge.','warning');feedbackQA.updateFishingCallout();
 });
 assert.equal(await page.locator('#fishing-callout').isVisible(),true);
 assert.match(await page.locator('#fishing-callout').innerText(),/STOP REELING/);
 await page.evaluate(()=>{Object.assign(feedbackQA.fishing,{tensionState:'clear',nextTensionAt:feedbackQA.getElapsed()+100});feedbackQA.updateFishingCallout();});
 assert.match(await page.locator('#fishing-callout').innerText(),/REEL LINE/);
 assert.equal(await page.locator('.toast').count(),0);
 await page.evaluate(()=>{feedbackQA.toast('A duck laid an egg.');feedbackQA.updateFishingCallout();});
 assert.equal(await page.locator('#fishing-callout').isVisible(),true);
 assert.equal(await page.locator('.feedback-card').isVisible(),false);
 await page.evaluate(()=>{Object.assign(feedbackQA.fishing,{phase:'bite',biteDeadline:feedbackQA.getElapsed()+100});feedbackQA.updateFishingCallout();});
 assert.match(await page.locator('#fishing-callout').innerText(),/BITE/);
 await page.evaluate(()=>{feedbackQA.fishing.phase='idle';feedbackQA.openShop();feedbackQA.toast('Purchased worms. Your field kit has been updated.');feedbackQA.updateFishingCallout();});
 await page.waitForTimeout(100);
 await page.screenshot({path:`artifacts/feedback/${width}-shop.png`});
 const modal=await page.evaluate(()=>{const t=document.querySelector('.toast').getBoundingClientRect(),m=document.querySelector('#shop-modal .modal-card').getBoundingClientRect();return {toastTop:t.top,modalBottom:m.bottom};});
 assert(modal.modalBottom<=modal.toastTop,JSON.stringify(modal));
 await page.keyboard.press('Escape');
 assert.equal(await page.locator('#shop-modal').isVisible(),false);
 if(width===320){await page.waitForTimeout(8500);assert.equal(await page.locator('.toast').count(),0);assert.equal(await page.locator('#status-message').isVisible(),true);}
 if(width===1440){
  await page.evaluate(()=>{feedbackQA.enterZone('store');feedbackQA.approach('car');});
  await page.waitForTimeout(200);await page.keyboard.press('e');
  assert.equal(await page.locator('#travel-modal').isVisible(),true);
  await page.keyboard.press('Escape');
  await page.evaluate(()=>feedbackQA.openShop());
  await page.locator('[data-buy-item="worms"]').click();
  assert.equal(await page.locator('#shop-modal #toast-stack .toast').count(),1);
  assert.match(await page.locator('.toast').innerText(),/Purchased|Bought|added|Worm/i);
  await page.keyboard.press('Escape');
 }
 assert.deepEqual(errors,[]);results.push({width,height,layout,modal,errors});await page.close();
}
fs.writeFileSync('artifacts/feedback/results.json',JSON.stringify(results,null,2));
console.log(JSON.stringify(results,null,2));await browser.close();
