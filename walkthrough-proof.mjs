// End-to-end proof for the forced first day: the tour advances only through
// its world events, tools refuse until their lesson, travel offers only the
// tour's stops, the lake lesson completes when the drive does (not when it
// starts), and finishing hands the field to the commission card.
import { chromium } from 'playwright';
import fs from 'node:fs';

const browser = await chromium.launch({ headless: true, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.route('**/src/main.js*', async (route) => {
  const r = await route.fetch();
  let s = await r.text();
  s += `
window.tour = {
  get step() { return Number(save.onboardingStep || 0); },
  get active() { return Number(save.onboardingStep || 0) < ONBOARDING_LESSONS.length; },
  get lesson() { return onboardingLesson()?.gate ?? null; },
  get tool() { return activeTool; },
  get cardHidden() { return document.getElementById('commission-card').classList.contains('is-hidden'); },
  get dialogHidden() { return document.getElementById('onboarding').classList.contains('is-hidden'); },
  travel: () => onboardingTravelZones(),
  gate: (name) => onboardingGate(name),
  enter: (z) => enterZone(z),
  buy: () => applyPurchase(SHOP_ITEMS[0]),
  driveToEnd: () => updateJenkinsLakeArrival(14),
  get objective() { return document.getElementById('onboarding-objective').textContent; }
};`;
  await route.fulfill({ response: r, body: s });
});
await page.route('**/@vite/client', route => route.fulfill({ contentType: 'application/javascript', body: 'export const createHotContext=()=>({on(){},accept(){},dispose(){},prune(){}}); export const updateStyle=()=>{}; export const removeStyle=()=>{};' }));
await page.goto('http://127.0.0.1:5193/jenkins-conservatory/');
await page.waitForFunction(() => window.tour);
await page.waitForTimeout(1200);

const result = await page.evaluate(() => {
  const out = { states: [] };
  const record = (label) => out.states.push({ label, step: tour.step, lesson: tour.lesson, tool: tour.tool, active: tour.active });
  record('fresh boot');
  // Tools refuse before their lesson: the net is lesson 4's.
  window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Digit2', key: '2', bubbles: true }));
  window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Digit2', key: '2', bubbles: true }));
  out.netRefusedEarly = tour.tool === 'rod';
  out.travelAtStep0 = tour.travel();
  // Walking completes lesson 0 through real input.
  window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyW', key: 'w', bubbles: true }));
  return out;
});

// The walk gate runs on frames; poll for the step change.
await page.waitForFunction(() => window.tour.step >= 1, null, { timeout: 40000 });
await page.evaluate(() => window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyW', key: 'w', bubbles: true })));

const result2 = await page.evaluate(() => {
  const out = {};
  out.walkedTo = { step: tour.step, lesson: tour.lesson };
  out.travelAtStep1 = tour.travel();
  // The car drive to the store completes lesson 1 on arrival.
  tour.enter('store');
  out.afterStoreArrival = { step: tour.step, lesson: tour.lesson };
  // A purchase completes lesson 2.
  tour.buy();
  out.afterPurchase = { step: tour.step, lesson: tour.lesson };
  // The rod unlocks with its lesson (3): pressing 1 now takes.
  window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Digit1', key: '1', bubbles: true }));
  window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Digit1', key: '1', bubbles: true }));
  out.rodUnlocked = tour.tool === 'rod';
  out.travelAtStep3 = tour.travel();
  // The remaining gates in sequence.
  tour.gate('caught-fish');
  out.afterFish = { step: tour.step, lesson: tour.lesson };
  // The magnifier is still locked before its own lesson (step 5); the rod is
  // the held tool here, and pressing 3 must leave it held.
  window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Digit3', key: '3', bubbles: true }));
  window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Digit3', key: '3', bubbles: true }));
  out.glassRefusedBeforeLesson = tour.tool === 'rod';
  // The net unlocks with lesson 4.
  window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Digit2', key: '2', bubbles: true }));
  window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Digit2', key: '2', bubbles: true }));
  out.netUnlocked = tour.tool === 'net';
  tour.gate('caught-animal');
  out.afterAnimal = { step: tour.step, lesson: tour.lesson };
  // The glass takes during its own lesson.
  window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Digit3', key: '3', bubbles: true }));
  window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Digit3', key: '3', bubbles: true }));
  out.glassUnlockedAtOwnLesson = tour.tool === 'magnifier';
  out.travelAtStep5 = tour.travel();
  tour.gate('caught-bug');
  out.afterBug = { step: tour.step, lesson: tour.lesson };
  // The zoo appears in the travel menu once its lesson is current.
  out.travelAtStep6 = tour.travel();
  tour.enter('zoo');
  out.afterZooArrival = { step: tour.step, lesson: tour.lesson };
  tour.gate('cleaned');
  out.afterCleaning = { step: tour.step, lesson: tour.lesson };
  out.travelAtStep8 = tour.travel();
  // Entering the lake starts the drive; the lesson must not complete yet.
  tour.enter('lake');
  out.afterLakeEntry = { step: tour.step, lesson: tour.lesson };
  // The drive's completion finishes the tour and hands over the tracker.
  tour.driveToEnd();
  out.afterDrive = { step: tour.step, active: tour.active, dialogHidden: tour.dialogHidden, cardHidden: tour.cardHidden };
  out.cardText = document.getElementById('commission-body').textContent.replace(/\s+/g, ' ').trim().slice(0, 60);
  return out;
});

console.log(JSON.stringify({ errors, result, result2 }, null, 2));
await browser.close();
const r = { ...result, ...result2 };
const checks = {
  noErrors: !errors.length,
  netRefusedEarly: r.netRefusedEarly,
  travelAtStep0: r.travelAtStep0.join() === 'forest',
  walkedTo1: r.walkedTo.step === 1 && r.walkedTo.lesson === 'zone-store',
  travelAtStep1: r.travelAtStep1.join() === 'forest,store',
  storeArrival: r.afterStoreArrival.step === 2,
  purchase: r.afterPurchase.step === 3,
  rodUnlocked: r.rodUnlocked,
  travelAtStep3: r.travelAtStep3.join() === 'forest,store',
  afterFish4: r.afterFish.step === 4,
  glassRefusedBeforeLesson: r.glassRefusedBeforeLesson,
  netUnlocked: r.netUnlocked,
  afterAnimal5: r.afterAnimal.step === 5,
  glassUnlockedAtOwnLesson: r.glassUnlockedAtOwnLesson,
  afterBug6: r.afterBug.step === 6,
  travelAtStep5: r.travelAtStep5.join() === 'forest,store',
  travelAtStep6: r.travelAtStep6.join() === 'forest,store,zoo',
  zooArrival: r.afterZooArrival.step === 7,
  cleaning: r.afterCleaning.step === 8,
  travelAtStep8: r.travelAtStep8.join() === 'forest,store,zoo,lake',
  lakeEntryDoesNotFinish: r.afterLakeEntry.step === 8,
  driveCompletesTour: r.afterDrive.step === 9 && !r.afterDrive.active && r.afterDrive.dialogHidden && !r.afterDrive.cardHidden,
  handoverNamesGrayson: r.cardText.toLowerCase().includes('grayson')
};
const failed = Object.entries(checks).filter(([, pass]) => !pass).map(([name]) => name);
console.log('checks failed:', failed.length ? failed.join(', ') : 'none');
if (failed.length) process.exitCode = 1;
