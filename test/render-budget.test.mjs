// Guards the draw-call and resource budget per zone. These numbers are the
// whole reason the geometry and material caches exist; without a check they
// drift back up one prop at a time.
import { boot, ZONES } from './harness.mjs';

// Ceilings sit above the measured values with room for content, but far below
// the pre-cache numbers (lake was 6,611 calls / 8,287 materials). A zone that
// blows through one of these has stopped sharing something it should.
// Measured after batching: 291 / 729 / 1758 / 2759 draw calls and
// 177 / 374 / 506 / 678 materials. Ceilings carry roughly 15% headroom for new
// content; the pre-cache figures were 313 / 991 / 2312 / 6611 calls and
// 843 / 1681 / 1864 / 8287 materials, so a regression past these is obvious.
const BUDGET = {
  store:  { drawCalls: 340, materials: 230 },
  forest: { drawCalls: 840, materials: 450 },
  zoo:    { drawCalls: 2020, materials: 600 },
  lake:   { drawCalls: 3180, materials: 800 }
};

const { page, errors, close } = await boot();
const rows = [];
let failed = false;

for (const zone of ZONES) {
  await page.evaluate((z) => window.__conservatoryProbe.enterZone(z), zone);
  await page.waitForTimeout(900);
  const census = await page.evaluate(() => window.__conservatoryProbe.resourceCensus());
  const budget = BUDGET[zone];
  const ok = census.drawCalls <= budget.drawCalls && census.reachableMaterials <= budget.materials;
  if (!ok) failed = true;
  rows.push({
    zone,
    drawCalls: census.drawCalls,
    maxDrawCalls: budget.drawCalls,
    materials: census.reachableMaterials,
    maxMaterials: budget.materials,
    triangles: census.triangles,
    ok: ok ? 'pass' : 'FAIL'
  });
}

console.table(rows);
if (errors.length) { failed = true; console.error('page errors:', errors); }
await close();
if (failed) { console.error('render budget exceeded'); process.exitCode = 1; }
else console.log('render budget: all zones within budget');
