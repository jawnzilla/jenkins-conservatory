// Pure logic, so this runs in-process with no browser and no build. It is the
// first check in the project that can: everything else has to drive a renderer.
import assert from 'node:assert/strict';
import {
  COMMISSIONS, getCommission, goalProgress, commissionProgress,
  isUnlocked, isComplete, openCommissions, trackedCommission,
  readyToClaim, overallProgress
} from '../src/commissions.js';

const checks = [];
function check(name, fn) { checks.push({ name, fn }); }

check('every commission has a unique id and at least one goal', () => {
  const ids = new Set();
  for (const commission of COMMISSIONS) {
    assert.ok(!ids.has(commission.id), `duplicate id ${commission.id}`);
    ids.add(commission.id);
    assert.ok(commission.goals.length > 0, `${commission.id} has no goals`);
    assert.ok(commission.title && commission.brief && commission.hint, `${commission.id} is missing copy`);
  }
});

check('every prerequisite names a commission that exists and comes earlier', () => {
  const seen = new Set();
  for (const commission of COMMISSIONS) {
    for (const id of commission.requires) {
      assert.ok(getCommission(id), `${commission.id} requires unknown ${id}`);
      // A requirement defined later in the array would be unreachable in play.
      assert.ok(seen.has(id), `${commission.id} requires ${id}, which comes after it`);
    }
    seen.add(commission.id);
  }
});

check('the chain is completable: every commission unlocks from a fresh save', () => {
  const save = { commissionsDone: [] };
  const remaining = new Set(COMMISSIONS.map((commission) => commission.id));
  let guard = COMMISSIONS.length + 1;
  while (remaining.size && guard-- > 0) {
    const open = openCommissions(save);
    assert.ok(open.length > 0, `stalled with ${remaining.size} commissions unreachable`);
    for (const commission of open) {
      save.commissionsDone.push(commission.id);
      remaining.delete(commission.id);
    }
  }
  assert.equal(remaining.size, 0, 'not every commission is reachable');
});

check('anyOf totals across the pool, distinct does not', () => {
  const save = { caught: { rabbit: 3 } };
  assert.equal(goalProgress({ kind: 'anyOf', pool: ['rabbit', 'squirrel'], count: 2 }, save).done, true);
  assert.equal(goalProgress({ kind: 'distinct', pool: ['rabbit', 'squirrel'], count: 2 }, save).done, false);
});

check('goal progress is clamped for display but keeps the raw count', () => {
  const progress = goalProgress({ kind: 'material', key: 'sticks', count: 10 }, { materials: { sticks: 25 } });
  assert.equal(progress.have, 10);
  assert.equal(progress.raw, 25);
  assert.equal(progress.done, true);
});

check('every goal kind reads the save field it claims to', () => {
  const save = {
    caught: { trout: 1, bee: 2 },
    materials: { stones: 4 },
    ingredients: { berries: 6 },
    cooked: { risotto: 1, glazedCarrots: 2 },
    builds: { 'site-1': 'cairn', 'site-2': 'bench' },
    cleanedEnclosures: { 'water-wing': true, aviary: false },
    coins: 300
  };
  assert.equal(goalProgress({ kind: 'distinctRecorded', count: 2 }, save).raw, 2);
  assert.equal(goalProgress({ kind: 'material', key: 'stones', count: 1 }, save).raw, 4);
  assert.equal(goalProgress({ kind: 'ingredient', key: 'berries', count: 1 }, save).raw, 6);
  assert.equal(goalProgress({ kind: 'cookedTotal', count: 1 }, save).raw, 3);
  assert.equal(goalProgress({ kind: 'builds', count: 1 }, save).raw, 2);
  assert.equal(goalProgress({ kind: 'cleanedEnclosures', count: 1 }, save).raw, 1);
  assert.equal(goalProgress({ kind: 'coins', count: 1 }, save).raw, 300);
});

check('an empty save reads as zero progress rather than throwing', () => {
  for (const commission of COMMISSIONS) {
    const progress = commissionProgress(commission, {});
    assert.equal(progress.complete, false, `${commission.id} completes on an empty save`);
    for (const goal of progress.goals) assert.equal(goal.have, 0);
  }
  assert.equal(trackedCommission({}).id, COMMISSIONS[0].id);
  assert.deepEqual(overallProgress({}), { done: 0, total: COMMISSIONS.length });
});

check('locked commissions stay closed until their prerequisites are done', () => {
  const gated = COMMISSIONS.find((commission) => commission.requires.length > 0);
  assert.equal(isUnlocked(gated, {}), false);
  assert.equal(isUnlocked(gated, { commissionsDone: gated.requires }), true);
});

check('a handed-in commission leaves the open list', () => {
  const first = COMMISSIONS[0];
  assert.ok(openCommissions({}).includes(first));
  const after = { commissionsDone: [first.id] };
  assert.equal(isComplete(first, after), true);
  assert.ok(!openCommissions(after).includes(first));
});

check('the tracker follows the commission nearest to finishing', () => {
  // Both open after the first link; only the bug survey has any progress.
  const save = { commissionsDone: ['first-cast', 'quiet-approach'], caught: { butterfly: 1 } };
  assert.equal(trackedCommission(save).id, 'small-things');
});

check('readyToClaim only reports commissions whose goals are actually met', () => {
  assert.deepEqual(readyToClaim({}), []);
  const save = { caught: { trout: 1 } };
  assert.deepEqual(readyToClaim(save).map((commission) => commission.id), ['first-cast']);
});

let failed = 0;
for (const { name, fn } of checks) {
  try {
    fn();
    console.log(`  pass  ${name}`);
  } catch (error) {
    failed += 1;
    console.error(`  FAIL  ${name}\n        ${error.message}`);
  }
}
console.log(`\ncommissions: ${checks.length - failed}/${checks.length} checks passed`);
if (failed) process.exitCode = 1;
