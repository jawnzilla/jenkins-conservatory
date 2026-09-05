# Field team and skiff visual polish

## Changes
- Brynlee: safari hat, shoulder braid, satchel, layered pink field jacket.
- Brooks: uniform cap, badge, cuffs, caged hand-held lantern.
- Grayson: round glasses, swept hair, long purple coat, held clipboard and pen.
- Shared face, connected elbow/hand geometry, boots and clothing details.
- Shared open-hull skiff for forest display and pilotable lake boat: flared teal hull, cream rub rail, teak sole and thwarts, paddle, rope, life ring, specimen box and outboard.
- Forest skiff moved beyond the dock rail to eliminate dock intersection. Visual keel lowered independently of gameplay root.
- Character interaction records and lake steering/reset/exit logic unchanged.

## Verification
`npm run build` passes (existing >500 kB bundle warning remains).

Browser regression and screenshot reproduction:
1. `npm ci`
2. `npx playwright install chromium`
3. `npm run dev -- --host 127.0.0.1 --port 5193 --strictPort`
4. In another terminal: `node visual-qa.mjs`

The test injects inspection hooks through Playwright response interception only; none ship to production. It captures all three characters and forest skiff, invokes the character services, and verifies lake boat movement and exit without page errors. Screenshots go to ignored `artifacts/`. Headless desktop check, not physical-device QA. Grayson is behind the existing collection sign; inspect from the side as the test camera does.
