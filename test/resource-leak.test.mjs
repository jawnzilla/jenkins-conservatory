// Zone changes must not strand GPU resources. Fast travel is the core loop, so
// anything leaked per zone change is leaked continuously for the life of the tab.
// Before the teardown walk this grew by 11,158 geometries and 147 textures on
// every four-zone tour, without bound.
import { boot, ZONES } from './harness.mjs';

const TOURS = 4;
// The caches are meant to grow — they fill up with each zone's distinct shapes
// and then stop. What must not grow is the total resident count once every zone
// has been visited once, so growth is measured from the end of the first tour.
const GEOMETRY_DRIFT_LIMIT = 60;
const TEXTURE_DRIFT_LIMIT = 10;

const { page, errors, close } = await boot();

async function tour() {
  for (const zone of ZONES) {
    await page.evaluate((z) => window.__conservatoryProbe.enterZone(z), zone);
    await page.waitForTimeout(350);
  }
  return page.evaluate(() => window.__conservatoryProbe.resourceCensus());
}

const samples = [];
for (let index = 0; index < TOURS; index += 1) samples.push(await tour());

const baseline = samples[0];
const last = samples[samples.length - 1];
const geometryDrift = last.residentGeometries - baseline.residentGeometries;
const textureDrift = last.residentTextures - baseline.residentTextures;

console.table(samples.map((sample, index) => ({
  tour: index + 1,
  residentGeometries: sample.residentGeometries,
  residentTextures: sample.residentTextures,
  reachableGeometries: sample.reachableGeometries,
  reachableTextures: sample.reachableTextures
})));
console.log(`geometry drift after tour 1: ${geometryDrift} (limit ${GEOMETRY_DRIFT_LIMIT})`);
console.log(`texture drift after tour 1: ${textureDrift} (limit ${TEXTURE_DRIFT_LIMIT})`);

let failed = false;
if (geometryDrift > GEOMETRY_DRIFT_LIMIT) { failed = true; console.error('geometries are leaking across zone changes'); }
if (textureDrift > TEXTURE_DRIFT_LIMIT) { failed = true; console.error('textures are leaking across zone changes'); }
if (errors.length) { failed = true; console.error('page errors:', errors); }

await close();
if (failed) process.exitCode = 1;
else console.log('resource leak: no drift across zone changes');
