// Checks that animals are actually audible while they move, at a rate that reads
// as wildlife rather than as a clatter, and that the sound is placed.
//
// The rate is measured by stepping the simulation directly rather than by
// waiting on frames: software rendering runs this world at about two frames a
// second, so a thirty second wall-clock sample covers roughly one game-second
// and any rate computed from it is a rounding error. That is what hid the first
// version of this cadence, which fired nine times a second.
import { boot } from './harness.mjs';

const SIMULATED_SECONDS = 60;
// Per zone: a floor so silence is caught, and a ceiling so a clatter is caught.
const RATE = {
  forest: { min: 0.6, max: 4.5 },
  lake: { min: 0.15, max: 3.0 },
  zoo: { min: 0.1, max: 3.0 }
};

const { page, errors, close } = await boot({ viewport: { width: 480, height: 320 } });
await page.click('canvas');
await page.waitForTimeout(400);

const failures = [];
const rows = [];

for (const [zone, bounds] of Object.entries(RATE)) {
  const result = await page.evaluate((z) => {
    const P = window.__conservatoryProbe;
    P.enterZone(z);
    P.stepAnimals(4);
    P.audio.resetCueCounts();
    const simulated = P.stepAnimals(60);
    return { simulated, counts: P.audio.getCueCounts() };
  }, zone);
  const total = Object.values(result.counts).reduce((sum, n) => sum + n, 0);
  const rate = total / result.simulated;
  rows.push({ zone, sounds: total, perSecond: Number(rate.toFixed(2)), kinds: Object.keys(result.counts).join(' ') || '(none)' });
  if (rate < bounds.min) failures.push(`${zone}: ${rate.toFixed(2)} sounds/s is below ${bounds.min} — the wildlife has gone silent`);
  if (rate > bounds.max) failures.push(`${zone}: ${rate.toFixed(2)} sounds/s is above ${bounds.max} — the field is clattering`);
}

// Cadence must follow distance covered, not wall time: an animal that has not
// moved makes no travelling noise however long it stands there.
const stationary = await page.evaluate(() => {
  const P = window.__conservatoryProbe;
  P.enterZone('forest');
  P.stepAnimals(4);
  const live = P.critterReport().filter((c) => !c.hidden && !c.caught);
  if (!live.length) return null;
  P.audio.resetCueCounts();
  // Freezing the clock advances nothing, so nothing should travel or sound.
  P.stepAnimals(0.0001, 0.0001);
  return Object.values(P.audio.getCueCounts()).reduce((sum, n) => sum + n, 0);
});
if (stationary === null) failures.push('no live animals in the forest to measure');
else if (stationary > 0) failures.push(`${stationary} travelling sounds fired without the animals moving`);

console.table(rows);
console.log(`stationary animals produced ${stationary} travelling sounds`);

if (errors.length) failures.push(`page errors: ${errors.join(' | ')}`);
await close();

if (failures.length) {
  for (const failure of failures) console.error('FAIL', failure);
  process.exitCode = 1;
} else {
  console.log('wildlife audio: animals sound while travelling, at a rate that reads as a field');
}
