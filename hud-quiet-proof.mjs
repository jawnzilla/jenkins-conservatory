// Proof for the context-driven HUD: cards speak when they have something to
// say and go quiet on the half-second cadence; movement and tool switches
// bring them back. Runs the built bundle with real frames.
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, normalize } from 'node:path';

const BASE = '/jenkins-conservatory/';
const server = createServer(async (req, res) => {
  try {
    let path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (path.startsWith(BASE)) path = path.slice(BASE.length - 1);
    if (path.endsWith('/')) path += 'index.html';
    const file = join('dist', normalize(path).replace(/^(\.\.[/\\])+/, ''));
    const info = await stat(file).catch(() => null);
    if (!info?.isFile()) { res.writeHead(404).end('not found'); return; }
    res.writeHead(200, { 'content-type': { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' }[extname(file)] || 'application/octet-stream' });
    res.end(await readFile(file));
  } catch { res.writeHead(500).end(); }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));

const browser = await chromium.launch({ headless: true, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(`http://127.0.0.1:${server.address().port}${BASE}?probe=1`);
await page.waitForFunction(() => window.__conservatoryProbe);
await page.waitForTimeout(800);
await page.evaluate(() => window.__conservatoryProbe.onboarding.skip());

const cards = () => page.evaluate(() => JSON.stringify({
  status: document.getElementById('status-card').classList.contains('is-hud-quiet'),
  commission: document.getElementById('commission-card').classList.contains('is-hud-quiet'),
  equipment: document.getElementById('equipment-card').classList.contains('is-hud-quiet'),
  noise: document.getElementById('noise-card').classList.contains('is-hud-quiet'),
  noiseWord: document.getElementById('noise-value').textContent,
  pos: [Math.round(window.__conservatoryProbe.camera.position.x * 10) / 10, Math.round(window.__conservatoryProbe.camera.position.z * 10) / 10],
  clock: Math.round(window.__conservatoryProbe.gameClock())
}));

// Headless frame rate drifts, so every state is read at a game-clock target,
// not after wall time: the deadlines the design names are in game seconds.
const atClock = (target) => page.evaluate(async (t) => {
  while (window.__conservatoryProbe.gameClock() < t) await new Promise((r) => setTimeout(r, 200));
  return true;
}, target);

// Past the noise (4) and kit (8) deadlines, before the tracker's (14).
await atClock(10);
const quietState = JSON.parse(await cards());

// The lock hint's job: hidden while the field is held, back when it is not.
await page.click('canvas');
await atClock(12);
const lockedState = JSON.parse(await cards());

// A tool switch makes the kit card speak again.
await page.evaluate(() => window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Digit2', key: '2', bubbles: true })));
await page.evaluate(() => window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Digit2', key: '2', bubbles: true })));
await atClock(13.5);
const afterTool = JSON.parse(await cards());

// Movement raises noise, which speaks the spook meter. Walking noise needs
// ~2 game-seconds to cross the 0.25 band, so walk until clock 20.
await page.evaluate(() => window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyW', key: 'w', bubbles: true })));
await atClock(20);
const movingState = JSON.parse(await cards());
await page.evaluate(() => window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyW', key: 'w', bubbles: true })));
await atClock(26);
const settledState = JSON.parse(await cards());
await page.screenshot({ path: 'artifacts/review/hud-quiet.png' });

console.log(JSON.stringify({ errors, quietState, lockedState, afterTool, movingState, settledState }, null, 2));
await browser.close();
server.close();
const ok = !errors.length
  && quietState.noise && quietState.equipment && !quietState.commission && !quietState.status
  && lockedState.status
  && !afterTool.equipment
  && !movingState.noise
  && settledState.noise && settledState.commission;
if (!ok) process.exitCode = 1;
