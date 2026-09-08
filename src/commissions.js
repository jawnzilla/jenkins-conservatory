// ---------------------------------------------------------------------------
// Field commissions.
//
// The slice tracked a great deal — fish caught, species recorded, materials
// gathered, enclosures cleaned, dishes cooked, things built — and asked the
// player to do none of it. A new arrival landed in the forest holding a rod with
// no reason to prefer any one of a dozen systems over the others.
//
// Commissions are a goal layer over state that already exists. Nothing here
// simulates anything or writes to the world: a commission reads the save and
// says how far along it is. That keeps the chain honest — progress counts work
// the player actually did, including work done before the commission was
// offered — and it keeps this module pure, so it can be tested without a
// browser, a renderer, or a save file.
//
// The chain doubles as the tutorial. Each link introduces one system, in an
// order that builds on the last, which is why the goals are deliberately small
// early on and only widen once the player has met the mechanic.
// ---------------------------------------------------------------------------

const FISH = ['trout', 'sunfish', 'bass', 'crappie'];
const BUGS = ['butterfly', 'bee', 'dragonfly', 'caterpillar', 'worm', 'spider'];
const NOCTURNAL = ['owl', 'raccoon', 'fox', 'frog', 'rabbit'];

export const COMMISSIONS = [
  {
    id: 'first-cast',
    giver: 'Grayson',
    title: 'Something for the record',
    brief: 'Grayson wants one fish on the board before he writes up the season. Pick a rod, match a lure and bait, and find a disturbance on the water.',
    hint: 'Press 1 for the rod. Aim at a circular ripple, hold left click to cast, then set the hook when it bites.',
    requires: [],
    goals: [{ kind: 'anyOf', pool: FISH, count: 1, label: 'Land any fish' }],
    reward: { coins: 45, supplies: { worms: 4, spinner: 1 } }
  },
  {
    id: 'quiet-approach',
    giver: 'Brynlee',
    title: 'A quiet approach',
    brief: 'Brynlee will not sign off on your fieldcraft until you have taken an animal by hand. Move slowly — anything that hears you coming is gone.',
    hint: 'Hold Shift to halve your pace and your noise, press 2 for the net, then close in and left click.',
    requires: ['first-cast'],
    goals: [{ kind: 'anyOf', pool: ['rabbit', 'squirrel', 'sparrow'], count: 1, label: 'Net a rabbit, squirrel or sparrow' }],
    reward: { coins: 55, supplies: { nets: 2 } }
  },
  {
    id: 'small-things',
    giver: 'Grayson',
    title: 'The small things',
    brief: 'The invertebrate survey is short two entries. Grayson does not mind which, so long as they are properly observed rather than swiped at.',
    hint: 'Press 3 for the magnifying glass. Hold the focus steady through the timing event before you net.',
    requires: ['quiet-approach'],
    goals: [{ kind: 'distinct', pool: BUGS, count: 2, label: 'Record 2 different invertebrates' }],
    reward: { coins: 60, supplies: { magnifiers: 1 } }
  },
  {
    id: 'clean-house',
    giver: 'Brynlee',
    title: 'Nobody else is going to',
    brief: 'The showcase enclosures are behind on cleaning. The caretaker gates on the path side are there so you can get in without opening them to the public.',
    hint: 'Travel to the showcase and look for the marker over each enclosure. Use the gate on the path side.',
    requires: ['quiet-approach'],
    goals: [{ kind: 'cleanedEnclosures', count: 2, label: 'Clean 2 enclosures' }],
    reward: { coins: 70 }
  },
  {
    id: 'raw-materials',
    giver: 'Brax',
    title: 'Raw materials',
    brief: 'Brax is short on stock for the build yard. Fallen sticks and loose field stones are all over the field — the marked ones, not the scenery.',
    hint: 'Look for the LOOT markers on sticks and stones. Anything without a marker is not lootable.',
    requires: ['small-things'],
    goals: [
      { kind: 'material', key: 'sticks', count: 10, label: 'Gather sticks' },
      { kind: 'material', key: 'stones', count: 8, label: 'Gather field stones' }
    ],
    reward: { coins: 50 }
  },
  {
    id: 'something-standing',
    giver: 'Brax',
    title: 'Leave something standing',
    brief: 'Spend the stock. Brax does not care what goes up, only that the yard stops looking like an empty lot. Dismantling refunds the full cost if you change your mind.',
    hint: 'Talk to Brax in the build yard to open the menu. Every plot holds one project.',
    requires: ['raw-materials'],
    goals: [{ kind: 'builds', count: 2, label: 'Raise 2 builds in the yard' }],
    reward: { coins: 80, supplies: { lanternOil: 1 } }
  },
  {
    id: 'after-dark',
    giver: 'Brooks',
    title: 'After dark',
    brief: 'Brooks works the night watch and reckons you have only ever seen half the field. The animals keep their own hours — some of them are only out once the light goes.',
    hint: 'Sleep in the cabin bunk and pick a wake time, or wait for dusk. Brooks’ lantern and any lantern post you build will be lit.',
    requires: ['clean-house'],
    goals: [{ kind: 'anyOf', pool: NOCTURNAL, count: 2, label: 'Record 2 animals that are out after dark' }],
    reward: { coins: 90, supplies: { lanternOil: 2 } }
  },
  {
    id: 'field-kitchen',
    giver: 'Mara',
    title: 'The field kitchen',
    brief: 'Mara will trade properly once you have cooked something. Bring the stove two finished dishes — the ingredients are all out there.',
    hint: 'Gather ingredients in the field, then use the stove. F cycles the food you are holding.',
    requires: ['something-standing'],
    goals: [{ kind: 'cookedTotal', count: 2, label: 'Cook 2 dishes' }],
    reward: { coins: 100 }
  },
  {
    id: 'full-survey',
    giver: 'Grayson',
    title: 'The full survey',
    brief: 'The capstone. Grayson wants the season’s survey to stand on its own: ten distinct species, however you take them, across the whole field.',
    hint: 'Check the journal on J for what is out right now and what you are still missing.',
    requires: ['after-dark', 'field-kitchen'],
    goals: [{ kind: 'distinctRecorded', count: 10, label: 'Record 10 distinct species' }],
    reward: { coins: 220, supplies: { goldenSeeds: 2 } }
  }
];

const COMMISSION_BY_ID = new Map(COMMISSIONS.map((commission) => [commission.id, commission]));

export function getCommission(id) {
  return COMMISSION_BY_ID.get(id) || null;
}

function count(map, key) {
  return Number(map?.[key] || 0);
}

// How far one goal has come, read straight off the save. Every kind resolves to
// the same {have, need} shape so the caller never has to branch on the kind.
export function goalProgress(goal, save = {}) {
  const caught = save.caught || {};
  let have = 0;
  switch (goal.kind) {
    case 'anyOf':
      // Total taken across the pool: three rabbits satisfies "two of these".
      have = goal.pool.reduce((sum, key) => sum + count(caught, key), 0);
      break;
    case 'distinct':
      // Distinct entries in the pool: three rabbits does not.
      have = goal.pool.filter((key) => count(caught, key) > 0).length;
      break;
    case 'distinctRecorded':
      have = Object.values(caught).filter((value) => Number(value) > 0).length;
      break;
    case 'material':
      have = count(save.materials, goal.key);
      break;
    case 'ingredient':
      have = count(save.ingredients, goal.key);
      break;
    case 'cookedTotal':
      have = Object.values(save.cooked || {}).reduce((sum, value) => sum + Number(value || 0), 0);
      break;
    case 'builds':
      have = Object.keys(save.builds || {}).length;
      break;
    case 'cleanedEnclosures':
      have = Object.values(save.cleanedEnclosures || {}).filter(Boolean).length;
      break;
    case 'coins':
      have = Number(save.coins || 0);
      break;
    default:
      have = 0;
  }
  const need = goal.count;
  return { label: goal.label, have: Math.min(have, need), raw: have, need, done: have >= need };
}

export function commissionProgress(commission, save = {}) {
  const goals = commission.goals.map((goal) => goalProgress(goal, save));
  return { goals, complete: goals.every((goal) => goal.done) };
}

function completedIds(save = {}) {
  return new Set(save.commissionsDone || []);
}

export function isUnlocked(commission, save = {}) {
  const done = completedIds(save);
  return commission.requires.every((id) => done.has(id));
}

export function isComplete(commission, save = {}) {
  return completedIds(save).has(commission.id);
}

// Everything unlocked and not yet handed in, in chain order. More than one can
// be open at a time: the chain forks after the first two links so the player is
// never blocked behind a system they have not warmed to.
export function openCommissions(save = {}) {
  return COMMISSIONS.filter((commission) => !isComplete(commission, save) && isUnlocked(commission, save));
}

// What the HUD shows. The one nearest to finishing leads, so the tracker follows
// the player rather than the author's ordering; ties fall back to chain order.
export function trackedCommission(save = {}) {
  const open = openCommissions(save);
  if (!open.length) return null;
  let best = null;
  let bestRatio = -1;
  for (const commission of open) {
    const { goals } = commissionProgress(commission, save);
    const ratio = goals.reduce((sum, goal) => sum + goal.have / goal.need, 0) / goals.length;
    if (ratio > bestRatio) {
      bestRatio = ratio;
      best = commission;
    }
  }
  return best;
}

// Commissions whose goals are met but which have not been handed in yet. The
// caller pays these out; doing it here would mean mutating a save from a module
// that is meant only to read one.
export function readyToClaim(save = {}) {
  return openCommissions(save).filter((commission) => commissionProgress(commission, save).complete);
}

export function overallProgress(save = {}) {
  return { done: completedIds(save).size, total: COMMISSIONS.length };
}
