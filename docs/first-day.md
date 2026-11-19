# The first day: a forced tour through every zone

The original walkthrough was a manual you clicked past: five cards, nothing
locked, nothing performed. The new one is a forced sequence of nine lessons,
each completed by doing the thing in the world, and the tour drives through
every zone on the way — the Supply Depot, Northwater Field, the Conservatory
Zoo, and the lake road at the end.

## The lessons

| # | Gate | Lesson | Zone |
|---|---|---|---|
| 0 | `moved` | Click in, look around, walk ten metres | forest lot |
| 1 | `zone-store` | E at the car, drive to the depot | store |
| 2 | `purchased` | Buy bait from Mara or a shelf | store |
| 3 | `caught-fish` | Rod, bait and lure, cast, hook, reel | forest pond |
| 4 | `caught-animal` | Shift to sneak, net a small animal | forest |
| 5 | `caught-bug` | Lens on the pulse, seal the jar, net | forest |
| 6 | `zone-zoo` | Drive to the showcase | zoo |
| 7 | `cleaned` | One enclosure through its caretaker gate | zoo |
| 8 | `zone-lake` | Drive the lake road to the end | lake |

The gate completes the lesson and the card hands over to the next one; the
card's NEXT button no longer advances anything — it answers with the current
objective (`NOW:` line in the panel), because a tour that can be clicked
through is a manual again. Skip remains for anyone who wants the field
unlocked, and it opens everything at once.

## What is locked while the tour runs

- **Tools**: the rod, net and magnifying glass refuse to equip before their
  lessons (`ONBOARDING_TOOL_UNLOCK`), and their use sites (cast, swing,
  inspect) refuse independently, so a player who never presses the number keys
  still cannot skip ahead with the starting rod.
- **Travel**: the car's menu offers only the tour's stops — one new
  destination per lesson, visited zones kept open so the player can restock.
  The lake appears only when its lesson is current, and completing it waits
  for the drive itself to finish, not for the zone to load.
- **The car before lesson 0**: the lot must be walked first; the car answers
  with that instruction.

## The handover

The commission card is hidden while the tour runs — the walkthrough owns the
first day. Completing the lake drive ends the tour: the card comes back
naming Grayson's first commission, and `checkCommissions` runs so any work
done along the way (the first cast usually pays its 45¢ during lesson 3)
has already landed. The winter survey follows the chain exactly as before.

## Save compatibility

`save.onboardingStep` keeps its meaning — a 0-based number, `0` on a fresh
record, complete at the lesson count. A legacy record is anything without
`save.onboardingV2`: its stored step comes from the old five-card system (1
through 5), which would otherwise re-open the new tour mid-sequence, so the
load merge treats any legacy progress as complete and stamps the flag. Fresh
records and mid-tour reloads of the new system are unaffected: they carry the
flag and resume exactly at their lesson.

## Verification

- `test/progression.test.mjs` now asserts the forced contract on a fresh
  record: clicking the card states the objective and does not advance;
  walking the lot through real input does; skip persists.
- `walkthrough-proof.mjs` drives the whole tour end to end: every gate in
  order, the net refused before its lesson and accepted at it, the glass
  refused before its lesson and accepted during it, the travel menu offering
  exactly the tour's stops at each step, the lake entry not completing its
  lesson until the drive ends, and the handover — dialog hidden, commission
  card back, naming Grayson.
- `npm test` is 9/9.
