# Asset visual triage — selective polish

## Scope and evidence

Reviewed the procedural builder inventory below and scene screenshots across **store, forest, conservatory/zoo and Jenkins Lake**. The saved before audit has **23 captures**: 19 zone/asset views plus four isolated galleries covering all 19 species. The after pass has five focused views. Source-only entries are explicitly marked: this is not a claim that every tiny prop or animation received a close-up visual inspection.

Before/after evidence: ignored `artifacts/asset-audit/{before,after}/results.json` and PNG/contact sheets. `asset-audit-qa.mjs after` reproduces the focused final pass. Do not run the default before mode expecting historical screenshots: it captures the current checkout. The original before evidence was captured before these changes. The parent reviewed the saved contact sheets and changes, fixed clerk/shelf overlap and completed verification.

## Selection — only three asset families changed

1. **Mara / field clerk:** the remaining primitive humanoid had a barrel torso and horizontal stick arms, noticeably below the newly improved team. Added a readable face, hair/bun, hat, apron, sleeves/hands and boots. Shifted the middle back-wall product display from x=0 to x=-2.8 (including its existing builder-derived interaction position) to stop the shelf intersecting her head. Clerk root, counter and clerk collider unchanged.
2. **Travel car:** the box cabin and full-width light bars read as a placeholder toy. Added a sloped cabin, side glazing/pillars, mirrors, handles, grille, separate lights, bumpers and hub details. Existing footprint, wheelbase and transit interaction retained.
3. **Supply crates:** two featureless cubes lacked any material/construction cues. Added plank seams, frame battens and handles; kept centers, dimensions and tilts.

Kept the recent characters and skiffs, trees/foliage, animal silhouettes, aquarium, docks and building families. Some large buildings remain deliberately simple and the store is dark under its roof at dusk; neither justifies a broad environment/lighting rewrite in this selective pass. Tiny fauna and detailed held-tool views remain candidates for a future focused audit, not silently labeled fully validated.

## Enumerated builder inventory

"Source only" means its code/caller was inventoried but no dedicated asset close-up was reviewed. Overview evidence is not equivalent to close-up QA. Low-level geometry helpers and interaction registration builders are included for completeness rather than counted as separate art assets.

| Builder | Evidence | Decision |
|---|---|---|
| `addMesh` | Source only; represented indirectly in parent zone where applicable | Keep |
| `addCollider` | Source only; represented indirectly in parent zone where applicable | Keep |
| `createHeldToolModel` | rod visible in zone captures; other held tools source-reviewed only | Keep |
| `createLooseNet` | Source only; represented indirectly in parent zone where applicable | Keep |
| `createSkybox` | zone overviews | Keep |
| `createLowClouds` | zone overviews | Keep |
| `addGround` | all wide zones | Keep |
| `createParkingHub` | store-wide / zoo-wide | Keep |
| `createCar` | car close-up; store-wide | CHANGE — sloped cabin, glazing, pillars, grille, individual lamps, bumpers and wheel hubs. |
| `addClosedDoor` | Source only; represented indirectly in parent zone where applicable | Keep |
| `createLakeBarn` | lake-barn | Keep |
| `createLakeCabin` | lake-cabin | Keep |
| `createLakeShack` | lake-shack | Keep |
| `createLakeGarage` | lake-garage | Keep |
| `createLakeGrassCompound` | Source only; represented indirectly in parent zone where applicable | Keep |
| `createLakeDock` | lake-water overview | Keep |
| `createLakeLilyPad` | Source only; represented indirectly in parent zone where applicable | Keep |
| `createResearchSkiffModel` | recent visual-qa skiff capture; unchanged | Keep |
| `createLakeBoat` | recent visual-qa lake construction and controls; unchanged | Keep |
| `createLakeCaptain` | recent visual-qa captain capture; unchanged | Keep |
| `createLakeCarInterior` | Source only; represented indirectly in parent zone where applicable | Keep |
| `createTree` | forest-nature / wide zones | Keep |
| `createBranchTree` | forest-nature / wide zones | Keep |
| `createBeehiveOnTree` | Source only; represented indirectly in parent zone where applicable | Keep |
| `createSpiderWeb` | Source only; represented indirectly in parent zone where applicable | Keep |
| `createWildFlowerNode` | Source only; represented indirectly in parent zone where applicable | Keep |
| `createWildCarrot` | Source only; represented indirectly in parent zone where applicable | Keep |
| `createGroundMushroom` | Source only; represented indirectly in parent zone where applicable | Keep |
| `createTreeMushroom` | Source only; represented indirectly in parent zone where applicable | Keep |
| `createWildScallion` | Source only; represented indirectly in parent zone where applicable | Keep |
| `createBerryBush` | Source only; represented indirectly in parent zone where applicable | Keep |
| `createWildRicePlant` | Source only; represented indirectly in parent zone where applicable | Keep |
| `createGardenPlot` | Source only; represented indirectly in parent zone where applicable | Keep |
| `addTreeInteraction` | Source only; represented indirectly in parent zone where applicable | Keep |
| `createFence` | zoo-wide | Keep |
| `createMountainBoundary` | wide zones | Keep |
| `createAquarium` | zoo-aquarium | Keep |
| `createAquariumSmudge` | Source only; represented indirectly in parent zone where applicable | Keep |
| `createAquaticPlant` | Source only; represented indirectly in parent zone where applicable | Keep |
| `createPollinatorGarden` | zoo-wide | Keep |
| `createShowcaseGarden` | zoo-garden | Keep |
| `createShowcaseCabin` | zoo-rear | Keep |
| `createRearShowcaseGreenSpace` | zoo-rear | Keep |
| `createPollinatorFlower` | Source only; represented indirectly in parent zone where applicable | Keep |
| `addPollinatorDragonflies` | Source only; represented indirectly in parent zone where applicable | Keep |
| `createPath` | wide zones | Keep |
| `createFieldResearchBoat` | forest-pond (recent polished skiff unchanged) | Keep |
| `createPondDock` | forest-pond | Keep |
| `createPracticePond` | zoo-garden | Keep |
| `createDuckEgg` | Source only; represented indirectly in parent zone where applicable | Keep |
| `createPracticeDucks` | Source only; represented indirectly in parent zone where applicable | Keep |
| `createStorekeeper` | mara close-up | CHANGE — recognizable face, hair, hat, apron, arms, hands and connected legs. |
| `createShopDisplay` | shop / mara / store-wide | Keep |
| `createStoreRecordBoard` | store-wide | Keep |
| `buildStore` | store-wide | Keep |
| `addSmallCrates` | crates close-up | CHANGE — plank seams, battens and recessed-looking handles. |
| `buildForest` | forest-wide | Keep |
| `addRock` | nature/zone overviews | Keep |
| `createHotspot` | forest-pond / zoo-aquarium / lake-water | Keep |
| `createGroundFoliage` | forest-nature | Keep |
| `createNatureStick` | Source only; represented indirectly in parent zone where applicable | Keep |
| `createNatureScatter` | forest-nature / lake-road | Keep |
| `createDuck` | Source only; represented indirectly in parent zone where applicable | Keep |
| `createBugNode` | Source only; represented indirectly in parent zone where applicable | Keep |
| `buildZoo` | zoo-wide | Keep |
| `createFieldCharacter` | recent visual-qa all three characters; unchanged | Keep |
| `createJenkinsLakeRoad` | lake-road | Keep |
| `createJenkinsLakeYards` | Source only; represented indirectly in parent zone where applicable | Keep |
| `createJenkinsLakeForest` | lake-road | Keep |
| `createJenkinsLakeWater` | lake-water | Keep |
| `createJenkinsLakeMeadow` | lake-meadow | Keep |
| `buildJenkinsLake` | lake-road / lake-water | Keep |
| `addEnclosureInteractable` | Source only; represented indirectly in parent zone where applicable | Keep |
| `addExhibitAnimals` | Source only; represented indirectly in parent zone where applicable | Keep |
| `createAnimalModel` | isolated gallery of every SPECIES key (19 models) | Keep |
| `createFishingVisuals` | Source only; represented indirectly in parent zone where applicable | Keep |

Inventory count: **76 named builders/helpers**, generated from source, with no duplicate names.
