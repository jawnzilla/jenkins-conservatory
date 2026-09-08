// Guards the balance of the mix, which is the part of the audio that went wrong
// in play rather than in code: the wind bed's modulation depth was set as an
// absolute figure while its level was a small fraction, so the LFO added ±0.5 to
// a base of 0.16 and the bed swung from silence to three times its intended
// level on a sixteen second cycle. Nothing threw, every cue still fired, and the
// result was a loud slow whoosh over everything. Only measuring the output
// catches that, so this measures the output.
import { boot } from './harness.mjs';

// Ambience is a floor. Above these it starts competing with the cues.
const AMBIENT_RMS_CEILING = 0.02;
const AMBIENT_PEAK_CEILING = 0.09;
// The bed should breathe, not pump. Measured as the ratio of the 95th to the 5th
// percentile of short-window RMS rather than max/min: extremes over thousands of
// samples swing by a quarter between runs, and a flaky threshold is worse than
// none. The broken version measured about 3.2x on this metric.
const AMBIENT_SWING_CEILING = 2.1;
// Each cue's minimum headroom over the ambient floor, in dB.
const CUE_FLOOR_DB = {
  step: 18, stepSneak: 10, rustle6m: 18, hop8m: 8, wingbeat: 8, quack: 8, splash: 16
};
// Distance has to actually attenuate, or "placed" sound is decoration.
const MIN_FALLOFF_DB = 10;

const { page, errors, close } = await boot();
await page.click('canvas');
await page.waitForTimeout(700);

const measured = await page.evaluate(() => {
  const P = window.__conservatoryProbe;
  P.audio.measureMixLevel();
  // A backgrounded page clamps setTimeout to roughly a second, which makes any
  // timer-driven sampling loop unusably slow. The analyser is filled by the
  // audio thread, so a synchronous spin still reads fresh frames.
  const spin = (ms, onSample) => {
    const end = performance.now() + ms;
    let last = 0;
    while (performance.now() < end) {
      const at = performance.now();
      if (at - last >= 6) { last = at; onSample(P.audio.measureMixLevel()); }
    }
  };

  // The beds fade in from silence on arrival, so the first stretch is discarded
  // rather than counted as the low end of the swing.
  spin(2500, () => {});
  const rms = [];
  let peakMax = 0;
  spin(9000, (m) => {
    rms.push(m.rms);
    peakMax = Math.max(peakMax, m.peak);
  });
  rms.sort((a, b) => a - b);
  const percentile = (fraction) => rms[Math.min(rms.length - 1, Math.floor(rms.length * fraction))];
  const ambientRms = rms.reduce((sum, value) => sum + value, 0) / rms.length;
  const swing = percentile(0.95) / Math.max(1e-9, percentile(0.05));
  const samples = rms.length;

  // Cues are measured against silence so the figure is the cue, not the wind.
  P.audio.setAmbienceEnabled(false);
  spin(400, () => {});
  const peakOf = (fire) => { let peak = 0; fire(); spin(320, (m) => { peak = Math.max(peak, m.peak); }); return peak; };
  const cues = {
    step: peakOf(() => P.audio.playCue('step')),
    stepSneak: peakOf(() => P.audio.playCue('stepSneak')),
    rustle6m: peakOf(() => P.audio.playCueAt('rustle', { distance: 6, maxDistance: 26 })),
    rustle20m: peakOf(() => P.audio.playCueAt('rustle', { distance: 20, maxDistance: 26 })),
    hop8m: peakOf(() => P.audio.playCueAt('hop', { distance: 8, maxDistance: 20 })),
    wingbeat: peakOf(() => P.audio.playCueAt('wingbeat', { distance: 10, maxDistance: 30 })),
    quack: peakOf(() => P.audio.playCueAt('quack', { distance: 12, maxDistance: 34 })),
    splash: peakOf(() => P.audio.playCueAt('splash', { distance: 10, maxDistance: 40 })),
    beyondRange: peakOf(() => P.audio.playCueAt('rustle', { distance: 40, maxDistance: 26 }))
  };
  P.audio.setAmbienceEnabled(true);
  return { ambientRms, ambientPeak: peakMax, swing, samples, cues };
});

const failures = [];
const db = (value) => 20 * Math.log10(value / measured.ambientRms);

if (measured.ambientRms > AMBIENT_RMS_CEILING) failures.push(`ambient rms ${measured.ambientRms.toFixed(4)} over ceiling ${AMBIENT_RMS_CEILING}`);
if (measured.ambientPeak > AMBIENT_PEAK_CEILING) failures.push(`ambient peak ${measured.ambientPeak.toFixed(4)} over ceiling ${AMBIENT_PEAK_CEILING}`);
if (measured.swing > AMBIENT_SWING_CEILING) failures.push(`ambient swing ${measured.swing.toFixed(2)}x over ceiling ${AMBIENT_SWING_CEILING}x — the bed is pumping`);

for (const [name, minimum] of Object.entries(CUE_FLOOR_DB)) {
  const headroom = db(measured.cues[name]);
  if (headroom < minimum) failures.push(`${name} only ${headroom.toFixed(1)} dB over the floor, wanted ${minimum}`);
}

const falloff = db(measured.cues.rustle6m) - db(measured.cues.rustle20m);
if (falloff < MIN_FALLOFF_DB) failures.push(`distance attenuates only ${falloff.toFixed(1)} dB from 6m to 20m, wanted ${MIN_FALLOFF_DB}`);
if (measured.cues.beyondRange > measured.cues.rustle20m) failures.push('a cue past its max distance still made sound');

console.log(`ambient over ${measured.samples} samples: rms ${measured.ambientRms.toFixed(4)} (max ${AMBIENT_RMS_CEILING}), peak ${measured.ambientPeak.toFixed(4)} (max ${AMBIENT_PEAK_CEILING}), swing ${measured.swing.toFixed(2)}x (max ${AMBIENT_SWING_CEILING}x)`);
for (const [name, value] of Object.entries(measured.cues)) {
  console.log(`  ${name.padEnd(12)} ${value.toFixed(4)}  ${db(value).toFixed(1).padStart(6)} dB over floor`);
}
console.log(`  distance falloff 6m -> 20m: ${falloff.toFixed(1)} dB`);

if (errors.length) failures.push(`page errors: ${errors.join(' | ')}`);
await close();

if (failures.length) {
  for (const failure of failures) console.error('FAIL', failure);
  process.exitCode = 1;
} else {
  console.log('audio mix: ambience sits under the cues, placement attenuates with distance');
}
