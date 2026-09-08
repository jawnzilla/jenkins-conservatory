// Drives the commission chain through the real game rather than the pure module:
// the reward has to land in the save, the tracker has to move on, and a fresh
// record has to start the walkthrough while a finished one does not.
import { boot } from './harness.mjs';

const { page, errors, close } = await boot();
const failures = [];

const start = await page.evaluate(() => {
  const P = window.__conservatoryProbe;
  // Start from a clean record so the assertions do not depend on a stored save.
  P.save.commissionsDone = [];
  P.save.caught = {};
  P.save.onboardingStep = 0;
  P.commissions.check();
  return {
    tracked: P.commissions.tracked()?.id,
    open: P.commissions.open(),
    onboarding: P.onboarding.active(),
    coins: P.save.coins
  };
});
if (start.tracked !== 'first-cast') failures.push(`fresh record tracks ${start.tracked}, expected first-cast`);
if (start.open.length !== 1) failures.push(`fresh record has ${start.open.length} open commissions, expected 1`);
if (!start.onboarding) failures.push('walkthrough is not showing on a fresh record');

// The card has to actually render what the tracker reports.
const cardVisible = await page.evaluate(() => {
  const card = document.querySelector('#commission-card');
  return { hidden: card.classList.contains('is-hidden'), text: card.textContent.replace(/\s+/g, ' ').trim() };
});
if (cardVisible.hidden) failures.push('commission card is hidden on a fresh record');
if (!cardVisible.text.includes('Grayson')) failures.push(`commission card does not name the giver: ${cardVisible.text}`);

// Meeting the goal must pay out and advance the chain.
const afterFish = await page.evaluate(() => {
  const P = window.__conservatoryProbe;
  const before = P.save.coins;
  P.save.caught.trout = 1;
  P.commissions.check();
  return {
    done: P.save.commissionsDone.slice(),
    paid: P.save.coins - before,
    worms: P.save.supplies.worms,
    tracked: P.commissions.tracked()?.id
  };
});
if (!afterFish.done.includes('first-cast')) failures.push('landing a fish did not complete first-cast');
if (afterFish.paid !== 45) failures.push(`reward paid ${afterFish.paid} coins, expected 45`);
if (afterFish.tracked !== 'quiet-approach') failures.push(`tracker moved to ${afterFish.tracked}, expected quiet-approach`);

// A commission must not pay twice, however many times the check runs.
const doubled = await page.evaluate(() => {
  const P = window.__conservatoryProbe;
  const before = P.save.coins;
  P.commissions.check();
  P.commissions.check();
  return P.save.coins - before;
});
if (doubled !== 0) failures.push(`re-checking paid another ${doubled} coins`);

// The card sits over the middle of the canvas on a small window, so it must not
// swallow the click that enters field mode — step one of the walkthrough asks
// for exactly that click. Only its buttons may take pointer events.
const clickThrough = await page.evaluate(() => {
  const panel = document.querySelector('.onboarding-panel');
  const copy = document.querySelector('#onboarding-copy');
  const next = document.querySelector('#onboarding-next');
  return {
    panel: getComputedStyle(panel).pointerEvents,
    copy: getComputedStyle(copy).pointerEvents,
    next: getComputedStyle(next).pointerEvents
  };
});
if (clickThrough.panel !== 'none') failures.push(`onboarding panel takes pointer events (${clickThrough.panel}); it would block entering field mode`);
if (clickThrough.next !== 'auto') failures.push(`onboarding next button cannot be clicked (${clickThrough.next})`);

// And the buttons still have to work at a small window size.
await page.setViewportSize({ width: 480, height: 320 });
await page.waitForTimeout(200);
await page.click('#onboarding-next');
const advanced = await page.evaluate(() => window.__conservatoryProbe.save.onboardingStep);
if (advanced < 1) failures.push('onboarding did not advance when its button was clicked at 480x320');
await page.click('canvas');
await page.waitForTimeout(200);

// The walkthrough has to finish and stay finished across a save round-trip.
const walkthrough = await page.evaluate(() => {
  const P = window.__conservatoryProbe;
  P.onboarding.skip();
  const hidden = document.querySelector('#onboarding').classList.contains('is-hidden');
  P.saveGame();
  return { active: P.onboarding.active(), hidden, reloadedStep: P.loadSave().onboardingStep };
});
if (walkthrough.active) failures.push('walkthrough still active after skip');
if (!walkthrough.hidden) failures.push('walkthrough card still visible after skip');
if (!(walkthrough.reloadedStep > 0)) failures.push('walkthrough position did not persist');

console.log(`fresh record: tracks ${start.tracked}, walkthrough showing`);
console.log(`after a catch: paid ${afterFish.paid}¢, now tracking ${afterFish.tracked}`);
console.log('re-checking pays nothing further; walkthrough persists as complete');

if (errors.length) failures.push(`page errors: ${errors.join(' | ')}`);
await close();

if (failures.length) {
  for (const failure of failures) console.error('FAIL', failure);
  process.exitCode = 1;
} else {
  console.log('progression: chain advances, rewards pay once, walkthrough persists');
}
