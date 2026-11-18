// Proof for the living-collection pass: stands exist, a placed fish swims with
// a plaque, the real modal flow swaps a display, visitors pay out, and the
// record wall lists per-species bests. Captures go to artifacts/review/.
import { chromium } from 'playwright';
import fs from 'node:fs';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.route('**/src/main.js*', async (route) => {
  const r = await route.fetch();
  let s = await r.text();
  s += `
window.sc = { enterZone, get save() { return save; }, spawnVisitor, sendVisitorHome,
  get visitors() { return visitors; }, get showcaseDisplays() { return showcaseDisplays; },
  get zooAnimals() { return zooAnimals; }, openShowcaseMenu, get interactables() { return interactables; },
  get recordBoard() { return storeRecordBoard; } };
const scRender = renderer.render.bind(renderer);
renderer.render = (s, c) => { if (window.sc.view) { camera.position.set(...sc.view.from); camera.lookAt(...sc.view.to); } scRender(s, c); };`;
  await route.fulfill({ response: r, body: s });
});
await page.route('**/@vite/client', route => route.fulfill({ contentType: 'application/javascript', body: 'export const createHotContext=()=>({on(){},accept(){},dispose(){},prune(){}}); export const updateStyle=()=>{}; export const removeStyle=()=>{};' }));
await page.goto('http://127.0.0.1:5193/jenkins-conservatory/');
await page.waitForFunction(() => window.sc);
await page.waitForTimeout(1200);
await page.evaluate(() => { if (window.__conservatoryProbe) {} });

const out = await page.evaluate(() => {
  sc.save.caught.trout = 2;
  sc.save.caught.bass = 1;
  sc.save.caught.butterfly = 1;
  sc.save.showcase.fish = 'trout';
  sc.save.showcase.bug = 'butterfly';
  sc.enterZone('zoo');
  const stands = sc.interactables.filter((entry) => entry.type === 'showcase');
  const out = { standCount: stands.length, standSlots: stands.map((s) => s.slot) };
  out.displayFishBuilt = Boolean(sc.showcaseDisplays.fish?.model) && Boolean(sc.showcaseDisplays.fish?.plaque);
  out.displayBugBuilt = Boolean(sc.showcaseDisplays.bug?.model);
  out.displayFishSwims = sc.zooAnimals.some((entry) => entry.group === sc.showcaseDisplays.fish?.model && entry.type === 'fish');
  // The real modal flow: open the menu and swap to bass through its button.
  sc.openShowcaseMenu('fish');
  out.menuOffers = [...document.querySelectorAll('#showcase-options [data-showcase-key]')].map((b) => b.dataset.showcaseKey);
  const bassButton = document.querySelector('#showcase-options [data-showcase-key="bass"]');
  out.menuHasBass = Boolean(bassButton);
  bassButton.click();
  out.swapApplied = sc.save.showcase.fish === 'bass';
  out.swapRebuilt = sc.showcaseDisplays.fish && sc.showcaseDisplays.fish.model !== null && !document.getElementById('showcase-modal').classList.contains('is-hidden') === false;
  return out;
});
// The store record wall with two species records.
await page.evaluate(() => {
  sc.save.records.trout = { species: 'trout', weight: 4.2, size: 31 };
  sc.save.records.bass = { species: 'bass', weight: 6.8, size: 38 };
  sc.enterZone('store');
});
const wall = await page.evaluate(() => {
  const board = sc.recordBoard;
  return { rows: (board?.userData?.details || []).length };
});
// Captures: the aquarium with a display fish, the pedestal, the record wall.
await page.evaluate(() => { sc.enterZone('zoo'); sc.view = { from: [-4.6, 2.6, -13.2], to: [0, 2.4, -21.8] }; });
await page.waitForTimeout(500);
await page.screenshot({ path: 'artifacts/review/showcase-aquarium.png' });
await page.evaluate(() => { sc.view = { from: [7.4, 2.2, -7.6], to: [5.2, 1.3, -9.8] }; });
await page.waitForTimeout(400);
await page.screenshot({ path: 'artifacts/review/showcase-pedestal.png' });
await page.evaluate(() => { sc.enterZone('store'); sc.view = { from: [-5.45, 2.3, -4.4], to: [-5.45, 2.1, -8.95] }; });
await page.waitForTimeout(400);
await page.screenshot({ path: 'artifacts/review/record-wall.png' });
// Visitor payout, after re-entering the zoo so the displays are live.
const payout = await page.evaluate(() => {
  sc.enterZone('zoo');
  const before = sc.save.coins;
  sc.spawnVisitor('zoo', true);
  const visitor = sc.visitors[0];
  sc.sendVisitorHome(visitor);
  return { before, after: sc.save.coins, paid: sc.save.coins - before };
});
console.log(JSON.stringify({ errors, out, wall, payout }, null, 2));
await browser.close();
if (errors.length || out.standCount !== 2 || !out.displayFishBuilt || !out.displayBugBuilt || !out.displayFishSwims || !out.menuHasBass || !out.swapApplied || (wall?.rows || 0) !== 2 || !payout.paid) process.exitCode = 1;
