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
- A day/night cycle that animals actually follow: owls and raccoons come out at dusk, butterflies and squirrels work in daylight, and off-duty species leave the field until their hours come back around.
- A field journal on `J`, checkable at any time, with the field clock, an activity board of what is out right now, collection progress, kit, larder, and staff duty status.
- Brynlee, Grayson, and Brooks patrol their own areas of the showcase and stop to talk when you get close.
- Fenced enclosures the public cannot enter, each with a caretaker gate on the path side so you can still get in to clean and tend.
- Brax the field builder: gather fallen sticks and loose field stones, then spend them on cairns, benches, campfire rings, trellises, nest boxes and lantern posts across his build yard. Everything you build persists, and dismantling refunds the full cost.
- Sleep in the cabin bunk and pick a wake time — first light, midday, dusk or midnight — to line the clock up with the animals you are after.
- Brooks' lantern and any lantern post you build cast real light once the sun goes down.
- Visitors and customers arrive at the showcase and the supply depot, browse for a while, then leave.
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
- `E`: interact with the car, shop, zoo record, or a person
- `J`: open or close the field journal
- `F`: cycle held food
- `1 / 2 / 3`: equip rod / net / magnifying glass
- `Left click`: cast, set hook, reel, or use the equipped tool
- `Esc`: release pointer lock or exit an active observation
