# The winter survey

The commission chain is the tutorial: nine links that introduce every system
and end at the full survey. What was missing is everything after — the field
kept running, but the tracker went quiet and the coins had nowhere to go. The
winter survey is the board that never ends.

## The board

When the ninth commission signs off, Grayson posts the winter survey: five
goals drawn from the field's own verbs — land fish, catch small things, record
distinct species, gather sticks or stones, cook, clean, build. Five of eight
templates per board, in a seeded order, so board N is the same board for every
player and no two boards repeat the mix.

The rule that shapes everything else: **every goal counts work done while that
board is up.** Not lifetime totals — a finished record cannot claim boards it
did not play, because a fresh board starts every counter at zero. The distinct
species goal tracks which keys already counted on this board, so catching three
rabbits fills it by one.

## The loop

The left rail card — the same one the commissions lived in — becomes the survey
board, goal by goal with `have/need` tracks, and the journal gains a WINTER
SURVEY section. Field events tick it live: the same catches, gathers, dishes,
cleans and builds that already reported to the commission chain now report to
the board through `reportSurvey`. The moment the fifth goal fills, the board
pays its reward (240¢ plus 20¢ per goal), posts the next one by itself, and the
card never goes dark. There is nothing to hand in and no round can stall.

Economy: a board is worth 340¢ for roughly thirty to sixty minutes of mixed
fieldwork — ahead of idling, behind active commissions, and pointed at the
sinks the field already has (services, tools, the yard).

## Save

`save.survey` holds the live board (`null` before the chain completes and in
the moment between claim and re-post); `save.surveyCount` is the board index
and the seed. Old records gain both fields on load, and a pre-survey record
with the chain complete is offered its first board silently at boot.

## The day shift at Jenkins Lake

Building this surfaced a gap the old clock hid: a fresh record used to wake at
04:00, so the drive to Jenkins Lake was full of voices — rabbits, foxes, owls —
that are all off duty by day. With the field now waking at 09:00, the lake's
near-road fauna was silent all morning. The drive in gained a day shift:
sparrows in the road-side trees, two squirrels closer to the corridor, and a
turtle browsing by the gate shore. The wildlife-audio check's lake floor
(0.15 sounds/s) is met at 09:00 with margin, and a day visitor to the lake
hears a field rather than a diorama waiting for dusk.

## Verification

`test/survey.test.mjs` (pure, in-process, 19 checks): board shape and
seeding, per-board counters that a maxed record cannot pre-complete, distinct
keying, single-completion reporting, one-time claim payment, board-index
advance, and the untouched nine-commission chain. `survey-proof.mjs` drives the
built bundle end to end through the probe: the offer on chain completion, a
real event ticking a live goal, a full board paying 340¢ once and posting the
next board at zero, and the card and journal rendering it. `npm test` is 9/9
with the new suite.
