# Field life: schedules, patrols, and visitors

Notes on the systems that decide who is out in the field at any given moment,
and how they are driven.

## The field clock

The sky already ran an eight-minute gradient cycle (`SKY_CYCLE_SECONDS`). That
same phase now drives a named period, so gameplay and the sky never disagree:

| Phase       | Period | Field clock   | Real time |
| ----------- | ------ | ------------- | --------- |
| 0.80 – 0.06 | night  | 23:12 – 05:26 | ~2m 05s   |
| 0.06 – 0.18 | dawn   | 05:26 – 08:19 | ~0m 58s   |
| 0.18 – 0.62 | day    | 08:19 – 18:52 | ~3m 31s   |
| 0.62 – 0.80 | dusk   | 18:52 – 23:12 | ~1m 26s   |

`DAY_HOUR_OFFSET` shifts phase 0 into the small hours so the readout lands on a
believable clock rather than starting the day at midnight.

`getDayPhase`, `getDayPeriod`, `getFieldClockLabel`, and
`getPeriodSecondsRemaining` are the only entry points anything else needs.
`updateDayCycleEvents` fires one toast per transition. The clock is shown in the
topbar and, in more detail, in the journal.

## Species schedules

Every entry in `SPECIES` carries an `activity` list of the periods it is awake
for. `isSpeciesActive` is the single check; `describeSpeciesActivity` turns the
list into the wording the journal shows ("Nocturnal · out from dusk").

Three consumers act on it:

- **Wild critters** (`updateCritters`) retire off-hours — `retireCritter` pulls
  the model out of the world without counting it as caught, and `respawnCritter`
  puts it back somewhere fresh once its period returns. Targeting filters skip
  hidden animals, so an off-duty animal can't be netted from its last position.
- **Bug traces** (`updateBugNodes`) hide their marker and drop any active reveal
  when the species is off-hours.
- **Showcase exhibits** (`updateZooAnimals`) stay on view — it is a showcase —
  but ease to a `rest` factor of 0.1: they settle lower, slow their circuit, and
  barely move their wings. `exhibit.travel` accumulates instead of reading
  `elapsed * speed` so the speed change eases in rather than snapping.

Every period keeps something catchable out: dawn is the broadest, night is the
narrowest, and the journal's activity board says which.

## Ground gaits

`GROUND_GAITS` holds the numbers that separate a fox from a squirrel. Both
alternate travel bursts with stationary beats; the difference is the tuning.

- **Fox**: long bursts (2.2–4.8s) at a steady 1.4 m/s, wide turn radius, legs
  swinging in diagonal pairs, nose dropping to sniff during pauses.
- **Squirrel**: short bursts (0.4–1.15s) at 2.7 m/s, hard direction changes,
  a bounding arc that lifts and pitches the whole body, front and hind legs
  paired, tail whipping over the back and flicking when frozen.

`poseGroundCritter` handles the pose for a given speed, so the flee state and
the food-attraction state reuse the same legs, head, and tail motion rather than
falling back to a static slide. Critter models set `rotation.order = 'YXZ'` so
the bounding pitch stays in the animal's own frame after it turns.

## Wings

Winged models register hinge groups in `userData.wings`, each tagged with the
side of the body it belongs to, plus `wingAxis`:

- `'z'` — wings reach out along ±X and roll about Z from the shoulder (owl,
  butterfly, sparrow). The pond duck is the exception: its wings are posed by
  `updateDuckFlightPose`, which handles the folded-to-spread transition instead.
- `'x'` — the body runs along X and the wings reach out along ±Z, hinging about
  X (bee, dragonfly).

Before this, the owl's wings were static boxes that were never registered at
all, and the butterfly's two flat panels pivoted about their own centres, which
swung their inner edges through the body. Both now hinge where a real wing does.
`wingPhase` lets fore and hind wings beat out of step, and `strength` lets a
resting exhibit hold its wings nearly still.

## Staff patrols

`STAFF_PATROLS` gives each of the three a loop that stays inside their own part
of the showcase — Brynlee west of the meadow, Brooks east by the pollinator
enclosure, Grayson on the central path. `updateFieldCharacters` walks the loop,
holds at each waypoint, turns to face the player inside 3.4 m so they are always
talkable, and drives a walk cycle off hip and shoulder pivots. The talk prompt's
`interactable.position` is updated every frame so it follows them.

`STAFF_SHIFTS` slows the naturalist and the researcher down after dark and the
guard down during the day; Brooks' lantern brightens as the light goes.

Arms only swing for a hand that is free: Brooks holds his lantern in his right
hand and Grayson holds a clipboard in both, so those arms stay welded to the
torso.

## Visitors

`VISITOR_ROUTES` describes an entry point in the parking lot, a gate just inside,
and a set of stops for the showcase and the depot. `spawnVisitor` picks two to
four stops at random, builds a plan (gate → stops → gate → entry), and
`updateVisitors` walks it, pausing at each stop and turning to face the player
when they are close. Reaching the end of the plan despawns the model and removes
its interactable.

`warmStart` drops one or two people in mid-visit when you arrive in a zone, so
the place is not empty for the minute it takes the first person to walk in from
the lot. After dark the cap drops to one and the interval stretches out.
