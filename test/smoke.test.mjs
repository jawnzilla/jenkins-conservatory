// Boots every zone and checks that the world actually got built and that the
// systems the batching and teardown work touches are still intact. This is the
// check that would catch a scenery producer whose props stopped reaching the
// world, or a collider set that stopped being registered.
import { boot, ZONES } from './harness.mjs';

const { page, errors, close } = await boot();
const failures = [];
const rows = [];

for (const zone of ZONES) {
  await page.evaluate((z) => window.__conservatoryProbe.enterZone(z), zone);
  await page.waitForTimeout(600);
  const state = await page.evaluate(() => {
    const P = window.__conservatoryProbe;
    let meshes = 0;
    P.world.traverse((object) => { if (object.isMesh) meshes += 1; });
    return {
      zone: P.currentZone,
      meshes,
      colliders: P.colliders.length,
      interactables: P.interactables.length,
      // A sprite left behind by the batcher is the specific failure mode worth
      // watching: labels have no geometry to merge and are easy to drop.
      sprites: (() => { let n = 0; P.world.traverse((o) => { if (o.isSprite) n += 1; }); return n; })()
    };
  });
  rows.push(state);
  if (state.zone !== zone) failures.push(`${zone}: enterZone landed on ${state.zone}`);
  if (state.meshes < 100) failures.push(`${zone}: only ${state.meshes} meshes built`);
  if (state.colliders < 10) failures.push(`${zone}: only ${state.colliders} colliders registered`);
  if (state.interactables < 1) failures.push(`${zone}: no interactables registered`);
  if (state.sprites < 1) failures.push(`${zone}: no label sprites survived the static batcher`);
}

// Saving and reloading has to round-trip, since the save is the only thing that
// survives a session and there is no server copy of it.
const roundTrip = await page.evaluate(() => {
  const P = window.__conservatoryProbe;
  P.save.coins = 4242;
  P.saveGame();
  return P.loadSave().coins;
});
if (roundTrip !== 4242) failures.push(`save round-trip returned ${roundTrip}, expected 4242`);

console.table(rows);
if (errors.length) failures.push(`page errors: ${errors.join(' | ')}`);
await close();

if (failures.length) {
  for (const failure of failures) console.error('FAIL', failure);
  process.exitCode = 1;
} else {
  console.log('smoke: all zones build, save round-trips');
}
