// End-to-end proof for the winter survey in the real build: completing the
// commission chain posts the first board, real events tick the goals, and the
// moment the board completes it pays out and posts the next one.
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
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(`http://127.0.0.1:${server.address().port}${BASE}?probe=1`);
await page.waitForFunction(() => window.__conservatoryProbe);
await page.waitForTimeout(1500);

const result = await page.evaluate(() => {
  const P = window.__conservatoryProbe;
  const out = {};
  // Sign off the whole chain the way the game does, then ask for the offer.
  P.save.commissionsDone = ['first-cast', 'quiet-approach', 'small-things', 'clean-house', 'raw-materials', 'something-standing', 'after-dark', 'field-kitchen', 'full-survey'];
  P.commissions.check();
  out.surveyPosted = Boolean(P.survey.get());
  out.goalCount = P.survey.get()?.goals.length;
  out.reward = P.survey.get()?.reward;
  out.cardShowsSurvey = document.getElementById('commission-body').textContent.includes('Winter survey');
  // A real event through the wiring ticks a matching goal. The board is seeded,
  // so tick whichever goal it actually holds.
  const firstGoal = P.survey.get().goals[0];
  out.firstGoalEvent = firstGoal.event;
  const before = firstGoal.have;
  P.survey.report(firstGoal.event, firstGoal.event === 'species' ? 'proof-tick' : null);
  out.goalTicked = firstGoal.have === before + 1;
  // Complete every goal through the real reporter; the board pays once and
  // posts the next one by itself. reportSurvey is void by design, so the proof
  // of the claim is the payment and the fresh board, read after the fact.
  const coinsBefore = P.save.coins;
  const board = P.survey.get();
  for (const goal of board.goals) {
    while (board.goals.includes(goal) && goal.have < goal.need) {
      P.survey.report(goal.event, goal.event === 'species' ? `proof-${goal.have}` : null);
    }
  }
  out.paid = P.save.coins - coinsBefore;
  out.nextBoardPosted = Boolean(P.survey.get()) && P.survey.get().count === board.count + 1;
  out.nextBoardStartsAtZero = P.survey.get()?.goals.every((goal) => goal.have === 0);
  // The journal carries the survey section.
  document.querySelector('#journal-toggle-button').click();
  out.journalHasSurvey = document.getElementById('journal-body').textContent.includes('WINTER SURVEY');
  return out;
});
console.log(JSON.stringify({ errors, result }, null, 2));
await browser.close();
server.close();
if (errors.length || !result.surveyPosted || result.goalCount !== 5 || !result.cardShowsSurvey || !result.goalTicked || !result.paid || !result.nextBoardPosted || !result.nextBoardStartsAtZero || !result.journalHasSurvey) process.exitCode = 1;
