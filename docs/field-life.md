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

## Enclosures and the caretaker gate

The three showcase enclosures — meadow, pollinator and water wing — are fenced
off. `createFence` takes an optional `gate` (`{ offset, width }` in local x) that
splits the path-side rail into two spans and leaves a gap between them, marked
with taller posts, a threshold plank and a sign. Visitors and staff never route
inside: their waypoints were moved clear of the enclosure bounds rather than
relying on collision to hold them out.

Fixing this surfaced a long-standing collision bug. `resolveWorldCollisions`
only `continue`d out of the rect branch when the box test *hit*, so a rectangle
the player was clear of fell through to the circle test below and blocked them
anyway at `collider.radius`. Every rect collider in the game therefore had an
invisible circular bulge — which is what initially sealed the new gate shut, two
and a half metres in front of it. The rect branch now always continues.

## Brax's build yard

Fallen sticks and loose field stones now stack in `save.materials` as well as
paying out coins. `BUILD_PROJECTS` lists what they can become and what each
costs; `BUILD_SITES` are six plots behind the showcase, reached by a path down
the west side. Standing on a plot and pressing `E` opens the build menu for that
plot; `save.builds` maps plot id to project key, so what stands in the yard is
rebuilt from the save on every visit. Dismantling returns the full cost, so a
plot can be reworked freely.

The lantern post is the one project that carries a light. It follows the same
dusk curve as Brooks' lantern, in `updateBuildSites`.

## Sleeping

`dayTimeOffset` is a separate accumulator added to `elapsed` inside
`getDayPhase`. Sleeping moves that offset rather than `elapsed` itself, so a
night's sleep advances the sky and the animal schedules without also
fast-forwarding every respawn timer, cooldown and patrol hold in the world.

`advanceDayToPhase` always moves forward — picking a time earlier than now
sleeps through to that time tomorrow. Waking adopts the new period silently so
the ordinary dawn/dusk announcement does not fire on top of the wake-up message.

The clock label rounds to the nearest minute rather than flooring: the phase is
accumulated in floats, so an exact hour would otherwise land a hair under and
read as `:59`.

## Lights

An emissive material only *looks* bright; it illuminates nothing. Brooks'
lantern and the built lantern post each carry a `THREE.PointLight` alongside the
emissive glass, plus a translucent halo sphere so the source reads from a
distance. All three fade in together on `1 - currentDaylight`, with a small
two-frequency flicker, and sit fully dark through the middle of the day.

## Repairs made along the way

Several things in this area were referenced but never implemented, and had to be
built before the requested features could work:

- `DEFAULT_SAVE` had no `ingredients`, `cooked`, `records` or `honey`, so
  `save.ingredients[...]` threw on a fresh save — which took out the food hotkey
  and anything that read the larder.
- `buyShopDisplay`, `inspectFridge`, `cookAtStove`, `cookRecipe` and
  `sleepAtCabin` were all called from `handleInteract` but never defined, so the
  shop shelves and every fixture in the cabin threw on `E`.
- `pans` and `waders` were read all over the code but were in neither
  `DEFAULT_SAVE` nor `SHOP_ITEMS`, so they could not be obtained. Without a pan
  the stove could not cook, and since Captain Mark's gate wants a grilled fish
  and glazed carrots, Jenkins Lake was unreachable. Both are now on the shelves.
- `buyItem` re-opened the shop modal as its way of refreshing the counter list,
  which would have popped the modal open on a shelf purchase. The purchase is
  now split out into `applyPurchase`.
