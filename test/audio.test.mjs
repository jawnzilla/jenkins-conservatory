// Audio is the easiest thing in the project to break without noticing, because
// nothing on screen changes when it stops working. These checks assert the
// engine actually starts, that the preference round-trips through the save, and
// that no cue throws — a cue that throws on the frame loop would take movement
// down with it.
import { boot } from './harness.mjs';

const { page, errors, close } = await boot();
const failures = [];

// A real gesture is required before any browser will open an AudioContext.
await page.click('canvas');
await page.waitForTimeout(400);

const ready = await page.evaluate(() => window.__conservatoryProbe.audio.isReady());
if (!ready) failures.push('audio engine did not start after a trusted gesture');

// Every cue in the palette, played back to back. Web Audio schedules rather than
// blocks, so this is fast, and any recipe with a bad node graph throws here.
const cueReport = await page.evaluate(() => {
  const names = [
    'step', 'stepSneak', 'stepDock', 'jump', 'land',
    'cast', 'bobber', 'bite', 'hookSet', 'reelClick', 'lineSnap', 'catch',
    'net', 'pickup', 'build', 'gate', 'coins', 'cook', 'engine',
    'ui', 'success', 'warning', 'denied', 'journal', 'objective'
  ];
  const broken = [];
  for (const name of names) {
    try {
      window.__conservatoryProbe.audio.playCue(name);
    } catch (error) {
      broken.push(`${name}: ${error.message}`);
    }
  }
  return { count: names.length, broken };
});
if (cueReport.broken.length) failures.push(`cues threw: ${cueReport.broken.join(', ')}`);

// Mute must reach the engine, persist to the save, and survive a reload.
const persisted = await page.evaluate(() => {
  const P = window.__conservatoryProbe;
  P.save.audioMuted = true;
  P.save.audioVolume = 0.42;
  P.saveGame();
  const reloaded = P.loadSave();
  return { muted: reloaded.audioMuted, volume: reloaded.audioVolume };
});
if (persisted.muted !== true) failures.push(`mute did not persist (got ${persisted.muted})`);
if (Math.abs(persisted.volume - 0.42) > 0.001) failures.push(`volume did not persist (got ${persisted.volume})`);

console.log(`audio engine started: ${ready}`);
console.log(`cues played without throwing: ${cueReport.count - cueReport.broken.length}/${cueReport.count}`);
console.log(`preferences persisted: muted=${persisted.muted} volume=${persisted.volume}`);

if (errors.length) failures.push(`page errors: ${errors.join(' | ')}`);
await close();

if (failures.length) {
  for (const failure of failures) console.error('FAIL', failure);
  process.exitCode = 1;
} else {
  console.log('audio: engine starts, all cues sound, preferences persist');
}
