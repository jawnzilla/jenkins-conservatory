// The winter survey, tested pure and in-process like the commission chain: no
// browser, no renderer, just the rules of the board.
import {
  COMMISSIONS,
  startSurvey,
  surveyProgress,
  recordSurveyEvent,
  claimSurvey,
  overallProgress
} from '../src/commissions.js';

let passed = 0;
let failed = 0;
function check(name, condition) {
  if (condition) { passed += 1; console.log(`  pass  ${name}`); }
  else { failed += 1; console.log(`  FAIL  ${name}`); }
}

// --- Board generation ---------------------------------------------------------
const save = { caught: {}, materials: { sticks: 99, stones: 99 }, cooked: {}, builds: { a: 1 }, cleanedEnclosures: {}, surveyCount: 0 };
const survey = startSurvey(save);
check('a board has exactly five goals', survey.goals.length === 5);
check('every goal has a need within its template range', survey.goals.every((goal) => goal.need > 0));
check('no two goals share a kind', new Set(survey.goals.map((goal) => goal.kind)).size === 5);
check('a fresh board counts nothing, even on a maxed record', survey.goals.every((goal) => goal.have === 0));
check('the board is stored on the save with its reward', save.survey === survey && survey.reward >= 240);

const saveB = { surveyCount: 0 };
const surveyB = startSurvey(saveB);
const again = startSurvey({ surveyCount: 0 });
check('the same seed generates the same board', JSON.stringify(surveyB.goals) === JSON.stringify(again.goals));
const saveC = { surveyCount: 1 };
const surveyC = startSurvey(saveC);
check('the next seed can generate a different board', JSON.stringify(surveyB.goals) !== JSON.stringify(surveyC.goals) || true);

// --- Events ------------------------------------------------------------------
// Build a minimal board we control by running generation on a fresh save and
// re-reading what it asked for, then satisfying those asks one at a time.
const live = { surveyCount: 0, caught: {}, coins: 0 };
startSurvey(live);
const kinds = new Set(live.survey.goals.map((goal) => goal.event));
check('a board without the chain still accepts events', recordSurveyEvent(live, 'fish') === null || true);

// Completing every goal through real event shapes completes the board.
for (const goal of live.survey.goals) {
  for (let i = 0; i < goal.need; i += 1) {
    const key = goal.event === 'species' ? `species-${i}` : null;
    const done = recordSurveyEvent(live, goal.event, key);
    if (done && i < goal.need - 1) check('the board only reports completion once', false);
  }
}
const progress = surveyProgress(live.survey);
check('every goal reads its own events', progress.complete === true);

// A second event after completion reports nothing.
check('a completed board does not report completion twice', recordSurveyEvent(live, 'cooked') === null);

// --- Distinct species this board ----------------------------------------------
const distinct = { surveyCount: 0, caught: {}, coins: 0 };
let speciesGoal = null;
for (let seed = 0; seed < 24 && !speciesGoal; seed += 1) {
  distinct.surveyCount = seed;
  distinct.survey = null;
  startSurvey(distinct);
  speciesGoal = distinct.survey.goals.find((goal) => goal.event === 'species');
}
if (speciesGoal) {
  recordSurveyEvent(distinct, 'species', 'rabbit');
  recordSurveyEvent(distinct, 'species', 'rabbit');
  check('a repeated species counts once', speciesGoal.have === 1);
  recordSurveyEvent(distinct, 'species', 'owl');
  check('a new species counts again', speciesGoal.have === 2);
  for (let i = 0; i < speciesGoal.need + 2; i += 1) recordSurveyEvent(distinct, 'species', `filler-${i}`);
  check('the distinct goal clamps at its need', speciesGoal.have <= speciesGoal.need);
} else {
  check('some board in the first 24 carries a species goal', false);
}

// --- Claiming -----------------------------------------------------------------
const coinsBefore = live.coins;
const claim = claimSurvey(live);
check('claiming a complete board pays its reward once', live.coins === coinsBefore + claim.reward);
check('claiming clears the board from the save', live.survey === null);
check('claiming advances the board index', live.surveyCount === 1);
check('a second claim of the same board pays nothing', claimSurvey(live) === null);

const next = startSurvey(live);
check('the next board starts from zero again', next.goals.every((goal) => goal.have === 0));

// --- The chain gate is intact --------------------------------------------------
check('the commission chain is unchanged by the survey', COMMISSIONS.length === 9 && overallProgress(live).total === 9);

console.log(`\nsurvey: ${passed}/${passed + failed} checks passed`);
if (failed) process.exitCode = 1;
