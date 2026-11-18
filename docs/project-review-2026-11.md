# Jenkins Conservatory — project review

Reviewed 18 November 2026, against the `main` commit `50cc71a` ("Merge audio mix fix
and movement sound"). The live Pages deploy was verified byte-identical to the local
build of this commit (same `index-C59bPBCu.js` / `index-A3v_vKUL.css` asset hashes),
so everything below describes what players get today.

## Method and evidence

- **Code review**: all 9,246 lines of `src/main.js`, plus `src/audio.js`,
  `src/commissions.js`, `index.html`, the test harness, and the four `docs/` notes.
- **Play through the real route**: cold load, the five-step first-run walkthrough,
  field mode, walking, journal, zone travel, from the built bundle served exactly as
  the deploy serves it.
- **Checks**: the full `npm test` suite (8/8 green), plus `visual-qa.mjs`,
  `asset-audit-qa.mjs` (23 captures), `feedback-qa.mjs` (six screen sizes), and a
  purpose-built day/night + HUD capture pass (`review-capture.mjs`, 14 frames,
  artifacts in `artifacts/review/`).
- **Live instrumentation**: real-GPU frame sampling per zone, a boot trace, a
  resource census per zone, console-error watch (zero errors on every route taken),
  and a Lighthouse pass (accessibility / best-practices / SEO all 1.0).
- **Independent visual judge**: a vision model reviewed the 43 captures against the
  nineteen-tell checklist without seeing this document; its verdicts are folded in
  below with attribution.

Everything marked *observed* below was seen on the running build; code-level findings
cite file and line. Items I could not verify from this machine (sound feel, motion at
speed, real-phone behavior) are marked **unverified** rather than assumed good.

## Where the project stands

This is a coherent, unusually well-maintained slice. The things that usually rot are
rot-free here, and they are worth naming because every future change inherits them:

- **All checks green, and the checks are real.** The suite drives the built bundle in
  a real browser: render budget per zone, GPU resource drift across zone changes, a
  smoke pass over every zone, the audio engine and mix levels, the commission chain
  pure and in-process, and the progression flow end to end. `resource-leak.test.mjs`
  (resident vs reachable GPU objects) is the kind of instrument most projects never build.
- **Zero console errors** on every route taken — cold boot, four zones, day and night,
  journal, six emulated screen sizes.
- **Disposal discipline.** `releaseZoneResources` walks and disposes geometries,
  materials and label textures on every zone switch; shared caches are marked and
  survive. Four tours of all four zones show zero geometry or texture drift.
- **A working goal layer.** Nine commissions that introduce systems in a sensible
  order, read progress off work already done, and fork so no one system blocks.
  Progression pays once and persists — verified by the progression check.
- **Procedural audio with a real mix.** Distance falloff, stereo pan from the
  listener's frame, a per-frame cue budget, ambience beds under the cues. The
  audio-mix check measures the actual mix (ambience RMS 0.0068 under cues at
  −61 dB floor distance roll-off) rather than trusting the code.
- **Save hygiene.** Three slots, legacy key preserved for existing players, guarded
  `localStorage` access everywhere, saves carry the time of day.
- **Frame rate on a real GPU** (1440p-class, this machine): forest 144 fps, store
  144 fps, lake 89 fps (11.2 ms avg, p95 14 ms), zoo 64 fps (15.6 ms avg, p95 21 ms).
  The lake carries ~2427 draw calls and 741k triangles at 89 fps because the ground
  cover is merged; the zoo's separately-drawn exhibits make it the heaviest *feeling*
  zone even though it is not the largest.
- **Boot**: 272 KB gzip JS, one long task of ~850 ms (module parse/eval), then the
  zone build and first frame. To playable in roughly two seconds on this machine —
  honest for a single-bundle Three.js game.

## Aspects that could be improved

Ordered so the top of each list is both impactful and low-risk. Line references are
`src/main.js` unless stated.

### 1. Correctness — two dead or dying systems and one crash class

- **The beehive system is silently dead.** `updateBeehives` (2771) is defined and
  never called — `animate()` calls `updateTreeInteractions` (9387) but nothing calls
  the hive updater. Consequences, all verified by reading: hive sizes never scale
  with bee/flower counts, the "HIVE" labels never hide at distance, and — the real
  loss — **the honey drip never comes back after you loot it** (`lootHive` hides the
  drip at 2790; only the dead function would restore it at 2778). Honey is an
  ingredient in the recipe that gates Captain Mark's lake, so this is a gameplay
  regression hiding as dead code. One-line fix: call it from `animate()`.
- **`refreshStoreRecordBoard` can brick the store zone on a drifted save** (3361):
  `records.sort(...)` then `SPECIES[best.species].label` with no guard — one record
  with an unknown species key or missing weight throws during `buildStore`, and
  nothing catches zone-build errors (the boot/`enterZone` path has no try/catch), so
  the loading screen never lifts. Guard the record fields like `formatFishRecord`
  already does (6880).
- **Nothing catches zone-build or boot errors.** A throw anywhere in a builder (see
  above) leaves the player on the loading screen with a console error only. One
  try/catch around the `enterZone` build with a visible "the field failed to build"
  message would convert a hard hang into a reportable failure.
- **Two footguns waiting for a future edit**: the lake building-footprint table at
  5667–5673 duplicates the four `createLake*` call sites (5899–5903) — change one,
  forget the other, and flora grows through walls; and the zone-eligibility literal
  `['forest','zoo','lake']` is re-typed at ~20 call sites (6734, 6969, 7054, 7834,
  8028, 9268…), so adding a zone means hunting all of them. One named constant each.
- **Species sigils collide** (`◒` is both bass and duck at 215/225; `⌁` both sparrow
  and dragonfly at 224/228) — cosmetic, but the collection screen is where a player
  stares.
- **Brynlee's caretaker shift writes the whole save to `localStorage` every 3
  seconds** (9055–9059 → `setAllHabitatsClean` → unconditional `saveGame` at 9052),
  ~300 synchronous writes per 15-minute shift with nothing changing. Guard on
  "already clean, skip."

### 2. Performance — the frame is good, the headroom is thin in the zoo

The suite's render budget is met everywhere, but the per-frame paths carry avoidable
allocation and O(n²) work that a weaker shared GPU will feel first in the zoo:

- **Six `new THREE.Color` per frame in the sky** (1200–1224, `updateSkyCycle` runs
  unconditionally from `animate`): ~360 allocations/second forever. Hoist scratch
  colors like the existing `tempVector` pattern (465–470).
- **~264 `new THREE.Vector3` per frame while the net is held** (`gridPoint` 989 →
  `updateLooseNet` 980–1013): two scratch vectors remove all of it.
- **O(n²) aim targeting inside the critter loop** (7560): `getNetCritterTarget()`
  re-filters, re-sorts and angle-tests every critter, once per critter per frame,
  and again from `updateCrosshair` (7835). Hoist one call above the loop. With ~25
  critters this is ~25 full passes per frame for one boolean.
- **Per-frame array churn**: `getInteractionTarget` (7820) maps/filters/sorts the
  whole interactables list every frame; `getAimedHotspot` (7160) re-allocates
  `hotspots.map(...)`; `updatePollinatorGarden` filters per frame (3167).
- **Collision is a full linear scan per frame** (824–862) against 1,000+ colliders
  in the lake zone. A bucketed grid already exists in this file for placement
  (4219–4270) and is thrown away after dressing — keep one alive for runtime.
- **DOM writes every frame** (`updateActionDock` 9412, `updateFishingTips` 9413) and
  `updateCameraRotation` called twice per frame (9374 and 9414); `updateCrosshair`
  runs its raycasts even while a modal is open (7832).
- **Zone rebuild is a synchronous hitch on every fast-travel** (the lake build is
  ~1.2 s). The loading veil covers the first one, but car travel does not veil the
  rebuild. Not urgent; worth a frame-budget yield during builds if travel feels
  sticky on weak machines.

### 3. Architecture — one 9,246-line file

`main.js` is well-commented and internally consistent, but it is one flat module:
93 data tables, ~91 module-scope `let`s, 378 functions, and a hand-maintained
`resetWorld` list (6543–6597) that must grow whenever a new registry appears. The
file already has natural seams, and the probe plus the test suite make a split
low-risk if done in order:

1. `data.js` — the 93 constant tables (pure data, zero risk)
2. `three-kit.js` — geometry/material caches, primitive helpers, labels, grass
   batch, static batching (stateless given `world`)
3. `save.js` — slots, load/merge, profile UI (already a cohesive cluster)
4. `zones/` — the four builders behind a shared `ctx`
5. `systems/` — fishing, wildlife (the probe's `stepAnimals` proves it is
   separable), traffic, interaction dispatch

Also worth one small rewrite whenever touched: `handleInteract` (9149) is a
19-branch type chain that wants to be a table; `createAnimalModel` (6219) is a
20-branch species factory that wants to be a registry.

### 4. Look and player experience — the first frame, the horizon, the aim, the phone

- **The horizon is abrupt and the day reads pale.** The visual judge's single
  largest gap, and the one I would do first: distance fog blending the world into
  the sky color, a gentle grade on the day frames, and tint variation within the
  flat-shaded style (per-zone grass/water palettes already exist to vary). The
  pond view a player fishes from — near-uniform turquoise water against a hard
  backdrop — is the frame that most needs it. Nothing here changes the chosen
  low-poly style; it finishes it.
- **The first frame a stranger sees is a night scene.** A fresh save starts at
  04:00 (phase 0 + the 4-hour readout offset), so the very first impression of the
  game is a dark field. The world is built for daylight (butterflies, the showcase,
  grass color) and the night assets (lanterns, owls) are better shown *after* the
  player can see the field. Starting at, say, 09:00 costs nothing and shows the
  game's best face; night becomes something the day eases into.
- **The zone names read oddly in the top bar**: "LAKE FOREST" (line 40) is the
  *forest* zone, which sits next to a zone actually called "JENKINS LAKE" (62).
  A new player reading the HUD cannot tell which lake they are in. "NORTHWATER
  FIELD" or "THE WOODS" for the forest zone would disambiguate.
- **No keyboard look.** Movement, tools and menus are fully keyboard-driven, but
  aiming (casts, netting, the magnifier) is mouse-only — there is no arrow-key or
  keypad look. A keyboard-only player can walk but cannot play. The fallback
  pointer mode (9547) is a good start; a hold-to-turn key pair would finish it.
- **Both minigames are pointer-only**: the bug-drag observation (7073–7111) and the
  aquarium smudge round (6125) have no keyboard alternative.
- **Touch is unverified and partly unsupported.** The HUD is genuinely responsive
  (feedback-qa confirms no overflow at 390×844 down to 320×568, dock and crosshair
  placed), but there is no virtual joystick or touch look, and the docs themselves
  say the checks are "desktop Chromium emulation, not a physical phone gameplay
  certification." Real Safari/Android play is **unverified**.
- **Reduced motion covers CSS only** (style.css 1532–1541). Camera bob (7775),
  critter gaits, cloud drift and the sleep veil do not consult
  `prefers-reduced-motion`.
- **Modals don't restore focus** to the control that opened them (canvas re-focus
  only), and don't trap focus inside themselves.
- Lighthouse scores 1.0 on accessibility, best practices and SEO — the automated
  layer is genuinely clean (ARIA roles, live regions, labels all present). The gaps
  above are the ones automation cannot see.

### 5. Depth and economy — the chain ends, the coins pile up

- **The commission chain is the whole arc, and it ends** at `full-survey`
  (commissions.js 110). After that the tracker goes quiet: no daily board, no
  repeatable work, no season two. The systems all still run — that is a lot of
  machinery with nothing left to point at it.
- **Coins have no long-term sink.** Payouts total ~770¢ across the chain and
  repeatables (fish, loot) keep adding; the only sinks are a handful of tools and
  the two service retainers (golden seeds, lantern oil). A rich player has nothing
  to buy.
- **The services are shallow loops**: buy golden seeds → habitats auto-clean for
  15 minutes; buy lantern oil → Brooks patrols at night. Nothing in the world
  visibly changes (no new visitors, no new species) so there is little reason to
  keep paying.
- **Fish records are tracked but almost invisible**: per-species best weight/size
  live in `save.records` and surface only as one store-board label. There is a
  whole collection-completion channel (19 species, 4 recipes, 6 build projects,
  3 enclosures) with no scoreboard of its own.

## Independent visual judge (vision model, fresh context, 43 captures)

A separate vision-model agent reviewed the captures without seeing this document,
scoring bluntly. Its verdicts, with two corrections from re-verification, are
folded in below. The same frames are in `artifacts/contact-sheet.html`.

**Scores by eye.** First impression 4/10. Zone day frames 4–5/10
(store 4, forest 5, zoo 4, lake 5); the two player-view HUD frames 5 (day) and
4 (night). Context worth keeping in mind: the four zone frames are high survey
angles copied from the project's own audit set — the judge itself noted "the zone
images use an unusually high survey view," and the game is played at ground level.
The player's actual frame is the HUD pair.

**Cheap tells — absent** (each cited to a capture): primitive stand-ins (#1), flat
light (#3 — directional shadows and Brooks' lantern pool both read), an empty
world (#5), a black or blown-out held item (#14 — the rod reads brown and
legible), and a body no person has (#19 — all four staff plus Captain Mark have
connected limbs; the first-person hand is mitten-like but nothing is broken).

**Cheap tells — present, with corrections:**

- *Default materials (#2) and missing post (#4).* Fair as texture, with one
  caveat: this world is deliberately untextured flat-shaded solids — the project's
  own headers say so — and a chosen style is the style, not a defect. What
  survives the caveat is still worth acting on: the day frames read pale and
  ungraded with an abrupt horizon, and one flat color per surface leaves the
  water as the judge put it — "a large, nearly uniform turquoise surface."
  Distance fog toward the sky color, a subtle grade, and per-zone tint variation
  within the style would raise every zone at once. This is the single largest gap
  the judge named, and I agree with it.
- *Placeholder UI (#6), citing the journal capture.* **Corrected after
  re-verification**: the journal is fully styled (dark card, custom typography —
  confirmed by computed styles and a clean re-capture; the frame the judge saw had
  a blank lower half that was an artifact of my capture run, not the game). The
  residual fair point from the same capture: the HUD is crowded — several panels
  and the tutorial text compete for attention in the player's frame. Consolidating
  rail content when the commission tracker is quiet would help.

**Areas.** Light MET, characters MET. World/look GAP (diorama read on aerials,
repetition in tree forms), HUD/UI GAP (crowding), composition GAP (on the aerial
frames). The judge's frame of reference for "finished" is a shipped game's
marketing capture, so its 4/10s should be read as "solid slice, not yet a look
people stop scrolling at" — which matches my own read of the evidence.

**Could not perceive from captures** (matches this review's own unverified list):
sound, motion, hit feedback, camera feel, hitches, collision accuracy, load
stability. Those were covered separately by the live instrumentation and the
project's own checks where possible; sound and motion feel remain **unverified**
from this machine and worth one human play-through with headphones.

## Ideas worth adding

Ordered by how much they raise the game per unit of work. Each is grounded in a
system that already exists, so none of these is a from-scratch build.

### Finish or polish what is already half-there (smallest risks)

1. **Wake the hives.** Fix the dead `updateBeehives` call, then make hives matter:
   bee count scales with nearby blooms (the pollinator garden already tracks
   flowers), honey respawns on a timer, and a "hive health" note joins the journal's
   activity board. The system, the ingredient, the recipe and the gate it feeds
   (Captain Mark) already exist.
2. **A record board worth staring at.** The store board is one label; make it a
   proper wall: per-species personal bests, the fish that got away (line snaps are
   already tracked as an event), a "season total" that resets with the chain.
   Purely reads `save.records` — same architecture as commissions.
3. **Showcase your own collection.** The zoo has an aquarium and three enclosures
   but nothing you catch goes on display. Let a caught fish or bug be *placed* in
   an exhibit (the SHOWCASE inventory tab already exists as the UI hook). Visitors
   already route past exhibits — have them stop longer and drop a coin where
   something is on show. This single loop closes the biggest thematic gap: a
   conservatory that never conserves anything you bring back.

### New loops that reuse existing machinery

4. **Photography mode.** A field camera tool (fourth slot next to rod/net/glass):
   aim at an animal, hold focus (the bug-observation timing event is the same
   mechanic), get a "field photo" scored by distance/light/species. Photos fill
   journal pages the way records do. No new rendering tech — a screenshot of the
   held view with metadata.
5. **Weather as a second cycle.** The day/night cycle already drives sky, sun,
   audio beds and animal activity through one phase value; weather is a second,
   slower phase on the same rails. Rain: louder water bed (the bed exists), lower
  spook radius (stealth matters more), fish bite faster (a multiplier on the
   existing bite timer), butterflies and bees go off duty (the activity table
   already supports per-period gating). Fog at dawn. One gradient table, like
   `SKY_STOPS`, plus small multipliers.
6. **Seasons on the activity table.** Same move at a larger scale: `SPECIES[].activity`
   gains seasons, flora palettes swap (the grass builder already takes palettes),
   and the lake freezes in winter for a skate-and-fish loop. Start with autumn —
   it is mostly recolor plus two species migrating.
7. **Boat-only waters.** The lake boat exists and pilots well (verified by
   visual-qa's movement check); gate 3–4 hotspots and one species (crappie already
   notes "deep lake") behind waders or boat position. Gives the waders you already
   sell a reason to exist and the lake a second reason to visit at night.
8. **Visitors react to the world you built.** Visitors already walk routes and
   stop at stops; make benches and cairns (Brax's yard) become stops, clean
   enclosures increase visitor count and time-in-zone, and each visitor drops a
   small coin on exit. Makes the zoo and the build yard the same economy instead
   of two adjacent ones.

### Bigger swings (worth doing only after the above)

9. **A season-arc for commissions.** When the nine-chain completes, Grayson offers
   "the winter survey": a repeatable weekly board (5 random goals from the goal
   kinds already implemented — anyOf, distinct, material, cookedTotal) with a
   seeded pool, paying coins now spent on... builds, services, and a new shop
   tier. This is the single change that turns a slice into a game people keep
   open; almost every piece exists.
10. **Field notes per species.** Each of the 19 species gets a journal page that
    fills in as you observe behaviors in the field (fed, night-active, fled from
    you, photographed). The journal already renders the activity board; this is
    content plus one per-species progress map, and it makes the magnifying glass
    — the least-used tool — the key to most of it.
11. **Sound-led fishing at night.** Owls already call on a scheduler; add a
    night-only fish (the activity table allows it) whose hotspot is heard not
    seen — a splash cue (the palette has one) with no visual ring. Cheap, and it
    makes the audio engine the star for one species.

### Explicitly not recommended yet

- **Multiplayer/visiting friends' fields** — the save is device-local by design;
  the value does not justify the sync surface yet.
- **Voice acting for the staff** — the procedural aesthetic is a choice (the audio
  module's own header says so); synthesized voices would fight it.
- **A fifth zone** — the zone-eligibility literals (~20 call sites) and the zoo's
  frame budget say: consolidate before expanding.

## Suggested order of work

1. Correctness pass (the hive fix, the record-board guard, a zone-build error
   handler, the service save-write guard) — small, test-covered, unblocks trust.
2. Cold-open polish (start clock at morning, zone label rename, distance fog and
   the day grade) — one afternoon, changes the first impression most.
3. The performance quick wins (hoisted sky colors, net scratch vectors, single
   aim-target call, collider grid) — measured before/after with the render-budget
   check and the real-GPU sampler.
4. The record board + showcase-your-collection (idea 3) — the highest-value
   content change, and it reuses the commission architecture.
5. The winter-survey repeatable board (idea 9) — the endgame.
