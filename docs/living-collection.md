# The living collection: displays, the record wall, and visitor tips

The showcase had an aquarium and a pollinator garden, but nothing the player
brought back ever went on show — a conservatory that never conserved anything
you caught. This pass closes that loop, and finishes the store's record board
into a wall worth reading.

## The two stands

Two interactable stands live in the showcase zone:

- **Aquarium display stand** (`SHOWCASE_FISH_STAND`, west of the water wing's
  front glass). One caught fish — trout, sunfish, bass or crappie — swims with
  the tank's own circuit, a touch larger than the ambient fish, with a plaque
  on the glass: `BROOK TROUT · YOUR CATCH`.
- **Specimen pedestal** (by the pollinator garden). One caught small thing —
  butterfly, bee, dragonfly, caterpillar, spider or worm. Flying species circle
  the pedestal with their wings animated; ground species perch on it.

`save.showcase` holds `{ fish, bug }`, one species key per slot or `null`. It
merges per-key on load like the other bags, so an older record gains the field
without a migration. The stands always exist; with nothing eligible yet, the
menu says what to go and catch.

## The menu

`E` at a stand opens the living-collection modal (`#showcase-modal`, built on
the stove modal's styles). It lists every eligible species from the caught
record with the current display marked `ON DISPLAY`, plus a retire option.
Choosing a species is free and freely reversible: a display is a curation
choice, never a spend of the catch — `save.caught` is untouched, and retiring
leaves the record intact. The choice persists in the save and the displays are
rebuilt from it on every zoo build (`refreshShowcaseDisplays`).

## Visitor tips

A visitor who finishes a tour of the showcase while a display is live leaves a
coin for the conservatory: 3¢ with one display, 4¢ with both. The payout is
deliberately modest — a minute of fieldwork outearns it — so the reward is for
curating, not for idling. The toast names what was admired.

## The record wall

The store's `RECORD FISH` board is taller and now carries one row per species —
best weight each, strongest catch first, up to four — instead of a single
best-overall line. The per-record guard from the correctness pass still runs:
a drifted record with an unknown species or a non-numeric weight is skipped
rather than throwing inside `buildStore`. An empty board says
`LAND A FISH TO SET THE FIRST RECORD`. Rebuilding the wall disposes the plaque
sprites' unique canvas textures, so a season of visits does not eat a texture
per store entry.

## Journal

The field journal's FIELD RECORD section gained an `On display` row, so the
collection's public face is reviewable from anywhere.

## Verification

`showcase-proof.mjs` drives the built dev bundle end to end: both stands
exist after a zoo build; a placed trout and butterfly build with their
plaques; the display fish joins the tank's swim circuit; the real modal flow
swaps the display to bass through its own button; a visitor's departure pays
the tip with both displays live; and the record wall renders one row per
species. Captures of all three are in `artifacts/review/`
(`showcase-aquarium.png`, `showcase-pedestal.png`, `record-wall.png`).
`npm test` stays green across all eight checks, and the render budget still
passes with the two stands and displays in the zone.
