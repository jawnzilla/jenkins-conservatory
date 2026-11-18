# Cold open and horizon: the look statements

The look for this pass, written as sentences a stranger can mark pass or fail on
a capture. Every later look change edits this page.

## Statements

- A fresh field record wakes at 09:00 in daylight. The first frame a new
  player sees is the field lit; night is something the day eases into. (Fresh
  saves only — a returning record resumes at the time it was left, as before.)
- The forest zone's top-bar label reads NORTHWATER FIELD, matching its title.
  It no longer claims to be a lake while a zone named JENKINS LAKE exists.
- Distant ground dissolves into the sky behind it at every hour: the fog colour
  is the sky shader's own horizon term, recomputed each frame, not a fixed
  per-zone green that only matched midday. Pass is judged at dawn, day, dusk
  and night from a long sightline: the farthest geometry converges on the sky.
- The tone curve is exactly one: three's ACES at exposure 1.12, applied when
  drawing to the canvas, with no post pass after it. Nothing else may add a
  shoulder. (This was already true; it is written down now so it stays true.)
- Water reads as depth, not as one flat turquoise disc: each water disc — the
  forest pond, the showcase practice pond and Jenkins Lake — carries a
  shore-to-deep tint baked into its vertices, one mesh and one draw call each,
  with the drop-off eased so the shallows stay light.
- The sky, the sun arc, the lanterns, the materials and the palette are
  unchanged by this pass. The pale daylight horizon palette is the game's own
  style; changing it is an owner decision with before/after frames, not part
  of this fix.

## Implementation notes

- `applyWaterDepthColors(geometry, deep, shore)` bakes the tint; the water
  materials are white with `vertexColors: true`. `transparent`/`opacity`
  already mark them unique, so they are created per build and disposed with the
  zone as before.
- The sky loop's six per-frame `THREE.Color` allocations became two module
  scratch colours (`tempColor`, `tempColor2`) — the same pattern the movement
  code already used for vectors.
- `scene.fog` still sets its near/far per zone at `setZonePalette`; only its
  colour now follows the sky.

## Verification

`npm test` (render budget, resource drift, smoke across all four zones) plus
fresh-context captures day and night per zone (`review-capture.mjs`), including
a first-frame capture of a brand-new record. The fog statement is judged from
the night captures: far tree lines converge on the night sky rather than
sitting green against it.
