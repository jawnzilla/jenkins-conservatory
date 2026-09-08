// Shared plumbing for the browser-driven checks. Every script here boots the
// built app in Chromium, exposes the internals the checks need, and hands back
// a page. Keeping the boot in one place is what lets the checks run in CI: the
// port is allocated rather than hardcoded, and the browser binary is resolved
// from the environment instead of assumed.
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, normalize } from 'node:path';

const TYPES = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml',
  '.mp3': 'audio/mpeg', '.wav': 'audio/wav'
};

const BASE = '/jenkins-conservatory/';

// Serves ./dist so the checks exercise the same bundle the deploy publishes,
// rather than a dev server with its own module graph and transform pipeline.
export async function serveDist(root = 'dist') {
  const server = createServer(async (req, res) => {
    try {
      let path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
      if (path.startsWith(BASE)) path = path.slice(BASE.length - 1);
      if (path.endsWith('/')) path += 'index.html';
      const file = join(root, normalize(path).replace(/^(\.\.[/\\])+/, ''));
      const info = await stat(file).catch(() => null);
      if (!info?.isFile()) { res.writeHead(404).end('not found'); return; }
      res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream' });
      res.end(await readFile(file));
    } catch (error) {
      res.writeHead(500).end(String(error));
    }
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  return { server, origin: `http://127.0.0.1:${port}`, url: `http://127.0.0.1:${port}${BASE}` };
}

// Playwright's bundled browser revision moves with every minor release, so a
// pinned download is the first thing to break on a fresh machine or in CI.
// PLAYWRIGHT_CHROMIUM_PATH lets an image point at whatever it already has.
function launchOptions() {
  const executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH;
  return {
    headless: true,
    args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
    ...(executablePath ? { executablePath } : {})
  };
}

// The bundle keeps its internals module-private, which is correct for the app
// and useless for a test. Rather than reach inside, the checks ask the app to
// publish a read-only probe under a flag the production build never sets.
export async function boot({ viewport = { width: 1280, height: 800 } } = {}) {
  const hosted = await serveDist();
  const browser = await chromium.launch(launchOptions());
  const page = await browser.newPage({ viewport });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(`${hosted.url}?probe=1`);
  await page.waitForFunction(() => window.__conservatoryProbe, null, { timeout: 60000 });
  await page.waitForTimeout(1200);
  return {
    page,
    errors,
    async close() {
      await browser.close();
      await new Promise((resolve) => hosted.server.close(resolve));
    }
  };
}

export const ZONES = ['store', 'forest', 'zoo', 'lake'];
