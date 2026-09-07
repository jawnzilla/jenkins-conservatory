# Ground cover, flora, lot traffic and save slots

Notes on the systems added in this pass, and the constraints that shaped them.

## Grass blades

Grass used to be `createGroundFoliage`: four small cones per tuft. It read as
blocky geometry rather than as grass, and each tuft was its own object.

Grass is now drawn as individual blades. A blade is a tapered strip of five
vertices and three triangles, bent and leaned by a per-blade random, with a
vertical colour gradient baked into vertex colours. Every blade in a region is
merged into one buffer, so a zone's turf costs a handful of draw calls rather
than one per tuft:

| Zone | Blades | Merged meshes |
| --- | --- | --- |
| Supply Depot | ~28,000 | 1 |
| Northwater Field | ~28,000 | 1 |
| The Showcase | ~31,000 | 1 |
| Jenkins Lake | ~126,000 | 4 |

Three details are load-bearing:

- **Normals point at the sky, not out of the face.** A blade is thin and near
  vertical, so a true face normal leaves it unlit. Blades are double sided and
  three flips the shading normal on back faces, which rendered half of every
  field black; the material patches `normal_fragment_begin` to hold the authored
  normal on both sides.
- **Sway lives in the vertex shader.** Two per-blade attributes (`bladeSway`,
  `bladePhase`) and a shared time uniform. No per-frame CPU cost at all.
- **Normals and colours are normalised bytes.** At this blade count the buffer
  size is worth caring about and neither needs float precision.

Blades are placed in clumps rather than uniformly, because turf grows in
tussocks and because clumping lets each clump carry its own tint. Placement is
seeded, so a zone lays out the same way every time it is rebuilt.

## Unlootable flora

`scatterFlora` places downed logs, cut and snapped stumps, shrubs, ferns,
broadleaf ground plants, saplings, brush piles, reed beds with cattails and
decorative blooms. None of them registers an interactable or a `LOOT` marker:
the lootable sticks, stones, berries and flowers are still the existing
`createNatureStick`, `createNatureRock`, `createBerryBush` and
`createWildFlowerNode`. Ferns, broad leaves and reeds share the grass blade
batch, so they cost triangles but no extra draw call.

## Denser woods

The Jenkins Lake woods carry roughly 1,300 more trunks. They are added as
`createBackgroundForest`: merged geometry, about 260 trees per draw call, with
per-vertex colour carrying the variation that separate materials used to. The
trees near the road are still individual objects, because those are the ones
that hold beehives and spider webs.

## Placement cost

A dressing pass asks "is anything already here?" well over a hundred thousand
times against a zone that can hold two thousand colliders. Two coarse bucket
grids keep that from being quadratic:

- `beginFloraColliderGrid` buckets the zone's colliders for the pass, and
  `addCollider` keeps the grid current as flora registers its own.
- `makeSpacingGrid` answers the minimum-spacing test for tree and prop scatter.

Together these took the Jenkins Lake build from 3.8s back to about 1.2s.

## The drive in to Jenkins Lake

The arrival used to set `yaw` every frame to the current road segment's heading.
That pinned the player's aim to the road and snapped it at every joint between
segments.

Now:

- The road mesh and the car's line are the same centripetal Catmull-Rom curve,
  so the tarmac bends the way the car does.
- Aim is pointed down the road once, at the start, and never touched again. The
  player is held in place and can look wherever they like for the whole ride.
- The car body heading follows the curve with a lag and banks into that lag, so
  a corner reads as a corner.
- The interior is a world object riding at the car's position instead of being
  parented to the camera, and it has doors, window frames, a roof and a rear
  bench now that the player can turn their head. The dash plate is geometry, not
  a billboard sprite, which would have swung to face the player.

`updateJenkinsLakeArrival(largeDelta)` still completes the drive in one call,
which is how the QA harnesses skip it.

## Sleeping and the sky

`getSkyCycleSample` read `elapsed` directly while everything else read
`getDayPhase()`, which is `elapsed + dayTimeOffset`. Sleeping only moves
`dayTimeOffset`, so the clock, the animal schedules and the journal all jumped
while the sky stayed where it was. The sky now reads the same clock.

The sun also travels an east-to-west arc across the daylight band instead of
sitting in one place, and both it and its shadow camera ride with the player so
shadows stay resolved wherever the field is walked.

## Parking lots and visitor traffic

Every hub zone shares one lot: two rows of marked stalls either side of a drive
aisle, a perimeter wall, lamps, a painted walkway, and a service drive out to a
public street running along the back. The street is out of bounds on foot — the
wall and a collider across the drive mouth see to that — and the ridge line has
a gap only where the road passes through it, so traffic appears and disappears
through the pass.

Visitors no longer fade in and out. A visitor:

1. arrives as a car on the near lane and turns into the service drive,
2. parks nose-in in a free stall, which gains a collider while it stands,
3. gets out behind the car and walks their existing tour of the zone,
4. walks back to the car,
5. drives out through the service drive, east down the street, and turns out of
   sight behind the treeline before being removed.

Cars follow Catmull-Rom runs with eased speed rather than turning on a point at
each waypoint, back out of their bay in reverse, and spin their wheels. Loose
passing traffic runs the street on its own timer, including at the forest lot
where nobody parks.

## Save slots

Three independent field records, each with its own kit, coins, collection,
builds and field clock, reachable from the **⛁** button in the top bar.

Slot 1 deliberately keeps the original `jenkins-conservatory-save-v1` storage
key, so anyone who has already played keeps their records with no migration
step; slots 2 and 3 use `…::2` and `…::3`. The active slot is remembered in
`jenkins-conservatory-active-profile-v1`.

Switching writes the outgoing record first. Records can be renamed in place, and
erasing is a two-step confirm; erasing the record you are standing in restarts
it rather than leaving the world running on data that no longer exists.

Saves now also carry `dayPhase`, so a record comes back at the time of day it
was left at.
