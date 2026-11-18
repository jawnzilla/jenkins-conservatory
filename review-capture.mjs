// Review capture pass: the same route-interception technique as asset-audit-qa.mjs
// and visual-qa.mjs, but built to compare day against night and to keep the HUD
// in some frames. Nothing here ships to production: the patch is appended to the
// dev-server copy of main.js only, exactly as the other QA scripts do.
import { chromium } from 'playwright';
import fs from 'node:fs';

const dir = 'artifacts/review';
fs.mkdirSync(dir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));

await page.route('**/src/main.js*', async (route) => {
  const r = await route.fetch();
  let s = await r.text();
  s += `
window.review = {
  enterZone, world, save, applySavedDayPhase, skipOnboarding,
  updateJenkinsLakeArrival, createAnimalModel, SPECIES, get colliders() { return colliders; },
  get interactables() { return interactables; },
  setPhase(p) { save.dayPhase = p; applySavedDayPhase(); },
  census: () => ({ drawCalls: renderer.info.render.calls, triangles: renderer.info.render.triangles })
};
const reviewRender = renderer.render.bind(renderer);
renderer.render = (s, c) => {
  if (window.review.view) { camera.position.set(...window.review.view.from); camera.lookAt(...window.review.view.to); }
  reviewRender(s, c);
};`;
  await route.fulfill({ response: r, body: s });
});
await page.route('**/@vite/client', route => route.fulfill({ contentType: 'application/javascript', body: 'export const createHotContext=()=>({on(){},accept(){},dispose(){},prune(){}}); export const updateStyle=()=>{}; export const removeStyle=()=>{};' }));

await page.goto('http://127.0.0.1:5193/jenkins-conservatory/');
await page.waitForFunction(() => window.review);
await page.waitForTimeout(1200);
await page.evaluate(() => review.skipOnboarding());

// Same wide angles the saved audit used, so the two sets can be compared.
const views = [
  ['store', [13, 11, 15], [0, 1, -3]],
  ['forest', [27, 22, 22], [0, 0, -10]],
  ['zoo', [30, 29, 24], [0, 0, -13]],
  ['lake', [70, 55, -96], [0, 0, -150]]
];

const shots = [];
for (const [zone, from, to] of views) {
  for (const [tag, phase] of [['day', 0.35], ['night', 0.78]]) {
    await page.evaluate(({ zone, phase, from, to }) => {
      review.setPhase(phase);
      review.enterZone(zone);
      if (zone === 'lake') review.updateJenkinsLakeArrival(11);
      review.view = { from, to };
    }, { zone, phase, from, to });
    await page.waitForTimeout(400);
    const name = `${zone}-${tag}`;
    await page.screenshot({ path: `${dir}/${name}.png` });
    shots.push(name);
  }
}

// Night close-ups where the lanterns matter, day close-up of the characters.
await page.evaluate(() => { review.setPhase(0.78); review.enterZone('zoo'); review.view = { from: [14.5, 2.4, 0.2], to: [13.5, 1.4, -3.6] }; });
await page.waitForTimeout(400);
await page.screenshot({ path: `${dir}/night-brooks-lantern.png` }); shots.push('night-brooks-lantern');

await page.evaluate(() => { review.setPhase(0.78); review.enterZone('lake'); review.updateJenkinsLakeArrival(11); review.view = { from: [7, 8, -62], to: [-9.5, 1.8, -72] }; });
await page.waitForTimeout(400);
await page.screenshot({ path: `${dir}/night-lake-cabin.png` }); shots.push('night-lake-cabin');

// The pond with the rod held: the first-person held-item tell.
await page.evaluate(() => { review.setPhase(0.35); review.enterZone('forest'); review.view = { from: [10.5, 2.1, -12], to: [6, 0.6, -18] }; });
await page.waitForTimeout(400);
await page.screenshot({ path: `${dir}/day-rod-held.png` }); shots.push('day-rod-held');

// Two HUD frames exactly as a player sees them, DOM overlays left in place.
await page.evaluate(() => { review.view = null; review.setPhase(0.35); review.enterZone('forest'); });
await page.waitForTimeout(600);
await page.screenshot({ path: `${dir}/hud-day.png` }); shots.push('hud-day');

await page.evaluate(() => { review.setPhase(0.78); });
await page.waitForTimeout(600);
await page.screenshot({ path: `${dir}/hud-night.png` }); shots.push('hud-night');

// The journal, opened through its real button.
await page.click('#journal-toggle-button');
await page.waitForTimeout(500);
await page.screenshot({ path: `${dir}/hud-journal.png` }); shots.push('hud-journal');

const census = await page.evaluate(() => {
  review.enterZone('lake');
  return review.census();
});

fs.writeFileSync(`${dir}/results.json`, JSON.stringify({ errors, shots, census }, null, 2));
console.log(JSON.stringify({ errors, shots, census }, null, 2));
await browser.close();
if (errors.length) process.exitCode = 1;
