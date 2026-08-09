# Jenkins Conservatory

A low-poly Three.js visual slice for real-time wildlife fieldwork.

## Current slice

- First-person desktop browser controls with click-to-lock pointer look.
- Three destination zones—supply store, forest lake, and zoo showcase—each entered through its own connected parking-lot hub.
- Car-based fast travel between every destination zone; there is no standalone parking-lot scene.
- Fishing loop: select a compatible lure and bait, aim at a circular water disturbance, cast, wait for the bite, set the hook, and reel the fish in.
- Stealth loop: hold Shift to move at half speed with a lower spook risk.
- Squirrels and rabbits can be netted after a careful approach.
- Magnifying-glass bug observation with a short focus timing event, followed by net capture.
- Persistent browser-local inventory, currency, and collection records.
- Responsive HUD with touch-friendly action buttons for tablet-sized screens.

## Run locally

```bash
npm install
npm run dev -- --host 0.0.0.0
```

Open the printed local URL. The `--host` flag makes the Vite server reachable from another device on the same network.

## Build / preview

```bash
npm run build
npm run preview -- --host 0.0.0.0
```

## Public remote test

The repository is configured to deploy the `dist` build to GitHub Pages on every push to `main` through `.github/workflows/deploy.yml`.

Public repository: https://github.com/jawnzilla/jenkins-conservatory

Expected Pages URL: https://jawnzilla.github.io/jenkins-conservatory/

The save system intentionally uses `localStorage` for this slice. It is device/browser-local and does not sync across testers.

## Controls

- `WASD`: move
- `Mouse`: look after clicking the field
- `Shift`: sneak at half speed
- `E`: interact with the car, shop, or zoo record
- `1 / 2 / 3`: equip rod / net / magnifying glass
- `Left click`: cast, set hook, reel, or use the equipped tool
- `Esc`: release pointer lock or exit an active observation
