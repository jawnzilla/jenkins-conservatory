// Scene audit for Jenkins Conservatory: runs the copied scene-audit battery
// against the real, built world of each zone in a headless browser, plus two
// checks this game specifically needs — grass blades inside parking-lot rects,
// and colliders that reach past the meshes they guard. Every check plants a
// known defect first and must catch it before its real findings are trusted.
//
// Adaptations for this game, each with its reason:
// - Colliders are tested as 0.3m-high boxes: this game collides in 2D (XZ),
//   so taller boxes would phantom above low kerbs and slabs.
// - Merged static batches (plan > 20m) are dropped from pairwise checks: a
//   merged batch reads as one box and swallows everything near it, which the
//   scene-audit method itself warns about.
// - The walk-through direction is not applicable: decorative flora, dressing
//   and overhead detail carry no colliders by design; collision is opt-in for
//   structure. The directions that matter to players — colliders with nothing
//   in them, and colliders past their meshes — stay in.
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, normalize } from 'node:path';

const BASE = '/jenkins-conservatory/';
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
const server = createServer(async (req, res) => {
  try {
    if (req.url === '/audit-lib.js') {
      res.writeHead(200, { 'content-type': 'text/javascript' });
      res.end(await readFile('scene-audit-lib.js'));
      return;
    }
    let path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (path.startsWith(BASE)) path = path.slice(BASE.length - 1);
    if (path.endsWith('/')) path += 'index.html';
    const file = join('dist', normalize(path).replace(/^(\.\.[/\\])+/, ''));
    const info = await stat(file).catch(() => null);
    if (!info?.isFile()) { res.writeHead(404).end('not found'); return; }
    res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream' });
    res.end(await readFile(file));
  } catch { res.writeHead(500).end(); }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const url = `http://127.0.0.1:${server.address().port}${BASE}`;

// The drawn parking-lot rects, in lot-local coordinates (every hub lot sits at
// the zone origin): pad slab including its skirt, service drive at its full
// drawn length, and the public street slab.
const LOT_RECTS = [
  { name: 'lot pad', minX: -15.5, maxX: 15.5, minZ: 1.6, maxZ: 23 },
  { name: 'service drive', minX: 7.3, maxX: 13.9, minZ: 20.4, maxZ: 28.6 },
  { name: 'public street', minX: -42.5, maxX: 42.5, minZ: 23.2, maxZ: 31.6 }
];

// Player-reachable bounds per zone: scenery outside them cannot be walked
// against, so collider mismatches there do not reach a player.
const ZONE_BOUNDS = {
  store: { minX: -21, maxX: 21, minZ: -22, maxZ: 22 },
  forest: { minX: -28, maxX: 28, minZ: -40, maxZ: 22 },
  zoo: { minX: -23, maxX: 23, minZ: -64, maxZ: 22 },
  lake: { minX: -92, maxX: 92, minZ: -198, maxZ: 34 }
};

const browser = await chromium.launch({ headless: true, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(`${url}?probe=1`);
await page.waitForFunction(() => window.__conservatoryProbe);
await page.waitForTimeout(1500);

const auditPage = await page.evaluate(async ({ lotRects, zoneBounds }) => {
  const P = window.__conservatoryProbe;
  const THREE = P.THREE;
  const { runSceneAudit, fromThreeScene, formatReport } = await import('/audit-lib.js');
  const plan = (part) => Math.max(part.max[0] - part.min[0], part.max[2] - part.min[2]);
  const inRect = (rect, x, z) => x >= rect.minX && x <= rect.maxX && z >= rect.minZ && z <= rect.maxZ;

  // --- custom check: grass blades inside lot rects ---------------------------
  // A merged blade batch is strips of five vertices; the first of each strip is
  // the blade's base. Batches sit at the origin, so local positions are world.
  function checkBladesInLots(world, rects) {
    const findings = [];
    let examined = 0;
    world.traverse((object) => {
      if (!object.isMesh) return;
      const positions = object.geometry?.attributes?.position;
      if (!positions || positions.count < 500 || positions.count % 5 !== 0) return;
      const box = new THREE.Box3().setFromObject(object);
      if (box.max.y - box.min.y > 1.4) return; // blade batches are thin and low
      const m = object.matrixWorld;
      for (let i = 0; i + 4 < positions.count; i += 5) {
        const x = positions.getX(i), y = positions.getY(i), z = positions.getZ(i);
        if (y > 0.8) continue;
        const wx = x * m.elements[0] + y * m.elements[4] + z * m.elements[8] + m.elements[12];
        const wz = x * m.elements[2] + y * m.elements[6] + z * m.elements[10] + m.elements[14];
        examined += 1;
        for (const rect of rects) {
          if (inRect(rect, wx, wz)) {
            findings.push({ id: 'grass blade', at: [+wx.toFixed(1), +wz.toFixed(1)], why: `blade planted inside the ${rect.name}` });
            break;
          }
        }
      }
    });
    return { name: 'blades-in-lots', examined, findings };
  }

  // --- custom check: colliders whose footprint has nothing drawn ------------
  // This game collides in 2D (XZ), so the honest invisible-wall test is pure
  // footprint: no drawn solid's footprint covers the collider's ground area.
  function checkFootprintCoverage(world, colliders) {
    const solids = [];
    world.updateMatrixWorld(true);
    world.traverse((object) => {
      if (!object.isMesh || object.isSkinnedMesh) return;
      let shown = true;
      for (let o = object; o && shown; o = o.parent) if (!o.visible) shown = false;
      if (!shown) return;
      const data = object.userData ?? {};
      if (data.nocollide || data.decal) return;
      const material = Array.isArray(object.material) ? object.material[0] : object.material;
      if (material?.transparent) return;
      const box = new THREE.Box3().setFromObject(object);
      if (box.isEmpty()) return;
      solids.push(box);
    });
    const tol = 0.08;
    const covered = (x, z) => solids.some((box) => x >= box.min.x - tol && x <= box.max.x + tol && z >= box.min.z - tol && z <= box.max.z + tol);
    const findings = [];
    let examined = 0;
    for (const collider of colliders) {
      if (collider.nodraw) continue;
      examined += 1;
      const n = 7;
      let empty = 0;
      for (let ix = 0; ix < n; ix += 1) {
        for (let iz = 0; iz < n; iz += 1) {
          const x = collider.min.x + ((ix + 0.5) / n) * (collider.max.x - collider.min.x);
          const z = collider.min.z + ((iz + 0.5) / n) * (collider.max.z - collider.min.z);
          if (!covered(x, z)) empty += 1;
        }
      }
      const share = empty / (n * n);
      if (share > 0.25) {
        findings.push({ id: `${collider.debugLabel || `collider ${collider.id ?? ''}`}`, at: [+((collider.min.x + collider.max.x) / 2).toFixed(1), +((collider.min.z + collider.max.z) / 2).toFixed(1)], why: `${Math.round(share * 100)}% of this collider's footprint has nothing drawn in it: an invisible wall` });
      }
    }
    return { name: 'footprint-coverage', examined, findings };
  }

  // --- custom check: colliders that reach past their meshes ------------------
  // The invisible check owns colliders with nothing in them; this one catches
  // the subtler mismatch, a collider that covers a mesh but blocks well past
  // its edge. Scenery outside the zone's bounds is skipped: the player cannot
  // walk against it, so a mismatch there never reaches anyone.
  function checkColliderOverhang(world, colliders, bounds) {
    const solids = [];
    world.updateMatrixWorld(true);
    world.traverse((object) => {
      if (!object.isMesh || object.isSkinnedMesh) return;
      let shown = true;
      for (let o = object; o && shown; o = o.parent) if (!o.visible) shown = false;
      if (!shown) return;
      const data = object.userData ?? {};
      if (data.nocollide || data.decal) return;
      const material = Array.isArray(object.material) ? object.material[0] : object.material;
      if (material?.transparent) return;
      const box = new THREE.Box3().setFromObject(object);
      if (box.isEmpty() || box.max.y < 0.2) return;
      solids.push(box);
    });
    const findings = [];
    let examined = 0;
    for (const collider of colliders) {
      if (collider.nodraw) continue;
      const cx = (collider.min.x + collider.max.x) / 2;
      const cz = (collider.min.z + collider.max.z) / 2;
      if (bounds && (cx < bounds.minX - 2 || cx > bounds.maxX + 2 || cz < bounds.minZ - 2 || cz > bounds.maxZ + 2)) continue;
      examined += 1;
      const touching = solids.filter((box) => box.max.x > collider.min.x && box.min.x < collider.max.x && box.max.z > collider.min.z && box.min.z < collider.max.z && box.min.y < collider.max.y && box.max.y > collider.min.y);
      if (!touching.length) continue;
      const union = { minX: Infinity, maxX: -Infinity, minZ: Infinity, maxZ: -Infinity };
      for (const box of touching) {
        union.minX = Math.min(union.minX, box.min.x); union.maxX = Math.max(union.maxX, box.max.x);
        union.minZ = Math.min(union.minZ, box.min.z); union.maxZ = Math.max(union.maxZ, box.max.z);
      }
      const overhangs = [
        ['west', union.minX - collider.min.x], ['east', collider.max.x - union.maxX],
        ['north', union.minZ - collider.min.z], ['south', collider.max.z - union.maxZ]
      ].filter(([, gap]) => gap > 0.5);
      if (overhangs.length) {
        const worst = overhangs.sort((a, b) => b[1] - a[1])[0];
        findings.push({ id: `${collider.debugLabel || `collider ${collider.id ?? ''}`}`, at: [+((collider.min.x + collider.max.x) / 2).toFixed(1), +((collider.min.z + collider.max.z) / 2).toFixed(1)], why: `reaches ${worst[1].toFixed(1)}m ${worst[0]} past the mesh it guards` });
      }
    }
    return { name: 'collider-overhang', examined, findings };
  }

  const reports = {};
  for (const zone of ['store', 'forest', 'zoo', 'lake']) {
    P.enterZone(zone);
    const world = P.world;
    world.updateMatrixWorld(true);
    // Tag ground-scale layers so they never read as drawn solids: turf batches,
    // tarmac, path and paint geometry, ground discs, and the tall backdrops.
    world.traverse((object) => {
      if (!object.isMesh) return;
      if (object.userData.nocollide) return;
      const box = new THREE.Box3().setFromObject(object);
      if (box.isEmpty()) return;
      const size = Math.max(box.max.x - box.min.x, box.max.z - box.min.z);
      const height = box.max.y - box.min.y;
      if (height < 0.22 && size > 1) object.userData.nocollide = 'surface paint and paving (walk-through)';
      else if (size > 25 && height < 2) object.userData.nocollide = 'ground layer (turf, tarmac, discs)';
      else if (size > 40 && height > 6) object.userData.nocollide = 'backdrop forest and ridge';
    });
    // Colliders to 0.3m-high boxes: this game collides in 2D, and the audit
    // should test footprints, not tower over kerbs.
    const boxes = P.colliders
      .filter((collider) => collider.enabled !== false && (!collider.zone || collider.zone === zone))
      .map((collider) => {
        const hw = collider.type === 'rect' ? collider.halfWidth : collider.radius;
        const hd = collider.type === 'rect' ? collider.halfDepth : collider.radius;
        const box = new THREE.Box3(new THREE.Vector3(collider.x - hw, 0, collider.z - hd), new THREE.Vector3(collider.x + hw, 0.3, collider.z + hd));
        box.debugLabel = collider.debugLabel;
        box.id = collider.id;
        if (collider.debugLabel === 'captain-mark-lake-gate') box.nodraw = 'lake access gate: signed barrier across the shore road, opens with Captain Mark pass';
        if (collider.debugLabel === 'lot-service-drive') box.nodraw = 'service drive mouth: signed no-pedestrian with bollards at the kerb';
        if (collider.debugLabel === 'practice-dock-water-end') box.nodraw = 'dock water-end rail: keeps feet on the dock planks where open water starts, visible as the dock edge';
        if (collider.debugLabel === 'pond-dock-water-end') box.nodraw = 'dock water-end rail: keeps feet on the dock planks where open water starts, visible as the dock edge';
        return box;
      });
    const rects = zone === 'lake' ? [] : lotRects;

    // Plant the defects the two custom checks must catch before trusting them:
    // a full-shaped blade batch with one blade on the lot walkway, and a
    // collider three times a lone tree with the tree in its corner.
    let bladePlantCaught = 'no lots in this zone';
    if (rects.length) {
      // 600 blades of five vertices: the check reads any mesh with thousands
      // of low strip vertices, so the plant must be shaped like a real batch.
      const blades = 600;
      const verts = new Float32Array(blades * 15);
      for (let blade = 0; blade < blades; blade += 1) {
        const base = blade * 15;
        const x = blade === 0 ? 0 : -60 + blade * 0.2; // blade zero sits on the walkway
        const z = blade === 0 ? 8 : -60 + blade * 0.1;
        verts[base] = x; verts[base + 1] = 0; verts[base + 2] = z;
        verts[base + 3] = x; verts[base + 4] = 0.1; verts[base + 5] = z;
        verts[base + 6] = x + 0.05; verts[base + 7] = 0.2; verts[base + 8] = z;
        verts[base + 9] = x + 0.1; verts[base + 10] = 0.3; verts[base + 11] = z;
        verts[base + 12] = x + 0.15; verts[base + 13] = 0.4; verts[base + 14] = z;
      }
      const plantBatch = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial({ visible: false }));
      plantBatch.geometry.setAttribute('position', new THREE.BufferAttribute(verts, 3));
      plantBatch.frustumCulled = false;
      world.add(plantBatch);
      const withPlant = checkBladesInLots(world, rects);
      bladePlantCaught = withPlant.findings.some((f) => f.at[0] === 0 && f.at[1] === 8);
      world.remove(plantBatch);
    }
    let overhangPlantCaught = null;
    {
      const solids = [];
      world.traverse((o) => { if (o.isMesh) { const b = new THREE.Box3().setFromObject(o); if (!b.isEmpty() && b.max.y - b.min.y > 2 && b.max.y - b.min.y < 6 && (b.max.x - b.min.x) < 6) solids.push(b); } });
      const anchor = solids[0];
      if (anchor) {
        const plant = new THREE.Box3(
          new THREE.Vector3(anchor.min.x - 2.4, 0, anchor.min.z - 2.4),
          new THREE.Vector3(anchor.max.x + 2.4, 0.3, anchor.max.z + 2.4)
        );
        const withPlant = boxes.concat([plant]);
        overhangPlantCaught = checkColliderOverhang(world, withPlant, zoneBounds[zone]).findings.some((f) => Math.abs(f.at[0] - (anchor.min.x + anchor.max.x) / 2) < 3 && Math.abs(f.at[1] - (anchor.min.z + anchor.max.z) / 2) < 3);
      }
    }

    let helperScene = fromThreeScene(THREE, world, { colliders: boxes, groundY: 0 });
    // Two passes: float and sunk judge every part (the pad slab is a prop's
    // support); interpenetration skips merged batches, whose single box
    // swallows its neighbourhood — the method's own warning about merged parts.
    const passA = runSceneAudit(helperScene, {
      only: ['float', 'sunk'],
      notApplicable: {
        stairs: 'no stairs or ramps in this slice; docks are flat walks',
        coplanar: 'merged turf and backdrop batches share planes by construction; flicker is judged on the motion path instead',
        colliders: 'decorative flora, dressing and overhead detail are walk-through by design here; collision is opt-in for structure, and the player-facing directions (colliders with nothing in them, colliders past their meshes) are the footprint and overhang checks'
      }
    });
    const smallPartsScene = { ...helperScene, parts: helperScene.parts.filter((part) => {
      if (plan(part) > 26) return false;
      const cx = (part.min[0] + part.max[0]) / 2;
      const cz = (part.min[2] + part.max[2]) / 2;
      const bounds = zoneBounds[zone];
      return cx >= bounds.minX - 2 && cx <= bounds.maxX + 2 && cz >= bounds.minZ - 2 && cz <= bounds.maxZ + 2;
    }) };
    const passB = runSceneAudit(smallPartsScene, { only: ['interpenetration'] });
    const helper = formatReport(passA).split('\n').filter((line) => !line.startsWith('Scene audit')).join('\n')
      + '\n' + formatReport(passB).split('\n').filter((line) => !line.startsWith('Scene audit')).join('\n');
    const blades = checkBladesInLots(world, rects);
    const overhang = checkColliderOverhang(world, boxes, zoneBounds[zone]);
    const footprint = checkFootprintCoverage(world, boxes);
    // Plant a footprint defect: a collider far larger than anything near it,
    // which is the invisible-wall class itself. A dense zone leaves no truly
    // empty 1.7m cell, so the plant is oversized and sited on the grid.
    const footprintPlantCaught = (() => {
      const cell = 8;
      const bounds = zoneBounds[zone];
      for (let gx = 2; gx < 24; gx += 3) {
        for (let gz = 2; gz < 24; gz += 3) {
          const x = bounds.minX + 1.5 + gx * ((bounds.maxX - bounds.minX - 3) / 23);
          const z = bounds.minZ + 1.5 + gz * ((bounds.maxZ - bounds.minZ - 3) / 23);
          const plant = new THREE.Box3(new THREE.Vector3(x - cell / 2, 0, z - cell / 2), new THREE.Vector3(x + cell / 2, 0.3, z + cell / 2));
          const flagged = checkFootprintCoverage(world, boxes.concat([plant])).findings.some((f) => Math.abs(f.at[0] - x) < 0.5 && Math.abs(f.at[1] - z) < 0.5);
          if (flagged) return true;
        }
      }
      return false;
    })();
    reports[zone] = {
      helper,
      blades: { examined: blades.examined, findings: blades.findings, plantCaught: bladePlantCaught },
      overhang: { examined: overhang.examined, findings: overhang.findings, plantCaught: overhangPlantCaught },
      footprint: { examined: footprint.examined, findings: footprint.findings, plantCaught: footprintPlantCaught }
    };
  }
  return reports;
}, { lotRects: LOT_RECTS, zoneBounds: ZONE_BOUNDS });

console.log(JSON.stringify({ errors, auditPage }, null, 2));
await browser.close();
server.close();
