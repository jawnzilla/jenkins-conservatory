// Proof for the ride-along view. The drive is stepped with explicit deltas so
// it runs identically regardless of frame rate: the player's yaw must follow
// the car's lagged heading, converge by the end, and ease back after a manual
// look offset. The QA skip (one large delta) must still complete instantly.
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
window.ride = {
  get yaw() { return yaw; }, set yaw(v) { yaw = v; },
  get heading() { return lakeArrival?.heading ?? null; },
  get progress() { return lakeArrival?.progress ?? null; },
  get active() { return Boolean(lakeArrival?.active); },
  step: (d) => updateJenkinsLakeArrival(d),
  enter: (z) => enterZone(z)
};`;
  await route.fulfill({ response: r, body: s });
});
await page.route('**/@vite/client', route => route.fulfill({ contentType: 'application/javascript', body: 'export const createHotContext=()=>({on(){},accept(){},dispose(){},prune(){}}); export const updateStyle=()=>{}; export const removeStyle=()=>{};' }));
await page.goto('http://127.0.0.1:5193/jenkins-conservatory/?probe=1');
await page.waitForFunction(() => window.ride);
await page.waitForTimeout(1200);

const result = await page.evaluate(() => {
  const out = { samples: [], converged: null, offsetEased: null };
  ride.enter('lake');
  out.started = ride.active;
  let maxDivergence = 0;
  let steps = 0;
  let lastActiveDivergence = null;
  while (ride.active && steps < 80) {
    ride.step(0.25);
    steps += 1;
    const divergence = Math.abs(ride.yaw - ride.heading);
    maxDivergence = Math.max(maxDivergence, divergence);
    lastActiveDivergence = ride.active ? divergence : lastActiveDivergence;
    if (steps % 8 === 0) out.samples.push({ step: steps, yaw: +ride.yaw.toFixed(2), heading: +ride.heading.toFixed(2), divergence: +divergence.toFixed(3) });
  }
  out.droveToEnd = !ride.active && steps > 40;
  out.finalDivergence = lastActiveDivergence;
  out.maxDivergence = maxDivergence;

  // A look offset eases back toward the road: nudge a radian, ride a second,
  // and most of it should be gone.
  ride.enter('lake');
  ride.yaw += 1.0;
  for (let i = 0; i < 4; i += 1) ride.step(0.25);
  out.offsetAfterOneSecond = Math.abs(ride.yaw - ride.heading);

  // The QA skip completes the drive in one call.
  ride.enter('lake');
  ride.step(14);
  out.skipWorks = !ride.active;
  return out;
});

fs.mkdirSync('artifacts', { recursive: true });
console.log(JSON.stringify({ errors, result }, null, 2));
await browser.close();
const ok = !errors.length
  && result.started
  && result.droveToEnd
  && result.finalDivergence < 0.05
  && result.maxDivergence < 0.6
  && result.offsetAfterOneSecond < 0.35
  && result.skipWorks;
if (!ok) process.exitCode = 1;
