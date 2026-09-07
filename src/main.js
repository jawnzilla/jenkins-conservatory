import * as THREE from 'three';
import './style.css';
import './interaction-feedback.css';

const SAVE_KEY = 'jenkins-conservatory-save-v1';
// Save slots. Slot 1 deliberately keeps the original storage key, so anyone who
// has already played keeps their field records without a migration step.
const ACTIVE_SLOT_KEY = 'jenkins-conservatory-active-profile-v1';
const SAVE_SLOTS = [1, 2, 3];
const ZONE_ORDER = ['store', 'forest', 'zoo', 'lake'];
const FLOWER_GROW_MS = 5 * 60 * 1000;
const FLOWER_LIFE_MS = 2 * 60 * 60 * 1000;
const PLAYER_RADIUS = 0.46;
const GRAVITY = 15;
const JUMP_VELOCITY = 5.4;

const ZONES = {
  store: {
    label: 'FIELD STORE',
    title: 'Supply Depot',
    note: 'Buy bait, lures, nets, and fresh lenses.',
    background: 0x8e9b78,
    fog: 0x8e9b78,
    ground: 0x61705a,
    accent: 0xf2b268,
    bounds: { minX: -21, maxX: 21, minZ: -22, maxZ: 22 },
    visualBounds: { minX: -21, maxX: 21, minZ: -22, maxZ: 36 }
  },
  forest: {
    label: 'LAKE FOREST',
    title: 'Northwater Field',
    note: 'Disturbances mark the lake hot spots.',
    background: 0x91aa92,
    fog: 0x91aa92,
    ground: 0x46684e,
    accent: 0x8be0c3,
    bounds: { minX: -28, maxX: 28, minZ: -40, maxZ: 22 },
    visualBounds: { minX: -28, maxX: 28, minZ: -40, maxZ: 36 }
  },
  zoo: {
    label: 'CONSERVATORY ZOO',
    title: 'The Showcase',
    note: 'Review the animals in your growing collection.',
    background: 0x7d9587,
    fog: 0x7d9587,
    ground: 0x697862,
    accent: 0xd8ef85,
    bounds: { minX: -23, maxX: 23, minZ: -64, maxZ: 22 },
    visualBounds: { minX: -23, maxX: 23, minZ: -64, maxZ: 36 }
  },
  lake: {
    label: 'JENKINS LAKE',
    title: 'Jenkins Lake',
    note: 'Follow the forest road to Captain Mark and the lake gate.',
    background: 0x8da19a,
    fog: 0x8da19a,
    ground: 0x506b54,
    accent: 0x8be0c3,
    fogNear: 32,
    fogFar: 180,
    bounds: { minX: -92, maxX: 92, minZ: -198, maxZ: 34 }
  }
};

const JENKINS_LAKE_PLACEHOLDER_ACCESS = true;
const JENKINS_LAKE_ROAD = [
  [0, 28], [-1.4, 17], [1.8, 5], [-1.9, -8], [1.5, -21], [-1.6, -34], [1.1, -47], [-0.5, -63]
];

const JENKINS_LAKE_WATER = {
  centerX: 0,
  centerZ: -153,
  radiusX: 76,
  radiusZ: 34,
  playerRadiusX: 74.2,
  playerRadiusZ: 32.2,
  castRadiusX: 73.2,
  castRadiusZ: 31.2
};

// Keep the boat just beyond the main dock so it is reachable on foot, with its
// forward axis aimed down the open-water channel.
const JENKINS_LAKE_BOAT_SPAWN = { x: 0, z: -136 };

const JENKINS_LAKE_GRASS_COMPOUNDS = [
  { centerX: -34, centerZ: -96, width: 24, depth: 38, label: 'WEST CABIN LAWN' },
  { centerX: 0, centerZ: -99, width: 28, depth: 40, label: 'LAKE MEADOW' },
  { centerX: 35, centerZ: -98, width: 29, depth: 44, label: 'EAST MEADOW' }
];

const JENKINS_LAKE_DOCKS = [
  { x: -33, shoreZ: -121.7, endZ: -134.5, width: 3.2 },
  { x: 0, shoreZ: -120.7, endZ: -133.8, width: 3.4 },
  { x: 29, shoreZ: -123.2, endZ: -136.2, width: 3.2 }
];

const JENKINS_LAKE_YARDS = [
  { centerX: -18, centerZ: -28, width: 24, depth: 18 },
  { centerX: 17, centerZ: -31, width: 18, depth: 16 },
  { centerX: -9.5, centerZ: -72, width: 23, depth: 17 },
  { centerX: -34, centerZ: -99, width: 25, depth: 35 }
];

const FOREST_WATER = {
  centerX: 0,
  centerZ: -17,
  waterRadius: 10,
  radiusX: 10,
  radiusZ: 10,
  playerRadius: 8.65,
  castRadius: 9.25,
  castRadiusX: 9.25,
  castRadiusZ: 9.25
};

const FOOD_OPTIONS = [
  { key: 'carrots', label: 'Carrot', icon: '🥕', note: 'Attracts rabbits and squirrels' },
  { key: 'trout', label: 'Trout', icon: '≈', note: 'A fresh fish offering' },
  { key: 'sunfish', label: 'Sunfish', icon: '◌', note: 'A fresh fish offering' },
  { key: 'bass', label: 'Bass', icon: '◒', note: 'A fresh fish offering' },
  { key: 'crappie', label: 'Crappie', icon: '◍', note: 'A fresh fish offering' }
];

const COOKING_RECIPES = [
  {
    key: 'grilled-fish-glazed-carrots',
    label: 'Grilled fish + glazed carrots',
    note: 'A simple field supper with any fish.',
    ingredients: [
      { anyOf: ['trout', 'sunfish', 'bass', 'crappie'], label: 'Any fish', amount: 1 },
      { key: 'carrots', label: 'Carrot', amount: 1 },
      { key: 'honey', label: 'Honey', amount: 1 }
    ],
    outputs: [{ key: 'grilledFish', amount: 1 }, { key: 'glazedCarrots', amount: 1 }]
  },
  {
    key: 'wild-rice-mushroom-risotto',
    label: 'Wild rice mushroom risotto',
    note: 'Any mushroom works, including tree mushrooms and morels.',
    ingredients: [
      { key: 'wildRice', label: 'Wild rice', amount: 1 },
      { anyOf: ['mushrooms', 'morels', 'treeMushrooms'], label: 'Any mushroom', amount: 1 }
    ],
    outputs: [{ key: 'risotto', amount: 1 }]
  },
  {
    key: 'sunfish-salad',
    label: 'Sunfish salad',
    note: 'Fresh sunfish with wild greens and berries.',
    ingredients: [
      { key: 'sunfish', label: 'Sunfish', amount: 1 },
      { key: 'scallions', label: 'Wild scallion', amount: 1 },
      { key: 'berries', label: 'Berries', amount: 1 }
    ],
    outputs: [{ key: 'sunfishSalad', amount: 1 }]
  },
  {
    key: 'trout-eggs-benedict',
    label: 'Trout eggs benedict',
    note: 'Trout topped with a showcase duck egg.',
    ingredients: [
      { key: 'trout', label: 'Trout', amount: 1 },
      { key: 'duckEggs', label: 'Duck egg', amount: 1 }
    ],
    outputs: [{ key: 'troutEggsBenedict', amount: 1 }]
  }
];

const PRACTICE_POND = {
  centerX: -15.2,
  centerZ: -20.8,
  waterRadius: 4.35,
  castRadius: 3.8
};

const FOREST_DOCK = {
  halfWidth: 1.85,
  shoreZ: -7.15,
  endZ: -15.55
};

const POLLINATOR_PLOTS = [
  [6.5, -12.2], [7.8, -12.4], [9.1, -12.1], [10.4, -12.3],
  [11.7, -11.8], [6.8, -10.2], [8.2, -10.1], [9.5, -10.3],
  [10.8, -10.0], [12.0, -9.6], [7.4, -8.4], [9.8, -8.2]
];

// Field day periods, in the order the sky cycle walks through them.
const DAY_PERIODS = ['dawn', 'day', 'dusk', 'night'];
// Cycle phase boundaries, aligned with the SKY_STOPS gradient below.
const DAY_PERIOD_BOUNDS = [
  { key: 'dawn', from: 0.06 },
  { key: 'day', from: 0.18 },
  { key: 'dusk', from: 0.62 },
  { key: 'night', from: 0.80 }
];
const DAY_PERIOD_LABELS = { dawn: 'Dawn', day: 'Daylight', dusk: 'Dusk', night: 'Night' };
// Phase 0 sits in the small hours, so shift the readout to a believable clock.
const DAY_HOUR_OFFSET = 4;
const ALWAYS_ACTIVE = ['dawn', 'day', 'dusk', 'night'];

const SPECIES = {
  trout: { label: 'Brook trout', type: 'fish', sigil: '≈', color: 0xd78155, note: 'Spinner + worms', activity: ALWAYS_ACTIVE },
  sunfish: { label: 'Bluegill sunfish', type: 'fish', sigil: '◌', color: 0x70a6be, note: 'Feather + grubs', activity: ALWAYS_ACTIVE },
  bass: { label: 'Largemouth bass', type: 'fish', sigil: '◒', color: 0x688c5a, note: 'Spinner + worms · lily pads', activity: ALWAYS_ACTIVE },
  crappie: { label: 'Black crappie', type: 'fish', sigil: '◍', color: 0x8994a3, note: 'Spinner + worms · deep lake', activity: ALWAYS_ACTIVE },
  rabbit: { label: 'Cottontail rabbit', type: 'ground', sigil: '◒', color: 0xe6d7bf, note: 'Sneak + net', activity: ['dawn', 'dusk', 'night'] },
  squirrel: { label: 'Red squirrel', type: 'ground', sigil: '◓', color: 0xb56843, note: 'Sneak + net', activity: ['dawn', 'day'] },
  fox: { label: 'Red fox', type: 'ground', sigil: '◇', color: 0xc96c3e, note: 'Sneak + net', activity: ['dawn', 'dusk', 'night'] },
  frog: { label: 'Green frog', type: 'ground', sigil: '◉', color: 0x6fb36d, note: 'Sneak + net', activity: ['dawn', 'dusk', 'night'] },
  turtle: { label: 'Pond turtle', type: 'ground', sigil: '⊙', color: 0x71926b, note: 'Sneak + net', activity: ['day'] },
  owl: { label: 'Tawny owl', type: 'flying', sigil: '◎', color: 0xb79a70, note: 'Sneak + net', activity: ['dusk', 'night'] },
  raccoon: { label: 'Raccoon', type: 'ground', sigil: '◐', color: 0x899291, note: 'Sneak + net', activity: ['dusk', 'night'] },
  sparrow: { label: 'House sparrow', type: 'flying', sigil: '⌁', color: 0x9a8064, note: 'Sneak + net', activity: ['dawn', 'day'] },
  duck: { label: 'Mallard duck', type: 'water', sigil: '◒', color: 0x587a61, note: 'Floats on the lake', activity: ['dawn', 'day', 'dusk'] },
  butterfly: { label: 'Painted butterfly', type: 'bug', sigil: '✦', color: 0xf0a4c1, note: 'Catch with net', activity: ['day'] },
  bee: { label: 'Meadow bee', type: 'bug', sigil: '✧', color: 0xf2c84b, note: 'Catch with net', activity: ['dawn', 'day'] },
  dragonfly: { label: 'Blue dragonfly', type: 'bug', sigil: '⌁', color: 0x83cfe7, note: 'Catch with net', activity: ['day', 'dusk'] }
  ,caterpillar: { label: 'Monarch caterpillar', type: 'bug', sigil: '◍', color: 0xd59c3a, note: 'Magnify on flowers', activity: ['dawn', 'day'] }
  ,worm: { label: 'Earthworm', type: 'bug', sigil: '≈', color: 0xb7775b, note: 'Magnify on plants · fishing lure', activity: ['dawn', 'dusk', 'night'] }
  ,spider: { label: 'Garden spider', type: 'bug', sigil: '✣', color: 0x81768c, note: 'Magnify near webs', activity: ['dawn', 'dusk', 'night'] }
};

const BAITS = [
  { key: 'worms', label: 'Worms', note: 'Works with brook trout', cost: 8 },
  { key: 'grubs', label: 'Grubs', note: 'Works with bluegill sunfish', cost: 10 }
];

const LURES = [
  { key: 'spinner', label: 'Spinner', note: 'Tracks fast water', cost: 16 },
  { key: 'feather', label: 'Feather lure', note: 'Floats in the shallows', cost: 14 }
];

const SHOP_ITEMS = [
  { key: 'worms', group: 'bait', label: 'Worm bait', note: 'Required for brook trout hotspots.', cost: 8, amount: 3 },
  { key: 'grubs', group: 'bait', label: 'Grub bait', note: 'Required for bluegill hotspots.', cost: 10, amount: 3 },
  { key: 'spinner', group: 'lure', label: 'Spinner lure', note: 'A reusable-looking flash for moving water.', cost: 16, amount: 1 },
  { key: 'feather', group: 'lure', label: 'Feather lure', note: 'A light presentation for shallows.', cost: 14, amount: 1 },
  { key: 'nets', group: 'tool', label: 'Field net', note: 'For rabbits, squirrels, and flying bugs.', cost: 24, amount: 1 },
  { key: 'magnifiers', group: 'tool', label: 'Magnifying glass', note: 'Reveals hidden bug movement.', cost: 22, amount: 1 },
  { key: 'goldenSeeds', group: 'care', label: 'Golden seed bundle', note: 'Brynlee uses these to start a caretaker shift.', cost: 18, amount: 1 },
  { key: 'lanternOil', group: 'night', label: 'Lantern oil', note: 'Keeps Brooks on night watch.', cost: 14, amount: 1 },
  // Both of these were read all over the code but had no way to be obtained,
  // which left the cabin stove — and so Captain Mark's gate — unreachable.
  { key: 'pans', group: 'tool', label: 'Camp cooking pan', note: 'Required to cook anything on the cabin stove.', cost: 26, amount: 1 },
  { key: 'waders', group: 'tool', label: 'Chest waders', note: 'Wade further out from the bank before the drop-off.', cost: 32, amount: 1 }
];

const DEFAULT_SAVE = {
  profileName: '',
  savedAt: 0,
  // Where in the day/night cycle this profile left off, so the field clock is
  // remembered along with everything else.
  dayPhase: null,
  tipsEnabled: true,
  coins: 120,
  supplies: {
    worms: 6,
    grubs: 4,
    spinner: 2,
    feather: 2,
    nets: 2,
    magnifiers: 1,
    goldenSeeds: 1,
    lanternOil: 1
  },
  // Harvested field ingredients, cooked dishes, personal fish records and the
  // raw materials Brax builds with. These are read unguarded all over the file,
  // so they have to exist on a fresh save rather than being created on first use.
  ingredients: {
    carrots: 0,
    mushrooms: 0,
    morels: 0,
    treeMushrooms: 0,
    wildRice: 0,
    scallions: 0,
    berries: 0,
    duckEggs: 0,
    flowers: 0,
    trout: 0,
    sunfish: 0,
    bass: 0,
    crappie: 0
  },
  cooked: {
    grilledFish: 0,
    glazedCarrots: 0,
    risotto: 0,
    sunfishSalad: 0,
    troutEggsBenedict: 0
  },
  materials: { sticks: 0, stones: 0 },
  builds: {},
  honey: 0,
  records: {},
  caught: {},
  cleanedEnclosures: {},
  brynleeCaretakerUntil: 0,
  brooksWatchUntil: 0,
  brooksAssignment: 'conservatory',
  graysonResearch: 0,
  lastZone: 'forest'
};

const dom = {
  canvas: document.querySelector('#game-canvas'),
  zoneLabel: document.querySelector('#zone-label'),
  coinLabel: document.querySelector('#coin-label'),
  clockLabel: document.querySelector('#clock-label'),
  lockDot: document.querySelector('#lock-dot'),
  lockLabel: document.querySelector('#lock-label'),
  statusMessage: document.querySelector('#status-message'),
  promptCard: document.querySelector('#prompt-card'),
  promptKey: document.querySelector('#prompt-key'),
  promptText: document.querySelector('#prompt-text'),
  equipmentList: document.querySelector('#equipment-list'),
  inventoryTabs: document.querySelector('#inventory-tabs'),
  saveStatus: document.querySelector('#save-status'),
  profileModal: document.querySelector('#profile-modal'),
  profileSlots: document.querySelector('#profile-slots'),
  profileLabel: document.querySelector('#profile-label'),
  profileToggleButton: document.querySelector('#profile-toggle-button'),
  noiseValue: document.querySelector('#noise-value'),
  noiseMeter: document.querySelector('#noise-meter'),
  crosshair: document.querySelector('#crosshair'),
  fishingCallout: document.querySelector('#fishing-callout'),
  actionHint: document.querySelector('#action-hint'),
  actionDock: document.querySelector('#action-dock'),
  primaryAction: document.querySelector('#primary-action'),
  reelAction: document.querySelector('#reel-action'),
  equipmentDock: document.querySelector('#equipment-dock'),
  toastStack: document.querySelector('#toast-stack'),
  fishingTips: document.querySelector('#fishing-tips'),
  tipSteps: [...document.querySelectorAll('.tip-step')],
  tipsToggleButton: document.querySelector('#tips-toggle-button'),
  tipsMenu: document.querySelector('#tips-menu'),
  tipsMenuClose: document.querySelector('#tips-menu-close'),
  tipsEnabled: document.querySelector('#tips-enabled'),
  travelModal: document.querySelector('#travel-modal'),
  travelOptions: document.querySelector('#travel-options'),
  shopModal: document.querySelector('#shop-modal'),
  shopItems: document.querySelector('#shop-items'),
  shopRecord: document.querySelector('#shop-record'),
  stoveModal: document.querySelector('#stove-modal'),
  stoveRecipes: document.querySelector('#stove-recipes'),
  qteModal: document.querySelector('#qte-modal'),
  qteCursor: document.querySelector('.qte-cursor'),
  qteAction: document.querySelector('#qte-action'),
  inspectionZoom: document.querySelector('#inspection-zoom'),
  captureJar: null,
  inspectionState: document.querySelector('#inspection-state'),
  qteCopy: document.querySelector('#qte-copy'),
  collectionModal: document.querySelector('#collection-modal'),
  collectionGrid: document.querySelector('#collection-grid'),
  buildModal: document.querySelector('#build-modal'),
  buildOptions: document.querySelector('#build-options'),
  buildStock: document.querySelector('#build-stock'),
  sleepModal: document.querySelector('#sleep-modal'),
  sleepOptions: document.querySelector('#sleep-options'),
  sleepCopy: document.querySelector('#sleep-copy'),
  sleepVeil: document.querySelector('#sleep-veil'),
  journalModal: document.querySelector('#journal-modal'),
  journalBody: document.querySelector('#journal-body'),
  journalToggleButton: document.querySelector('#journal-toggle-button'),
  cleaningModal: document.querySelector('#cleaning-modal'),
  cleaningCopy: document.querySelector('#cleaning-copy'),
  cleaningField: document.querySelector('#cleaning-field'),
  cleaningProgress: document.querySelector('#cleaning-progress'),
  cleaningCount: document.querySelector('#cleaning-count'),
  cleaningAction: document.querySelector('#cleaning-action'),
  loadingScreen: document.querySelector('#loading-screen')
};

dom.canvas.tabIndex = 0;
const renderer = new THREE.WebGLRenderer({ canvas: dom.canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
renderer.setSize(window.innerWidth, window.innerHeight, false);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.08, 260);
camera.rotation.order = 'YXZ';
let skybox = null;
let skyCloudLayer = null;
let skyCloudMaterial = null;
const SKY_CYCLE_SECONDS = 8 * 60;
const SKY_PHASE_OFFSET = 0.06;
const SKY_STOPS = [
  { at: 0.00, top: 0x071326, horizon: 0x23324d, lower: 0x0c1b27, daylight: 0.08 },
  { at: 0.10, top: 0x53658e, horizon: 0xe6a17f, lower: 0x6c5e58, daylight: 0.34 },
  { at: 0.23, top: 0x74abc5, horizon: 0xf1dbb1, lower: 0x89a76d, daylight: 0.92 },
  { at: 0.50, top: 0x4e98bf, horizon: 0xd1ebe0, lower: 0x7c9c69, daylight: 1 },
  { at: 0.68, top: 0x414d75, horizon: 0xe2986d, lower: 0x625149, daylight: 0.55 },
  { at: 0.82, top: 0x0b1530, horizon: 0x303951, lower: 0x111c2b, daylight: 0.08 }
];
const skyUniforms = {
  topColor: { value: new THREE.Color(0x53658e) },
  horizonColor: { value: new THREE.Color(0xe6a17f) },
  lowerColor: { value: new THREE.Color(0x6c5e58) }
};
const heldToolGroup = new THREE.Group();
heldToolGroup.name = 'held-tool';
heldToolGroup.frustumCulled = false;
camera.add(heldToolGroup);
const world = new THREE.Group();
scene.add(world);
scene.add(camera);
createSkybox();

const hemiLight = new THREE.HemisphereLight(0xe9efcf, 0x20352a, 2.2);
scene.add(hemiLight);
const sunLight = new THREE.DirectionalLight(0xffedc3, 3.2);
sunLight.position.set(-14, 24, 10);
sunLight.castShadow = true;
sunLight.shadow.mapSize.set(1536, 1536);
sunLight.shadow.camera.left = -35;
sunLight.shadow.camera.right = 35;
sunLight.shadow.camera.top = 35;
sunLight.shadow.camera.bottom = -35;
sunLight.shadow.camera.near = 0.5;
sunLight.shadow.camera.far = 90;
scene.add(sunLight);
// The shadow camera is aimed by this target, and both it and the light ride
// along with the player so shadows stay resolved wherever the field is walked.
scene.add(sunLight.target);

const clock = new THREE.Clock();
const raycaster = new THREE.Raycaster();
const centerScreen = new THREE.Vector2(0, 0);
const keys = new Set();
const lookDirection = new THREE.Vector3();
const moveDirection = new THREE.Vector3();
const forwardDirection = new THREE.Vector3();
const rightDirection = new THREE.Vector3();
const tempVector = new THREE.Vector3();
const tempVector2 = new THREE.Vector3();

let activeSlot = readActiveSlot();
let save = loadSave();
let currentZone = save.lastZone && ZONES[save.lastZone] ? save.lastZone : 'forest';
let activeTool = 'rod';
let selectedBait = 'worms';
let selectedLure = 'spinner';
let selectedFood = 'carrots';
let activeInventoryTab = 'kit';
let pointerLocked = false;
let fallbackFieldMode = false;
let fallbackPointer = null;
let fallbackPointerId = null;
let yaw = 0;
let pitch = -0.08;
let elapsed = 0;
let dayTimeOffset = 0;
let currentDaylight = 1;
let currentDayPeriod = getDayPeriod(SKY_PHASE_OFFSET % 1);
let serviceCheckAt = 0;
let journalRefreshAt = 0;
let currentNoise = 0;
let spookRisk = 0.02;
let toastId = 0;
let feedbackTimer = null;
const feedbackHub = document.querySelector('#interaction-hub');
new ResizeObserver(([entry]) => {
  document.documentElement.style.setProperty('--feedback-height', `${Math.ceil(entry.target.getBoundingClientRect().height)}px`);
}).observe(feedbackHub);
let lastPromptKey = '';
let primaryHeld = false;
let actionHeld = false;
let qteState = null;
let modalOpen = false;
let interactables = [];
let hotspots = [];
let critters = [];
let bugNodes = [];
let treeInteractions = [];
let zooAnimals = [];
let zooEnclosures = [];
let fieldCharacters = [];
let buildSites = [];
let visitors = [];
let visitorSpawnAt = 0;
let visitorsSeeded = false;
let aquariumBubbles = [];
let pollinatorFlowers = [];
let wildFlowerNodes = [];
let beehives = [];
let spiderWebs = [];
let gardenPlots = [];
let natureLoot = [];
let natureResourceNodes = [];
let aquariumSmudges = [];
let carrotNodes = [];
let ducks = [];
let duckEggNodes = [];
let colliders = [];
let debugCollisionVisible = false;
let debugCollisionGroup = null;
let lakeArrival = null;
let lakeCarInterior = null;
let lakeParkedCar = null;
let lakeCaptain = null;
let lakeBoat = null;
let lakeBoatPilot = null;
let lakeGateCollider = null;
let lakeGateOpen = false;
let lakeGateNotified = false;
let lakeCabinBoundaryNotified = false;
let storeRecordBoard = null;
let fishingVisuals = null;
let toolAction = { name: '', startedAt: 0, duration: 0 };
let cleaningState = null;
let spawnPoint = new THREE.Vector3(0, 1.72, 15);
const player = new THREE.Vector3(0, 1.72, 15);
let jumpOffset = 0;
let jumpVelocity = 0;
let grounded = true;

const fishing = {
  phase: 'idle',
  charge: 0,
  castTarget: null,
  castLanding: null,
  castBait: null,
  castLure: null,
  baitConsumed: false,
  biteAt: 0,
  biteDeadline: 0,
  reelProgress: 0,
  reelHeld: false,
  fishSpecies: null,
  fishSize: 0,
  fishWeight: 0,
  practice: false,
  hookClicks: 0,
  hookTarget: 0,
  hookStartedAt: 0,
  tensionState: 'clear',
  nextTensionAt: 0,
  tensionEndsAt: 0,
  invalidCast: false
};

function slotStorageKey(slot) {
  return slot === 1 ? SAVE_KEY : `${SAVE_KEY}::${slot}`;
}

function readActiveSlot() {
  try {
    const stored = Number(window.localStorage.getItem(ACTIVE_SLOT_KEY));
    return SAVE_SLOTS.includes(stored) ? stored : 1;
  } catch (error) {
    return 1;
  }
}

function readRawSlot(slot) {
  try {
    return JSON.parse(window.localStorage.getItem(slotStorageKey(slot)) || 'null');
  } catch (error) {
    return null;
  }
}

function slotHasData(slot) {
  return Boolean(readRawSlot(slot));
}

function defaultProfileName(slot) {
  return `Field record ${slot}`;
}

function loadSave(slot = activeSlot) {
  try {
    const parsed = readRawSlot(slot);
    if (!parsed) {
      const fresh = structuredClone(DEFAULT_SAVE);
      fresh.profileName = defaultProfileName(slot);
      return fresh;
    }
    return {
      ...structuredClone(DEFAULT_SAVE),
      ...parsed,
      supplies: { ...DEFAULT_SAVE.supplies, ...(parsed.supplies || {}) },
      ingredients: { ...DEFAULT_SAVE.ingredients, ...(parsed.ingredients || {}) },
      cooked: { ...DEFAULT_SAVE.cooked, ...(parsed.cooked || {}) },
      materials: { ...DEFAULT_SAVE.materials, ...(parsed.materials || {}) },
      builds: { ...(parsed.builds || {}) },
      honey: Number(parsed.honey || 0),
      records: { ...(parsed.records || {}) },
      caught: { ...(parsed.caught || {}) },
      cleanedEnclosures: { ...(parsed.cleanedEnclosures || {}) },
      brynleeCaretakerUntil: Number(parsed.brynleeCaretakerUntil || 0),
      brooksWatchUntil: Number(parsed.brooksWatchUntil || 0),
      brooksAssignment: parsed.brooksAssignment || 'conservatory',
      graysonResearch: Number(parsed.graysonResearch || 0),
      profileName: parsed.profileName || defaultProfileName(slot),
      dayPhase: Number.isFinite(Number(parsed.dayPhase)) ? Number(parsed.dayPhase) : null
    };
  } catch (error) {
    console.warn('Save data unavailable; using a fresh field kit.', error);
    const fresh = structuredClone(DEFAULT_SAVE);
    fresh.profileName = defaultProfileName(slot);
    return fresh;
  }
}

function saveGame() {
  try {
    save.lastZone = currentZone;
    save.dayPhase = getDayPhase();
    save.savedAt = Date.now();
    window.localStorage.setItem(slotStorageKey(activeSlot), JSON.stringify(save));
    window.localStorage.setItem(ACTIVE_SLOT_KEY, String(activeSlot));
    dom.saveStatus.textContent = 'SAVED';
    dom.saveStatus.style.color = 'var(--aqua)';
  } catch (error) {
    dom.saveStatus.textContent = 'LOCAL ONLY';
    dom.saveStatus.style.color = 'var(--orange)';
    console.warn('Could not write local field notes.', error);
  }
}

function formatName(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function distanceTo(position) {
  return player.distanceTo(position);
}

function mat(color, options = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.88,
    metalness: 0,
    flatShading: true,
    ...options
  });
}

function addMesh(parent, geometry, material, position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1]) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  mesh.scale.set(...scale);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function addCollider(x, z, radius, options = {}) {
  const collider = { id: colliders.length, x, z, radius, enabled: true, ...options };
  colliders.push(collider);
  // A dressing pass registers logs, stumps and shrubs as it goes; the lookup
  // grid has to see them so later flora does not land on top of them.
  indexColliderForFlora(collider);
  return collider;
}

function clearDebugCollisionVisuals() {
  if (debugCollisionGroup) world.remove(debugCollisionGroup);
  debugCollisionGroup = null;
}

function rebuildDebugCollisionVisuals() {
  clearDebugCollisionVisuals();
  if (!debugCollisionVisible) return;
  debugCollisionGroup = new THREE.Group();
  debugCollisionGroup.name = 'debug-collision-visuals';
  debugCollisionGroup.renderOrder = 20;
  world.add(debugCollisionGroup);

  colliders.forEach((collider, index) => {
    const isRect = collider.type === 'rect';
    const width = isRect ? collider.halfWidth * 2 : collider.radius * 2;
    const depth = isRect ? collider.halfDepth * 2 : collider.radius * 2;
    const height = isRect ? 2.4 : 1.8;
    const material = new THREE.MeshBasicMaterial({
      color: collider.enabled === false ? 0x8b9290 : isRect ? 0xff4f62 : 0xffc34f,
      wireframe: true,
      transparent: true,
      opacity: collider.enabled === false ? 0.2 : 0.88,
      depthTest: false,
      depthWrite: false
    });
    const geometry = isRect
      ? new THREE.BoxGeometry(Math.max(0.08, width), height, Math.max(0.08, depth))
      : new THREE.CylinderGeometry(Math.max(0.08, collider.radius), Math.max(0.08, collider.radius), height, 20);
    const shape = new THREE.Mesh(geometry, material);
    shape.position.set(collider.x, height / 2, collider.z);
    shape.userData.colliderId = collider.id ?? index;
    debugCollisionGroup.add(shape);

    const kind = isRect ? 'RECT' : 'CIRCLE';
    const dimensions = isRect ? `${collider.halfWidth.toFixed(1)}x${collider.halfDepth.toFixed(1)}` : `${collider.radius.toFixed(1)}r`;
    const state = collider.enabled === false ? ' OFF' : '';
    const name = collider.debugLabel ? `${collider.debugLabel} ` : '';
    const label = makeLabel(`${name}C${collider.id ?? index} ${kind} ${dimensions} @${collider.x.toFixed(0)},${collider.z.toFixed(0)}${state}`, collider.enabled === false ? '#c5cbc8' : isRect ? '#ff9aa3' : '#ffe08a', '#202a26', 0.24);
    label.material.depthTest = false;
    label.position.set(collider.x, height + 0.42, collider.z);
    label.renderOrder = 21;
    debugCollisionGroup.add(label);
  });
}

function resolveWorldCollisions() {
  for (const collider of colliders) {
    if (collider.enabled === false || (collider.zone && collider.zone !== currentZone)) continue;
    if (collider.type === 'rect') {
      const nearestX = clamp(player.x, collider.x - collider.halfWidth, collider.x + collider.halfWidth);
      const nearestZ = clamp(player.z, collider.z - collider.halfDepth, collider.z + collider.halfDepth);
      const dx = player.x - nearestX;
      const dz = player.z - nearestZ;
      const distanceSq = dx * dx + dz * dz;
      if (distanceSq < PLAYER_RADIUS * PLAYER_RADIUS) {
        if (distanceSq > 0.0001) {
          const distance = Math.sqrt(distanceSq);
          const push = (PLAYER_RADIUS - distance) / distance;
          player.x += dx * push;
          player.z += dz * push;
        } else {
          const fromX = Math.abs(player.x - collider.x) / Math.max(0.01, collider.halfWidth);
          const fromZ = Math.abs(player.z - collider.z) / Math.max(0.01, collider.halfDepth);
          if (fromX > fromZ) player.x = collider.x + Math.sign(player.x - collider.x || 1) * (collider.halfWidth + PLAYER_RADIUS);
          else player.z = collider.z + Math.sign(player.z - collider.z || 1) * (collider.halfDepth + PLAYER_RADIUS);
        }
      }
      // A rectangle is fully described by the box test. Falling through to the
      // circle test below would give every rect an invisible circular bulge of
      // its `radius`, which is what used to seal gaps in walls and fences.
      continue;
    }
    const dx = player.x - collider.x;
    const dz = player.z - collider.z;
    const minDistance = PLAYER_RADIUS + collider.radius;
    const distanceSq = dx * dx + dz * dz;
    if (distanceSq < minDistance * minDistance && distanceSq > 0.0001) {
      const distance = Math.sqrt(distanceSq);
      const push = (minDistance - distance) / distance;
      player.x += dx * push;
      player.z += dz * push;
    }
  }
}

function box(parent, size, color, position, options = {}) {
  return addMesh(parent, new THREE.BoxGeometry(...size), mat(color, options.material), position, options.rotation, options.scale);
}

function cylinder(parent, radiusTop, radiusBottom, height, color, position, options = {}) {
  return addMesh(parent, new THREE.CylinderGeometry(radiusTop, radiusBottom, height, options.segments || 8), mat(color, options.material), position, options.rotation, options.scale);
}

function sphere(parent, radius, color, position, options = {}) {
  return addMesh(parent, new THREE.SphereGeometry(radius, options.widthSegments || 10, options.heightSegments || 7), mat(color, options.material), position, options.rotation, options.scale);
}

function cone(parent, radius, height, color, position, options = {}) {
  return addMesh(parent, new THREE.ConeGeometry(radius, height, options.segments || 8), mat(color, options.material), position, options.rotation, options.scale);
}

function makeLabel(text, color = '#d8ef85', background = '#1a3023', scale = 1.4) {
  const labelCanvas = document.createElement('canvas');
  labelCanvas.width = 512;
  labelCanvas.height = 128;
  const context = labelCanvas.getContext('2d');
  context.fillStyle = background;
  context.fillRect(0, 0, labelCanvas.width, labelCanvas.height);
  context.strokeStyle = color;
  context.lineWidth = 4;
  context.strokeRect(5, 5, labelCanvas.width - 10, labelCanvas.height - 10);
  context.fillStyle = color;
  context.font = '800 34px Trebuchet MS, Arial, sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(text.toUpperCase(), labelCanvas.width / 2, labelCanvas.height / 2 + 2);
  const texture = new THREE.CanvasTexture(labelCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false }));
  sprite.scale.set(scale * 3.5, scale * 0.87, 1);
  sprite.castShadow = false;
  return sprite;
}

function createHeldToolModel(tool) {
  while (heldToolGroup.children.length) heldToolGroup.remove(heldToolGroup.children[0]);

  const root = new THREE.Group();
  root.position.set(0.7, -0.66, -1.3);
  root.scale.setScalar(tool === 'rod' ? 0.5 : tool === 'net' ? 0.46 : 0.52);
  root.rotation.set(-0.16, -0.2, -0.42);
  sphere(root, 0.15, 0xc7825e, [0, -0.38, 0.08], { scale: [0.88, 1, 1.18] });

  if (tool === 'rod') {
    cylinder(root, 0.075, 0.095, 0.34, 0x29352f, [0, -0.18, 0.02], { segments: 8, rotation: [0, 0, 0.08] });
    cylinder(root, 0.045, 0.055, 1.48, 0x8e5d3c, [0, 0.68, 0.02], { segments: 8, rotation: [0.05, 0, 0] });
    cylinder(root, 0.075, 0.075, 0.12, 0x242d29, [0.1, 0.08, -0.02], { segments: 10, rotation: [Math.PI / 2, 0, 0] });
    torus(root, 0.11, 0.024, 0xc2a66d, [0.1, 0.08, -0.1], [0, 0, 0], 10, 18);
    cylinder(root, 0.018, 0.018, 0.46, 0xf1dfb0, [0, 1.42, 0.02], { segments: 6, rotation: [0.05, 0, 0] });
  }

  if (tool === 'net') {
    cylinder(root, 0.035, 0.06, 1.18, 0x80634b, [0, 0.28, 0.02], { segments: 8, rotation: [0.03, 0, 0.02] });
    torus(root, 0.36, 0.045, 0xd1b77e, [0, 1.04, 0], [0, 0, 0], 8, 24);
    root.userData.netCloth = createLooseNet(root);
  }

  if (tool === 'magnifier') {
    cylinder(root, 0.045, 0.07, 0.82, 0x76533f, [0, -0.02, 0.02], { segments: 8, rotation: [0, 0, -0.42] });
    torus(root, 0.3, 0.055, 0xc9ad68, [0.29, 0.62, 0], [0, 0, 0], 8, 24);
    addMesh(root, new THREE.CircleGeometry(0.25, 20), mat(0xbde9e3, { transparent: true, opacity: 0.38, depthWrite: false, side: THREE.DoubleSide, emissive: 0x3a7770, emissiveIntensity: 0.24 }), [0.29, 0.62, -0.02]);
    sphere(root, 0.035, 0xf4edc9, [0.19, 0.76, -0.08], { material: { emissive: 0xffffff, emissiveIntensity: 0.8 } });
  }

  if (tool === 'food') {
    if (selectedFood === 'carrots') {
      cone(root, 0.12, 0.55, 0xe27b3d, [0, 0.08, 0], { segments: 7, rotation: [0, 0, 0.1] });
      for (const x of [-0.08, 0, 0.08]) cylinder(root, 0.014, 0.025, 0.26, 0x5f9655, [x, 0.42, 0], { segments: 5, rotation: [0, 0, (x * 3) || 0.15] });
    } else {
      const fish = createAnimalModel(selectedFood, 0.42);
      fish.position.set(0, 0.1, 0);
      root.add(fish);
    }
  }

  root.traverse((object) => {
    if (object.isMesh || object.isSprite) {
      object.castShadow = false;
      object.receiveShadow = false;
      object.frustumCulled = false;
    }
  });
  heldToolGroup.add(root);
  heldToolGroup.userData.root = root;
  heldToolGroup.userData.basePosition = root.position.clone();
  heldToolGroup.userData.baseRotation = root.rotation.clone();
  heldToolGroup.userData.tool = tool;
}

function createLooseNet(root) {
  const rows = 6;
  const columns = 12;
  const points = [];
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      points.push(new THREE.Vector3(), new THREE.Vector3());
    }
  }
  for (let row = 0; row < rows - 1; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      points.push(new THREE.Vector3(), new THREE.Vector3());
    }
  }
  const mesh = new THREE.LineSegments(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineBasicMaterial({ color: 0xd7f1e7, transparent: true, opacity: 0.8 })
  );
  root.add(mesh);
  return { mesh, rows, columns };
}

function updateLooseNet(netCloth, time, swing) {
  if (!netCloth) return;
  const { mesh, rows, columns } = netCloth;
  const positions = mesh.geometry.attributes.position.array;
  const gridPoint = (row, column) => {
    const progress = row / (rows - 1);
    const angle = column / columns * Math.PI * 2;
    const radius = 0.34 * (1 - progress * 0.78);
    const sway = swing * progress * 0.075;
    return new THREE.Vector3(
      Math.cos(angle) * radius + Math.sin(time * 2.7 + row) * progress * 0.018 + sway,
      1.04 - progress * 0.8 + Math.sin(time * 3.1 + column * 0.7 + row) * (0.008 + progress * 0.016),
      Math.sin(angle) * radius + 0.035 + Math.cos(time * 2.4 + column * 0.9) * progress * 0.018
    );
  };
  let offset = 0;
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const left = gridPoint(row, column);
      const right = gridPoint(row, (column + 1) % columns);
      positions[offset++] = left.x; positions[offset++] = left.y; positions[offset++] = left.z;
      positions[offset++] = right.x; positions[offset++] = right.y; positions[offset++] = right.z;
    }
  }
  for (let row = 0; row < rows - 1; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const top = gridPoint(row, column);
      const bottom = gridPoint(row + 1, column);
      positions[offset++] = top.x; positions[offset++] = top.y; positions[offset++] = top.z;
      positions[offset++] = bottom.x; positions[offset++] = bottom.y; positions[offset++] = bottom.z;
    }
  }
  mesh.geometry.attributes.position.needsUpdate = true;
}

function createSkybox() {
  const skyMaterial = new THREE.ShaderMaterial({
    uniforms: skyUniforms,
    vertexShader: `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 topColor;
      uniform vec3 horizonColor;
      uniform vec3 lowerColor;
      varying vec3 vWorldPosition;
      void main() {
        float elevation = normalize(vWorldPosition - cameraPosition).y;
        float horizonBlend = smoothstep(-0.7, 0.18, elevation);
        vec3 lowerHorizon = mix(lowerColor, horizonColor, horizonBlend);
        vec3 skyColor = mix(lowerHorizon, topColor, smoothstep(0.06, 0.9, elevation));
        gl_FragColor = vec4(skyColor, 1.0);
      }
    `,
    side: THREE.BackSide,
    depthWrite: false,
    depthTest: false,
    fog: false
  });
  skybox = new THREE.Mesh(new THREE.SphereGeometry(180, 48, 24), skyMaterial);
  skybox.renderOrder = -10;
  scene.add(skybox);
  createLowClouds();
}

function createLowClouds() {
  skyCloudLayer = new THREE.Group();
  skyCloudLayer.name = 'low-cloud-layer';
  skyCloudMaterial = new THREE.MeshBasicMaterial({ color: 0xf2eee3, transparent: true, opacity: 0.58, depthWrite: false, fog: false });
  const cloudLayouts = [
    [-72, 9.5, -36, 1.15, 0.18, 0.018],
    [-28, 12.5, -122, 1.55, 1.4, 0.012],
    [18, 10.4, -62, 1.05, 2.7, 0.016],
    [66, 13.2, -154, 1.35, 3.8, 0.01],
    [84, 9.2, -12, 0.9, 5.2, 0.02],
    [-82, 14.2, -188, 1.25, 4.4, 0.014]
  ];
  cloudLayouts.forEach(([x, y, z, scale, phase, speed]) => {
    const cloud = new THREE.Group();
    cloud.position.set(x, y, z);
    cloud.scale.setScalar(scale);
    cloud.userData.cloudMotion = { baseX: x, baseZ: z, phase, speed };
    [[-1.2, 0, 0.05, 1.05], [0, 0.18, 0, 1.35], [1.3, 0.02, 0.08, 0.9], [2.25, -0.06, 0.02, 0.65]].forEach(([px, py, pz, puffScale]) => {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(1.15 * puffScale, 12, 8), skyCloudMaterial);
      puff.position.set(px, py, pz);
      puff.scale.set(1.35, 0.38, 0.78);
      cloud.add(puff);
    });
    skyCloudLayer.add(cloud);
  });
  scene.add(skyCloudLayer);
}

// `dayTimeOffset` is what sleeping moves. Keeping it separate from `elapsed`
// means a night's sleep does not also fast-forward every respawn, cooldown and
// patrol timer in the world.
function getDayPhase() {
  return (((elapsed + dayTimeOffset) / SKY_CYCLE_SECONDS + SKY_PHASE_OFFSET) % 1 + 1) % 1;
}

function phaseForHour(hour) {
  return (((hour - DAY_HOUR_OFFSET) / 24) % 1 + 1) % 1;
}

// Always moves the clock forward, so picking a time earlier than now sleeps
// through to that time tomorrow rather than winding the day backwards.
function advanceDayToPhase(targetPhase) {
  const current = getDayPhase();
  let delta = targetPhase - current;
  if (delta <= 0.0005) delta += 1;
  dayTimeOffset += delta * SKY_CYCLE_SECONDS;
  return delta * SKY_CYCLE_SECONDS;
}

function getDayPeriod(phase = getDayPhase()) {
  let period = 'night';
  for (const bound of DAY_PERIOD_BOUNDS) {
    if (phase >= bound.from) period = bound.key;
  }
  // Everything before the first boundary belongs to the tail of the previous night.
  if (phase < DAY_PERIOD_BOUNDS[0].from) period = 'night';
  return period;
}

function getFieldClockLabel(phase = getDayPhase()) {
  const hours = (phase * 24 + DAY_HOUR_OFFSET) % 24;
  // Round to the nearest minute rather than flooring: the phase is accumulated
  // in floats, so an exact hour can land a hair under and read as :59.
  const totalMinutes = Math.round(hours * 60) % (24 * 60);
  const whole = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(whole).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function getPeriodSecondsRemaining(phase = getDayPhase()) {
  const next = DAY_PERIOD_BOUNDS.map((bound) => bound.from).find((from) => from > phase);
  const target = next === undefined ? 1 + DAY_PERIOD_BOUNDS[0].from : next;
  return Math.max(0, (target - phase) * SKY_CYCLE_SECONDS);
}

function isSpeciesActive(species, period = currentDayPeriod) {
  const activity = SPECIES[species]?.activity || ALWAYS_ACTIVE;
  return activity.includes(period);
}

function describeSpeciesActivity(species) {
  const activity = SPECIES[species]?.activity || ALWAYS_ACTIVE;
  const day = activity.includes('day');
  const night = activity.includes('night');
  const dawn = activity.includes('dawn');
  const dusk = activity.includes('dusk');
  if (day && night) return 'Active around the clock';
  if (!day && !night) return 'Crepuscular · dawn and dusk only';
  if (night) {
    if (dawn && dusk) return 'Nocturnal · dusk to first light';
    if (dusk) return 'Nocturnal · out from dusk';
    if (dawn) return 'Nocturnal · lingers past first light';
    return 'Nocturnal · deep night only';
  }
  if (dawn && dusk) return 'Diurnal · first light to last';
  if (dawn) return 'Diurnal · busiest at first light';
  if (dusk) return 'Diurnal · works on into dusk';
  return 'Diurnal · full daylight only';
}

function listActiveSpecies(period = currentDayPeriod) {
  return Object.keys(SPECIES).filter((key) => SPECIES[key].type !== 'fish' && isSpeciesActive(key, period));
}

// Fires once whenever the field rolls into a new part of the day.
function updateDayCycleEvents() {
  const period = getDayPeriod();
  if (period === currentDayPeriod) return;
  const first = currentDayPeriod === '';
  currentDayPeriod = period;
  if (first) return;
  const messages = {
    dawn: 'First light. Rabbits and foxes are still out while the day shift wakes up.',
    day: 'Full daylight. Butterflies, bees and squirrels are working the meadow.',
    dusk: 'Dusk settles in. Owls and raccoons are starting their rounds.',
    night: 'Night falls over the field. Only the nocturnal animals are moving now.'
  };
  toast(messages[period], period === 'night' ? 'warning' : 'success');
  if (dom.journalModal && !dom.journalModal.classList.contains('is-hidden')) renderJournal();
}

function getSkyCycleSample() {
  // Read the same clock the field journal and the animal schedules read, so a
  // night's sleep moves the sky along with the time it just skipped.
  const phase = getDayPhase();
  let before = SKY_STOPS[SKY_STOPS.length - 1];
  let after = SKY_STOPS[0];
  let span = 1 - before.at;
  let distance = phase - before.at;
  for (let index = 0; index < SKY_STOPS.length - 1; index += 1) {
    if (phase >= SKY_STOPS[index].at && phase < SKY_STOPS[index + 1].at) {
      before = SKY_STOPS[index];
      after = SKY_STOPS[index + 1];
      span = after.at - before.at;
      distance = phase - before.at;
      break;
    }
  }
  if (phase < SKY_STOPS[0].at) {
    before = SKY_STOPS[SKY_STOPS.length - 1];
    after = SKY_STOPS[0];
    span = 1 - before.at + after.at;
    distance = phase + 1 - before.at;
  }
  return { before, after, blend: clamp(distance / span, 0, 1) };
}

function updateSkyCycle() {
  if (!skybox) return;
  const { before, after, blend } = getSkyCycleSample();
  const topColor = new THREE.Color(before.top).lerp(new THREE.Color(after.top), blend);
  const horizonColor = new THREE.Color(before.horizon).lerp(new THREE.Color(after.horizon), blend);
  const lowerColor = new THREE.Color(before.lower).lerp(new THREE.Color(after.lower), blend);
  skyUniforms.topColor.value.copy(topColor);
  skyUniforms.horizonColor.value.copy(horizonColor);
  skyUniforms.lowerColor.value.copy(lowerColor);
  const daylight = THREE.MathUtils.lerp(before.daylight, after.daylight, blend);
  currentDaylight = daylight;
  updateDayCycleEvents();
  skybox.position.set(camera.position.x, camera.position.y, camera.position.z);
  if (skyCloudLayer) {
    skyCloudLayer.position.set(camera.position.x, 0, camera.position.z);
    for (const cloud of skyCloudLayer.children) {
      const motion = cloud.userData.cloudMotion;
      const drift = (elapsed * motion.speed + motion.phase) % 240;
      cloud.position.x = ((motion.baseX + drift + 120) % 240) - 120;
      cloud.position.z = motion.baseZ + Math.sin(elapsed * 0.006 + motion.phase) * 2.2;
    }
  }
  if (skyCloudMaterial) {
    skyCloudMaterial.color.copy(new THREE.Color(0x777d93).lerp(new THREE.Color(0xf4f0e2), daylight));
    skyCloudMaterial.opacity = 0.16 + daylight * 0.46;
  }
  sunLight.intensity = (currentZone === 'forest' ? 3.45 : 3.05) * (0.18 + daylight * 0.82);
  sunLight.color.copy(new THREE.Color(0xb4bce0).lerp(new THREE.Color(0xffedc3), daylight));
  hemiLight.intensity = 0.62 + daylight * 1.58;
  updateSunPosition();
}

// The sun rides an east-to-west arc across the daylight band of the cycle and
// dips below the ridge at night, so shadows sweep and lengthen with the clock
// instead of pointing the same way all day.
function updateSunPosition() {
  const phase = getDayPhase();
  const dawn = DAY_PERIOD_BOUNDS[0].from;
  const dusk = DAY_PERIOD_BOUNDS[DAY_PERIOD_BOUNDS.length - 1].from;
  const arc = Math.PI * clamp((phase - dawn) / (dusk - dawn), -0.16, 1.16);
  const height = Math.sin(arc);
  sunLight.position.set(
    camera.position.x - Math.cos(arc) * 30,
    6 + Math.max(0.1, height) * 26,
    camera.position.z + 11 - height * 4
  );
  sunLight.target.position.set(camera.position.x, 0, camera.position.z);
  sunLight.target.updateMatrixWorld();
}

function torus(parent, majorRadius, tubeRadius, color, position, rotation = [0, 0, 0], radialSegments = 8, tubularSegments = 18) {
  return addMesh(parent, new THREE.TorusGeometry(majorRadius, tubeRadius, radialSegments, tubularSegments), mat(color), position, rotation);
}

function triggerToolAction(name, duration = 0.45) {
  toolAction = { name, startedAt: elapsed, duration };
}

function updateHeldTool() {
  heldToolGroup.visible = !(currentZone === 'lake' && lakeArrival?.active) && !lakeBoatPilot?.active;
  const root = heldToolGroup.userData.root;
  const basePosition = heldToolGroup.userData.basePosition;
  const baseRotation = heldToolGroup.userData.baseRotation;
  if (!root || !basePosition || !baseRotation) return;
  const moving = isKeyDown('KeyW', 'KeyA', 'KeyS', 'KeyD', 'w', 'a', 's', 'd');
  const stride = moving ? Math.sin(elapsed * 8.2) : Math.sin(elapsed * 1.8) * 0.2;
  const actionName = toolAction.name;
  const actionProgress = actionName ? clamp((elapsed - toolAction.startedAt) / toolAction.duration, 0, 1) : 0;
  const actionPulse = Math.sin(actionProgress * Math.PI);
  root.position.copy(basePosition);
  root.position.y += stride * (moving ? 0.018 : 0.004);
  root.rotation.copy(baseRotation);
  root.rotation.z += stride * (moving ? 0.035 : 0.008);
  if (fishing.phase === 'charging') root.rotation.x -= fishing.charge * 0.2;
  if (fishing.phase === 'reeling') root.rotation.x += Math.sin(elapsed * 10) * 0.035;
  if (actionName === 'rod-charge') {
    root.position.y += actionPulse * 0.055;
    root.rotation.z -= actionPulse * 0.12;
  }
  if (actionName === 'rod-cast') {
    root.position.x += actionPulse * 0.08;
    root.rotation.x += actionPulse * 0.34;
    root.rotation.z -= actionPulse * 0.48;
  }
  if (actionName === 'rod-hook') {
    root.position.y += actionPulse * 0.045;
    root.rotation.x -= actionPulse * 0.28;
  }
  if (actionName === 'net-swing') {
    root.position.x -= actionPulse * 0.09;
    root.rotation.y += actionPulse * 0.26;
    root.rotation.z += actionPulse * 0.55;
  }
  if (actionName === 'magnifier-inspect') {
    root.position.x -= actionPulse * 0.42;
    root.position.y += actionPulse * 0.26;
    root.position.z -= actionPulse * 0.28;
    root.rotation.x -= actionPulse * 0.28;
    root.rotation.z += actionPulse * 0.22;
  }
  if (actionName && actionProgress >= 1) toolAction = { name: '', startedAt: 0, duration: 0 };
  if (root.userData.netCloth) updateLooseNet(root.userData.netCloth, elapsed, actionPulse + stride * 0.35);
}


function setZonePalette(zoneKey) {
  const zone = ZONES[zoneKey];
  scene.background = new THREE.Color(0x0b1721);
  scene.fog = new THREE.Fog(zone.fog, zone.fogNear || 34, zone.fogFar || 100);
  hemiLight.color.set(zoneKey === 'forest' ? 0xd6efcb : 0xe9efcf);
  hemiLight.groundColor.set(zoneKey === 'zoo' ? 0x2f4034 : 0x20352a);
  sunLight.color.set(zoneKey === 'forest' ? 0xfff3ce : 0xffedc3);
  sunLight.intensity = zoneKey === 'forest' ? 3.45 : 3.05;
}

function addGround(color, size = 90) {
  return addMesh(world, new THREE.PlaneGeometry(size, size), mat(color), [0, -0.08, 0], [-Math.PI / 2, 0, 0]);
}

// The hub lot every destination shares: marked stalls in two rows either side of
// a drive aisle, a service drive out to the street, and the street itself
// running along the back. The street is out of bounds on foot — only traffic
// uses it — so visitors arrive and leave by car rather than fading in and out.
const PARKING_LOT = {
  halfWidth: 15,
  minZ: 2,
  wallZ: 22.6,
  driveX: 10.6,
  driveHalfWidth: 3.2,
  aisleZ: 15.5,
  rowBackZ: 19.4,
  rowFrontZ: 11.6,
  stallPitch: 2.9,
  streetZ: 27.4,
  streetHalfDepth: 4.1,
  laneZ: 25.6,
  farLaneZ: 29.2,
  streetMinX: -42,
  streetMaxX: 42,
  playerStallX: -1.5,
  backStallX: [-13.1, -10.2, -7.3, -4.4, -1.5, 1.4, 4.3],
  frontStallX: [-13.1, -10.2, -7.3, -4.4, 1.4, 4.3, 7.2, 10.1, 13],
  // Where visiting cars park. Back-row stalls face the wall, front-row stalls
  // face the footpath, and both back out into the aisle when they leave.
  visitorStalls: [
    { x: 4.3, z: 19.4, facing: 1 },
    { x: 1.4, z: 19.4, facing: 1 },
    { x: -1.5, z: 19.4, facing: 1 },
    { x: 10.1, z: 11.6, facing: -1 },
    { x: 7.2, z: 11.6, facing: -1 },
    { x: -4.4, z: 19.4, facing: 1 }
  ]
};

const HUB_ZONES = ['store', 'forest', 'zoo'];

// Local forward for the car model runs down +x, so a heading of zero points the
// nose east. This converts a direction of travel into that model rotation.
function carHeading(dx, dz) {
  return Math.atan2(-dz, dx);
}

function isParkingLotPosition(x, z, padding = 0) {
  if (!HUB_ZONES.includes(currentZone)) return false;
  const lot = PARKING_LOT;
  const onPad = Math.abs(x) <= lot.halfWidth + padding && z >= lot.minZ - padding && z <= lot.wallZ + padding;
  const onDrive = Math.abs(x - lot.driveX) <= lot.driveHalfWidth + padding && z >= lot.wallZ - padding && z <= lot.streetZ + padding;
  const onStreet = z >= lot.streetZ - lot.streetHalfDepth - padding && z <= lot.streetZ + lot.streetHalfDepth + padding;
  return onPad || onDrive || onStreet;
}

function createParkingStallLines(centerZ, stallXs, depth) {
  const lot = PARKING_LOT;
  const half = lot.stallPitch / 2;
  const edges = new Set();
  stallXs.forEach((x) => {
    edges.add(Number((x - half).toFixed(2)));
    edges.add(Number((x + half).toFixed(2)));
  });
  edges.forEach((x) => {
    box(world, [0.12, 0.035, depth], 0xd4c78e, [x, 0.09, centerZ], { material: { roughness: 0.8 } });
  });
}

function createLotLamp(x, z) {
  const lamp = new THREE.Group();
  lamp.position.set(x, 0, z);
  cylinder(lamp, 0.28, 0.34, 0.24, 0x39443b, [0, 0.12, 0], { segments: 8 });
  cylinder(lamp, 0.09, 0.12, 4.4, 0x4c5a4f, [0, 2.3, 0], { segments: 7 });
  box(lamp, [0.9, 0.1, 0.34], 0x4c5a4f, [0.4, 4.48, 0]);
  box(lamp, [0.62, 0.16, 0.42], 0xf6efc8, [0.72, 4.34, 0], {
    material: { emissive: 0xffe6a2, emissiveIntensity: 0.55, roughness: 0.5 }
  });
  world.add(lamp);
  addCollider(x, z, 0.34, { zone: currentZone });
  return lamp;
}

// The public road past the lot. The player is walled out of it; the traffic
// system drives visiting cars along it and off past the treeline.
function createHubStreet() {
  const lot = PARKING_LOT;
  const width = lot.streetMaxX - lot.streetMinX;
  const centerX = (lot.streetMinX + lot.streetMaxX) / 2;
  box(world, [width, 0.09, lot.streetHalfDepth * 2], 0x3b4038, [centerX, 0.015, lot.streetZ], { material: { roughness: 1 } });
  box(world, [width, 0.03, lot.streetHalfDepth * 2 - 0.9], 0x4a5049, [centerX, 0.06, lot.streetZ], { material: { roughness: 1 } });
  // Centre dashes and shoulder lines.
  for (let x = lot.streetMinX + 2; x < lot.streetMaxX - 2; x += 4.4) {
    box(world, [2.2, 0.02, 0.16], 0xd9cf92, [x, 0.08, lot.streetZ], { material: { roughness: 0.8 } });
  }
  for (const edge of [-1, 1]) {
    box(world, [width, 0.02, 0.14], 0xcfc9a4, [centerX, 0.08, lot.streetZ + edge * (lot.streetHalfDepth - 0.5)], { material: { roughness: 0.8 } });
  }
  // Kerb along the near verge, broken where the service drive crosses it.
  const kerbZ = lot.streetZ - lot.streetHalfDepth - 0.5;
  [[lot.streetMinX, lot.driveX - lot.driveHalfWidth], [lot.driveX + lot.driveHalfWidth, lot.streetMaxX]].forEach(([fromX, toX]) => {
    box(world, [toX - fromX, 0.14, 1.1], 0x5c6350, [(fromX + toX) / 2, 0.06, kerbZ], { material: { roughness: 1 } });
  });
  box(world, [lot.driveHalfWidth * 2, 0.09, lot.streetZ - lot.wallZ + 2.4], 0x434a41,
    [lot.driveX, 0.02, (lot.streetZ + lot.wallZ) / 2 - 0.6], { material: { roughness: 1 } });
  // Hatched keep-clear paint and a sign: the drive is for traffic, not walkers.
  for (let index = 0; index < 5; index += 1) {
    box(world, [lot.driveHalfWidth * 1.8, 0.02, 0.18], 0xd9b063, [lot.driveX, 0.075, lot.wallZ - 1.3 + index * 0.42], {
      rotation: [0, 0, 0],
      material: { roughness: 0.85 }
    });
  }
  for (const side of [-1, 1]) {
    cylinder(world, 0.09, 0.11, 1.05, 0xd9a94f, [lot.driveX + side * (lot.driveHalfWidth - 0.15), 0.52, lot.wallZ - 0.4], { segments: 7 });
    box(world, [0.16, 0.14, 0.16], 0x2f3831, [lot.driveX + side * (lot.driveHalfWidth - 0.15), 1.06, lot.wallZ - 0.4]);
  }
  const driveSign = makeLabel('SERVICE DRIVE · NO PEDESTRIAN ACCESS', '#f2b268', '#33291f', 0.38);
  driveSign.position.set(lot.driveX, 1.85, lot.wallZ - 0.35);
  world.add(driveSign);
  // A treeline along the far verge, and a heavier screen out past each end of
  // the road, so traffic turns out of sight instead of shrinking to a dot on
  // open ground.
  for (let index = 0, x = lot.streetMinX - 6; x <= lot.streetMaxX + 6; index += 1, x += 4.4) {
    createTree(x, lot.streetZ + lot.streetHalfDepth + 2.4 + (index % 2) * 1.4, 1.1 + (index % 3) * 0.16, index % 2 ? 0x3b6446 : 0x44704b, 0x6a4c36);
    if (index % 2 === 0) createTree(x + 2.2, lot.streetZ + lot.streetHalfDepth + 7.2 + (index % 3) * 1.8, 1.24 + (index % 2) * 0.2, 0x3f6a49, 0x63482f);
  }
  for (const side of [-1, 1]) {
    for (let index = 0; index < 6; index += 1) {
      createTree(side * (lot.streetMaxX + 4 + (index % 3) * 4.2), lot.streetZ - lot.streetHalfDepth - 3.4 - index * 3.6, 1.18 + (index % 3) * 0.16, 0x3b6446, 0x6a4c36);
    }
  }
}

function createParkingHub(label, accent) {
  const lot = PARKING_LOT;
  const padDepth = lot.wallZ - lot.minZ;
  const padCenterZ = (lot.wallZ + lot.minZ) / 2;
  box(world, [lot.halfWidth * 2 + 0.8, 0.08, padDepth + 0.8], 0x333f38, [0, 0, padCenterZ], { material: { roughness: 1 } });
  box(world, [lot.halfWidth * 2 - 0.6, 0.025, padDepth - 0.6], 0x4f5b4e, [0, 0.06, padCenterZ], { material: { roughness: 1 } });
  createParkingStallLines(lot.rowBackZ, lot.backStallX, 3.9);
  createParkingStallLines(lot.rowFrontZ, [...lot.frontStallX, lot.playerStallX], 3.9);
  // Aisle centre dashes and the painted walkway back to the field.
  for (let x = -lot.halfWidth + 2; x < lot.halfWidth - 1; x += 3.4) {
    box(world, [1.8, 0.02, 0.12], 0xb9b184, [x, 0.085, lot.aisleZ], { material: { roughness: 0.85 } });
  }
  for (let z = lot.minZ + 0.9; z < lot.rowFrontZ - 2.4; z += 1.4) {
    box(world, [2.6, 0.02, 0.42], 0xc9c69c, [0, 0.085, z], { material: { roughness: 0.85 } });
  }

  // Perimeter wall, with a gap where the service drive leaves for the street.
  const gapMin = lot.driveX - lot.driveHalfWidth;
  const gapMax = lot.driveX + lot.driveHalfWidth;
  const wallRuns = [[-lot.halfWidth, gapMin], [gapMax, lot.halfWidth]];
  wallRuns.forEach(([fromX, toX]) => {
    const runWidth = toX - fromX;
    if (runWidth <= 0.1) return;
    box(world, [runWidth, 0.5, 0.35], 0x26352d, [(fromX + toX) / 2, 0.25, lot.wallZ]);
    addCollider((fromX + toX) / 2, lot.wallZ, 0.2, { type: 'rect', halfWidth: runWidth / 2, halfDepth: 0.2, zone: currentZone });
  });
  // The drive mouth stays visually open for traffic and closed to the player.
  addCollider(lot.driveX, lot.wallZ, 0.2, { type: 'rect', halfWidth: lot.driveHalfWidth, halfDepth: 0.2, zone: currentZone, debugLabel: 'lot-service-drive' });
  for (const side of [-1, 1]) {
    box(world, [0.35, 0.5, padDepth], 0x26352d, [side * lot.halfWidth, 0.25, padCenterZ]);
    addCollider(side * lot.halfWidth, padCenterZ, 0.2, { type: 'rect', halfWidth: 0.2, halfDepth: padDepth / 2, zone: currentZone });
  }

  createLotLamp(-lot.halfWidth + 1.4, lot.aisleZ);
  createLotLamp(lot.halfWidth - 1.4, lot.aisleZ);
  createLotLamp(-lot.halfWidth + 1.4, lot.minZ + 2.2);

  const car = createCar();
  car.position.set(lot.playerStallX, 0.25, lot.rowFrontZ);
  car.rotation.y = carHeading(0, -1);
  world.add(car);
  addCollider(lot.playerStallX, lot.rowFrontZ, 1.5, { type: 'rect', halfWidth: 1.0, halfDepth: 1.9, zone: currentZone });
  interactables.push({ type: 'car', label: 'Open travel map', position: new THREE.Vector3(lot.playerStallX, 1.1, lot.rowFrontZ), radius: 3.5 });

  const sign = makeLabel(label, `#${new THREE.Color(accent).getHexString()}`, '#1c3025', 1.12);
  sign.position.set(-lot.halfWidth + 3.4, 3.4, lot.minZ - 1.4);
  sign.rotation.y = 0.22;
  world.add(sign);

  createHubStreet();
  for (const x of [-lot.halfWidth - 3.4, lot.halfWidth + 3.4]) {
    createTree(x, lot.rowFrontZ, 1.35, 0x376045, 0x6f4e39);
    createTree(x, lot.minZ + 0.5, 1.15, 0x3f6a49, 0x6f4e39);
  }
}

// --- Lot traffic ---------------------------------------------------------------
// Cars follow centripetal Catmull-Rom runs rather than turning on a point at
// each waypoint, so corners are taken as arcs and the whole approach reads as
// driving rather than as a sequence of snaps.

let trafficCars = [];
let passingTrafficAt = 0;

const VISITOR_CAR_COLORS = [0x9aa7b4, 0xb8564a, 0x5d7f6b, 0xd0b06a, 0x6c6f8c, 0x8c9a6a, 0xc4c0b4];

function createRoadRun(points, options = {}) {
  const curve = new THREE.CatmullRomCurve3(
    points.map(([x, z]) => new THREE.Vector3(x, 0.25, z)),
    false,
    'centripetal',
    0.5
  );
  return {
    curve,
    length: Math.max(0.5, curve.getLength()),
    reverse: Boolean(options.reverse),
    speed: options.speed || 6.5
  };
}

function spawnTrafficCar(legs, options = {}) {
  const group = createCar(options.color ?? VISITOR_CAR_COLORS[Math.floor(Math.random() * VISITOR_CAR_COLORS.length)], null);
  const start = legs[0].curve.getPointAt(0);
  const startTangent = legs[0].curve.getTangentAt(0);
  group.position.set(start.x, 0.25, start.z);
  group.rotation.y = carHeading(startTangent.x, startTangent.z) + (legs[0].reverse ? Math.PI : 0);
  world.add(group);
  const car = {
    group,
    legs,
    leg: 0,
    distance: 0,
    heading: group.rotation.y,
    onFinish: options.onFinish || null,
    onLeg: options.onLeg || null,
    collider: null
  };
  trafficCars.push(car);
  return car;
}

function retireTrafficCar(car) {
  world.remove(car.group);
  releaseCarCollider(car);
  trafficCars = trafficCars.filter((entry) => entry !== car);
}

// Every visitor stall is nose-in, so a parked car is narrow across the aisle
// and long into the bay. The collider only exists while the car is standing.
function holdCarCollider(car, x, z) {
  releaseCarCollider(car);
  car.collider = addCollider(x, z, 1.5, { type: 'rect', halfWidth: 1.0, halfDepth: 1.9, zone: currentZone });
}

function releaseCarCollider(car) {
  if (!car.collider) return;
  car.collider.enabled = false;
  colliders = colliders.filter((entry) => entry !== car.collider);
  car.collider = null;
}

// Ease off the throttle at both ends of a run so cars pull away and arrive
// smoothly instead of snapping between full speed and stopped.
function runSpeedFactor(t) {
  const easeIn = clamp(t / 0.16, 0, 1);
  const easeOut = clamp((1 - t) / 0.16, 0, 1);
  return 0.32 + 0.68 * Math.min(easeIn, easeOut);
}

function updateTrafficCars(delta) {
  for (const car of [...trafficCars]) {
    if (car.parked) continue;
    const leg = car.legs[car.leg];
    if (!leg) {
      retireTrafficCar(car);
      continue;
    }
    const progress = clamp(car.distance / leg.length, 0, 1);
    car.distance += leg.speed * runSpeedFactor(progress) * delta;
    const t = clamp(car.distance / leg.length, 0, 1);
    const point = leg.curve.getPointAt(t);
    const tangent = leg.curve.getTangentAt(t);
    car.group.position.set(point.x, 0.25, point.z);
    let target = carHeading(tangent.x, tangent.z) + (leg.reverse ? Math.PI : 0);
    let turn = target - car.heading;
    while (turn > Math.PI) turn -= Math.PI * 2;
    while (turn < -Math.PI) turn += Math.PI * 2;
    car.heading += clamp(turn, -delta * 2.6, delta * 2.6);
    car.group.rotation.y = car.heading;
    // The wheel cylinders are already laid on their side, so their own Y axis
    // is the axle: spinning about it rolls the wheel.
    const wheelSpin = leg.speed * runSpeedFactor(t) * delta * (leg.reverse ? -1 : 1) / 0.34;
    for (const wheel of car.group.userData.wheels || []) wheel.rotation.y -= wheelSpin;
    if (t < 1) continue;
    car.leg += 1;
    car.distance = 0;
    if (car.onLeg) car.onLeg(car, car.leg);
    if (car.leg >= car.legs.length) {
      const finish = car.onFinish;
      if (finish) finish(car);
      else retireTrafficCar(car);
    }
  }
}

// Street runs. Arrivals come in from the west on the near lane; departures take
// the same lane east and curve away behind the treeline before they are removed.
function lotApproachLegs(stall) {
  const lot = PARKING_LOT;
  const aisleApproach = stall.z > lot.aisleZ ? lot.aisleZ - 0.6 : lot.aisleZ + 0.6;
  return [createRoadRun([
    [lot.streetMinX - 8, lot.laneZ],
    [lot.driveX - 16, lot.laneZ],
    [lot.driveX - 4.5, lot.laneZ],
    [lot.driveX + 0.4, lot.laneZ - 2.4],
    [lot.driveX, lot.wallZ - 1.2],
    [lot.driveX, aisleApproach],
    [(lot.driveX + stall.x) / 2, lot.aisleZ],
    [stall.x + (stall.x > lot.driveX ? 1.4 : -1.4), lot.aisleZ],
    [stall.x, stall.z]
  ], { speed: 7.4 })];
}

function lotDepartureLegs(stall) {
  const lot = PARKING_LOT;
  const backOutZ = stall.z > lot.aisleZ ? lot.aisleZ - 0.4 : lot.aisleZ + 0.4;
  return [
    createRoadRun([[stall.x, stall.z], [stall.x, (stall.z + backOutZ) / 2], [stall.x, backOutZ]], { reverse: true, speed: 2.4 }),
    createRoadRun([
      [stall.x, backOutZ],
      [(stall.x + lot.driveX) / 2, lot.aisleZ],
      [lot.driveX - 1.6, lot.aisleZ + 0.6],
      [lot.driveX, lot.aisleZ + 4],
      [lot.driveX, lot.wallZ + 0.8],
      [lot.driveX + 2.6, lot.laneZ],
      [lot.driveX + 10, lot.laneZ],
      [lot.streetMaxX - 12, lot.laneZ],
      [lot.streetMaxX - 2, lot.laneZ + 2.6],
      [lot.streetMaxX + 6, lot.laneZ + 13]
    ], { speed: 7.2 })
  ];
}

function passingTrafficLegs(eastbound) {
  const lot = PARKING_LOT;
  const laneZ = eastbound ? lot.laneZ : lot.farLaneZ;
  const from = eastbound ? lot.streetMinX - 8 : lot.streetMaxX + 8;
  const to = eastbound ? lot.streetMaxX + 2 : lot.streetMinX - 2;
  const away = eastbound ? 10 : -10;
  return [createRoadRun([
    [from, laneZ],
    [(from + to) / 2, laneZ],
    [to, laneZ],
    [to + away, laneZ + (eastbound ? 3.4 : 2.6)],
    [to + away * 1.6, laneZ + (eastbound ? 10 : 8)]
  ], { speed: 9.2 + Math.random() * 3 })];
}

function freeVisitorStall() {
  const taken = new Set(visitors.map((visitor) => visitor.stall).filter(Boolean));
  for (const car of trafficCars) if (car.stall) taken.add(car.stall);
  return PARKING_LOT.visitorStalls.find((stall) => !taken.has(stall)) || null;
}

// Nothing should turn into the drive while another car is still on the approach.
function approachIsClear() {
  return !trafficCars.some((car) => car.group.position.z > PARKING_LOT.wallZ - 2 && car.group.position.x < PARKING_LOT.driveX + 6);
}

function maybeSpawnPassingTraffic() {
  if (elapsed < passingTrafficAt) return;
  const afterHours = currentDayPeriod === 'night';
  passingTrafficAt = elapsed + (afterHours ? 34 + Math.random() * 40 : 13 + Math.random() * 22);
  if (trafficCars.length > 4) return;
  spawnTrafficCar(passingTrafficLegs(Math.random() > 0.45));
}

function createCar(bodyColor = 0xd76d4d, labelText = 'TRAVEL') {
  const group = new THREE.Group();
  const paint = new THREE.Color(bodyColor);
  const body = paint.getHex();
  const highlight = paint.clone().offsetHSL(0, -0.08, 0.12).getHex();
  const shadow = paint.clone().offsetHSL(0, 0.04, -0.12).getHex();
  const shell = box(group, [3.6, 0.65, 1.7], body, [0, 0.78, 0]);
  shell.castShadow = true;
  // Baked low-poly cabin profile, with the existing X-axis wheelbase and footprint.
  const cabinShape = new THREE.Shape();
  cabinShape.moveTo(-1.15, 1.08); cabinShape.lineTo(-0.78, 1.62);
  cabinShape.lineTo(0.55, 1.62); cabinShape.lineTo(1.08, 1.08); cabinShape.closePath();
  addMesh(group, new THREE.ExtrudeGeometry(cabinShape, { depth: 1.3, bevelEnabled: false }), mat(0x344e4b, { roughness: 0.42 }), [0, 0, -0.65]);
  box(group, [1.4, 0.085, 1.38], body, [-0.12, 1.65, 0]);
  const wheels = [];
  for (const side of [-1, 1]) {
    box(group, [0.07, 0.51, 0.045], body, [-0.17, 1.34, side * 0.675]);
    box(group, [2.08, 0.07, 0.055], highlight, [-0.04, 1.09, side * 0.69]);
    box(group, [0.21, 0.04, 0.045], 0xd8d2b7, [-0.43, 0.96, side * 0.862]);
    box(group, [0.24, 0.12, 0.13], body, [0.9, 1.13, side * 0.83]);
    box(group, [0.03, 0.44, 0.02], shadow, [-0.18, 0.83, side * 0.858]);
    box(group, [3.1, 0.09, 0.055], 0x39443b, [0, 0.52, side * 0.86]);
    for (const x of [-1.2, 1.2]) {
      cylinder(group, 0.19, 0.19, 0.035, 0xb6bba9, [x, 0.38, side * 0.877], { rotation: [Math.PI / 2, 0, 0], segments: 10 });
      cylinder(group, 0.075, 0.075, 0.04, 0x56665c, [x, 0.38, side * 0.9], { rotation: [Math.PI / 2, 0, 0], segments: 8 });
    }
  }
  for (const end of [-1, 1]) {
    box(group, [0.1, 0.16, 1.65], 0xadb3a0, [end * 1.83, 0.53, 0]);
    box(group, [0.08, 0.24, 1.65], body, [end * 1.84, 0.8, 0]);
    for (const side of [-1, 1]) box(group, [0.1, 0.2, 0.32], end === 1 ? 0xffe4a0 : 0xb94532, [end * 1.89, 0.83, side * 0.61]);
    box(group, [0.115, 0.12, 0.33], 0xefe3b8, [end * 1.88, 0.55, 0]);
  }
  box(group, [0.13, 0.16, 0.65], 0x34433b, [1.9, 0.8, 0]);
  for (const z of [-0.22, 0, 0.22]) box(group, [0.14, 0.11, 0.025], 0xb6bba9, [1.91, 0.8, z]);
  for (const x of [-1.2, 1.2]) {
    for (const side of [-1, 1]) {
      wheels.push(cylinder(group, 0.34, 0.34, 0.22, 0x1a201c, [x, 0.38, side * 0.75], { rotation: [Math.PI / 2, 0, 0], segments: 10 }));
    }
  }
  // Wheels turn about the model's Z axis once the cylinder is laid on its side.
  group.userData.wheels = wheels;
  if (labelText) {
    const roofLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-1, 1.64, -0.72), new THREE.Vector3(1, 1.64, -0.72)]),
      new THREE.LineBasicMaterial({ color: 0xd8ef85 })
    );
    group.add(roofLine);
    const label = makeLabel(labelText, '#d8ef85', '#1b3024', 0.48);
    label.position.set(0, 2.55, 0);
    group.add(label);
  }
  return group;
}

function addClosedDoor(parent, x, y, z, width, height, color = 0x5a4738) {
  const door = box(parent, [width, height, 0.14], color, [x, y, z]);
  box(parent, [0.07, height * 0.88, 0.08], 0x392e27, [x - width * 0.23, y, z - 0.08]);
  box(parent, [0.07, height * 0.88, 0.08], 0x392e27, [x + width * 0.23, y, z - 0.08]);
  box(parent, [width * 0.92, 0.08, 0.08], 0x392e27, [x, y, z - 0.08]);
  return door;
}

function createLakeBarn(x, z) {
  const width = 14;
  const depth = 10;
  const height = 4.6;
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  box(group, [width, 0.16, depth], 0x73533b, [0, 0.08, 0]);
  box(group, [0.24, height, depth], 0x8c6848, [-width / 2, height / 2, 0]);
  box(group, [0.24, height, depth], 0x8c6848, [width / 2, height / 2, 0]);
  box(group, [width, height, 0.24], 0x8c6848, [0, height / 2, -depth / 2]);
  box(group, [width, height, 0.24], 0x8c6848, [0, height / 2, depth / 2]);
  box(group, [width + 0.5, 0.3, depth + 0.5], 0x3e4f42, [0, height + 0.18, 0], { rotation: [0.03, 0, -0.04] });
  addClosedDoor(group, 0, 2.0, -depth / 2 - 0.08, 4.8, 3.6, 0x4d3e34);
  addClosedDoor(group, 0, 2.0, depth / 2 + 0.08, 4.8, 3.6, 0x4d3e34);
  for (const side of [-1, 1]) {
    for (const zOffset of [-2.8, 0, 2.8]) box(group, [0.06, 0.9, 1.25], 0xa8c6b1, [side * (width / 2 + 0.02), 2.65, zOffset], { material: { transparent: true, opacity: 0.55 } });
  }
  const label = makeLabel('POLE BARN · CLOSED', '#f2b268', '#2f3d30', 0.48);
  label.position.set(0, height + 0.72, -depth / 2 - 0.12);
  group.add(label);
  world.add(group);
  addCollider(x, z - depth / 2, width / 2, { type: 'rect', halfWidth: width / 2, halfDepth: 0.2, zone: 'lake' });
  addCollider(x, z + depth / 2, width / 2, { type: 'rect', halfWidth: width / 2, halfDepth: 0.2, zone: 'lake' });
  addCollider(x - width / 2, z, 0.2, { type: 'rect', halfWidth: 0.2, halfDepth: depth / 2, zone: 'lake' });
  addCollider(x + width / 2, z, 0.2, { type: 'rect', halfWidth: 0.2, halfDepth: depth / 2, zone: 'lake' });
  interactables.push({ type: 'closed-door', label: 'Pole barn doors are locked', position: new THREE.Vector3(x, 1.8, z - depth / 2 - 0.25), radius: 2.6 });
  interactables.push({ type: 'closed-door', label: 'Pole barn doors are locked', position: new THREE.Vector3(x, 1.8, z + depth / 2 + 0.25), radius: 2.6 });
  return group;
}

function createLakeCabin(x, z) {
  const width = 14;
  const depth = 12;
  const height = 3.7;
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  box(group, [width, 0.16, depth], 0x76523a, [0, 0.08, 0]);
  box(group, [0.24, height, depth], 0x936a49, [-width / 2, height / 2, 0]);
  box(group, [0.24, height, depth], 0x936a49, [width / 2, height / 2, 0]);
  box(group, [width, height, 0.24], 0x936a49, [0, height / 2, -depth / 2]);
  box(group, [width, height, 0.24], 0x936a49, [0, height / 2, depth / 2]);
  box(group, [width + 0.5, 0.35, depth + 0.5], 0x4a5c4b, [0, height + 0.22, 0], { rotation: [0.04, 0, -0.03] });
  addClosedDoor(group, 0, 1.55, depth / 2 + 0.08, 3.2, 2.8, 0x4d3c31);
  for (const windowX of [-4.2, 4.2]) box(group, [2.2, 1.25, 0.08], 0xaecbbd, [windowX, 2.25, depth / 2 + 0.02], { material: { transparent: true, opacity: 0.56 } });
  const label = makeLabel('LAKE CABIN · CLOSED', '#d8ef85', '#30442f', 0.5);
  label.position.set(0, height + 0.7, depth / 2 + 0.1);
  group.add(label);
  world.add(group);
  addCollider(x, z - depth / 2, width / 2, { type: 'rect', halfWidth: width / 2, halfDepth: 0.2, zone: 'lake' });
  addCollider(x, z + depth / 2, width / 2, { type: 'rect', halfWidth: width / 2, halfDepth: 0.2, zone: 'lake' });
  addCollider(x - width / 2, z, 0.2, { type: 'rect', halfWidth: 0.2, halfDepth: depth / 2, zone: 'lake' });
  addCollider(x + width / 2, z, 0.2, { type: 'rect', halfWidth: 0.2, halfDepth: depth / 2, zone: 'lake' });
  interactables.push({ type: 'closed-door', label: 'The cabin door is locked', position: new THREE.Vector3(x, 1.45, z + depth / 2 + 0.25), radius: 2.4 });
  return group;
}

function createLakeShack(x, z) {
  const width = 9;
  const depth = 8;
  const height = 3.3;
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  box(group, [width, 0.16, depth], 0x76523a, [0, 0.08, 0]);
  box(group, [0.2, height, depth], 0x866249, [-width / 2, height / 2, 0]);
  box(group, [0.2, height, depth], 0x866249, [width / 2, height / 2, 0]);
  box(group, [width, height, 0.2], 0x866249, [0, height / 2, -depth / 2]);
  box(group, [width, height, 0.2], 0x866249, [0, height / 2, depth / 2]);
  box(group, [width + 0.35, 0.28, depth + 0.35], 0x4d5e4d, [0, height + 0.16, 0], { rotation: [0.03, 0, 0.04] });
  addClosedDoor(group, 0, 1.35, depth / 2 + 0.08, 2.25, 2.3, 0x4b3c30);
  const label = makeLabel('FIELD SHACK', '#f2b268', '#30442f', 0.42);
  label.position.set(0, height + 0.58, depth / 2 + 0.08);
  group.add(label);
  world.add(group);
  addCollider(x, z - depth / 2, width / 2, { type: 'rect', halfWidth: width / 2, halfDepth: 0.18, zone: 'lake' });
  addCollider(x, z + depth / 2, width / 2, { type: 'rect', halfWidth: width / 2, halfDepth: 0.18, zone: 'lake' });
  addCollider(x - width / 2, z, 0.18, { type: 'rect', halfWidth: 0.18, halfDepth: depth / 2, zone: 'lake' });
  addCollider(x + width / 2, z, 0.18, { type: 'rect', halfWidth: 0.18, halfDepth: depth / 2, zone: 'lake' });
  return group;
}

function createLakeGarage(x, z, label = 'GARAGE · CLOSED') {
  const width = 8.5;
  const depth = 7.2;
  const height = 3.2;
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  box(group, [width, 0.16, depth], 0x624735, [0, 0.08, 0]);
  box(group, [0.22, height, depth], 0x7f5b43, [-width / 2, height / 2, 0]);
  box(group, [0.22, height, depth], 0x7f5b43, [width / 2, height / 2, 0]);
  box(group, [width, height, 0.22], 0x7f5b43, [0, height / 2, -depth / 2]);
  box(group, [width, height, 0.22], 0x7f5b43, [0, height / 2, depth / 2]);
  box(group, [width + 0.35, 0.28, depth + 0.35], 0x465849, [0, height + 0.16, 0], { rotation: [0.02, 0, -0.035] });
  addClosedDoor(group, 0, 1.62, depth / 2 + 0.08, 5.2, 2.65, 0x4b3d32);
  const sign = makeLabel(label, '#d8ef85', '#30442f', 0.38);
  sign.position.set(0, height + 0.58, depth / 2 + 0.1);
  group.add(sign);
  world.add(group);
  addCollider(x, z - depth / 2, width / 2, { type: 'rect', halfWidth: width / 2, halfDepth: 0.18, zone: 'lake' });
  addCollider(x, z + depth / 2, width / 2, { type: 'rect', halfWidth: width / 2, halfDepth: 0.18, zone: 'lake' });
  addCollider(x - width / 2, z, 0.18, { type: 'rect', halfWidth: 0.18, halfDepth: depth / 2, zone: 'lake' });
  addCollider(x + width / 2, z, 0.18, { type: 'rect', halfWidth: 0.18, halfDepth: depth / 2, zone: 'lake' });
  interactables.push({ type: 'closed-door', label: 'The garage door is locked', position: new THREE.Vector3(x, 1.5, z + depth / 2 + 0.25), radius: 2.4 });
  return group;
}

function createLakeGrassCompound(compound) {
  const { centerX, centerZ, width, depth, label } = compound;
  const meadow = addMesh(world, new THREE.PlaneGeometry(width, depth), mat(0x718f5a, { roughness: 1 }), [centerX, -0.045, centerZ], [-Math.PI / 2, 0, 0]);
  meadow.receiveShadow = true;
  const borderColor = 0x4b8d58;
  box(world, [width, 0.08, 0.22], borderColor, [centerX, 0.015, centerZ - depth / 2]);
  box(world, [width, 0.08, 0.22], borderColor, [centerX, 0.015, centerZ + depth / 2]);
  box(world, [0.22, 0.08, depth], borderColor, [centerX - width / 2, 0.015, centerZ]);
  box(world, [0.22, 0.08, depth], borderColor, [centerX + width / 2, 0.015, centerZ]);
  if (label) {
    const sign = makeLabel(label, '#d8ef85', '#30442f', label === 'LAKE MEADOW' ? 0.52 : 0.38);
    sign.position.set(centerX, 1.55, centerZ - depth / 2 + 2.1);
    world.add(sign);
  }
  return meadow;
}

function createLakeDock(dock, index = 0) {
  const group = new THREE.Group();
  const length = dock.shoreZ - dock.endZ;
  const centerZ = (dock.shoreZ + dock.endZ) / 2;
  // A short timber ramp bridges the grass bank and the raised deck.
  box(group, [dock.width + 0.42, 0.12, 2.55], 0x75563d, [0, 0.06, 1.12]);
  box(group, [dock.width + 0.22, 0.2, 2.25], 0x9b754f, [0, 0.16, 1.02], { rotation: [-0.18, 0, 0] });
  box(group, [dock.width, 0.28, length], 0xc9ceca, [0, 0.31, centerZ - dock.shoreZ]);
  box(group, [dock.width + 0.18, 0.1, length + 0.16], 0x7f8984, [0, 0.48, centerZ - dock.shoreZ]);
  for (let z = dock.shoreZ - 0.35; z > dock.endZ; z -= 0.72) {
    box(group, [dock.width - 0.22, 0.055, 0.12], 0xf0f1e8, [0, 0.5, z - dock.shoreZ]);
  }
  for (const x of [-dock.width / 2 + 0.18, dock.width / 2 - 0.18]) {
    for (const z of [dock.shoreZ + 0.05, dock.endZ - 0.05]) {
      cylinder(group, 0.11, 0.14, 1.2, 0x69756f, [x, 0.38, z - dock.shoreZ], { segments: 7 });
    }
  }
  group.position.set(dock.x, 0, dock.shoreZ);
  world.add(group);
  const edgeOffset = dock.width / 2 + 0.18;
  addCollider(dock.x - edgeOffset, centerZ, 0.16, {
    type: 'rect', halfWidth: 0.16, halfDepth: length / 2 + 0.24, zone: 'lake', debugLabel: `dock-${index + 1}-left`
  });
  addCollider(dock.x + edgeOffset, centerZ, 0.16, {
    type: 'rect', halfWidth: 0.16, halfDepth: length / 2 + 0.24, zone: 'lake', debugLabel: `dock-${index + 1}-right`
  });
  addCollider(dock.x, dock.endZ - 0.2, 0.12, {
    type: 'rect', halfWidth: dock.width / 2 + 0.12, halfDepth: 0.12, zone: 'lake', debugLabel: `dock-${index + 1}-water-end`
  });
  const label = makeLabel(index === 1 ? 'MAIN DOCK' : 'DOCK', '#d8ef85', '#30442f', 0.34);
  label.position.set(dock.x, 1.35, dock.shoreZ - 0.7);
  world.add(label);
  return group;
}

function createLakeLilyPad(x, z, scale = 1, index = 0) {
  const pad = new THREE.Group();
  pad.position.set(x, 0.19, z);
  const padColor = index % 2 ? 0x168e68 : 0x1b9a70;
  sphere(pad, 0.48, padColor, [0, 0, 0], { scale: [scale * 1.3, 0.22, scale * 1.08], widthSegments: 10, heightSegments: 6 });
  sphere(pad, 0.28, new THREE.Color(padColor).offsetHSL(0.01, 0, 0.05), [0.18 * scale, 0.07, -0.08 * scale], { scale: [scale * 0.95, 0.13, scale * 0.7], widthSegments: 9, heightSegments: 5 });
  const flower = index % 3 === 0 ? sphere(pad, 0.075, 0xf4e7ab, [0.08 * scale, 0.075, -0.04 * scale], { scale: [1.25, 0.55, 1.25] }) : null;
  pad.rotation.y = index * 0.8;
  world.add(pad);
  return { pad, flower };
}

function createResearchSkiffModel() {
  const boat = new THREE.Group();
  boat.name = 'research-skiff';
  // Bow points along local -Z, matching the existing steering convention.
  // Open, flared shell rather than a solid primitive: the cockpit has real depth.
  const outline = [[-0.59, 1.24], [0.59, 1.24], [0.77, 0.54], [0.72, -0.64], [0.43, -1.25], [0, -1.58], [-0.43, -1.25], [-0.72, -0.64], [-0.77, 0.54]];
  const ring = (scale, y) => outline.map(([px, pz]) => new THREE.Vector3(px * scale, y, pz * scale));
  const shellBand = (lower, upper, color) => {
    const vertices = [];
    for (let i = 0; i < lower.length; i += 1) {
      const j = (i + 1) % lower.length;
      for (const p of [lower[i], lower[j], upper[j], lower[i], upper[j], upper[i]]) vertices.push(p.x, p.y, p.z);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.computeVertexNormals();
    return addMesh(boat, geometry, mat(color, { side: THREE.DoubleSide, roughness: 0.62, metalness: 0.12 }));
  };
  const keel = ring(0.69, -0.22);
  const chine = ring(0.88, -0.04);
  const stripe = ring(0.985, 0.26);
  const rim = ring(1, 0.32);
  const inner = ring(0.91, 0.30);
  shellBand(keel, chine, 0x203f3d);
  shellBand(chine, stripe, 0x3f7770);
  shellBand(stripe, rim, 0xf0deb0);
  shellBand(rim, inner, 0xbfa47a);
  shellBand(ring(0.70, -0.10), inner, 0x879c8b);
  // Fitted teak sole and two cross-thwarts, with subtle plank seams.
  for (let i = -3; i <= 3; i += 1) {
    box(boat, [0.135, 0.07, 1.64 - Math.abs(i) * 0.065], i % 2 ? 0x9f754e : 0xb78c60, [i * 0.145, -0.06, 0.11]);
  }
  for (const zSeat of [-0.53, 0.65]) {
    box(boat, [1.23, 0.11, 0.28], 0xc49965, [0, 0.22, zSeat]);
    box(boat, [1.05, 0.16, 0.06], 0x53675e, [0, 0.085, zSeat]);
    for (const px of [-0.51, 0.51]) cylinder(boat, 0.018, 0.018, 0.008, 0xe5dbb7, [px, 0.28, zSeat], { segments: 6 });
  }
  const spar = (a, b, radius, color) => {
    const from = new THREE.Vector3(...a), to = new THREE.Vector3(...b);
    const mesh = cylinder(boat, radius, radius, from.distanceTo(to), color, from.clone().add(to).multiplyScalar(0.5).toArray(), { segments: 6 });
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), to.sub(from).normalize());
    return mesh;
  };
  for (let i = 0; i < rim.length; i += 1) spar(rim[i].toArray(), rim[(i + 1) % rim.length].toArray(), 0.033, 0xe6d2a6);
  // Stowed paddle, rope coil, specimen box, life ring and a compact outboard.
  spar([-0.61, 0.39, 0.95], [-0.55, 0.39, -0.91], 0.026, 0x95683e);
  box(boat, [0.17, 0.035, 0.40], 0xc9a16c, [-0.55, 0.39, -0.91], { rotation: [0, -0.04, 0] });
  for (const r of [0.085, 0.12, 0.155]) addMesh(boat, new THREE.TorusGeometry(r, 0.013, 5, 20), mat(0xd3bd8e), [0.28, 0.30, 0.65], [Math.PI / 2, 0, 0]);
  box(boat, [0.37, 0.23, 0.30], 0xd9dfcd, [0.15, 0.10, 0.05]);
  box(boat, [0.40, 0.05, 0.33], 0x385b52, [0.15, 0.245, 0.05]);
  box(boat, [0.09, 0.06, 0.025], 0xc4a665, [0.15, 0.20, 0.21]);
  addMesh(boat, new THREE.TorusGeometry(0.18, 0.055, 7, 20), mat(0xd97945), [0.71, 0.13, 0.30], [0, Math.PI / 2, 0]);
  box(boat, [0.23, 0.17, 0.16], 0x596960, [0, 0.29, 1.25]);
  box(boat, [0.32, 0.31, 0.32], 0x263c3c, [0, 0.43, 1.41]);
  box(boat, [0.26, 0.045, 0.27], 0xd3d2bd, [0, 0.60, 1.41]);
  box(boat, [0.075, 0.53, 0.09], 0x455352, [0, 0.03, 1.45]);
  spar([0.10, 0.43, 1.37], [0.31, 0.43, 0.98], 0.027, 0x303b37);
  const label = makeLabel('JENKINS · FIELD SKIFF', '#f0deb0', '#274941', 0.3);
  label.position.set(0, 1.15, 0);
  boat.add(label);
  // Gameplay root stays at its existing height; immerse the visual keel.
  for (const child of boat.children) child.position.y -= 0.15;
  return boat;
}

function createLakeBoat(x, z) {
  const boat = createResearchSkiffModel();
  boat.position.set(x, 0.33, z);
  world.add(boat);
  const interactable = {
    type: 'lake-boat',
    label: 'Pilot boat · E',
    position: new THREE.Vector3(x, 1.0, z),
    radius: 3.2,
    group: boat,
    spawn: { x, z },
    heading: getLakeBoatHeading(x, z)
  };
  interactables.push(interactable);
  return interactable;
}

// The skiff's bow is modelled along local -Z, so a heading of `h` points the bow
// at (-sin h, -cos h). Aim that vector at the open water in the middle of the lake.
function getLakeBoatHeading(x, z) {
  return Math.atan2(-(JENKINS_LAKE_WATER.centerX - x), -(JENKINS_LAKE_WATER.centerZ - z));
}

function isLakeBoatInSafeWater(x, z) {
  const water = JENKINS_LAKE_WATER;
  const radiusX = water.radiusX - 2;
  const radiusZ = water.radiusZ - 2;
  const dx = (x - water.centerX) / radiusX;
  const dz = (z - water.centerZ) / radiusZ;
  return dx * dx + dz * dz < 1;
}

function canStandInLakeWater(x, z) {
  const water = JENKINS_LAKE_WATER;
  const radiusX = water.playerRadiusX - ((save.supplies.waders || 0) > 0 ? 2.7 : 1.35);
  const radiusZ = water.playerRadiusZ - ((save.supplies.waders || 0) > 0 ? 2.7 : 1.35);
  const dx = (x - water.centerX) / radiusX;
  const dz = (z - water.centerZ) / radiusZ;
  return dx * dx + dz * dz >= 1;
}

function cycleLakeBoatSpeed(direction) {
  if (!lakeBoatPilot?.active) return;
  const speeds = [
    { label: 'REVERSE', value: -1.15 },
    { label: 'NEUTRAL', value: 0 },
    { label: 'TROLLING SPEED', value: 0.28 },
    { label: 'LOW SPEED', value: 0.7 },
    { label: 'HIGH SPEED', value: 1.3 }
  ];
  lakeBoatPilot.speedIndex = clamp(lakeBoatPilot.speedIndex + direction, 0, speeds.length - 1);
  const current = speeds[lakeBoatPilot.speedIndex];
  lakeBoatPilot.speed = current.value;
  setStatus(`BOAT: ${current.label} · W/S changes speed · A/D steers · E exits`);
  toast(`Boat speed: ${current.label}.`, 'success');
}

function respawnLakeBoat(message = 'The boat grounded out. It has returned to the dock in neutral.') {
  if (!lakeBoat?.group) return;
  const boat = lakeBoat.group;
  const spawn = JENKINS_LAKE_BOAT_SPAWN;
  const heading = getLakeBoatHeading(spawn.x, spawn.z);
  boat.position.set(spawn.x, 0.33, spawn.z);
  boat.rotation.y = heading;
  lakeBoat.position.set(spawn.x, 1.0, spawn.z);
  lakeBoat.heading = heading;
  lakeBoatPilot = null;
  player.set(JENKINS_LAKE_DOCKS[1].x, 1.72, JENKINS_LAKE_DOCKS[1].shoreZ + 1.7);
  jumpOffset = 0;
  grounded = true;
  yaw = 0;
  pitch = -0.08;
  camera.position.set(player.x, player.y, player.z);
  updateCameraRotation();
  updateHeldTool();
  toast(message, 'warning');
  setStatus('Boat reset to neutral. Walk down the main dock and press E to pilot it again.');
}

function enterLakeBoat(entry) {
  if (currentZone !== 'lake' || !entry?.group || lakeBoatPilot?.active) return;
  const heading = entry.heading ?? getLakeBoatHeading(entry.group.position.x, entry.group.position.z);
  lakeBoatPilot = { active: true, entry, heading, speedIndex: 1, speed: 0 };
  entry.group.rotation.y = heading;
  player.set(entry.group.position.x, 1.72, entry.group.position.z);
  yaw = heading;
  pitch = -0.08;
  camera.position.set(player.x, player.y, player.z);
  updateCameraRotation();
  updateHeldTool();
  toast('You are at the helm. W/S changes speed; A/D steers.', 'success');
  setStatus('BOAT: NEUTRAL · W/S changes speed · A/D steers · E exits');
}

function exitLakeBoat() {
  if (!lakeBoatPilot?.active) return;
  const boat = lakeBoatPilot.entry.group;
  if (!canStandInLakeWater(boat.position.x, boat.position.z)) {
    respawnLakeBoat('The water is too deep to stand in. The boat and player returned to the main dock.');
    return;
  }
  const exitX = boat.position.x;
  const exitZ = boat.position.z;
  lakeBoatPilot = null;
  player.set(exitX, 1.72, exitZ);
  jumpOffset = 0;
  grounded = true;
  yaw = 0;
  pitch = -0.08;
  camera.position.set(player.x, player.y, player.z);
  updateCameraRotation();
  updateHeldTool();
  setStatus('You stepped out in the shallows. Press E by the boat to pilot it again.');
}

function updateLakeBoatMovement(delta) {
  if (!lakeBoatPilot?.active || !lakeBoatPilot.entry?.group) return;
  const boat = lakeBoatPilot.entry.group;
  // A turns the bow to port, D to starboard. Increasing the heading swings the
  // bow counter-clockwise seen from above, which is a left turn from the helm.
  const steering = (isKeyDown('KeyA', 'a') ? 1 : 0) - (isKeyDown('KeyD', 'd') ? 1 : 0);
  // Reverse backs the stern around, so the helm response flips with the throttle.
  const speed = lakeBoatPilot.speed || 0;
  const turn = steering * delta * 0.9 * (speed < 0 ? -1 : 1);
  lakeBoatPilot.heading += turn;
  // Carry the view around with the hull so the bow stays where the pilot left it.
  yaw += turn;
  // Travel follows the bow: heading `h` means the bow points at (-sin h, -cos h).
  const nextX = boat.position.x - Math.sin(lakeBoatPilot.heading) * speed * delta;
  const nextZ = boat.position.z - Math.cos(lakeBoatPilot.heading) * speed * delta;
  if (speed !== 0 && !isLakeBoatInSafeWater(nextX, nextZ)) {
    respawnLakeBoat('The boat touched the shoreline and was reset before it could get stuck.');
    return;
  }
  boat.position.x = nextX;
  boat.position.z = nextZ;
  boat.rotation.y = lakeBoatPilot.heading;
  lakeBoatPilot.entry.position.set(nextX, 1.0, nextZ);
  lakeBoatPilot.entry.heading = lakeBoatPilot.heading;
  player.set(nextX, 1.72, nextZ);
  camera.position.set(player.x, player.y, player.z);
}

function createLakeCaptain(x, z) {
  const captain = new THREE.Group();
  captain.position.set(x, 0, z);
  const navy = 0x293f58;
  const trim = 0x426079;
  const skin = 0xc99475;
  const grey = 0xa9aaa1;
  const cream = 0xeee4cd;
  const brass = 0xcda65b;
  // All joints meet endpoint-to-endpoint; the captain looks toward local +Z.
  const limb = (from, to, radius, color, endRadius = radius) => {
    const a = new THREE.Vector3(...from);
    const b = new THREE.Vector3(...to);
    const mesh = cylinder(captain, endRadius, radius, a.distanceTo(b), color, a.clone().add(b).multiplyScalar(0.5).toArray());
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.sub(a).normalize());
    return mesh;
  };
  for (const side of [-1, 1]) {
    const footX = side * 0.155;
    // Broad soles sit on y=0; forward toes and boot shafts overlap the trousers.
    box(captain, [0.235, 0.065, 0.39], 0x252c30, [footX, 0.0325, 0.065]);
    sphere(captain, 0.14, 0x394047, [footX, 0.135, 0.085], { scale: [0.82, 0.66, 1.28] });
    cylinder(captain, 0.089, 0.098, 0.24, 0x394047, [footX, 0.21, 0]);
    limb([footX, 0.29, 0], [side * 0.13, 0.85, 0], 0.099, 0x56616a, 0.12);
    box(captain, [0.025, 0.36, 0.013], 0x69737b, [footX, 0.53, 0.098]);
  }
  sphere(captain, 0.25, 0x56616a, [0, 0.8, 0], { scale: [1.05, 0.66, 0.75] });
  cylinder(captain, 0.31, 0.265, 0.62, navy, [0, 1.09, 0], { scale: [1, 1, 0.68], segments: 10 });
  box(captain, [0.37, 0.045, 0.025], trim, [0, 0.8, 0.186]);
  cylinder(captain, 0.09, 0.105, 0.2, skin, [0, 1.44, 0]);
  box(captain, [0.2, 0.3, 0.05], cream, [0, 1.285, 0.195]);
  box(captain, [0.045, 0.18, 0.02], 0x607c88, [0, 1.26, 0.228]);
  for (const side of [-1, 1]) {
    box(captain, [0.105, 0.29, 0.055], trim, [side * 0.105, 1.275, 0.216], { rotation: [0, 0, side * -0.32] });
    box(captain, [0.22, 0.045, 0.15], trim, [side * 0.285, 1.385, 0]);
    box(captain, [0.12, 0.018, 0.115], brass, [side * 0.3, 1.412, 0.01]);
    for (const y of [1.14, 1.015, 0.89]) {
      sphere(captain, 0.023, brass, [side * 0.108, y, 0.208], { scale: [1, 1, 0.4] });
    }
    box(captain, [0.125, 0.038, 0.028], trim, [side * 0.185, 0.955, 0.169]);
    // Relaxed elbows bend forward, with a hand resting near the jacket hem.
    const shoulder = [side * 0.29, 1.31, 0];
    const elbow = [side * 0.4, 1.045, 0.02];
    const wrist = [side * 0.335, 0.91, 0.205];
    sphere(captain, 0.117, navy, shoulder);
    limb(shoulder, elbow, 0.105, navy, 0.092);
    sphere(captain, 0.092, navy, elbow);
    limb(elbow, wrist, 0.092, navy, 0.071);
    limb([side * 0.345, 0.931, 0.177], wrist, 0.075, brass, 0.074);
    sphere(captain, 0.074, skin, [side * 0.322, 0.872, 0.229], { scale: [0.8, 1.12, 0.85] });
    sphere(captain, 0.033, skin, [side * 0.266, 0.893, 0.228]);
  }
  // A tapered jaw, warm cheeks and raised brows keep the older face friendly.
  sphere(captain, 0.235, skin, [0, 1.64, 0.012], { scale: [0.94, 1.09, 0.91] });
  sphere(captain, 0.17, grey, [0, 1.505, 0.073], { scale: [1.04, 0.64, 0.85] });
  for (const side of [-1, 1]) {
    sphere(captain, 0.052, skin, [side * 0.222, 1.63, 0.006], { scale: [0.65, 1.08, 0.75] });
    sphere(captain, 0.025, 0xad775f, [side * 0.239, 1.63, 0.038], { scale: [0.5, 1, 0.45] });
    sphere(captain, 0.088, grey, [side * 0.186, 1.719, -0.053], { scale: [0.5, 1.13, 1.23], rotation: [0, 0, side * -0.25] });
    sphere(captain, 0.066, 0xd49b7e, [side * 0.13, 1.579, 0.169], { scale: [0.93, 0.62, 0.44] });
    sphere(captain, 0.044, 0xf3ead8, [side * 0.083, 1.668, 0.207], { scale: [1, 0.66, 0.3] });
    sphere(captain, 0.023, 0x54716d, [side * 0.083, 1.666, 0.221], { scale: [0.8, 1, 0.37] });
    sphere(captain, 0.012, 0x222d31, [side * 0.083, 1.666, 0.23], { scale: [0.75, 1, 0.3] });
    box(captain, [0.094, 0.023, 0.027], 0xb8b8ab, [side * 0.085, 1.722, 0.203], { rotation: [0, 0, side * -0.12] });
    sphere(captain, 0.073, 0xc1bfb1, [side * 0.058, 1.554, 0.216], { scale: [1.08, 0.43, 0.53], rotation: [0, 0, side * 0.16] });
  }
  sphere(captain, 0.047, skin, [0, 1.616, 0.239], { scale: [0.74, 1.06, 0.91] });
  box(captain, [0.075, 0.012, 0.016], 0x805d50, [0, 1.52, 0.202]);
  sphere(captain, 0.061, 0xbdbcb0, [0, 1.478, 0.168], { scale: [1.03, 0.6, 0.58] });
  sphere(captain, 0.213, grey, [0, 1.743, -0.057], { scale: [1, 0.71, 0.82] });
  sphere(captain, 0.12, 0xc1bfb2, [-0.06, 1.815, 0.095], { scale: [1.35, 0.34, 0.8], rotation: [0, 0, -0.19] });
  // Cream skipper cap: low crown, navy band, projecting dark visor, gold badge.
  cylinder(captain, 0.235, 0.236, 0.075, navy, [0, 1.835, 0], { segments: 12, scale: [1, 1, 0.92] });
  sphere(captain, 0.258, cream, [0, 1.906, -0.017], { scale: [1.05, 0.37, 0.94], widthSegments: 12 });
  sphere(captain, 0.22, 0x27353d, [0, 1.809, 0.177], { scale: [1.08, 0.105, 0.82], widthSegments: 12 });
  box(captain, [0.3, 0.018, 0.02], brass, [0, 1.831, 0.224]);
  sphere(captain, 0.05, brass, [0, 1.899, 0.213], { scale: [0.72, 1, 0.24] });
  box(captain, [0.013, 0.051, 0.012], navy, [0, 1.899, 0.228]);
  box(captain, [0.04, 0.012, 0.012], navy, [0, 1.893, 0.23]);
  const label = makeLabel('CAPTAIN MARK', '#f2b268', '#2f3d30', 0.38);
  label.position.set(0, 2.45, 0);
  captain.add(label);
  world.add(captain);
  const interactable = { type: 'captain', label: 'Talk to Captain Mark', position: new THREE.Vector3(x, 1.05, z), radius: 3.1, group: captain };
  interactables.push(interactable);
  lakeCaptain = interactable;
  return interactable;
}

// The interior rides in the world at the car's position rather than being
// bolted to the camera: that is what lets the player look around inside the car
// while it drives instead of having their aim dragged around by the road.
function createLakeCarInterior() {
  const interior = new THREE.Group();
  box(interior, [2.2, 0.12, 0.72], 0x342e2a, [0, -0.48, -0.78]);
  box(interior, [1.95, 0.09, 0.1], 0xd0a25f, [0, -0.37, -0.98]);
  box(interior, [0.12, 1.35, 0.12], 0x342e2a, [-1.02, 0.12, -1.3]);
  box(interior, [0.12, 1.35, 0.12], 0x342e2a, [1.02, 0.12, -1.3]);
  box(interior, [2.15, 0.12, 0.12], 0x342e2a, [0, 0.76, -1.3]);
  box(interior, [0.78, 0.07, 0.78], 0x253837, [0.48, -0.24, -0.92], { material: { transparent: true, opacity: 0.78 } });
  torus(interior, 0.2, 0.035, 0x1c2422, [0.5, -0.18, -0.68], [Math.PI / 2, 0, 0], 8, 18);
  // A painted dash plate rather than a billboard label: a sprite would swing to
  // face the player every time they looked away from the road.
  box(interior, [0.62, 0.11, 0.03], 0x1d3027, [-0.42, -0.26, -1.02]);
  box(interior, [0.5, 0.045, 0.012], 0xd8ef85, [-0.42, -0.26, -1.035]);
  // Now that the player can turn their head, the cabin has to exist off the
  // windscreen axis too: doors, window frames, a roof and a rear bench.
  box(interior, [2.3, 0.09, 2.75], 0x2b2622, [0, 0.94, -0.05]);
  box(interior, [2.16, 0.05, 2.5], 0x3b342e, [0, 0.88, -0.05]);
  for (const side of [-1, 1]) {
    box(interior, [0.13, 0.66, 2.0], 0x342e2a, [side * 1.06, -0.5, -0.35]);
    box(interior, [0.15, 0.11, 2.05], 0x4a413a, [side * 1.05, -0.14, -0.35]);
    box(interior, [0.11, 1.2, 0.12], 0x342e2a, [side * 1.04, 0.32, 0.62]);
    box(interior, [0.1, 0.2, 0.36], 0x595046, [side * 1.0, -0.3, -0.9]);
    cylinder(interior, 0.035, 0.035, 0.16, 0xb6bba9, [side * 0.96, -0.3, -1.06], { segments: 6, rotation: [0, 0, Math.PI / 2] });
  }
  box(interior, [2.15, 0.12, 0.12], 0x342e2a, [0, 0.76, 0.72]);
  box(interior, [1.94, 0.62, 0.14], 0x3d352f, [0, -0.2, 0.78]);
  box(interior, [1.94, 0.16, 0.5], 0x453b34, [0, -0.5, 0.6]);
  world.add(interior);
  return interior;
}

function createTree(x, z, scale = 1, foliage = 0x376045, trunkColor = 0x6b4e36) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.scale.setScalar(scale);
  cylinder(group, 0.25, 0.35, 2.5, trunkColor, [0, 1.25, 0], { segments: 7 });
  cone(group, 1.15, 2.3, foliage, [0, 2.65, 0], { segments: 8 });
  cone(group, 0.9, 1.9, new THREE.Color(foliage).offsetHSL(0, 0, 0.06), [0, 3.8, 0.1], { segments: 8 });
  cone(group, 0.62, 1.6, new THREE.Color(foliage).offsetHSL(0, 0, 0.1), [0, 4.75, 0], { segments: 8 });
  world.add(group);
  addCollider(x, z, 0.72 * scale, { zone: currentZone });
  return group;
}

function createBranchTree(x, z, scale = 1, foliage = 0x376045, trunkColor = 0x6b4e36) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.scale.setScalar(scale);
  cylinder(group, 0.18, 0.27, 4.75, trunkColor, [0, 2.38, 0], { segments: 7 });
  const branchColor = new THREE.Color(trunkColor).offsetHSL(0, 0, 0.045);
  const leafColor = new THREE.Color(foliage).offsetHSL(0, 0, 0.06);
  const makeBranch = (angle, height, length, tilt = 0.62) => {
    const branch = cylinder(group, 0.075, 0.13, length, branchColor, [Math.sin(angle) * length * 0.24, height, Math.cos(angle) * length * 0.24], { segments: 6 });
    branch.rotation.set(Math.cos(angle) * tilt, 0, -Math.sin(angle) * tilt);
    const crown = new THREE.Group();
    crown.position.set(Math.sin(angle) * length * 0.52, height + length * 0.24, Math.cos(angle) * length * 0.52);
    sphere(crown, 0.52, leafColor, [0, 0.38, 0], { scale: [1.18, 0.52, 1.02], widthSegments: 8, heightSegments: 5 });
    sphere(crown, 0.35, new THREE.Color(foliage).offsetHSL(0, 0, 0.12), [0.1, 0.78, -0.05], { scale: [1.12, 0.48, 0.94], widthSegments: 8, heightSegments: 5 });
    group.add(crown);
  };
  [0.2, 2.22, 4.3].forEach((angle, index) => makeBranch(angle, 3.6 + (index % 2) * 0.2, 1.5 - index * 0.1));
  makeBranch(5.35, 2.25, 1.18, 0.74);
  sphere(group, 0.88, foliage, [0, 5.08, 0], { scale: [1.15, 0.46, 1.02], widthSegments: 9, heightSegments: 5 });
  sphere(group, 0.57, leafColor, [0.08, 5.68, 0.03], { scale: [1.12, 0.5, 0.95], widthSegments: 8, heightSegments: 5 });
  world.add(group);
  addCollider(x, z, 0.64 * scale, { zone: currentZone });
  return group;
}

// --- Merged background forest --------------------------------------------------
// The woods need hundreds more trunks than the road can afford as individual
// objects. A tree the player only ever walks past does not need to be its own
// draw call, so background trees are baked into one merged mesh per batch with
// per-vertex colour carrying the variation the separate materials used to.

const BACKGROUND_TREE_BATCH = 260;
const backgroundForestMaterial = new THREE.MeshStandardMaterial({
  vertexColors: true,
  roughness: 0.9,
  metalness: 0,
  flatShading: true
});
let backgroundForestParts = null;
let backgroundForestMeshes = [];

function getBackgroundForestParts() {
  if (!backgroundForestParts) {
    backgroundForestParts = {
      trunk: new THREE.CylinderGeometry(0.25, 0.35, 2.5, 7),
      slimTrunk: new THREE.CylinderGeometry(0.18, 0.28, 3.4, 6),
      crownLow: new THREE.ConeGeometry(1.15, 2.3, 8),
      crownMid: new THREE.ConeGeometry(0.9, 1.9, 8),
      crownTop: new THREE.ConeGeometry(0.62, 1.6, 8),
      canopy: new THREE.SphereGeometry(0.95, 8, 5),
      canopyTop: new THREE.SphereGeometry(0.62, 8, 5)
    };
  }
  return backgroundForestParts;
}

function appendMergedGeometry(batch, geometry, matrix, color) {
  const normalMatrix = new THREE.Matrix3().getNormalMatrix(matrix);
  const source = geometry.attributes.position;
  const sourceNormal = geometry.attributes.normal;
  const index = geometry.index;
  const first = batch.positions.length / 3;
  const point = new THREE.Vector3();
  const normal = new THREE.Vector3();
  for (let vertex = 0; vertex < source.count; vertex += 1) {
    point.fromBufferAttribute(source, vertex).applyMatrix4(matrix);
    normal.fromBufferAttribute(sourceNormal, vertex).applyMatrix3(normalMatrix).normalize();
    batch.positions.push(point.x, point.y, point.z);
    batch.normals.push(normal.x * 127, normal.y * 127, normal.z * 127);
    batch.colors.push(color.r * 255, color.g * 255, color.b * 255);
  }
  if (index) {
    for (let entry = 0; entry < index.count; entry += 1) batch.indices.push(first + index.getX(entry));
  } else {
    for (let vertex = 0; vertex < source.count; vertex += 1) batch.indices.push(first + vertex);
  }
}

function flushBackgroundForest(batch) {
  if (!batch.positions.length) return null;
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(batch.positions, 3));
  geometry.setAttribute('normal', new THREE.Int8BufferAttribute(batch.normals, 3, true));
  geometry.setAttribute('color', new THREE.Uint8BufferAttribute(batch.colors, 3, true));
  geometry.setIndex(batch.indices);
  geometry.computeBoundingSphere();
  const mesh = new THREE.Mesh(geometry, backgroundForestMaterial);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  world.add(mesh);
  backgroundForestMeshes.push(mesh);
  return mesh;
}

function disposeBackgroundForest() {
  for (const mesh of backgroundForestMeshes) mesh.geometry.dispose();
  backgroundForestMeshes = [];
}

// `spots` is [x, z, scale, foliage, trunk, broadleaf].
function createBackgroundForest(spots) {
  const parts = getBackgroundForestParts();
  const matrix = new THREE.Matrix4();
  const scaleVector = new THREE.Vector3();
  const identity = new THREE.Quaternion();
  const place = (batch, geometry, x, y, z, scale, spin, stretch, color) => {
    scaleVector.set(scale * stretch[0], scale * stretch[1], scale * stretch[2]);
    matrix.compose(new THREE.Vector3(x, y * scale, z), identity.setFromAxisAngle(new THREE.Vector3(0, 1, 0), spin), scaleVector);
    appendMergedGeometry(batch, geometry, matrix, color);
  };
  let batch = { positions: [], normals: [], colors: [], indices: [], trees: 0 };
  spots.forEach(([x, z, scale = 1, foliage = 0x3f6d4b, trunk = 0x6b4e36, broadleaf = false], index) => {
    const leaf = new THREE.Color(foliage);
    const bark = new THREE.Color(trunk);
    const spin = (index % 7) * 0.9;
    if (broadleaf) {
      place(batch, parts.slimTrunk, x, 1.7, z, scale, spin, [1, 1, 1], bark);
      place(batch, parts.canopy, x, 3.9, z, scale, spin, [1.16, 0.6, 1.06], leaf);
      place(batch, parts.canopyTop, x, 4.7, z, scale, spin + 0.6, [1.1, 0.66, 1.02], leaf.clone().offsetHSL(0, 0, 0.08));
    } else {
      place(batch, parts.trunk, x, 1.25, z, scale, spin, [1, 1, 1], bark);
      place(batch, parts.crownLow, x, 2.65, z, scale, spin, [1, 1, 1], leaf);
      place(batch, parts.crownMid, x, 3.8, z, scale, spin + 0.4, [1, 1, 1], leaf.clone().offsetHSL(0, 0, 0.06));
      place(batch, parts.crownTop, x, 4.75, z, scale, spin + 0.8, [1, 1, 1], leaf.clone().offsetHSL(0, 0, 0.1));
    }
    addCollider(x, z, 0.68 * scale, { zone: currentZone });
    batch.trees += 1;
    if (batch.trees >= BACKGROUND_TREE_BATCH) {
      flushBackgroundForest(batch);
      batch = { positions: [], normals: [], colors: [], indices: [], trees: 0 };
    }
  });
  flushBackgroundForest(batch);
}

function createBeehiveOnTree(tree, x, z, id, wild = false, mountHeight = 3.1) {
  const hive = new THREE.Group();
  hive.position.set(x + 0.45, mountHeight, z - 0.22);
  const body = sphere(hive, 0.48, 0xd59b4d, [0, 0, 0], { scale: [0.9, 1.18, 0.86], widthSegments: 12, heightSegments: 8 });
  sphere(hive, 0.11, 0x2c2921, [0, -0.1, -0.43], { scale: [1, 0.72, 0.25] });
  const honeyDrip = new THREE.Group();
  sphere(honeyDrip, 0.045, 0xf1bd45, [0, -0.18, -0.48], { scale: [0.68, 1.9, 0.55], material: { emissive: 0x8a5c16, emissiveIntensity: 0.28 } });
  sphere(honeyDrip, 0.026, 0xf7d36a, [0.015, -0.3, -0.49], { material: { emissive: 0x8a5c16, emissiveIntensity: 0.22 } });
  hive.add(honeyDrip);
  const marker = makeLabel(wild ? 'WILD HIVE' : 'HIVE', wild ? '#f2b268' : '#f6d56b', '#3b2b20', 0.38);
  marker.position.set(0, 0.78, 0);
  hive.add(marker);
  world.add(hive);
  const entry = { id, group: hive, body, marker, honeyDrip, position: new THREE.Vector3(x + 0.45, mountHeight, z - 0.22), radius: 2.8, wild, lootedAt: -1000, baseScale: 1 };
  beehives.push(entry);
  interactables.push({ type: 'hive', label: wild ? 'Loot wild beehive' : 'Loot showcase beehive', position: entry.position.clone(), radius: 3.2, hive: entry });
  addCollider(entry.position.x, entry.position.z, 0.55, { zone: currentZone });
  return entry;
}

function createSpiderWeb(x, z, y = 2.6, zone = currentZone) {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  const webMaterial = new THREE.LineBasicMaterial({ color: 0xe8eee2, transparent: true, opacity: 0.68 });
  for (let ringIndex = 0; ringIndex < 3; ringIndex += 1) {
    const radius = 0.28 + ringIndex * 0.22;
    const points = [];
    for (let index = 0; index <= 16; index += 1) {
      const angle = index / 16 * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, 0));
    }
    group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), webMaterial));
  }
  for (let index = 0; index < 8; index += 1) {
    const angle = index / 8 * Math.PI * 2;
    group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0), new THREE.Vector3(Math.cos(angle) * 0.72, Math.sin(angle) * 0.72, 0)
    ]), webMaterial));
  }
  sphere(group, 0.08, 0x332a3c, [0, 0, -0.08], { material: { emissive: 0x211528, emissiveIntensity: 0.3 } });
  world.add(group);
  spiderWebs.push({ group, position: new THREE.Vector3(x, y, z), zone });
  addCollider(x, z, 0.16, { zone });
  createBugNode('spider', [x + 0.18, 0.05, z + 0.16], 0x81768c);
  return group;
}

function createWildFlowerNode(x, z, color, index) {
  const plant = new THREE.Group();
  plant.position.set(x, 0, z);
  cylinder(plant, 0.04, 0.06, 0.72, 0x4f8f55, [0, 0.36, 0], { segments: 5 });
  for (let petalIndex = 0; petalIndex < 5; petalIndex += 1) {
    const angle = petalIndex * Math.PI * 2 / 5;
    sphere(plant, 0.11, color, [Math.cos(angle) * 0.12, 0.76 + Math.sin(angle) * 0.12, 0], { scale: [1.2, 0.62, 0.62] });
  }
  sphere(plant, 0.09, 0xe6b44c, [0, 0.76, -0.02]);
  const marker = makeLabel('SEEDS', '#f3d667', '#30442f', 0.28);
  marker.position.set(0, 1.18, 0);
  plant.add(marker);
  world.add(plant);
  const entry = { type: 'wild-flower', label: 'Harvest wild flower seeds', position: new THREE.Vector3(x, 0.78, z), radius: 2.5, group: plant, marker, harvested: false, index };
  interactables.push(entry);
  wildFlowerNodes.push(entry);
  addCollider(x, z, 0.22, { zone: currentZone });
  return entry;
}

function harvestWildFlower(node) {
  if (!node || node.harvested) return;
  node.harvested = true;
  node.group.visible = false;
  node.marker.visible = false;
  save.supplies.flowerSeeds = (save.supplies.flowerSeeds || 0) + 1;
  save.ingredients.flowers = (save.ingredients.flowers || 0) + 1;
  saveGame();
  updateHUD();
  toast('Wild flower picked: +1 seed and +1 flower.', 'success');
  setStatus('The wild flower will return after the next field reset.');
}

function createWildCarrot(x, z, index = 0) {
  const carrot = new THREE.Group();
  carrot.position.set(x, 0, z);
  for (let leaf = 0; leaf < 5; leaf += 1) {
    const angle = leaf / 5 * Math.PI * 2;
    const blade = cylinder(carrot, 0.018, 0.04, 0.72 + (leaf % 2) * 0.12, leaf % 2 ? 0x4f8f55 : 0x67985b, [Math.cos(angle) * 0.12, 0.35, Math.sin(angle) * 0.12], { segments: 5 });
    blade.rotation.set(Math.sin(angle) * 0.55, 0, -Math.cos(angle) * 0.55);
  }
  sphere(carrot, 0.17, 0xdf783d, [0, 0.05, 0], { scale: [0.7, 1.15, 0.7] });
  const marker = makeLabel('PULL', '#f2b268', '#30442f', 0.22);
  marker.position.set(0, 1.05, 0);
  carrot.add(marker);
  world.add(carrot);
  const entry = { type: 'carrot', label: 'Pull up wild carrot (click)', position: new THREE.Vector3(x, 0.42, z), radius: 2.25, group: carrot, marker, pulls: 0, harvested: false, index };
  carrotNodes.push(entry);
  natureResourceNodes.push(entry);
  interactables.push(entry);
  return entry;
}

function pullWildCarrot(node) {
  if (!node || node.harvested) return;
  node.pulls += 1;
  node.group.position.y = node.pulls * 0.12;
  if (node.pulls < 3) {
    setStatus(`Keep pulling the carrot: ${node.pulls} / 3.`);
    toast(`Carrot loosened (${node.pulls}/3).`, 'success');
    return;
  }
  node.harvested = true;
  node.group.visible = false;
  save.ingredients.carrots = (save.ingredients.carrots || 0) + 1;
  save.supplies.carrotSeeds = (save.supplies.carrotSeeds || 0) + 1;
  saveGame();
  updateHUD();
  toast('Wild carrot pulled: +1 carrot and +1 carrot seed.', 'success');
  setStatus('The carrot bed will return after a rest at the field cabin.');
}

function registerNatureResource(entry) {
  natureResourceNodes.push(entry);
  interactables.push(entry);
  return entry;
}

function createGroundMushroom(x, z, index = 0, morel = false) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  const stemColor = morel ? 0xb18455 : 0xe3d8b1;
  cylinder(group, morel ? 0.07 : 0.055, morel ? 0.1 : 0.075, 0.34, stemColor, [0, 0.17, 0], { segments: 7 });
  if (morel) {
    cone(group, 0.24, 0.36, 0x8f633f, [0, 0.45, 0], { segments: 8 });
    for (let bump = 0; bump < 5; bump += 1) sphere(group, 0.035, 0x6f4935, [Math.cos(bump) * 0.12, 0.44 + (bump % 2) * 0.08, Math.sin(bump) * 0.12]);
  } else {
    sphere(group, 0.22, index % 2 ? 0xc96c4c : 0xd87969, [0, 0.4, 0], { scale: [1.22, 0.48, 1.22], widthSegments: 8, heightSegments: 5 });
    sphere(group, 0.035, 0xf4e4be, [-0.08, 0.46, -0.1]);
  }
  const marker = makeLabel(morel ? 'MOREL' : 'MUSHROOM', '#f2b268', '#30442f', 0.23);
  marker.position.set(0, 0.82, 0);
  group.add(marker);
  world.add(group);
  return registerNatureResource({ type: 'nature-resource', resourceKey: morel ? 'morels' : 'mushrooms', label: morel ? 'Loot rare morel mushroom' : 'Loot ground mushroom', position: new THREE.Vector3(x, 0.5, z), radius: 2.1, group, marker, used: false, index });
}

function createTreeMushroom(x, z, index = 0) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  const side = index % 2 ? -1 : 1;
  for (let mushroom = 0; mushroom < 2; mushroom += 1) {
    const y = 1.12 + mushroom * 0.32;
    cylinder(group, 0.035, 0.06, 0.2, 0xd6bf8c, [side * 0.34, y, 0], { segments: 6, rotation: [0, 0, side * 0.42] });
    sphere(group, 0.14, mushroom ? 0xa87756 : 0x98714e, [side * 0.34, y + 0.13, 0], { scale: [1.25, 0.42, 0.75], widthSegments: 7, heightSegments: 4 });
  }
  const marker = makeLabel('TREE MUSHROOM', '#f2b268', '#30442f', 0.2);
  marker.position.set(side * 0.36, 1.95, 0);
  group.add(marker);
  world.add(group);
  return registerNatureResource({ type: 'nature-resource', resourceKey: 'treeMushrooms', label: 'Loot tree-side mushroom', position: new THREE.Vector3(x, 1.35, z), radius: 2.2, group, marker, used: false, index });
}

function createWildScallion(x, z, index = 0) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  for (let leaf = 0; leaf < 4; leaf += 1) {
    const blade = cylinder(group, 0.018, 0.035, 0.74 + (leaf % 2) * 0.14, leaf % 2 ? 0x5d9456 : 0x77a760, [Math.cos(leaf * 1.7) * 0.08, 0.37, Math.sin(leaf * 1.7) * 0.08], { segments: 5 });
    blade.rotation.set(Math.sin(leaf * 1.7) * 0.42, 0, -Math.cos(leaf * 1.7) * 0.42);
  }
  sphere(group, 0.09, 0xe9ddbd, [0, 0.08, 0], { scale: [0.82, 0.78, 0.82] });
  const marker = makeLabel('SCALLION', '#d8ef85', '#30442f', 0.2);
  marker.position.set(0, 1.02, 0);
  group.add(marker);
  world.add(group);
  return registerNatureResource({ type: 'nature-resource', resourceKey: 'scallions', label: 'Pick wild scallion', position: new THREE.Vector3(x, 0.45, z), radius: 2.0, group, marker, used: false, index });
}

function createBerryBush(x, z, index = 0) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  for (let bush = 0; bush < 4; bush += 1) sphere(group, 0.3, index % 2 ? 0x477952 : 0x527f50, [(bush - 1.5) * 0.22, 0.35 + (bush % 2) * 0.12, (bush % 2) * 0.16], { scale: [1, 0.85, 0.9] });
  for (let berry = 0; berry < 6; berry += 1) sphere(group, 0.055, berry % 2 ? 0x5b2851 : 0x7c2f43, [(berry - 2.5) * 0.13, 0.42 + (berry % 3) * 0.1, (berry % 2 ? -1 : 1) * 0.2]);
  const marker = makeLabel('BERRIES', '#f2b268', '#30442f', 0.2);
  marker.position.set(0, 1.02, 0);
  group.add(marker);
  world.add(group);
  return registerNatureResource({ type: 'nature-resource', resourceKey: 'berries', label: 'Pick wild berries', position: new THREE.Vector3(x, 0.5, z), radius: 2.1, group, marker, used: false, index });
}

function createWildRicePlant(x, z, index = 0) {
  const group = new THREE.Group();
  group.position.set(x, 0.08, z);
  for (let reed = 0; reed < 5; reed += 1) {
    const height = 0.75 + (reed % 3) * 0.16;
    const stalk = cylinder(group, 0.018, 0.032, height, reed % 2 ? 0x6fa06a : 0x84ae69, [(reed - 2) * 0.06, height * 0.5, Math.sin(reed) * 0.06], { segments: 5 });
    stalk.rotation.set(Math.sin(reed) * 0.16, 0, (reed - 2) * 0.05);
    sphere(group, 0.04, 0xd3bb78, [(reed - 2) * 0.06, height + 0.08, Math.sin(reed) * 0.06], { scale: [0.65, 1.8, 0.65] });
  }
  const marker = makeLabel('WILD RICE', '#d8ef85', '#30442f', 0.2);
  marker.position.set(0, 1.3, 0);
  group.add(marker);
  world.add(group);
  return registerNatureResource({ type: 'nature-resource', resourceKey: 'wildRice', label: 'Loot wild rice plant', position: new THREE.Vector3(x, 0.45, z), radius: 2.25, group, marker, used: false, index });
}

function lootNatureResource(resource) {
  if (!resource || resource.used) return;
  resource.used = true;
  resource.group.visible = false;
  resource.marker.visible = false;
  save.ingredients[resource.resourceKey] = (save.ingredients[resource.resourceKey] || 0) + 1;
  saveGame();
  updateHUD();
  const label = resource.label.replace(/^Loot |^Pick |^Pick up /i, '');
  toast(`${label} collected.`, 'success');
  setStatus('The field item has been added to the looted plants tab.');
}

function plantFlowerSeed(plot = null) {
  if (currentZone !== 'zoo') return;
  plot = plot || gardenPlots.find((candidate) => !isGardenPlotOccupied(candidate) && distanceTo(candidate.position) < candidate.radius);
  if ((save.supplies.flowerSeeds || 0) <= 0) {
    toast('No flower seeds in the field kit. Harvest wild flowers or visit the store.', 'warning');
    return;
  }
  if (!plot) {
    toast('Aim at one of the empty planting spots inside the pollinator pen.', 'warning');
    return;
  }
  const now = Date.now();
  const record = { id: `planted-${now}-${Math.floor(Math.random() * 1000)}`, x: plot.position.x, z: plot.position.z, scale: 0.68 + Math.random() * 0.22, color: [0xf1c84b, 0xe889b0, 0xb58ce0, 0xf3d667][Math.floor(Math.random() * 4)], seededAt: now, bloomsAt: now + FLOWER_GROW_MS, despawnsAt: now + FLOWER_GROW_MS + FLOWER_LIFE_MS };
  save.supplies.flowerSeeds -= 1;
  save.gardenFlowers = [...(save.gardenFlowers || []), record];
  createPollinatorFlower(record.x, record.z, record.scale, record.color, pollinatorFlowers.length * 0.8, record);
  saveGame();
  updateHUD();
  toast('Seed planted. It will bloom in 5 minutes and remain for 2 hours.', 'success');
  setStatus('A new seed is taking root. Check back after it blooms.');
}

function isGardenPlotOccupied(plot) {
  return (save.gardenFlowers || []).some((flower) => Math.hypot(flower.x - plot.position.x, flower.z - plot.position.z) < 0.72);
}

function createGardenPlot(x, z, index) {
  const group = new THREE.Group();
  group.position.set(x, 0.09, z);
  addMesh(group, new THREE.CircleGeometry(0.34, 18), mat(0x765d42, { roughness: 1, transparent: true, opacity: 0.84 }), [0, 0, 0], [-Math.PI / 2, 0, 0]);
  const ring = addMesh(group, new THREE.TorusGeometry(0.36, 0.035, 6, 18), mat(0xf3d667, { emissive: 0x976d28, emissiveIntensity: 0.7, transparent: true, opacity: 0.9 }), [0, 0.02, 0], [-Math.PI / 2, 0, 0]);
  world.add(group);
  const plot = { type: 'seed-plot', label: 'Plant flower seed here', position: new THREE.Vector3(x, 0.25, z), radius: 1.35, group, ring };
  gardenPlots.push(plot);
  interactables.push(plot);
}

function updateGardenPlotMarkers() {
  for (const plot of gardenPlots) {
    const empty = !isGardenPlotOccupied(plot);
    const near = distanceTo(plot.position) < 13;
    plot.group.visible = empty || near;
    plot.ring.material.opacity = empty ? 0.9 : 0.12;
  }
}

function updateBeehives() {
  const flowerCount = pollinatorFlowers.filter((flower) => flower.record ? flower.record.bloomsAt <= Date.now() : true).length;
  const beeCount = 3 + (save.caught.bee || 0);
  for (const hive of beehives) {
    const size = clamp(0.72 + beeCount * 0.045 + flowerCount * 0.075, 0.72, 1.9);
    hive.group.scale.setScalar(size);
    hive.marker.visible = distanceTo(hive.position) < 9 && elapsed > hive.lootedAt + 1.5;
    hive.honeyDrip.visible = elapsed > hive.lootedAt + 12;
    hive.marker.position.y = 0.78 + Math.sin(elapsed * 3 + hive.position.x) * 0.04;
  }
}

function lootHive(hive) {
  if (!hive || elapsed < hive.lootedAt + 12) {
    toast('The hive is still settling. Give the bees a moment.', 'warning');
    return;
  }
  const amount = 2 + Math.max(0, Math.floor((save.caught.bee || 0) / 2));
  hive.lootedAt = elapsed;
  hive.honeyDrip.visible = false;
  save.honey = (save.honey || 0) + amount;
  save.coins += amount * 2;
  saveGame();
  updateHUD();
  toast(`Honey collected: +${amount} honey and +${amount * 2}¢.`, 'success');
  setStatus('The hive hums back to life. Flowers and bees help it grow.');
}

function addTreeInteraction(x, z, label, message, reward = 4) {
  const marker = new THREE.Group();
  const ring = addMesh(marker, new THREE.TorusGeometry(0.27, 0.035, 6, 18), mat(0xd8ef85, { emissive: 0x9aad4b, emissiveIntensity: 0.8, transparent: true, opacity: 0.9 }), [0, 0, 0], [-Math.PI / 2, 0, 0]);
  const core = sphere(marker, 0.065, 0xd8ef85, [0, 0, 0], { material: { emissive: 0x9aad4b, emissiveIntensity: 1.4 } });
  marker.position.set(x, 1.05, z);
  marker.visible = false;
  world.add(marker);
  const interaction = {
    type: 'tree',
    label,
    message,
    reward,
    position: new THREE.Vector3(x, 0.95, z),
    radius: 2.8,
    marker,
    ring,
    core,
    used: false
  };
  interactables.push(interaction);
  treeInteractions.push(interaction);
  return interaction;
}

function updateTreeInteractions() {
  for (const interaction of treeInteractions) {
    const near = distanceTo(interaction.position) < 8.5;
    interaction.marker.visible = near && !interaction.used;
    if (interaction.marker.visible) {
      const pulse = 1 + Math.sin(elapsed * 4.2 + interaction.position.x) * 0.15;
      interaction.marker.scale.setScalar(pulse);
      interaction.marker.rotation.y += 0.018;
      interaction.core.material.emissiveIntensity = 1.1 + Math.sin(elapsed * 5.5) * 0.35;
    }
  }
}

function inspectTree(interaction) {
  if (!interaction || interaction.used) return;
  interaction.used = true;
  interaction.marker.visible = false;
  save.coins += interaction.reward;
  const hiddenBug = bugNodes
    .filter((bug) => bug.cooldown <= 0 && !bug.revealed && distanceTo(bug.position) < 8)
    .sort((a, b) => distanceTo(a.position) - distanceTo(b.position))[0];
  if (hiddenBug) {
    toast(`A ${SPECIES[hiddenBug.species].label.toLowerCase()} trace is nearby. Follow the subtle plant pulse with the magnifying glass.`, 'success');
    setStatus(`${interaction.message} A small trace is moving through the nearby leaves.`);
  } else {
    toast(`Tree note recorded. +${interaction.reward}¢`, 'success');
    setStatus(interaction.message);
  }
  saveGame();
  updateHUD();
}


// `gate` opens a caretaker gap in the path-side (+Z) rail: { offset, width } in
// local x. Visitors and staff route around the enclosure entirely, so the gap is
// there for the caretaker to tend and clean the habitat from the inside.
function createFence(x, z, width, depth, color = 0x806e53, solid = true, gate = null) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  const railY = [0.7, 1.3];
  // Rail runs from `from` to `to` in local x, so a gated side can be built as
  // two shorter spans instead of one continuous bar.
  const spans = gate
    ? [[-width / 2, gate.offset - gate.width / 2], [gate.offset + gate.width / 2, width / 2]]
        .filter(([from, to]) => to - from > 0.02)
    : [[-width / 2, width / 2]];
  for (const y of railY) {
    box(group, [width, 0.12, 0.12], color, [0, y, -depth / 2]);
    for (const [from, to] of spans) {
      box(group, [to - from, 0.12, 0.12], color, [(from + to) / 2, y, depth / 2]);
    }
    box(group, [0.12, 0.12, depth], color, [-width / 2, y, 0]);
    box(group, [0.12, 0.12, depth], color, [width / 2, y, 0]);
  }
  for (const post of [[-width / 2, -depth / 2], [width / 2, -depth / 2], [-width / 2, depth / 2], [width / 2, depth / 2]]) {
    cylinder(group, 0.11, 0.14, 1.9, color, [post[0], 0.9, post[1]], { segments: 6 });
  }
  if (gate) {
    // Taller posts and a sign board mark the gap as a way in, not a broken rail.
    for (const side of [-1, 1]) {
      const postX = gate.offset + side * (gate.width / 2);
      cylinder(group, 0.1, 0.13, 2.15, color, [postX, 1.07, depth / 2], { segments: 6 });
      cylinder(group, 0.05, 0.05, 0.05, 0xd7c088, [postX, 2.18, depth / 2], { segments: 6 });
    }
    box(group, [gate.width, 0.05, 0.5], 0xa8946a, [gate.offset, 0.03, depth / 2], { material: { roughness: 1 } });
    const gateSign = makeLabel('CARETAKER GATE', '#d8ef85', '#2c4130', 0.24);
    gateSign.position.set(gate.offset, 2.42, depth / 2);
    group.add(gateSign);
  }
  world.add(group);
  if (solid) {
    addCollider(x, z - depth / 2, width / 2, { type: 'rect', halfWidth: width / 2, halfDepth: 0.18, zone: currentZone });
    for (const [from, to] of spans) {
      addCollider(x + (from + to) / 2, z + depth / 2, (to - from) / 2, { type: 'rect', halfWidth: (to - from) / 2, halfDepth: 0.18, zone: currentZone });
    }
    addCollider(x - width / 2, z, 0.18, { type: 'rect', halfWidth: 0.18, halfDepth: depth / 2, zone: currentZone });
    addCollider(x + width / 2, z, 0.18, { type: 'rect', halfWidth: 0.18, halfDepth: depth / 2, zone: currentZone });
  }
  return group;
}

function createMountainBoundary(zoneKey) {
  // The ring is drawn on the visual bounds where a zone has them, so the ridge
  // sits behind the street rather than across it; the player is still held by
  // the tighter `bounds`.
  const bounds = ZONES[zoneKey].visualBounds || ZONES[zoneKey].bounds;
  const points = [];
  for (let x = bounds.minX + 1.5; x <= bounds.maxX - 1.5; x += 2.6) {
    points.push([x, bounds.minZ]);
    points.push([x, bounds.maxZ]);
  }
  for (let z = bounds.minZ + 2.6; z <= bounds.maxZ - 2.6; z += 2.6) {
    points.push([bounds.minX, z]);
    points.push([bounds.maxX, z]);
  }
  const lot = PARKING_LOT;
  const streetCorridor = ZONES[zoneKey].visualBounds
    ? [lot.streetZ - lot.streetHalfDepth - 0.6, lot.streetZ + lot.streetHalfDepth + 0.6]
    : null;
  points.forEach(([x, z], index) => {
    // Leave a gap where the road runs out of the zone, so traffic has somewhere
    // to drive to rather than nosing into a rock wall.
    if (streetCorridor && z > streetCorridor[0] && z < streetCorridor[1]) return;
    const height = 2.8 + (index % 4) * 0.7;
    const radius = 1.25 + (index % 3) * 0.22;
    const mountain = addMesh(world, new THREE.DodecahedronGeometry(radius, 1), mat(index % 2 ? 0x4a5b4d : 0x596c5a), [x, height * 0.5, z], [0.12, index * 0.37, 0.08], [1.25, height / (radius * 2), 1.05]);
    mountain.userData.edgeMountain = true;
    addCollider(x, z, radius * 1.2, { zone: zoneKey });
  });
}

function createAquarium() {
  const tankZ = -21.8;
  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xb8fff0,
    roughness: 0.08,
    metalness: 0.04,
    transmission: 0.34,
    thickness: 0.08,
    transparent: true,
    opacity: 0.28,
    side: THREE.DoubleSide,
    depthWrite: false
  });
  const waterMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x2db6bf,
    roughness: 0.16,
    metalness: 0.04,
    transmission: 0.12,
    transparent: true,
    opacity: 0.38,
    side: THREE.DoubleSide,
    depthWrite: false
  });

  box(world, [14.5, 0.32, 5.15], 0x2c493e, [0, 0.18, tankZ], { material: { roughness: 0.72 } });
  box(world, [13.6, 0.42, 4.45], 0x6b7f5e, [0, 0.52, tankZ], { material: { roughness: 0.92 } });
  box(world, [12.05, 0.2, 3.45], 0xc9b177, [0, 0.72, tankZ], { material: { roughness: 1 } });
  box(world, [12.1, 2.9, 0.08], 0x1d5360, [0, 1.96, -23.62], { material: { roughness: 0.62, emissive: 0x103e4a, emissiveIntensity: 0.32 } });

  const water = addMesh(world, new THREE.BoxGeometry(12.05, 2.55, 3.45), waterMaterial, [0, 1.98, tankZ]);
  water.castShadow = false;
  water.receiveShadow = false;
  const surface = addMesh(world, new THREE.PlaneGeometry(11.9, 3.35), new THREE.MeshStandardMaterial({ color: 0x88f3e1, transparent: true, opacity: 0.23, emissive: 0x1d7c7d, emissiveIntensity: 0.5, roughness: 0.2, side: THREE.DoubleSide, depthWrite: false }), [0, 3.25, tankZ], [-Math.PI / 2, 0, 0]);
  surface.castShadow = false;
  surface.receiveShadow = false;

  addMesh(world, new THREE.BoxGeometry(12.65, 3.55, 0.12), glassMaterial, [0, 1.95, -19.9]);
  addMesh(world, new THREE.BoxGeometry(12.65, 3.55, 0.12), glassMaterial, [0, 1.95, -23.7]);
  addMesh(world, new THREE.BoxGeometry(0.12, 3.55, 3.95), glassMaterial, [-6.32, 1.95, tankZ]);
  addMesh(world, new THREE.BoxGeometry(0.12, 3.55, 3.95), glassMaterial, [6.32, 1.95, tankZ]);
  aquariumSmudges = [[-4.25, 2.65, 0.9], [-1.55, 1.7, 0.72], [1.45, 2.45, 0.82], [4.3, 1.35, 0.68]].map(([x, y, scale], index) => createAquariumSmudge(x, y, scale, index));

  for (const x of [-6.38, 6.38]) {
    box(world, [0.22, 3.8, 0.22], 0x315b50, [x, 1.95, -21.8], { material: { roughness: 0.68 } });
  }
  box(world, [12.9, 0.22, 0.22], 0x315b50, [0, 3.72, -19.9], { material: { roughness: 0.68 } });
  box(world, [12.9, 0.22, 0.22], 0x315b50, [0, 0.2, -19.9], { material: { roughness: 0.68 } });
  box(world, [12.9, 0.18, 0.22], 0x315b50, [0, 3.72, -23.7], { material: { roughness: 0.68 } });
  box(world, [8.6, 0.12, 0.38], 0xd9efc2, [0, 3.98, tankZ], { material: { emissive: 0x9ddbb2, emissiveIntensity: 1.1, roughness: 0.42 } });
  box(world, [7.5, 0.06, 0.14], 0xf7d78c, [0, 3.88, tankZ], { material: { emissive: 0xf0bd5f, emissiveIntensity: 0.72 } });

  const rocks = [
    [-4.7, 0.92, -22.85, 0.5, 0x667a70], [-2.9, 0.88, -20.45, 0.34, 0x71877a],
    [1.8, 0.92, -22.95, 0.48, 0x5b746d], [4.65, 0.88, -20.7, 0.42, 0x71877a],
    [5.05, 0.88, -22.8, 0.3, 0x496861]
  ];
  rocks.forEach(([x, y, z, size, color]) => addMesh(world, new THREE.DodecahedronGeometry(size, 0), mat(color, { roughness: 0.96 }), [x, y, z], [0.12, 0.3, 0.08], [1.35, 0.7, 1]));
  [[-5.1, -23.15, 1.65, 0x3b986f], [-3.7, -20.55, 1.2, 0x4aa879], [0.4, -23.1, 1.85, 0x378f6e], [3.55, -20.55, 1.35, 0x4da97c], [4.7, -23.1, 1.55, 0x378f6e]].forEach(([x, z, height, color]) => createAquaticPlant(x, z, height, color));

  const bubblePositions = [[-4.2, 1.05, -21.9], [-3.7, 1.3, -22.2], [-1.2, 1.1, -20.9], [0.8, 0.95, -22.8], [2.1, 1.45, -21.2], [4.15, 1.08, -22.2], [5.1, 1.55, -21.35], [-5.3, 1.2, -20.8], [2.9, 1.0, -23.0]];
  aquariumBubbles = bubblePositions.map(([x, y, z], index) => {
    const bubble = sphere(world, 0.045 + (index % 3) * 0.018, 0xd4fff3, [x, y, z], { material: { transparent: true, opacity: 0.58, emissive: 0x8fe8d7, emissiveIntensity: 0.7, depthWrite: false } });
    bubble.castShadow = false;
    bubble.receiveShadow = false;
    return { mesh: bubble, baseX: x, baseZ: z, baseY: y, speed: 0.22 + (index % 4) * 0.045, phase: index * 0.71 };
  });

  const fishPlan = [
    ['trout', -4.1, 1.48, -21.6, 2.3, 0.72, 0.3],
    ['sunfish', -1.8, 2.15, -22.45, 2.7, 0.82, 1.2],
    ['sunfish', 0.8, 1.45, -20.85, 2.1, 0.64, 2.1],
    ['trout', 3.3, 2.35, -22.55, 2.6, 0.78, 2.8],
    ['sunfish', 4.25, 1.35, -21.25, 1.7, 0.6, 3.5],
    ['trout', -0.1, 2.72, -21.9, 2.9, 0.7, 4.1]
  ];
  fishPlan.forEach(([species, x, y, z, radiusX, radiusZ, phase], index) => {
    const fish = createAnimalModel(species, 0.72 + (index % 2) * 0.06);
    fish.position.set(x, y, z);
    fish.rotation.y = phase;
    fish.userData.zooFish = true;
    world.add(fish);
    zooAnimals.push({ group: fish, type: 'fish', center: fish.position.clone(), phase, radiusX, radiusZ, speed: 0.22 + index * 0.035 });
  });
}

function createAquariumSmudge(x, y, scale, index) {
  const smudge = new THREE.Group();
  smudge.position.set(x, y, -19.82);
  const material = mat(index % 2 ? 0xbaa98f : 0x9f9c87, { transparent: true, opacity: 0.28, depthWrite: false, roughness: 1 });
  addMesh(smudge, new THREE.CircleGeometry(0.38 * scale, 14), material, [0, 0, 0]);
  addMesh(smudge, new THREE.CircleGeometry(0.2 * scale, 12), material, [0.18 * scale, 0.08 * scale, -0.01]);
  smudge.visible = !save.cleanedEnclosures['water-wing'];
  world.add(smudge);
  return smudge;
}

function createAquaticPlant(x, z, height, color) {
  const plant = new THREE.Group();
  plant.position.set(x, 0.82, z);
  cylinder(plant, 0.035, 0.055, height, color, [0, height * 0.5, 0], { segments: 5, rotation: [0.05, 0, 0.05] });
  for (let index = 0; index < 4; index += 1) {
    const side = index % 2 ? 1 : -1;
    const leaf = sphere(plant, 0.12, color, [side * (0.12 + index * 0.035), height * (0.3 + index * 0.16), 0], { scale: [1.8, 0.34, 0.62], rotation: [0, 0, side * (0.42 + index * 0.08)] });
    leaf.castShadow = false;
  }
  world.add(plant);
  return plant;
}

function createPollinatorGarden() {
  const initialPlan = [
    [6.5, -12.2, 0.82, 0xf1c84b], [9.1, -12.1, 0.72, 0xe889b0],
    [11.7, -11.8, 0.9, 0xb58ce0], [8.2, -10.1, 0.78, 0xf3d667]
  ];
  if (!Array.isArray(save.gardenFlowers)) {
    const now = Date.now();
    save.gardenFlowers = initialPlan.map(([x, z, scale, color], index) => ({
      id: `starter-${index}`,
      x, z, scale, color,
      seededAt: now - FLOWER_LIFE_MS + 60 * 1000,
      bloomsAt: now - 60 * 1000,
      despawnsAt: now + FLOWER_LIFE_MS
    }));
    saveGame();
  }
  const now = Date.now();
  save.gardenFlowers = save.gardenFlowers.filter((flower) => flower.despawnsAt > now);
  save.gardenFlowers.forEach((flower, index) => createPollinatorFlower(flower.x, flower.z, flower.scale, flower.color, index * 0.8, flower));
  POLLINATOR_PLOTS.forEach(([x, z], index) => createGardenPlot(x, z, index));
  const gardenTrees = [[6.4, -8.2], [12.8, -8.5]];
  gardenTrees.forEach(([x, z], index) => {
    const tree = createBranchTree(x, z, 0.82, index ? 0x3e724f : 0x477957);
    createBeehiveOnTree(tree, x, z, `garden-hive-${index}`, false, index ? 2.85 : 3.35);
    createSpiderWeb(x + (index ? -0.35 : 0.3), z - 0.22, index ? 2.5 : 3.15, 'zoo');
  });
  addPollinatorDragonflies();
}

function createShowcaseGarden() {
  const centerX = 12.3;
  const centerZ = -21.8;
  box(world, [8.1, 0.07, 6.35], 0x71543b, [centerX, 0.01, centerZ], { material: { roughness: 1 } });
  box(world, [7.7, 0.025, 5.95], 0x916b45, [centerX, 0.055, centerZ], { material: { roughness: 1 } });
  const gardenLabel = makeLabel('GARDEN BEDS', '#d8ef85', '#30442f', 0.42);
  gardenLabel.position.set(centerX, 1.6, centerZ - 3.15);
  world.add(gardenLabel);
  const positions = [];
  for (let row = 0; row < 3; row += 1) {
    for (let column = 0; column < 4; column += 1) positions.push([centerX - 2.75 + column * 1.82, centerZ - 1.65 + row * 1.65]);
  }
  positions.forEach(([x, z], index) => createGardenPlot(x, z, 12 + index));
}

function createShowcaseCabin(x, z) {
  const cabin = new THREE.Group();
  cabin.position.set(x, 0, z);
  box(cabin, [5.6, 0.16, 4.3], 0x75533a, [0, 0.08, 0]);
  box(cabin, [0.22, 2.8, 4.3], 0x806041, [2.7, 1.4, 0]);
  box(cabin, [5.6, 2.8, 0.22], 0x806041, [0, 1.4, 2.05]);
  box(cabin, [5.6, 0.3, 4.7], 0x3f5744, [0, 3.05, 0], { rotation: [0, 0, 0.04] });
  box(cabin, [1.45, 2.15, 0.08], 0x6c4e35, [-1.48, 1.08, -2.05]);
  box(cabin, [0.72, 0.88, 0.72], 0xa5b9a8, [1.55, 0.52, 1.16]);
  box(cabin, [0.76, 0.08, 0.76], 0xd4e6d5, [1.55, 1.0, 1.16]);
  box(cabin, [1.1, 0.78, 0.62], 0x454b48, [1.48, 0.45, -1.18]);
  box(cabin, [0.82, 0.06, 0.78], 0x232b29, [1.48, 0.87, -1.18]);
  box(cabin, [1.65, 0.36, 0.9], 0x936a4a, [-1.15, 0.38, 0.95]);
  box(cabin, [1.72, 0.12, 0.96], 0xf0e4bd, [-1.15, 0.62, 0.95]);
  box(cabin, [1.25, 0.08, 0.72], 0x805b3d, [-1.2, 0.95, -1.2]);
  for (const [dx, dz] of [[-1.68, -1.47], [-0.72, -1.47], [-1.68, -0.93], [-0.72, -0.93]]) cylinder(cabin, 0.055, 0.055, 0.82, 0x62442f, [dx, 0.51, dz], { segments: 6 });
  const sign = makeLabel('FIELD CABIN', '#d8ef85', '#30442f', 0.43);
  sign.position.set(-2.35, 2.55, -2.18);
  cabin.add(sign);
  world.add(cabin);
  interactables.push({ type: 'fridge', label: 'Check ingredient fridge', position: new THREE.Vector3(x + 1.55, 1, z + 1.15), radius: 2.3 });
  interactables.push({ type: 'stove', label: 'Use cabin stove', position: new THREE.Vector3(x + 1.48, 0.9, z - 1.18), radius: 2.3 });
  interactables.push({ type: 'bed', label: 'Sleep · set a wake time', position: new THREE.Vector3(x - 1.15, 0.7, z + 0.95), radius: 2.4 });
  interactables.push({ type: 'desk', label: 'Inspect field desk', position: new THREE.Vector3(x - 1.2, 1, z - 1.2), radius: 2.3 });
}

function createRearShowcaseGreenSpace() {
  const green = addMesh(world, new THREE.PlaneGeometry(33, 31), mat(0x617c5b), [0, -0.045, -45], [-Math.PI / 2, 0, 0]);
  green.receiveShadow = true;
  const edgeTrees = [[-16, -31], [16, -32], [-18, -42], [18, -44], [-15, -54], [15, -55], [-8, -60], [8, -60]];
  edgeTrees.forEach(([x, z], index) => (index % 2 ? createBranchTree : createTree)(x, z, 0.9 + (index % 3) * 0.08, index % 2 ? 0x3a654a : 0x466e4e));
  [[-11, -36], [12, -38], [-8, -50], [10, -52], [-3, -58], [4, -57]].forEach(([x, z], index) => createGroundFoliage(x, z, 0.85 + (index % 2) * 0.2, index % 2 ? 0x4f8054 : 0x5c8d59));
}

function createPollinatorFlower(x, z, scale, color, phase, record = null) {
  const flower = new THREE.Group();
  flower.position.set(x, 0, z);
  const stem = cylinder(flower, 0.035, 0.05, 0.62 * scale, 0x4f8f55, [0, 0.31 * scale, 0], { segments: 5 });
  stem.castShadow = false;
  sphere(flower, 0.13, 0x4f8f55, [-0.12 * scale, 0.22 * scale, 0], { scale: [1.7, 0.32, 0.72], rotation: [0, 0, -0.42] });
  sphere(flower, 0.13, 0x4f8f55, [0.12 * scale, 0.34 * scale, 0], { scale: [1.7, 0.32, 0.72], rotation: [0, 0, 0.42] });
  const head = new THREE.Group();
  head.position.set(0, 0.7 * scale, 0);
  for (let petalIndex = 0; petalIndex < 5; petalIndex += 1) {
    const angle = petalIndex * (Math.PI * 2 / 5);
    sphere(head, 0.13, color, [Math.cos(angle) * 0.13 * scale, Math.sin(angle) * 0.13 * scale, 0], { scale: [1.15, 0.68, 0.62], rotation: [0, 0, angle] });
  }
  sphere(head, 0.105, 0xe8b84e, [0, 0, -0.02], { material: { emissive: 0x9c5f25, emissiveIntensity: 0.34 } });
  flower.add(head);
  world.add(flower);
  pollinatorFlowers.push({ group: flower, head, stem, phase, record });
}

function addPollinatorDragonflies() {
  const positions = [[6.7, 2.55, -8.1], [8.25, 2.85, -10.2], [9.65, 2.45, -11.1], [10.75, 2.75, -8.35], [12.0, 2.35, -10.9]];
  positions.forEach(([x, y, z], index) => {
    const dragonfly = createAnimalModel('dragonfly', 1.14);
    dragonfly.position.set(x, y, z);
    dragonfly.userData.zooDragonfly = true;
    world.add(dragonfly);
    zooAnimals.push({ group: dragonfly, type: 'flying', center: dragonfly.position.clone(), phase: index * 1.55 + 0.6, radiusX: 0.55 + (index % 3) * 0.2, radiusZ: 0.38 + (index % 2) * 0.12, speed: 0.64 + index * 0.07 });
  });
}

function updatePollinatorGarden() {
  const now = Date.now();
  for (const flower of pollinatorFlowers) {
    if (flower.record && flower.record.despawnsAt <= now) {
      world.remove(flower.group);
      save.gardenFlowers = (save.gardenFlowers || []).filter((entry) => entry.id !== flower.record.id);
      flower.record = null;
      continue;
    }
    const growing = flower.record && flower.record.bloomsAt > now;
    const growth = growing ? clamp((now - flower.record.seededAt) / (flower.record.bloomsAt - flower.record.seededAt), 0.18, 0.74) : 1;
    flower.group.scale.setScalar(growth);
    flower.head.visible = !growing;
    flower.head.rotation.z = Math.sin(elapsed * 1.35 + flower.phase) * 0.045;
    flower.head.rotation.y = Math.sin(elapsed * 0.8 + flower.phase) * 0.08;
  }
  pollinatorFlowers = pollinatorFlowers.filter((flower) => flower.group.parent === world);
  updateGardenPlotMarkers();
}

function updateAquarium() {
  if (currentZone !== 'zoo') return;
  for (const bubble of aquariumBubbles) {
    const cycle = (elapsed * bubble.speed + bubble.phase) % 2.35;
    bubble.mesh.position.y = 0.9 + cycle;
    bubble.mesh.position.x = bubble.baseX + Math.sin(elapsed * 1.8 + bubble.phase) * 0.07;
    bubble.mesh.position.z = bubble.baseZ + Math.cos(elapsed * 1.5 + bubble.phase) * 0.06;
    bubble.mesh.scale.setScalar(0.85 + Math.sin(elapsed * 3 + bubble.phase) * 0.14);
  }
}

function createPath(x, z, width, length, color = 0xb3a47a) {
  box(world, [width, 0.04, length], color, [x, 0, z]);
}

function createFieldResearchBoat() {
  const group = createResearchSkiffModel();
  // Float beyond the end rail, not intersecting the dock planks.
  group.position.set(0, 0.33, FOREST_DOCK.endZ - 1.15);
  group.rotation.y = Math.PI / 2;
  world.add(group);
}

function createPondDock() {
  const group = new THREE.Group();
  const length = FOREST_DOCK.shoreZ - FOREST_DOCK.endZ;
  const centerZ = (FOREST_DOCK.shoreZ + FOREST_DOCK.endZ) / 2;
  box(group, [4.15, 0.12, 2.55], 0x75563d, [0, 0.06, 1.12]);
  box(group, [3.95, 0.2, 2.25], 0x9b754f, [0, 0.16, 1.02], { rotation: [-0.18, 0, 0] });
  box(group, [3.7, 0.34, length], 0x8b694a, [0, 0.34, centerZ]);
  for (let z = FOREST_DOCK.shoreZ - 0.25; z > FOREST_DOCK.endZ; z -= 0.62) {
    box(group, [3.46, 0.065, 0.13], 0xc29a62, [0, 0.55, z]);
  }
  for (const x of [-1.55, 1.55]) {
    for (const z of [FOREST_DOCK.shoreZ + 0.05, FOREST_DOCK.endZ - 0.05]) {
      cylinder(group, 0.13, 0.16, 1.35, 0x5e4838, [x, 0.55, z], { segments: 7 });
    }
    box(group, [0.1, 0.1, length - 0.22], 0xb58a5b, [x, 1.08, centerZ]);
  }
  world.add(group);
  const edgeOffset = FOREST_DOCK.halfWidth + 0.18;
  addCollider(-edgeOffset, centerZ, 0.16, { type: 'rect', halfWidth: 0.16, halfDepth: length / 2 + 0.24, zone: 'forest', debugLabel: 'practice-dock-left' });
  addCollider(edgeOffset, centerZ, 0.16, { type: 'rect', halfWidth: 0.16, halfDepth: length / 2 + 0.24, zone: 'forest', debugLabel: 'practice-dock-right' });
  addCollider(0, FOREST_DOCK.endZ - 0.2, 0.12, { type: 'rect', halfWidth: FOREST_DOCK.halfWidth + 0.12, halfDepth: 0.12, zone: 'forest', debugLabel: 'practice-dock-water-end' });
  const label = makeLabel('POND DOCK', '#d8ef85', '#1e3428', 0.58);
  label.position.set(0, 1.65, FOREST_DOCK.shoreZ - 0.55);
  world.add(label);
}

function createPracticePond() {
  const centerX = -15.2;
  const centerZ = -20.8;
  addMesh(world, new THREE.CircleGeometry(4.35, 40), mat(0x3d94a0, { roughness: 0.2, transparent: true, opacity: 0.88 }), [centerX, 0.08, centerZ], [-Math.PI / 2, 0, 0]);
  addMesh(world, new THREE.RingGeometry(4.38, 4.62, 40), mat(0x8da36f, { roughness: 1 }), [centerX, 0.07, centerZ], [-Math.PI / 2, 0, 0]);
  const practiceLabel = makeLabel('PRACTICE POND', '#8be0c3', '#183d3c', 0.52);
  practiceLabel.position.set(centerX, 2.55, centerZ - 0.2);
  world.add(practiceLabel);
  addRock(centerX - 3.5, 0.2, centerZ - 1.5, 0.32, 0x667b6e);
  addRock(centerX + 3.3, 0.18, centerZ + 1.2, 0.28, 0x718474);
  createHotspot(centerX - 1.55, centerZ - 0.65, 'trout', 'spinner', 'worms');
  createHotspot(centerX + 1.35, centerZ + 0.9, 'sunfish', 'feather', 'grubs');
}

function createDuckEgg(x, z, index = 0) {
  const group = new THREE.Group();
  group.position.set(x, 0.08, z);
  sphere(group, 0.12, 0xf1e4c5, [0, 0.12, 0], { scale: [0.78, 1.18, 0.78], widthSegments: 8, heightSegments: 6 });
  const marker = makeLabel('EGG', '#f2b268', '#30442f', 0.2);
  marker.position.set(0, 0.48, 0);
  group.add(marker);
  world.add(group);
  const entry = registerNatureResource({ type: 'nature-resource', resourceKey: 'duckEggs', label: 'Loot duck egg', position: new THREE.Vector3(x, 0.28, z), radius: 1.8, group, marker, used: false, index });
  duckEggNodes.push(entry);
  return entry;
}

function createPracticeDucks() {
  const duckCount = Math.min(3, save.caught.duck || 0);
  for (let index = 0; index < duckCount; index += 1) {
    const angle = index / Math.max(1, duckCount) * Math.PI * 2;
    const group = createAnimalModel('duck', 0.72);
    const x = PRACTICE_POND.centerX + Math.cos(angle) * 1.7;
    const z = PRACTICE_POND.centerZ + Math.sin(angle) * 1.35;
    group.position.set(x, 0.28, z);
    world.add(group);
    zooAnimals.push({ group, type: 'duck', center: group.position.clone(), phase: index * 1.8, radiusX: 1.35, radiusZ: 1.0, speed: 0.2, nextEggAt: elapsed + 10 + index * 7 });
  }
}

function createStorekeeper() {
  const npc = new THREE.Group();
  npc.position.set(0, 1.05, -6.45);
  // Keep the clerk's original root/collider; model coordinates include the hidden legs.
  for (const side of [-1, 1]) {
    cylinder(npc, 0.14, 0.12, 1.04, 0x394f49, [side * 0.19, -0.30, 0], { segments: 8 });
    box(npc, [0.29, 0.2, 0.46], 0x40382e, [side * 0.19, -0.92, 0.09]);
  }
  cylinder(npc, 0.34, 0.3, 0.94, 0x4f6c65, [0, 0.61, 0], { segments: 8, scale: [1, 1, 0.72] });
  cylinder(npc, 0.12, 0.14, 0.19, 0xc88561, [0, 1.12, 0], { segments: 8 });
  sphere(npc, 0.29, 0xc88561, [0, 1.38, 0], { scale: [0.88, 1.08, 0.9] });
  sphere(npc, 0.295, 0x49382c, [0, 1.46, -0.09], { scale: [0.94, 0.94, 0.78] });
  sphere(npc, 0.16, 0x49382c, [0.04, 1.3, -0.3]);
  for (const side of [-1, 1]) {
    sphere(npc, 0.055, 0xc88561, [side * 0.255, 1.37, 0]);
    sphere(npc, 0.029, 0x292e27, [side * 0.095, 1.42, 0.242]);
    box(npc, [0.085, 0.025, 0.025], 0x49382c, [side * 0.095, 1.49, 0.238]);
    cylinder(npc, 0.14, 0.12, 0.38, 0x4f6c65, [side * 0.4, 0.85, 0], { segments: 8, rotation: [0, 0, side * 0.22] });
    cylinder(npc, 0.085, 0.075, 0.35, 0xc88561, [side * 0.45, 0.55, 0.09], { segments: 8, rotation: [-0.4, 0, side * 0.05] });
    sphere(npc, 0.095, 0xc88561, [side * 0.46, 0.38, 0.16], { scale: [0.85, 1.1, 0.8] });
  }
  sphere(npc, 0.047, 0xd49a75, [0, 1.35, 0.265], { scale: [0.8, 1, 0.8] });
  box(npc, [0.085, 0.018, 0.018], 0x874e3e, [0, 1.27, 0.24]);
  box(npc, [0.45, 0.7, 0.055], 0xbca477, [0, 0.54, 0.25]);
  for (const side of [-1, 1]) box(npc, [0.055, 0.3, 0.05], 0xbca477, [side * 0.16, 0.99, 0.24]);
  box(npc, [0.28, 0.19, 0.035], 0x967b53, [0, 0.41, 0.291]);
  box(npc, [0.13, 0.07, 0.025], 0xefe4bb, [-0.09, 0.79, 0.29]);
  cylinder(npc, 0.36, 0.36, 0.045, 0xd4b67b, [0, 1.65, 0.035], { segments: 12, scale: [1, 1, 0.87] });
  cylinder(npc, 0.235, 0.255, 0.17, 0xd4b67b, [0, 1.75, -0.015], { segments: 10 });
  cylinder(npc, 0.255, 0.26, 0.05, 0x4f6c65, [0, 1.69, -0.015], { segments: 10 });
  const name = makeLabel('MARA · FIELD CLERK', '#f2b268', '#2f3f31', 0.33);
  name.position.set(0, 1.95, 0);
  npc.add(name);
  world.add(npc);
  addCollider(0, -6.45, 0.55, { zone: 'store' });
}

function createShopDisplay(item, x, z, row = 0, rotation = 0) {
  const display = new THREE.Group();
  const displayY = row ? 1.75 : 0;
  display.position.set(x, displayY, z);
  display.rotation.y = rotation;
  box(display, [1.9, 2.05, 0.14], 0x405d48, [0, 1.05, 0]);
  box(display, [1.72, 0.12, 0.72], 0xc29a62, [0, 0.48, 0.12]);
  box(display, [1.72, 0.1, 0.72], 0x334f3d, [0, 0.56, 0.1]);
  if (item.group === 'tool') {
    if (item.key === 'pans') {
      // Hung face-out on the backboard with the handle down, the way a shop
      // actually displays one, so the round face reads from the aisle.
      cylinder(display, 0.3, 0.3, 0.09, 0x4a5350, [0, 1.16, 0.02], { rotation: [Math.PI / 2, 0, 0], segments: 14 });
      cylinder(display, 0.245, 0.245, 0.035, 0x6b7570, [0, 1.16, 0.075], { rotation: [Math.PI / 2, 0, 0], segments: 14 });
      cylinder(display, 0.045, 0.05, 0.52, 0x2e3634, [0, 0.8, 0.02], { segments: 7 });
      torus(display, 0.05, 0.016, 0x2e3634, [0, 0.55, 0.02], [0, 0, 0], 6, 14);
    } else if (item.key === 'waders') {
      cylinder(display, 0.18, 0.22, 0.76, 0x4d6b69, [-0.22, 1.02, 0], { segments: 8 });
      cylinder(display, 0.18, 0.22, 0.76, 0x4d6b69, [0.22, 1.02, 0], { segments: 8 });
      box(display, [0.34, 0.14, 0.4], 0x2d493e, [-0.22, 0.62, 0.02]);
      box(display, [0.34, 0.14, 0.4], 0x2d493e, [0.22, 0.62, 0.02]);
      box(display, [0.76, 0.12, 0.12], 0xd1b77e, [0, 1.38, 0]);
    } else {
      cylinder(display, 0.06, 0.08, 0.9, item.key === 'nets' ? 0x80634b : 0x76533f, [0, 1.15, 0], { rotation: [0.1, 0, 0.18], segments: 8 });
      torus(display, item.key === 'nets' ? 0.3 : 0.22, 0.035, 0xd1b77e, [0, 1.62, 0], [0, 0, 0], 8, 18);
    }
  } else if (item.group === 'bait') {
    for (let index = 0; index < 3; index += 1) sphere(display, 0.12, item.key === 'worms' ? 0xb7775b : 0x6c9b56, [-0.28 + index * 0.28, 0.95, 0], { scale: [1, 0.65, 1.2] });
  } else if (item.group === 'lure') {
    cylinder(display, 0.04, 0.04, 0.75, 0xc8d3c7, [0, 1.03, 0], { rotation: [Math.PI / 2, 0, 0], segments: 6 });
    sphere(display, 0.15, item.key === 'spinner' ? 0xe3b74f : 0xd8e4e0, [0.2, 1.03, 0]);
  } else {
    const packet = box(display, [0.48, 0.62, 0.12], 0xe3b74f, [0, 1.02, 0]);
    packet.rotation.y = row * 0.2;
    sphere(display, 0.08, 0x5d8a52, [0, 1.12, -0.1]);
  }
  const label = makeLabel(item.label, '#f2b268', '#2d4232', 0.26);
  label.position.set(0, 2.0, -0.12);
  display.add(label);
  world.add(display);
  const interactable = { type: 'shop-item', label: `Buy ${item.label}`, position: new THREE.Vector3(x, displayY + 1.05, z), radius: 3.0, itemKey: item.key, group: item.group, display };
  interactables.push(interactable);
  addCollider(x, z, 0.72, { zone: 'store' });
}

function createStoreRecordBoard() {
  const board = new THREE.Group();
  board.position.set(-5.45, 2.1, -8.95);
  box(board, [3.0, 2.0, 0.16], 0x314b39, [0, 0, 0]);
  const label = makeLabel('RECORD FISH', '#f2c84b', '#2f3a2c', 0.4);
  label.position.set(0, 0.56, -0.12);
  board.add(label);
  world.add(board);
  storeRecordBoard = board;
  refreshStoreRecordBoard();
}

function refreshStoreRecordBoard() {
  if (!storeRecordBoard) return;
  if (storeRecordBoard.userData.details) storeRecordBoard.remove(storeRecordBoard.userData.details);
  const records = Object.values(save.records || {});
  const best = records.sort((a, b) => b.weight - a.weight)[0];
  if (!best) return;
  const details = makeLabel(`${SPECIES[best.species].label} · ${best.weight}LB`, '#f0eccf', '#3f5c48', 0.25);
  details.position.set(0, -0.22, -0.12);
  storeRecordBoard.add(details);
  storeRecordBoard.userData.details = details;
}


function buildStore() {
  setZonePalette('store');
  addGround(ZONES.store.ground, 150);
  createParkingHub('FIELD DEPOT', ZONES.store.accent);
  createPath(0, 0, 7, 20, 0x9f956d);

  box(world, [19, 0.6, 0.45], 0x2e4936, [0, 3.6, -8.5]);
  box(world, [0.45, 3.6, 9], 0x35523e, [-9.3, 1.8, -4.3]);
  box(world, [0.45, 3.6, 9], 0x35523e, [9.3, 1.8, -4.3]);
  box(world, [19, 0.25, 9], 0x283b31, [0, 3.9, -4.3], { rotation: [0.06, 0, -0.04] });
  box(world, [19, 0.28, 0.35], 0x7a6445, [0, 0.25, -8.5]);
  box(world, [4.5, 2.6, 0.2], 0xa86f49, [0, 1.4, -8.7]);
  const storefront = makeLabel('SUPPLIES', '#f2b268', '#3a2b25', 1.14);
  storefront.position.set(0, 3.0, -8.96);
  world.add(storefront);
  addCollider(-9.3, -4.3, 0.25, { type: 'rect', halfWidth: 0.25, halfDepth: 4.5, zone: 'store' });
  addCollider(9.3, -4.3, 0.25, { type: 'rect', halfWidth: 0.25, halfDepth: 4.5, zone: 'store' });
  addCollider(0, -8.5, 0.25, { type: 'rect', halfWidth: 9.5, halfDepth: 0.25, zone: 'store' });

  const counter = new THREE.Group();
  counter.position.set(0, 0, -5.5);
  box(counter, [7.2, 0.9, 1.2], 0x8f6948, [0, 0.55, 0]);
  box(counter, [6.7, 0.06, 1.05], 0xd4b67b, [0, 1.03, -0.03]);
  box(counter, [0.8, 0.65, 0.38], 0x2d503d, [0, 1.36, -0.08]);
  world.add(counter);
  interactables.push({ type: 'shop', label: 'Open supply counter', position: counter.position.clone(), radius: 3.6 });
  addCollider(0, -5.5, 0.9, { type: 'rect', halfWidth: 3.6, halfDepth: 0.7, zone: 'store' });
  createStorekeeper();
  createStoreRecordBoard();

  // Keep the clerk's face clear of the middle display's shelf/backboard.
  const backXs = [-5.8, -2.8, 5.8];
  SHOP_ITEMS.slice(0, 3).forEach((item, index) => createShopDisplay(item, backXs[index], -6.72, 1));
  const sideSpots = [
    [-8.62, -1.5, Math.PI / 2, 0], [-8.62, -4.55, Math.PI / 2, 0],
    [8.62, -1.5, -Math.PI / 2, 0], [8.62, -4.55, -Math.PI / 2, 0],
    [-8.62, -6.7, Math.PI / 2, 1], [8.62, -6.7, -Math.PI / 2, 1],
    [-8.62, -3.0, Math.PI / 2, 1], [8.62, -3.0, -Math.PI / 2, 1]
  ];
  SHOP_ITEMS.slice(3).forEach((item, index) => {
    const spot = sideSpots[index];
    // Anything past the last shelf stays on the counter list rather than
    // throwing when a new item is added to SHOP_ITEMS.
    if (!spot) return;
    const [x, z, rotation, row] = spot;
    createShopDisplay(item, x, z, row, rotation);
  });
  createTree(-14, -4, 1.1, 0x44694e);
  createTree(14, -3, 1.05, 0x44694e);
  addSmallCrates(-4, 0, -2);
  addSmallCrates(5, 0, -1);
}

function addSmallCrates(x, y, z) {
  // Retain both original centers, sizes and tilts; details stay on the old cube faces.
  for (const [size, color, center, rotation] of [
    [0.8, 0xb5794e, [x, y + 0.4, z], [0, 0.08, 0.05]],
    [0.68, 0xe0a566, [x + 0.7, y + 0.34, z + 0.2], [0.03, -0.1, 0]]
  ]) {
    const crate = new THREE.Group();
    crate.position.set(...center); crate.rotation.set(...rotation);
    box(crate, [size, size, size], color, [0, 0, 0]);
    const edge = size / 2;
    for (const side of [-1, 1]) {
      for (const seam of [-0.18, 0.06]) {
        box(crate, [size * 0.87, 0.016, 0.008], 0x795334, [0, size * seam, side * (edge + 0.004)]);
        box(crate, [0.008, 0.016, size * 0.87], 0x795334, [side * (edge + 0.004), size * seam, 0]);
      }
      for (const rail of [-0.36, 0.36]) {
        box(crate, [size * 0.13, size, 0.025], 0x986b42, [size * rail, 0, side * edge]);
        box(crate, [0.025, size, size * 0.13], 0x986b42, [side * edge, 0, size * rail]);
        box(crate, [size * 0.13, 0.025, size], 0x986b42, [size * rail, edge, 0]);
      }
      box(crate, [size * 0.32, size * 0.07, 0.012], 0x4a3b2b, [0, size * 0.32, side * (edge + 0.009)]);
    }
    for (const seam of [-0.18, 0.06]) box(crate, [size * 0.72, 0.009, 0.015], 0x795334, [0, edge + 0.004, size * seam]);
    world.add(crate);
  }
}

function buildForest() {
  setZonePalette('forest');
  addGround(ZONES.forest.ground, 150);
  createMountainBoundary('forest');
  createNatureScatter('forest');
  createParkingHub('LAKE FIELD', ZONES.forest.accent);
  createPath(0, -1.7, 5.5, 25, 0x9d946e);
  box(world, [5.5, 0.07, 7], 0x7f815e, [0, 0, -10], { rotation: [0, 0, 0.04] });

  const water = addMesh(world, new THREE.CircleGeometry(10, 48), mat(0x2f8291, { roughness: 0.24, metalness: 0.05, transparent: true, opacity: 0.9 }), [0, 0.08, -17], [-Math.PI / 2, 0, 0]);
  water.receiveShadow = true;
  const shoreline = addMesh(world, new THREE.RingGeometry(10.1, 10.45, 48), mat(0x8da36f, { roughness: 1 }), [0, 0.07, -17], [-Math.PI / 2, 0, 0]);
  shoreline.receiveShadow = true;
  addMesh(world, new THREE.CircleGeometry(10.7, 48), mat(0x6a7d55, { roughness: 1 }), [0, 0.02, -17], [-Math.PI / 2, 0, 0]);
  createPondDock();
  createFieldResearchBoat();

  const treeSpots = [
    [-16, -15, 1.3], [-13, -3, 1.5], [-10, 5, 1.1], [14, -2, 1.45], [17, -16, 1.2],
    [-17, -25, 1.1], [15, -28, 1.35], [9, 4, 1.15], [-4, 2, 0.9], [18, 5, 0.8],
    [-20, -8, 1.1], [-19, 2, 0.95], [-21, -19, 1.25], [-18, -29, 1.05],
    [20, -8, 1.05], [19, 2, 0.92], [21, -21, 1.18], [18, -29, 1.08],
    [-12, -29, 0.9], [11, -27, 0.95], [-15, -7, 0.84], [15, -7, 0.88],
    [-21, 8, 0.86], [21, 8, 0.9], [-13, -12, 0.92], [13, -12, 0.95],
    [-13, -21, 0.9], [13, -21, 0.96], [-9, -29, 0.86], [8, -29, 0.9],
    [-6, 6, 0.78], [6, 7, 0.82], [-19, -4, 0.88], [19, -4, 0.86],
    [-26, -34, 1.05], [25, -32, 1.12], [-27, -10, 0.96], [27, -13, 1.02],
    [-25, 7, 0.9], [25, 8, 0.94], [-12, -37, 0.92], [12, -37, 0.98]
  ];
  treeSpots.forEach(([x, z, scale], index) => (index % 4 === 0 ? createBranchTree : createTree)(x, z, scale, index % 2 ? 0x315a41 : 0x3f6b47));
  createBeehiveOnTree(null, -16, -15, 'wild-hive-west', true, 3.35);
  createBeehiveOnTree(null, 17, -16, 'wild-hive-east', true, 2.85);
  createSpiderWeb(-13.1, -3.2, 2.8, 'forest');
  createSpiderWeb(14.4, -2.1, 3.0, 'forest');
  createSpiderWeb(-10.3, 5.0, 2.7, 'forest');
  createWildFlowerNode(-7.6, -4.7, 0xe889b0, 0);
  createWildFlowerNode(5.7, -8.4, 0xf1c84b, 1);
  createWildFlowerNode(10.9, -6.8, 0xb58ce0, 2);
  [[-24, -34], [25, -31], [26, 7]].forEach(([x, z], index) => {
    if (isGrassNaturePosition('forest', x, z)) createWildCarrot(x, z, index);
  });
  [[-25, -25], [24, -24], [26, 14]].forEach(([x, z], index) => {
    if (isGrassNaturePosition('forest', x, z)) createGroundMushroom(x, z, index);
  });
  if (isGrassNaturePosition('forest', -26, -37)) createGroundMushroom(-26, -37, 0, true);
  [[-21, -19], [21, -21], [-18, -29], [18, -29]].forEach(([x, z], index) => createTreeMushroom(x, z, index));
  [[-25, -16], [25, -17], [-22, 7], [22, 8], [-4, -31], [6, -35]].forEach(([x, z], index) => {
    if (isGrassNaturePosition('forest', x, z)) createWildScallion(x, z, index);
  });
  [[-26, -8], [26, -10], [-24, 2], [24, 3], [-12, -35], [12, -36], [-25, -38], [25, -38]].forEach(([x, z], index) => {
    if (isGrassNaturePosition('forest', x, z)) createBerryBush(x, z, index);
  });
  [[-8.1, -17.7], [8.05, -16.5], [2.5, -8.55], [-4.3, -25.0], [6.3, -23.2]].forEach(([x, z], index) => createWildRicePlant(x, z, index));
  createBugNode('caterpillar', [7.1, 0.05, -8.5], 0xd59c3a);
  createBugNode('worm', [-13.1, 0.05, -3.2], 0xb7775b);
  addRock(-7, 0.4, -6, 1.4, 0x667b6e);
  addRock(7, 0.32, -2, 1.1, 0x718474);
  addRock(-11, 0.28, -22, 0.85, 0x667b6e);

  createHotspot(-4.4, -13.1, 'trout', 'spinner', 'worms');
  createHotspot(2.3, -19.7, 'sunfish', 'feather', 'grubs');
  createHotspot(6.1, -13.7, 'trout', 'spinner', 'worms');

  spawnCritter('rabbit', [-8.5, 0.42, -5.5]);
  spawnCritter('squirrel', [10.3, 0.42, -5.8]);
  spawnCritter('rabbit', [12.2, 0.42, -22.8]);
  spawnCritter('squirrel', [-15.4, 0.42, -21.4]);
  spawnCritter('rabbit', [-18.2, 0.42, -10.4]);
  spawnCritter('squirrel', [18.2, 0.42, -11.2]);
  spawnCritter('rabbit', [-10.8, 0.42, -27.4]);
  spawnCritter('squirrel', [10.8, 0.42, -27.8]);
  spawnCritter('rabbit', [-17.1, 0.42, 3.8]);
  spawnCritter('squirrel', [16.8, 0.42, 3.2]);
  spawnCritter('fox', [-19, 0.48, -14.2]);
  spawnCritter('frog', [-17.8, 0.42, -6.8]);
  spawnCritter('owl', [12.8, 2.1, -22.5]);

  addTreeInteraction(-13, -3, 'Check tree hollow', 'A squirrel has been using this hollow as a field cache.', 5);
  addTreeInteraction(14, -2, 'Read bark marks', 'Fresh claw marks point toward the lake trail.', 4);
  addTreeInteraction(-17, -25, 'Collect pinecone', 'A tidy pinecone cache marks a quiet animal route.', 3);
  addTreeInteraction(15, -28, 'Inspect fallen branch', 'The branch is warm from a recent animal crossing.', 4);
  addTreeInteraction(-10, 5, 'Listen at the trunk', 'A soft rustle answers from somewhere in the canopy.', 5);

  spawnCritter('butterfly', [-8.6, 1.85, -5.5]);
  spawnCritter('bee', [-15.2, 2.6, -14.2]);
  spawnCritter('dragonfly', [7.2, 2.2, -21.5]);
  createDuck(-3.4, -20.2, 0);
  createDuck(4.4, -17.6, 1);

  const trailLabel = makeLabel('LAKE TRAIL', '#d8ef85', '#1c3025', 0.72);
  trailLabel.position.set(0, 2.9, -3.2);
  world.add(trailLabel);
}

function addRock(x, y, z, scale, color) {
  const rock = addMesh(world, new THREE.DodecahedronGeometry(scale, 0), mat(color), [x, y, z], [0.1, 0.25, 0.08], [1.3, 0.8, 1]);
  rock.castShadow = true;
  addCollider(x, z, scale * 1.05, { zone: currentZone });
  return rock;
}

function createHotspot(x, z, fishSpecies, lure, bait) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  const target = addMesh(group, new THREE.CylinderGeometry(1.1, 1.1, 0.08, 32), mat(0x9fead4, { transparent: true, opacity: 0.12, depthWrite: false }), [0, 0.15, 0]);
  target.userData.hotspot = true;
  const ringOne = addMesh(group, new THREE.TorusGeometry(0.82, 0.055, 6, 28), mat(0x9fead4, { transparent: true, opacity: 0.82, emissive: 0x1f6f6c, emissiveIntensity: 0.25 }), [0, 0.22, 0], [-Math.PI / 2, 0, 0]);
  const ringTwo = addMesh(group, new THREE.TorusGeometry(1.42, 0.04, 6, 28), mat(0x9fead4, { transparent: true, opacity: 0.52, emissive: 0x1f6f6c, emissiveIntensity: 0.18 }), [0, 0.21, 0], [-Math.PI / 2, 0, 0]);
  const center = sphere(group, 0.12, 0xe1fff2, [0, 0.23, 0], { material: { emissive: 0x75e0bd, emissiveIntensity: 1.2 } });
  const bubbleA = sphere(group, 0.08, 0xd7f7ec, [-0.65, 0.35, 0.15], { material: { transparent: true, opacity: 0.82 } });
  const bubbleB = sphere(group, 0.06, 0xd7f7ec, [0.55, 0.32, -0.25], { material: { transparent: true, opacity: 0.78 } });
  world.add(group);
  hotspots.push({ group, target, ringOne, ringTwo, center, bubbleA, bubbleB, fishSpecies, lure, bait, practice: currentZone === 'zoo', position: new THREE.Vector3(x, 0.18, z) });
}

function spawnCritter(species, position) {
  const isFlying = SPECIES[species].type === 'flying' || ['butterfly', 'bee', 'dragonfly'].includes(species);
  const validLand = isGrassNaturePosition(currentZone, position[0], position[2]);
  const validAir = isFlying && isInsideNatureWater(position[0], position[2]);
  if (!['forest', 'lake'].includes(currentZone) || (!validLand && !validAir)) return null;
  const group = createAnimalModel(species, 0.9);
  group.position.set(...position);
  world.add(group);
  // Ground gaits pitch the body forward as it bounds, so yaw has to be applied
  // before pitch or the lean would tip sideways once the animal turns.
  group.rotation.order = 'YXZ';
  const direction = Math.random() * Math.PI * 2;
  const critter = { species, group, home: new THREE.Vector3(...position), direction, targetDirection: direction, state: 'idle', stateTime: Math.random() * 2, fleeTime: 0, caught: false, hidden: false, respawnAt: 0 };
  critters.push(critter);
  // Animals that are off duty at this hour wait out of sight until their time.
  if (!isSpeciesActive(species)) retireCritter(critter);
  return critter;
}

function createGroundFoliage(x, z, scale = 1, color = 0x4d8055) {
  const foliage = new THREE.Group();
  foliage.position.set(x, 0, z);
  for (let index = 0; index < 4; index += 1) {
    const height = (0.34 + (index % 3) * 0.16) * scale;
    cone(foliage, 0.12 * scale, height, new THREE.Color(color).offsetHSL(index * 0.015, 0, (index % 2) * 0.05), [Math.sin(index * 1.7) * 0.18 * scale, height * 0.5, Math.cos(index * 1.7) * 0.15 * scale], { segments: 5 });
  }
  world.add(foliage);
  return foliage;
}

// --- Individual grass blades and understory flora ------------------------------
// Grass is drawn as real blades rather than blocky tufts: each one is a seven
// vertex tapered strip, and every blade in a region is baked into a single
// merged mesh, so a meadow of thousands of blades still costs one draw call.
// A vertex shader sway keeps them moving with no per-frame CPU work, and the
// same builder draws fern fronds, broad leaves and lake reeds.

const GRASS_SWAY_UNIFORM = { value: 0 };
// Blade level heights along the strip; the last entry is the single tip vertex.
// Three levels is five vertices and three triangles a blade, which is what
// keeps tens of thousands of them affordable.
const BLADE_LEVELS = [0, 0.45, 1];
const GRASS_BATCH_LIMIT = 40000;

const GRASS_PALETTES = {
  field: { base: 0x4c7d38, tip: 0xa6c765, height: [0.2, 0.52] },
  meadow: { base: 0x51873a, tip: 0xbcd274, height: [0.26, 0.74] },
  forest: { base: 0x3f6d34, tip: 0x8fb45e, height: [0.16, 0.46] },
  shore: { base: 0x5b8340, tip: 0xc6cf78, height: [0.3, 0.9] },
  lawn: { base: 0x53883f, tip: 0xa9cd6b, height: [0.12, 0.28] },
  dry: { base: 0x7d7c45, tip: 0xd6c983, height: [0.22, 0.64] }
};

const grassMaterial = new THREE.MeshStandardMaterial({
  vertexColors: true,
  side: THREE.DoubleSide,
  roughness: 1,
  metalness: 0
});
grassMaterial.onBeforeCompile = (shader) => {
  shader.uniforms.grassSwayTime = GRASS_SWAY_UNIFORM;
  shader.vertexShader = shader.vertexShader
    .replace('#include <common>', `#include <common>
      attribute float bladeSway;
      attribute float bladePhase;
      uniform float grassSwayTime;`)
    .replace('#include <begin_vertex>', `#include <begin_vertex>
      float gust = sin(grassSwayTime * 1.15 + bladePhase) * 0.66 + sin(grassSwayTime * 2.45 + bladePhase * 1.7) * 0.34;
      float crossBreeze = cos(grassSwayTime * 0.85 + bladePhase * 0.7);
      transformed.x += gust * bladeSway * 0.22;
      transformed.z += crossBreeze * bladeSway * 0.15;
      transformed.y -= abs(gust) * bladeSway * 0.06;`);
  // Blades are double sided, and three flips the shading normal on back faces.
  // For an up-facing authored normal that would light half the field from
  // below and render it black, so hold the authored normal on both sides.
  shader.fragmentShader = shader.fragmentShader.replace(
    '#include <normal_fragment_begin>',
    `#include <normal_fragment_begin>
      normal = normalize( vNormal );
      nonPerturbedNormal = normal;`);
};

let bladeBatch = null;
let grassMeshes = [];
const bladeNormal = new THREE.Vector3();
const bladeShade = new THREE.Color();

// A small deterministic generator, so the same field lays out the same way on
// every visit instead of reshuffling each time a zone is rebuilt.
// A coarse bucket grid for "is anything already within r of this point?".
// Scattering hundreds of trees or props with a plain array scan is quadratic
// and shows up directly in zone load time.
function makeSpacingGrid(cell = 2) {
  const buckets = new Map();
  const key = (cellX, cellZ) => (cellX + 1024) * 4096 + (cellZ + 1024);
  return {
    add(x, z) {
      const bucketKey = key(Math.floor(x / cell), Math.floor(z / cell));
      const bucket = buckets.get(bucketKey);
      if (bucket) bucket.push(x, z);
      else buckets.set(bucketKey, [x, z]);
    },
    occupied(x, z, radius) {
      const reach = Math.ceil(radius / cell);
      const cellX = Math.floor(x / cell);
      const cellZ = Math.floor(z / cell);
      for (let offsetX = -reach; offsetX <= reach; offsetX += 1) {
        for (let offsetZ = -reach; offsetZ <= reach; offsetZ += 1) {
          const bucket = buckets.get(key(cellX + offsetX, cellZ + offsetZ));
          if (!bucket) continue;
          for (let entry = 0; entry < bucket.length; entry += 2) {
            if (Math.hypot(bucket[entry] - x, bucket[entry + 1] - z) < radius) return true;
          }
        }
      }
      return false;
    }
  };
}

function makeFieldRandom(seed = 1) {
  let state = (Math.floor(Math.abs(seed)) * 2654435761 + 97) >>> 0 || 1;
  return () => {
    state ^= state << 13; state >>>= 0;
    state ^= state >>> 17;
    state ^= state << 5; state >>>= 0;
    return state / 4294967296;
  };
}

function addGrassBlade(x, z, options = {}) {
  const {
    height = 0.5,
    width = 0.024,
    angle = 0,
    lean = 0.3,
    baseColor,
    tipColor,
    stiffness = 1,
    phase = 0,
    y = 0,
    arch = 0
  } = options;
  if (!bladeBatch) {
    bladeBatch = { positions: [], normals: [], colors: [], sways: [], phases: [], indices: [], blades: 0 };
  }
  const batch = bladeBatch;
  const first = batch.positions.length / 3;
  const acrossX = Math.cos(angle);
  const acrossZ = Math.sin(angle);
  const bendX = -acrossZ;
  const bendZ = acrossX;
  // Blades are thin and near vertical, so a true face normal would leave them
  // unlit. Tilting the normal towards the sky is what makes turf read as turf.
  bladeNormal.set(bendX * 0.42, 1, bendZ * 0.42).normalize();
  for (const t of BLADE_LEVELS) {
    const bend = lean * height * t * t;
    // Slightly super-linear early rise, then flattening: the usual blade arc.
    const rise = height * (t * (1.08 - t * 0.08)) - arch * height * t * t;
    const halfWidth = width * (1 - t * 0.94);
    bladeShade.copy(baseColor).lerp(tipColor, clamp(t * 0.9 + 0.08, 0, 1));
    for (const side of (t >= 1 ? [0] : [-1, 1])) {
      batch.positions.push(
        x + bendX * bend + acrossX * halfWidth * side,
        y + rise,
        z + bendZ * bend + acrossZ * halfWidth * side
      );
      // Normals and colours are stored as normalised bytes rather than floats:
      // at a hundred thousand blades a zone the buffer size matters, and neither
      // needs more precision than this.
      batch.normals.push(bladeNormal.x * 127, bladeNormal.y * 127, bladeNormal.z * 127);
      batch.colors.push(bladeShade.r * 255, bladeShade.g * 255, bladeShade.b * 255);
      batch.sways.push(t * t * stiffness);
      batch.phases.push(phase);
    }
  }
  // Quads between each pair of full-width levels, then one triangle to the tip.
  for (let level = 0; level < BLADE_LEVELS.length - 2; level += 1) {
    const corner = first + level * 2;
    batch.indices.push(corner, corner + 1, corner + 3, corner, corner + 3, corner + 2);
  }
  const lastPair = first + (BLADE_LEVELS.length - 2) * 2;
  batch.indices.push(lastPair, lastPair + 1, lastPair + 2);
  batch.blades += 1;
  if (batch.blades >= GRASS_BATCH_LIMIT) flushGrassBlades();
}

function flushGrassBlades() {
  const batch = bladeBatch;
  bladeBatch = null;
  if (!batch || !batch.blades) return null;
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(batch.positions, 3));
  geometry.setAttribute('normal', new THREE.Int8BufferAttribute(batch.normals, 3, true));
  geometry.setAttribute('color', new THREE.Uint8BufferAttribute(batch.colors, 3, true));
  geometry.setAttribute('bladeSway', new THREE.Float32BufferAttribute(batch.sways, 1));
  geometry.setAttribute('bladePhase', new THREE.Float32BufferAttribute(batch.phases, 1));
  geometry.setIndex(new THREE.Uint32BufferAttribute(batch.indices, 1));
  geometry.computeBoundingSphere();
  const mesh = new THREE.Mesh(geometry, grassMaterial);
  mesh.receiveShadow = true;
  mesh.castShadow = false;
  world.add(mesh);
  grassMeshes.push(mesh);
  return mesh;
}

// Blade geometry is rebuilt from scratch for every zone, so the buffers the old
// zone uploaded have to be released rather than left sitting on the GPU.
function disposeGrassMeshes() {
  for (const mesh of grassMeshes) mesh.geometry.dispose();
  grassMeshes = [];
  bladeBatch = null;
}

// Blades are laid down in clumps rather than uniformly: real turf grows in
// tussocks, and clumping also lets each clump carry its own tint.
function createGrassPatch(options = {}) {
  const {
    seed = 1,
    count = 400,
    minX = -1, maxX = 1, minZ = -1, maxZ = 1,
    accept = null,
    palette = 'field',
    clumpRadius = 0.6,
    bladesPerClump = 7,
    lean = 0.3,
    heightScale = 1
  } = options;
  const preset = GRASS_PALETTES[palette] || GRASS_PALETTES.field;
  const random = makeFieldRandom(seed);
  const paletteBase = new THREE.Color(preset.base);
  const paletteTip = new THREE.Color(preset.tip);
  const [minHeight, maxHeight] = preset.height;
  const clumps = Math.max(1, Math.ceil(count / bladesPerClump));
  let placed = 0;
  for (let clump = 0; clump < clumps; clump += 1) {
    let centerX = 0;
    let centerZ = 0;
    let found = false;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      centerX = minX + random() * (maxX - minX);
      centerZ = minZ + random() * (maxZ - minZ);
      if (!accept || accept(centerX, centerZ)) {
        found = true;
        break;
      }
    }
    if (!found) continue;
    const tint = random() * 0.18 - 0.09;
    const clumpBase = paletteBase.clone().offsetHSL(tint * 0.14, tint * 0.1, tint * 0.8);
    const clumpTip = paletteTip.clone().offsetHSL(tint * 0.1, tint * 0.08, tint * 0.6);
    const blades = Math.max(2, bladesPerClump + Math.floor(random() * 5) - 2);
    for (let index = 0; index < blades; index += 1) {
      const spread = Math.sqrt(random()) * clumpRadius;
      const around = random() * Math.PI * 2;
      const bladeX = centerX + Math.cos(around) * spread;
      const bladeZ = centerZ + Math.sin(around) * spread;
      if (accept && !accept(bladeX, bladeZ)) continue;
      addGrassBlade(bladeX, bladeZ, {
        height: (minHeight + random() * (maxHeight - minHeight)) * heightScale,
        width: 0.019 + random() * 0.017,
        angle: random() * Math.PI * 2,
        lean: lean * (0.45 + random() * 1.1),
        baseColor: clumpBase,
        tipColor: clumpTip,
        stiffness: 0.65 + random() * 0.7,
        phase: random() * Math.PI * 2
      });
      placed += 1;
    }
  }
  return placed;
}

// --- Unlootable field flora ----------------------------------------------------
// Nothing below registers an interactable or a LOOT marker. These are scenery:
// they fill the wooded floor out so a forest reads as a forest rather than as a
// stand of evenly spaced trunks.

function createDownedLog(x, z, options = {}) {
  const { length = 3.4, radius = 0.32, angle = 0, color = 0x6b5238, seed = 1 } = options;
  const random = makeFieldRandom(seed);
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.rotation.set(0, angle, 0);
  const bark = new THREE.Color(color);
  cylinder(group, radius, radius * 1.06, length, color, [0, radius * 0.94, 0], {
    segments: 9,
    rotation: [0, 0, Math.PI / 2]
  });
  // Pale heartwood on the broken ends.
  const heartwood = bark.clone().offsetHSL(0.01, -0.12, 0.24).getHex();
  for (const end of [-1, 1]) {
    cylinder(group, radius * 0.95, radius * 0.95, 0.06, heartwood, [end * length * 0.5, radius * 0.94, 0], {
      segments: 9,
      rotation: [0, 0, Math.PI / 2]
    });
  }
  // Bark ridges along the top, moss cushions on the weather side, shelf fungi.
  const ridge = bark.clone().offsetHSL(0, 0, -0.06).getHex();
  for (let index = 0; index < 5; index += 1) {
    box(group, [length * 0.13, 0.05, radius * 0.5], ridge,
      [(index / 4 - 0.5) * length * 0.84, radius * 1.7, (random() - 0.5) * radius * 0.7],
      { rotation: [0, random() * 0.5, 0] });
  }
  for (let index = 0; index < 3; index += 1) {
    sphere(group, radius * (0.4 + random() * 0.3), 0x5d7f45,
      [(random() - 0.5) * length * 0.8, radius * 1.6, (random() - 0.5) * radius * 0.9],
      { scale: [1.5, 0.34, 1.15], widthSegments: 8, heightSegments: 5 });
  }
  for (let index = 0; index < 2; index += 1) {
    cylinder(group, radius * 0.46, radius * 0.2, 0.06, 0xc7ab7c,
      [(random() - 0.5) * length * 0.7, radius * 1.05, radius * 0.84],
      { segments: 8, rotation: [Math.PI / 2.3, 0, 0], scale: [1, 1, 0.55] });
  }
  // A stub branch, so the log does not read as a plain pipe.
  cylinder(group, 0.07, 0.1, radius * 3.4, ridge, [length * 0.22, radius * 1.5, radius * 0.7], {
    segments: 6,
    rotation: [0.9, 0.4, 0.5]
  });
  world.add(group);
  addCollider(x, z, Math.max(radius, 0.42), {
    type: 'rect',
    halfWidth: Math.abs(Math.cos(angle)) * length * 0.5 + radius * 0.55,
    halfDepth: Math.abs(Math.sin(angle)) * length * 0.5 + radius * 0.55,
    zone: currentZone
  });
  return group;
}

function createTreeStump(x, z, options = {}) {
  const { radius = 0.44, height = 0.62, color = 0x6a4f36, seed = 1, broken = false } = options;
  const random = makeFieldRandom(seed);
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.rotation.y = random() * Math.PI;
  const bark = new THREE.Color(color);
  cylinder(group, radius * 0.92, radius * 1.12, height, color, [0, height * 0.5, 0], { segments: 9 });
  const heartwood = bark.clone().offsetHSL(0.015, -0.16, 0.26).getHex();
  if (broken) {
    // A snapped stump: a torn crown of heartwood rather than a clean saw cut.
    for (let index = 0; index < 4; index += 1) {
      const spike = (index / 4) * Math.PI * 2 + random() * 0.5;
      cone(group, radius * 0.3, height * (0.5 + random() * 0.6), heartwood,
        [Math.cos(spike) * radius * 0.4, height + height * 0.28, Math.sin(spike) * radius * 0.4], { segments: 5 });
    }
  } else {
    cylinder(group, radius * 0.88, radius * 0.88, 0.05, heartwood, [0, height + 0.02, 0], { segments: 10 });
    for (let ring = 1; ring <= 2; ring += 1) {
      torus(group, radius * 0.26 * ring, 0.012, bark.clone().offsetHSL(0, -0.05, 0.08).getHex(),
        [0, height + 0.05, 0], [Math.PI / 2, 0, 0], 6, 16);
    }
  }
  // Root flares spreading into the ground.
  const rootColor = bark.clone().offsetHSL(0, 0, -0.05).getHex();
  for (let index = 0; index < 5; index += 1) {
    const flare = (index / 5) * Math.PI * 2 + random() * 0.4;
    cone(group, radius * 0.28, radius * 1.5, rootColor,
      [Math.cos(flare) * radius * 0.72, radius * 0.26, Math.sin(flare) * radius * 0.72],
      { segments: 5, rotation: [Math.PI / 2 - 0.35, -flare, 0] });
  }
  for (let index = 0; index < 2; index += 1) {
    sphere(group, radius * 0.34, 0x597c43,
      [(random() - 0.5) * radius, height * (0.5 + random() * 0.4), (random() - 0.5) * radius],
      { scale: [1.2, 0.42, 1.1], widthSegments: 7, heightSegments: 5 });
  }
  world.add(group);
  addCollider(x, z, radius * 1.15, { zone: currentZone });
  return group;
}

function createShrub(x, z, options = {}) {
  const { scale = 1, color = 0x406f3f, seed = 1 } = options;
  const random = makeFieldRandom(seed);
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.rotation.y = random() * Math.PI * 2;
  const leaf = new THREE.Color(color);
  // Woody stems first, so the leaf masses read as sitting on something.
  for (let index = 0; index < 3; index += 1) {
    const stem = (index / 3) * Math.PI * 2 + random();
    cylinder(group, 0.022 * scale, 0.04 * scale, 0.42 * scale, 0x5c4630,
      [Math.cos(stem) * 0.08 * scale, 0.21 * scale, Math.sin(stem) * 0.08 * scale],
      { segments: 5, rotation: [Math.cos(stem) * 0.24, 0, -Math.sin(stem) * 0.24] });
  }
  const masses = 4 + Math.floor(random() * 3);
  for (let index = 0; index < masses; index += 1) {
    const around = (index / masses) * Math.PI * 2 + random() * 0.7;
    const spread = (0.16 + random() * 0.26) * scale;
    addMesh(group, new THREE.IcosahedronGeometry((0.3 + random() * 0.17) * scale, 0),
      mat(leaf.clone().offsetHSL(random() * 0.03 - 0.015, 0, random() * 0.1 - 0.04).getHex()),
      [Math.cos(around) * spread, (0.42 + random() * 0.38) * scale, Math.sin(around) * spread],
      [random() * 0.6, random() * 2, random() * 0.5],
      [1.15, 0.82, 1.1]);
  }
  world.add(group);
  addCollider(x, z, 0.46 * scale, { zone: currentZone });
  return group;
}

// Fronds are wide, heavily arched blades sharing the grass batch, so a fern
// costs a handful of triangles and no extra draw call.
function createFernPlant(x, z, options = {}) {
  const { scale = 1, seed = 1, color = 0x2e5a30, tip = 0x76a24d } = options;
  const random = makeFieldRandom(seed);
  const base = new THREE.Color(color);
  const crown = new THREE.Color(tip);
  const fronds = 7 + Math.floor(random() * 6);
  for (let index = 0; index < fronds; index += 1) {
    const around = (index / fronds) * Math.PI * 2 + random() * 0.5;
    addGrassBlade(x + Math.cos(around) * 0.05 * scale, z + Math.sin(around) * 0.05 * scale, {
      height: (0.42 + random() * 0.34) * scale,
      width: 0.09 + random() * 0.05,
      angle: around + Math.PI / 2,
      lean: 0.85 + random() * 0.5,
      baseColor: base,
      tipColor: crown,
      stiffness: 0.5 + random() * 0.3,
      phase: random() * Math.PI * 2,
      arch: 0.34
    });
  }
  // A few short inner fronds keep the centre of the crown from looking hollow.
  for (let index = 0; index < 4; index += 1) {
    addGrassBlade(x, z, {
      height: (0.2 + random() * 0.16) * scale,
      width: 0.055,
      angle: random() * Math.PI * 2,
      lean: 0.3,
      baseColor: base,
      tipColor: crown,
      stiffness: 0.4,
      phase: random() * Math.PI * 2,
      arch: 0.12
    });
  }
}

function createBroadleafPlant(x, z, options = {}) {
  const { scale = 1, seed = 1, color = 0x3a6d34, tip = 0x89b558 } = options;
  const random = makeFieldRandom(seed);
  const base = new THREE.Color(color);
  const crown = new THREE.Color(tip);
  const leaves = 5 + Math.floor(random() * 4);
  for (let index = 0; index < leaves; index += 1) {
    const around = (index / leaves) * Math.PI * 2 + random() * 0.6;
    addGrassBlade(x + Math.cos(around) * 0.04 * scale, z + Math.sin(around) * 0.04 * scale, {
      height: (0.3 + random() * 0.2) * scale,
      width: 0.15 + random() * 0.07,
      angle: around + Math.PI / 2,
      lean: 1.05 + random() * 0.45,
      baseColor: base,
      tipColor: crown,
      stiffness: 0.35 + random() * 0.25,
      phase: random() * Math.PI * 2,
      arch: 0.42
    });
  }
}

function createReedClump(x, z, options = {}) {
  const { scale = 1, seed = 1, cattails = true } = options;
  const random = makeFieldRandom(seed);
  const base = new THREE.Color(0x466b34);
  const tip = new THREE.Color(0xbcc06a);
  const stalks = 7 + Math.floor(random() * 7);
  for (let index = 0; index < stalks; index += 1) {
    const around = random() * Math.PI * 2;
    const spread = Math.sqrt(random()) * 0.42 * scale;
    addGrassBlade(x + Math.cos(around) * spread, z + Math.sin(around) * spread, {
      height: (1.05 + random() * 0.85) * scale,
      width: 0.026 + random() * 0.016,
      angle: random() * Math.PI * 2,
      lean: 0.16 + random() * 0.3,
      baseColor: base,
      tipColor: tip,
      stiffness: 0.55 + random() * 0.4,
      phase: random() * Math.PI * 2,
      arch: 0.1
    });
  }
  if (!cattails) return;
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  for (let index = 0; index < 2 + Math.floor(random() * 2); index += 1) {
    const around = random() * Math.PI * 2;
    const spread = random() * 0.3 * scale;
    const stemHeight = (1.25 + random() * 0.5) * scale;
    const stemX = Math.cos(around) * spread;
    const stemZ = Math.sin(around) * spread;
    cylinder(group, 0.016, 0.022, stemHeight, 0x5c7c3c, [stemX, stemHeight * 0.5, stemZ], { segments: 5 });
    cylinder(group, 0.05, 0.05, 0.3 * scale, 0x6a4a30, [stemX, stemHeight + 0.13 * scale, stemZ], { segments: 7 });
    sphere(group, 0.05, 0x6a4a30, [stemX, stemHeight + 0.29 * scale, stemZ], { widthSegments: 7, heightSegments: 5 });
  }
  world.add(group);
}

function createSapling(x, z, options = {}) {
  const { scale = 1, seed = 1, foliage = 0x466f42 } = options;
  const random = makeFieldRandom(seed);
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.rotation.y = random() * Math.PI * 2;
  const height = (1.3 + random() * 0.9) * scale;
  cylinder(group, 0.035 * scale, 0.06 * scale, height, 0x6b5039, [0, height * 0.5, 0], {
    segments: 6,
    rotation: [0.03, 0, (random() - 0.5) * 0.1]
  });
  const leaf = new THREE.Color(foliage);
  for (let index = 0; index < 4; index += 1) {
    const around = (index / 4) * Math.PI * 2 + random() * 0.6;
    sphere(group, 0.26 * scale, leaf.clone().offsetHSL(0, 0, index * 0.03).getHex(),
      [Math.cos(around) * 0.2 * scale, height * (0.55 + index * 0.12), Math.sin(around) * 0.2 * scale],
      { scale: [1.25, 0.6, 1.15], widthSegments: 8, heightSegments: 5 });
  }
  sphere(group, 0.22 * scale, leaf.clone().offsetHSL(0, 0, 0.1).getHex(), [0, height + 0.1 * scale, 0],
    { scale: [1.1, 0.75, 1.1], widthSegments: 8, heightSegments: 5 });
  world.add(group);
  addCollider(x, z, 0.24 * scale, { zone: currentZone });
  return group;
}

function createBrushPile(x, z, options = {}) {
  const { scale = 1, seed = 1 } = options;
  const random = makeFieldRandom(seed);
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  for (let index = 0; index < 5 + Math.floor(random() * 4); index += 1) {
    cylinder(group, 0.028 * scale, 0.045 * scale, (0.7 + random() * 1.1) * scale, index % 2 ? 0x6f5539 : 0x866546,
      [(random() - 0.5) * 0.5 * scale, (0.05 + random() * 0.18) * scale, (random() - 0.5) * 0.5 * scale],
      { segments: 5, rotation: [Math.PI / 2 - random() * 0.4, random() * Math.PI * 2, random() * 0.5] });
  }
  for (let index = 0; index < 3; index += 1) {
    sphere(group, 0.16 * scale, 0x4f7040,
      [(random() - 0.5) * 0.6 * scale, 0.12 * scale, (random() - 0.5) * 0.6 * scale],
      { scale: [1.3, 0.5, 1.2], widthSegments: 7, heightSegments: 5 });
  }
  world.add(group);
  return group;
}

// Purely decorative blooms. The lootable wild flowers are createWildFlowerNode;
// these carry no marker and no interactable, so nothing here is pickable.
function createFieldBlooms(x, z, options = {}) {
  const { scale = 1, seed = 1, color = 0xe4e8b0 } = options;
  const random = makeFieldRandom(seed);
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  const bloom = new THREE.Color(color);
  for (let index = 0; index < 5 + Math.floor(random() * 5); index += 1) {
    const around = random() * Math.PI * 2;
    const spread = Math.sqrt(random()) * 0.36 * scale;
    const stemHeight = (0.22 + random() * 0.24) * scale;
    const stemX = Math.cos(around) * spread;
    const stemZ = Math.sin(around) * spread;
    cylinder(group, 0.008, 0.012, stemHeight, 0x4f7a3d, [stemX, stemHeight * 0.5, stemZ], {
      segments: 4,
      rotation: [(random() - 0.5) * 0.24, 0, (random() - 0.5) * 0.24]
    });
    sphere(group, 0.045 * scale, bloom.clone().offsetHSL(random() * 0.05 - 0.025, 0, random() * 0.1 - 0.05).getHex(),
      [stemX, stemHeight + 0.03 * scale, stemZ], { scale: [1, 0.6, 1], widthSegments: 6, heightSegments: 4 });
  }
  world.add(group);
  return group;
}

// --- Flora scattering ----------------------------------------------------------

const FLORA_KINDS = ['log', 'stump', 'broken-stump', 'shrub', 'fern', 'broadleaf', 'sapling', 'brush', 'blooms'];

function placeFlora(kind, x, z, random) {
  const seed = Math.floor(random() * 100000) + 1;
  switch (kind) {
    case 'log':
      createDownedLog(x, z, {
        length: 2.6 + random() * 2.6,
        radius: 0.24 + random() * 0.18,
        angle: random() * Math.PI,
        color: random() > 0.5 ? 0x6b5238 : 0x5b4a35,
        seed
      });
      return;
    case 'stump':
      createTreeStump(x, z, { radius: 0.36 + random() * 0.2, height: 0.42 + random() * 0.36, seed });
      return;
    case 'broken-stump':
      createTreeStump(x, z, { radius: 0.34 + random() * 0.22, height: 0.7 + random() * 0.5, seed, broken: true });
      return;
    case 'shrub':
      createShrub(x, z, { scale: 0.8 + random() * 0.7, color: random() > 0.5 ? 0x406f3f : 0x4c7a45, seed });
      return;
    case 'fern':
      createFernPlant(x, z, { scale: 0.85 + random() * 0.6, seed });
      return;
    case 'broadleaf':
      createBroadleafPlant(x, z, { scale: 0.85 + random() * 0.7, seed });
      return;
    case 'sapling':
      createSapling(x, z, { scale: 0.8 + random() * 0.7, seed });
      return;
    case 'brush':
      createBrushPile(x, z, { scale: 0.8 + random() * 0.6, seed });
      return;
    case 'reeds':
      createReedClump(x, z, { scale: 0.8 + random() * 0.5, seed, cattails: random() > 0.45 });
      return;
    default:
      createFieldBlooms(x, z, {
        scale: 0.85 + random() * 0.6,
        seed,
        color: [0xe4e8b0, 0xdca7c4, 0xc9d2f0, 0xf0d089][Math.floor(random() * 4)]
      });
  }
}

function scatterFlora(options = {}) {
  const {
    seed = 1,
    count = 30,
    minX = -1, maxX = 1, minZ = -1, maxZ = 1,
    accept = null,
    kinds = FLORA_KINDS,
    spacing = 2.1
  } = options;
  const random = makeFieldRandom(seed);
  const taken = makeSpacingGrid(Math.max(1, spacing));
  let placed = 0;
  for (let attempt = 0; attempt < count * 9 && placed < count; attempt += 1) {
    const x = minX + random() * (maxX - minX);
    const z = minZ + random() * (maxZ - minZ);
    if (accept && !accept(x, z)) continue;
    if (taken.occupied(x, z, spacing)) continue;
    placeFlora(kinds[Math.floor(random() * kinds.length)], x, z, random);
    taken.add(x, z);
    placed += 1;
  }
  return placed;
}

// Grass and flora are laid down after the built world, so this rejects anything
// that would grow through a wall, a trunk, a fence post or a shop display.
//
// A zone can carry well over a thousand colliders and a dressing pass asks this
// question a hundred thousand times, so during the pass the colliders are
// bucketed into a coarse grid and only the bucket under the sample is tested.
// Each collider is registered into every cell it reaches plus FLORA_MAX_PADDING
// of slack, which is why a single cell lookup is enough.
const FLORA_CELL_SIZE = 4;
const FLORA_MAX_PADDING = 2;
let colliderGrid = null;

function floraCellKey(cellX, cellZ) {
  return (cellX + 1024) * 4096 + (cellZ + 1024);
}

function indexColliderForFlora(collider) {
  if (!colliderGrid) return;
  if (collider.enabled === false || (collider.zone && collider.zone !== currentZone)) return;
  const halfWidth = (collider.type === 'rect' ? collider.halfWidth : collider.radius) + FLORA_MAX_PADDING;
  const halfDepth = (collider.type === 'rect' ? collider.halfDepth : collider.radius) + FLORA_MAX_PADDING;
  const fromX = Math.floor((collider.x - halfWidth) / FLORA_CELL_SIZE);
  const toX = Math.floor((collider.x + halfWidth) / FLORA_CELL_SIZE);
  const fromZ = Math.floor((collider.z - halfDepth) / FLORA_CELL_SIZE);
  const toZ = Math.floor((collider.z + halfDepth) / FLORA_CELL_SIZE);
  for (let cellX = fromX; cellX <= toX; cellX += 1) {
    for (let cellZ = fromZ; cellZ <= toZ; cellZ += 1) {
      const key = floraCellKey(cellX, cellZ);
      const bucket = colliderGrid.get(key);
      if (bucket) bucket.push(collider);
      else colliderGrid.set(key, [collider]);
    }
  }
}

function beginFloraColliderGrid() {
  colliderGrid = new Map();
  for (const collider of colliders) indexColliderForFlora(collider);
}

function endFloraColliderGrid() {
  colliderGrid = null;
}

function isBlockedByCollider(x, z, padding = 0.35) {
  const reach = Math.min(padding, FLORA_MAX_PADDING);
  const candidates = colliderGrid
    ? colliderGrid.get(floraCellKey(Math.floor(x / FLORA_CELL_SIZE), Math.floor(z / FLORA_CELL_SIZE)))
    : colliders;
  if (!candidates) return false;
  for (const collider of candidates) {
    if (collider.enabled === false || (collider.zone && collider.zone !== currentZone)) continue;
    if (collider.type === 'rect') {
      if (Math.abs(x - collider.x) < collider.halfWidth + reach && Math.abs(z - collider.z) < collider.halfDepth + reach) return true;
      continue;
    }
    if (Math.hypot(x - collider.x, z - collider.z) < collider.radius + reach) return true;
  }
  return false;
}

// --- Per-zone ground cover -----------------------------------------------------
// Everything above is generic; this is where each zone gets its turf and its
// understory. It runs last in a zone build, after every collider is registered,
// so nothing is planted through a wall, a trunk, a fence post or a display.

function isOpenGroundPosition(zoneKey, x, z, padding = 0.35) {
  const bounds = ZONES[zoneKey].bounds;
  const outer = ZONES[zoneKey].visualBounds || bounds;
  if (x < bounds.minX + 1.2 || x > bounds.maxX - 1.2) return false;
  if (z < bounds.minZ + 1.2 || z > outer.maxZ - 1.6) return false;
  if (isParkingLotPosition(x, z, 0.7)) return false;
  if (zoneKey === 'store') {
    if (Math.abs(x) < 4.4 && z > -9.2 && z < 5.4) return false;
    if (Math.abs(x) < 10.2 && z < -0.2) return false;
  } else if (zoneKey === 'zoo') {
    if (Math.abs(x) < 3.8 && z > -16.4 && z < 11.5) return false;
    if (Math.abs(z + 3.6) < 2.8 && (Math.abs(x + 9) < 2.1 || Math.abs(x - 9) < 2.1)) return false;
    if (Math.hypot(x - PRACTICE_POND.centerX, z - PRACTICE_POND.centerZ) < PRACTICE_POND.waterRadius + 0.9) return false;
  } else if (zoneKey === 'forest') {
    if (!isGrassNaturePosition('forest', x, z)) return false;
  } else if (zoneKey === 'lake') {
    if (!isJenkinsLakeClearPosition(x, z, true)) return false;
  }
  return !isBlockedByCollider(x, z, padding);
}

function isLakeShorePosition(x, z) {
  const water = JENKINS_LAKE_WATER;
  const spread = ((x - water.centerX) / water.radiusX) ** 2 + ((z - water.centerZ) / water.radiusZ) ** 2;
  if (spread < 1.0 || spread > 1.14) return false;
  const onDock = JENKINS_LAKE_DOCKS.some((dock) => Math.abs(x - dock.x) < dock.width * 0.9);
  return !onDock && !isBlockedByCollider(x, z, 0.4);
}

function dressZoneFlora(zoneKey) {
  beginFloraColliderGrid();
  const grassAccept = (x, z) => isOpenGroundPosition(zoneKey, x, z, 0.12);
  const floraAccept = (x, z) => isOpenGroundPosition(zoneKey, x, z, 0.95);
  const bounds = ZONES[zoneKey].bounds;
  const outer = ZONES[zoneKey].visualBounds || bounds;

  if (zoneKey === 'lake') {
    dressJenkinsLakeFlora(grassAccept, floraAccept);
    flushGrassBlades();
    endFloraColliderGrid();
    return;
  }

  createGrassPatch({
    seed: 4101, count: zoneKey === 'zoo' ? 20000 : 17000, palette: zoneKey === 'zoo' ? 'lawn' : 'field',
    minX: bounds.minX, maxX: bounds.maxX, minZ: bounds.minZ, maxZ: outer.maxZ,
    accept: grassAccept, bladesPerClump: 6, clumpRadius: 0.28
  });
  // A rougher, longer second pass keeps the turf from reading as one flat tone.
  createGrassPatch({
    seed: 8807, count: zoneKey === 'zoo' ? 5200 : 6400, palette: zoneKey === 'forest' ? 'forest' : 'meadow',
    minX: bounds.minX, maxX: bounds.maxX, minZ: bounds.minZ, maxZ: outer.maxZ,
    accept: grassAccept, bladesPerClump: 7, clumpRadius: 0.46, lean: 0.42
  });
  // Dry tussocks along the street verge behind the lot.
  createGrassPatch({
    seed: 3312, count: 5200, palette: 'dry',
    minX: PARKING_LOT.streetMinX + 4, maxX: PARKING_LOT.streetMaxX - 4,
    minZ: PARKING_LOT.wallZ + 0.4, maxZ: outer.maxZ,
    accept: (x, z) => !isParkingLotPosition(x, z, 0.5) && !isBlockedByCollider(x, z, 0.2),
    bladesPerClump: 6, clumpRadius: 0.38
  });

  const floraCounts = { store: 24, forest: 40, zoo: 30 };
  scatterFlora({
    seed: 5501, count: floraCounts[zoneKey] || 24,
    minX: bounds.minX, maxX: bounds.maxX, minZ: bounds.minZ, maxZ: outer.maxZ,
    accept: floraAccept, spacing: 2.4
  });
  flushGrassBlades();
  endFloraColliderGrid();
}

// Jenkins Lake carries the bulk of the ground cover: the woods either side of
// the road, the three meadow compounds, the cabin lawns and the lake shore.
function dressJenkinsLakeFlora(grassAccept, floraAccept) {
  const meadowAccept = (x, z) => isLakeGrassCompoundPosition(x, z, 0.6) && !isBlockedByCollider(x, z, 0.12);
  const yardAccept = (x, z) => isJenkinsLakeYardPosition(x, z, 0.6) && !isBlockedByCollider(x, z, 0.3);

  // Woodland floor, road verges first and then the deep forest either side.
  createGrassPatch({
    seed: 1201, count: 52000, palette: 'forest',
    minX: -46, maxX: 46, minZ: -76, maxZ: 30,
    accept: grassAccept, bladesPerClump: 6, clumpRadius: 0.3
  });
  createGrassPatch({
    seed: 1307, count: 18000, palette: 'forest',
    minX: -92, maxX: 92, minZ: -196, maxZ: 30,
    accept: grassAccept, bladesPerClump: 7, clumpRadius: 0.44, lean: 0.36
  });
  createGrassPatch({
    seed: 1409, count: 9000, palette: 'field',
    minX: -22, maxX: 22, minZ: -80, maxZ: 30,
    accept: grassAccept, bladesPerClump: 5, clumpRadius: 0.26
  });

  // The three grass compounds get taller, richer meadow grass.
  JENKINS_LAKE_GRASS_COMPOUNDS.forEach((compound, index) => {
    createGrassPatch({
      seed: 2200 + index * 37,
      count: Math.round(compound.width * compound.depth * 9),
      palette: 'meadow',
      minX: compound.centerX - compound.width / 2,
      maxX: compound.centerX + compound.width / 2,
      minZ: compound.centerZ - compound.depth / 2,
      maxZ: compound.centerZ + compound.depth / 2,
      accept: meadowAccept,
      bladesPerClump: 7,
      clumpRadius: 0.36,
      lean: 0.38
    });
  });

  // Cabin and barn lawns are kept short.
  JENKINS_LAKE_YARDS.forEach((yard, index) => {
    createGrassPatch({
      seed: 3100 + index * 53,
      count: Math.round(yard.width * yard.depth * 9),
      palette: 'lawn',
      minX: yard.centerX - yard.width / 2,
      maxX: yard.centerX + yard.width / 2,
      minZ: yard.centerZ - yard.depth / 2,
      maxZ: yard.centerZ + yard.depth / 2,
      accept: yardAccept,
      bladesPerClump: 6,
      clumpRadius: 0.3
    });
  });

  // Shore grass and reed beds ringing the water.
  const water = JENKINS_LAKE_WATER;
  const shoreRandom = makeFieldRandom(4404);
  for (let index = 0; index < 260; index += 1) {
    const angle = shoreRandom() * Math.PI * 2;
    const spread = 1.005 + shoreRandom() * 0.11;
    const x = water.centerX + Math.cos(angle) * water.radiusX * spread;
    const z = water.centerZ + Math.sin(angle) * water.radiusZ * spread;
    if (!isLakeShorePosition(x, z)) continue;
    if (index % 3 === 0) {
      createReedClump(x, z, { scale: 0.75 + shoreRandom() * 0.6, seed: 700 + index, cattails: shoreRandom() > 0.5 });
      continue;
    }
    createGrassPatch({
      seed: 5000 + index, count: 60, palette: 'shore',
      minX: x - 1.3, maxX: x + 1.3, minZ: z - 1.3, maxZ: z + 1.3,
      accept: isLakeShorePosition, bladesPerClump: 7, clumpRadius: 0.4
    });
  }

  // Understory: logs, stumps, ferns and brush through the woods, then lighter
  // flowering cover out in the open meadows.
  scatterFlora({
    seed: 6601, count: 120,
    minX: -88, maxX: 88, minZ: -192, maxZ: 28,
    accept: floraAccept, spacing: 3.4
  });
  scatterFlora({
    seed: 6707, count: 46,
    minX: -40, maxX: 40, minZ: -74, maxZ: 26,
    accept: floraAccept, spacing: 2.6,
    kinds: ['log', 'stump', 'broken-stump', 'fern', 'shrub', 'brush', 'broadleaf']
  });
  scatterFlora({
    seed: 6809, count: 54,
    minX: -50, maxX: 52, minZ: -120, maxZ: -78,
    accept: (x, z) => isLakeGrassCompoundPosition(x, z, 1.4) && !isBlockedByCollider(x, z, 1),
    spacing: 3,
    kinds: ['shrub', 'blooms', 'broadleaf', 'fern', 'sapling', 'log', 'stump']
  });
}

function createNatureStick(x, z, index = 0) {
  const stick = new THREE.Group();
  stick.position.set(x, 0.07, z);
  cylinder(stick, 0.045, 0.06, 0.95, 0x77583d, [0, 0, 0], { segments: 6, rotation: [0, 0.18, 0.94 + index * 0.08] });
  cylinder(stick, 0.028, 0.035, 0.42, 0x8b6848, [0.2, 0.08, 0.1], { segments: 5, rotation: [0.1, -0.45, 0.3] });
  const marker = makeLabel('LOOT', '#f2b268', '#3b2e23', 0.22);
  marker.position.set(0, 0.72, 0);
  stick.add(marker);
  world.add(stick);
  const loot = { type: 'nature-loot', label: 'Loot fallen stick', position: new THREE.Vector3(x, 0.35, z), radius: 1.6, group: stick, marker, used: false };
  natureLoot.push(loot);
  interactables.push(loot);
  addCollider(x, z, 0.16, { zone: currentZone });
  return loot;
}

function createNatureScatter(zoneKey) {
  const layouts = {
    forest: {
      foliage: [[-4, -4], [3, -4.8], [-6, -10], [5, -6], [-15, -9], [15, -10], [-18, -20], [18, -22], [-8, -26], [8, -27], [-19, 5], [19, 6], [-20, -6], [20, -6], [-20, -14], [20, -14], [-18, -27], [18, -27], [-12, 7], [12, 7], [-5, -28], [5, -28], [-24, -35], [24, -36], [-26, -4], [26, -5], [-24, 12], [24, 13], [-14, -36], [14, -36], [-5, -37], [5, -38]],
      rocks: [[-4.5, -4.2, 0.35], [4.8, -5.4, 0.28], [-17.5, -8, 0.42], [16.5, -9, 0.32], [-8.2, -26.4, 0.26], [8.4, -27.2, 0.3], [-20, -14, 0.24], [20, -14, 0.27], [-25, -29, 0.3], [25, -27, 0.34], [-24, 11, 0.24], [24, 12, 0.27]],
      sticks: [[-2.8, -3.6], [4.3, -8.1], [-14.8, -11.1], [13.9, -18.3], [-7.6, -23.8], [10.8, -25.4], [18.6, 1.2], [-19, -6.5], [19, -15.5], [-11.5, 7.2], [-26, -20], [26, -22], [-18, -35], [18, -36], [-3, -38], [4, -39]]
    },
    zoo: {
      foliage: [[-12.1, -12.7], [-10.2, -12.1], [-7.2, -12.5], [-12.4, -9.3], [-10.1, -7.9], [-6.8, -8.4], [6.5, -12.6], [8.5, -12.0], [11.4, -12.5], [6.3, -9.3], [9.4, -7.8], [11.8, -9.5]],
      rocks: [[-12.2, -11.8, 0.26], [-7.1, -11.6, 0.22], [-11.8, -8.1, 0.25], [6.6, -11.8, 0.24], [11.4, -11.5, 0.22], [11.1, -8.1, 0.24]],
      sticks: [[-11.5, -10.8], [-8.2, -12.8], [-6.8, -8.9], [6.9, -10.5], [10.5, -12.9], [11.6, -8.7]]
    }
  }[zoneKey];
  if (!layouts) return;
  layouts.foliage.forEach(([x, z], index) => {
    if (isGrassNaturePosition(zoneKey, x, z)) createGroundFoliage(x, z, 0.7 + (index % 3) * 0.18, index % 2 ? 0x4d8055 : 0x5b8d5b);
  });
  layouts.rocks.forEach(([x, z, scale], index) => {
    if (isGrassNaturePosition(zoneKey, x, z)) createNatureRock(x, z, scale, index);
  });
  layouts.sticks.forEach(([x, z], index) => {
    if (isGrassNaturePosition(zoneKey, x, z)) createNatureStick(x, z, index);
  });
}

function isGrassNaturePosition(zoneKey, x, z) {
  if (zoneKey === 'forest') {
    const inWater = Math.hypot(x - FOREST_WATER.centerX, z - FOREST_WATER.centerZ) < FOREST_WATER.waterRadius + 1.1;
    const onDock = Math.abs(x) < FOREST_DOCK.halfWidth + 0.45 && z > FOREST_DOCK.endZ - 0.6 && z < FOREST_DOCK.shoreZ + 0.8;
    const onParkingHub = isParkingLotPosition(x, z, 1);
    const onMainPath = Math.abs(x) < 3.2 && z > -14 && z < 4;
    return !inWater && !onDock && !onParkingHub && !onMainPath;
  }
  if (zoneKey === 'zoo') {
    const inMeadow = Math.abs(x + 9) <= 3.65 && Math.abs(z + 10) <= 3.65;
    const inPollinator = Math.abs(x - 9) <= 3.65 && Math.abs(z + 10) <= 3.65;
    return inMeadow || inPollinator;
  }
  if (zoneKey === 'lake') return isJenkinsLakeClearPosition(x, z, true);
  return false;
}

function lootNatureStick(loot) {
  if (!loot || loot.used) return;
  loot.used = true;
  loot.group.visible = false;
  loot.marker.visible = false;
  save.coins += 2;
  save.materials.sticks = (save.materials.sticks || 0) + 1;
  saveGame();
  updateHUD();
  toast(`Fallen stick looted. +1 stick · +2¢ (${save.materials.sticks} sticks)`, 'success');
  setStatus('Brax builds with sticks and stones. Bring him what you gather.');
}

// Loose field stones, gathered the same way as sticks. The bigger scenery rocks
// stay put; only the small scatter is worth carrying.
function createNatureRock(x, z, scale, index = 0) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  const rock = addMesh(group, new THREE.DodecahedronGeometry(scale, 0), mat(index % 2 ? 0x718474 : 0x667b6e, { roughness: 0.96 }), [0, scale * 0.62, 0], [0.12, index * 0.4, 0.08], [1.3, 0.78, 1.05]);
  rock.castShadow = true;
  addMesh(group, new THREE.DodecahedronGeometry(scale * 0.5, 0), mat(index % 2 ? 0x66796c : 0x5d7165, { roughness: 0.98 }), [scale * 0.9, scale * 0.34, scale * 0.25], [0.3, index, 0.2]);
  const marker = makeLabel('LOOT', '#f2b268', '#3b2e23', 0.22);
  marker.position.set(0, scale * 1.5 + 0.35, 0);
  group.add(marker);
  world.add(group);
  const loot = { type: 'nature-rock', label: 'Gather field stone', position: new THREE.Vector3(x, 0.35, z), radius: 1.6, group, marker, used: false };
  natureLoot.push(loot);
  interactables.push(loot);
  addCollider(x, z, scale * 0.9, { zone: currentZone });
  return loot;
}

function lootNatureRock(loot) {
  if (!loot || loot.used) return;
  loot.used = true;
  loot.group.visible = false;
  loot.marker.visible = false;
  save.coins += 3;
  save.materials.stones = (save.materials.stones || 0) + 1;
  saveGame();
  updateHUD();
  toast(`Field stone gathered. +1 stone · +3¢ (${save.materials.stones} stones)`, 'success');
  setStatus('Brax builds with sticks and stones. Bring him what you gather.');
}

function steerCritterFromEdge(critter, delta) {
  const bounds = ZONES[currentZone].bounds;
  const margin = 2.2;
  let steerX = 0;
  let steerZ = 0;
  if (critter.group.position.x < bounds.minX + margin) steerX += 1;
  if (critter.group.position.x > bounds.maxX - margin) steerX -= 1;
  if (critter.group.position.z < bounds.minZ + margin) steerZ += 1;
  if (critter.group.position.z > bounds.maxZ - margin) steerZ -= 1;
  if (!steerX && !steerZ) return;
  const desired = Math.atan2(steerX, steerZ);
  let turn = desired - critter.direction;
  while (turn > Math.PI) turn -= Math.PI * 2;
  while (turn < -Math.PI) turn += Math.PI * 2;
  critter.direction += clamp(turn, -delta * 3.8, delta * 3.8);
}

function getNatureWater(zoneKey = currentZone) {
  if (zoneKey === 'forest') return FOREST_WATER;
  if (zoneKey === 'lake') return JENKINS_LAKE_WATER;
  return null;
}

function isInsideNatureWater(x, z, water = getNatureWater()) {
  if (!water) return false;
  const radiusX = water.radiusX || water.waterRadius;
  const radiusZ = water.radiusZ || water.waterRadius;
  const dx = (x - water.centerX) / radiusX;
  const dz = (z - water.centerZ) / radiusZ;
  return dx * dx + dz * dz < 1;
}

function keepGroundAnimalOnLand(animal, critter) {
  if (!['forest', 'lake'].includes(currentZone)) return;
  const water = getNatureWater();
  const offsetX = animal.position.x - water.centerX;
  const offsetZ = animal.position.z - water.centerZ;
  const radiusX = water.radiusX || water.waterRadius;
  const radiusZ = water.radiusZ || water.waterRadius;
  const distance = (offsetX / radiusX) ** 2 + (offsetZ / radiusZ) ** 2;
  if (distance >= 1) return;
  if (distance < 0.001) {
    animal.position.x = water.centerX;
    animal.position.z = water.centerZ + radiusZ;
    critter.direction = Math.PI;
    critter.home.copy(animal.position);
    return;
  }
  const scale = 1 / Math.sqrt(Math.max(0.001, distance));
  animal.position.x = water.centerX + offsetX * scale;
  animal.position.z = water.centerZ + offsetZ * scale;
  critter.direction = Math.atan2(offsetX, offsetZ);
  critter.home.copy(animal.position);
}

// Pulls an animal off the field without counting it as caught, so it can come
// back the next time its part of the day comes around.
function retireCritter(critter) {
  if (critter.hidden) return;
  world.remove(critter.group);
  critter.hidden = true;
  critter.state = 'idle';
  critter.fleeTime = 0;
  critter.respawnAt = elapsed + 1.5 + Math.random() * 4;
}

function respawnCritter(critter) {
  const bounds = ZONES[currentZone].bounds;
  for (let attempt = 0; attempt < 18; attempt += 1) {
    const x = bounds.minX + 2.5 + Math.random() * (bounds.maxX - bounds.minX - 5);
    const z = bounds.minZ + 2.5 + Math.random() * (bounds.maxZ - bounds.minZ - 5);
    const isFlying = SPECIES[critter.species].type === 'flying' || ['butterfly', 'bee', 'dragonfly'].includes(critter.species);
    const validLand = isGrassNaturePosition(currentZone, x, z);
    const validAir = isFlying && isInsideNatureWater(x, z);
    if (!['forest', 'lake'].includes(currentZone) || (!validLand && !validAir)) continue;
    if (Math.hypot(x - player.x, z - player.z) < 9) continue;
    critter.group.position.set(x, isFlying ? 1.6 + Math.random() * 1.2 : 0.42, z);
    critter.group.rotation.x = 0;
    critter.home.copy(critter.group.position);
    critter.direction = Math.random() * Math.PI * 2;
    critter.targetDirection = critter.direction;
    critter.gait = null;
    critter.state = 'idle';
    critter.stateTime = 0;
    critter.hidden = false;
    critter.respawnAt = 0;
    world.add(critter.group);
    return;
  }
  critter.respawnAt = elapsed + 1;
}

function createDuck(x, z, index = 0) {
  const group = createAnimalModel('duck', 0.72);
  group.position.set(x, 0.22, z);
  world.add(group);
  group.userData.duckWingBases = group.userData.wings.map((wing) => ({ position: wing.position.clone(), rotation: wing.rotation.clone(), scale: wing.scale.clone() }));
  ducks.push({ group, home: new THREE.Vector3(x, 0.22, z), phase: index * 2.4, direction: index ? -0.8 : 1.1, state: 'float', fleeEndsAt: 0, flightStartedAt: 0, respawnAt: 0 });
}

function updateDuckFlightPose(duck) {
  const progress = duck.state === 'flee' ? clamp((elapsed - duck.flightStartedAt) / 0.75, 0, 1) : 0;
  const flap = duck.state === 'flee' ? Math.sin(elapsed * 18 + duck.phase) : 0;
  duck.group.rotation.x = -progress * 0.25;
  duck.group.userData.wings.forEach((wing, index) => {
    const base = duck.group.userData.duckWingBases[index];
    const side = index === 0 ? -1 : 1;
    const spread = 0.5 + progress * 1.25;
    wing.position.x = base.position.x * spread;
    wing.position.y = base.position.y + progress * 0.12;
    wing.rotation.z = base.rotation.z + flap * 0.38 * side;
    wing.rotation.y = flap * 0.28 * side;
    wing.scale.x = base.scale.x * (0.55 + progress * 0.95);
    wing.scale.y = base.scale.y * (0.75 + progress * 0.25);
  });
}

function updateDucks(delta) {
  if (!['forest', 'lake'].includes(currentZone)) return;
  const water = getNatureWater();
  for (const duck of ducks) {
    if (duck.state === 'hidden') {
      if (elapsed >= duck.respawnAt) {
        duck.group.position.copy(duck.home);
        duck.group.position.y = 0.22;
        duck.state = 'float';
        duck.flightStartedAt = 0;
        world.add(duck.group);
      }
      continue;
    }
    const group = duck.group;
    const distance = distanceTo(group.position);
    // Outside their hours the ducks raft up on the water and stop foraging.
    const roosting = !isSpeciesActive('duck');
    if (duck.state === 'float') {
      const holdingFish = !roosting && activeTool === 'food' && (selectedFood === 'trout' || selectedFood === 'sunfish') && distance < 9;
      const attractionRadiusX = (water.radiusX || water.waterRadius) * 0.72;
      const attractionRadiusZ = (water.radiusZ || water.waterRadius) * 0.72;
      const drift = roosting ? 0.05 : 0.22;
      const spread = roosting ? 0.3 : 1;
      const nextX = holdingFish ? clamp(player.x, water.centerX - attractionRadiusX, water.centerX + attractionRadiusX) : duck.home.x + Math.cos(elapsed * drift + duck.phase) * 1.05 * spread;
      const nextZ = holdingFish ? clamp(player.z, water.centerZ - attractionRadiusZ, water.centerZ + attractionRadiusZ) : duck.home.z + Math.sin(elapsed * drift + duck.phase) * 0.78 * spread;
      const dx = nextX - group.position.x;
      const dz = nextZ - group.position.z;
      group.position.x += dx * delta * 1.45;
      group.position.z += dz * delta * 1.45;
      group.position.y = 0.24 + Math.sin(elapsed * 2.5 + duck.phase) * 0.035;
      updateDuckFlightPose(duck);
      duck.direction = Math.atan2(dx, dz);
      if ((distance < 5.8 && currentNoise > 0.28) || distance < 2.1) {
        tempVector.subVectors(group.position, player).setY(0).normalize();
        duck.direction = Math.atan2(tempVector.x, tempVector.z);
        duck.state = 'flee';
        duck.flightStartedAt = elapsed;
        duck.fleeEndsAt = elapsed + 3.2;
        toast('The ducks startled and flew toward the far shore.', 'warning');
      }
    } else {
      group.position.x += Math.sin(duck.direction) * delta * 5.2;
      group.position.z += Math.cos(duck.direction) * delta * 5.2;
      group.position.y += delta * 1.25;
      updateDuckFlightPose(duck);
      const lakeDistance = ((group.position.x - water.centerX) / (water.radiusX || water.waterRadius)) ** 2 + ((group.position.z - water.centerZ) / (water.radiusZ || water.waterRadius)) ** 2;
      if (elapsed >= duck.fleeEndsAt || lakeDistance > 1.35) {
        world.remove(group);
        duck.state = 'hidden';
        duck.respawnAt = elapsed + 6 + Math.random() * 5;
      }
    }
    group.rotation.y = duck.direction + Math.PI;
  }
}

function createBugNode(species, position, color) {
  const group = new THREE.Group();
  group.position.set(...position);
  const plant = new THREE.Group();
  cylinder(plant, 0.08, 0.12, 1.38, 0x5b7448, [0, 0.69, 0], { segments: 6, rotation: [0.08, 0, 0.05] });
  cylinder(plant, 0.045, 0.06, 0.86, 0x6f8b4f, [-0.26, 0.86, 0], { segments: 5, rotation: [0, 0, -0.62] });
  cylinder(plant, 0.045, 0.06, 0.9, 0x6f8b4f, [0.28, 0.98, 0], { segments: 5, rotation: [0, 0, 0.56] });
  cylinder(plant, 0.04, 0.05, 0.72, 0x6f8b4f, [0.04, 1.27, 0], { segments: 5, rotation: [0, 0, -0.42] });
  for (const [x, y, z, sx, sy, rz] of [
    [-0.56, 1.0, 0.02, 1.65, 0.62, -0.35], [0.64, 1.14, 0.02, 1.65, 0.62, 0.35],
    [-0.24, 1.48, 0.02, 1.45, 0.55, -0.5], [0.33, 0.67, 0.02, 1.45, 0.55, 0.42]
  ]) {
    sphere(plant, 0.2, 0x5b8b54, [x, y, z], { scale: [sx, sy, 0.76], rotation: [0, 0, rz] });
  }
  group.add(plant);
  const bugModel = createAnimalModel(species, 0.43);
  bugModel.position.set(0.3, 1.1, 0);
  bugModel.visible = false;
  group.add(bugModel);
  const marker = new THREE.Group();
  const markerRing = addMesh(marker, new THREE.TorusGeometry(0.26, 0.025, 5, 18), mat(color, { emissive: color, emissiveIntensity: 0.6, transparent: true, opacity: 0.46 }), [0.33, 1.1, 0], [-Math.PI / 2, 0, 0]);
  markerRing.rotation.z = 0.3;
  const markerCore = sphere(marker, 0.045, color, [0.33, 1.1, 0], { material: { emissive: color, emissiveIntensity: 0.8 } });
  group.add(marker);
  world.add(group);
  const focusPoint = new THREE.Vector3(position[0] + 0.33, 1.1, position[2]);
  bugNodes.push({ species, group, plant, bugModel, marker, markerCore, position: new THREE.Vector3(...position), focusPoint, aimPosition: focusPoint.clone(), revealed: false, cooldown: 0, color });
}

function buildZoo() {
  setZonePalette('zoo');
  addGround(ZONES.zoo.ground, 150);
  createMountainBoundary('zoo');
  createNatureScatter('zoo');
  createParkingHub('CONSERVATORY', ZONES.zoo.accent);
  createPath(0, -2.5, 6, 25, 0xc0ad78);
  // The viewing spurs stop at the enclosure rail rather than running through it.
  createPath(-9, -3.6, 3.2, 4.6, 0xc0ad78);
  createPath(9, -3.6, 3.2, 4.6, 0xc0ad78);

  // Enclosures are fenced off. Visitors and staff view them from the path; each
  // has a caretaker gate on the path side so you can still get in to work.
  createFence(-9, -10, 8, 8, 0x806e53, true, { offset: 0, width: 1.9 });
  createFence(9, -10, 8, 8, 0x806e53, true, { offset: 0, width: 1.9 });
  createFence(0, -22, 14, 5, 0x66806d, true, { offset: 0, width: 1.9 });
  box(world, [5.3, 0.06, 1.85], 0x4f8054, [0, 0.04, 0.85], { material: { roughness: 1 } });
  const entranceName = makeLabel('JENKINS CONSERVATORY', '#e6f5b7', '#31563d', 0.68);
  entranceName.position.set(0, 1.9, 0.85);
  world.add(entranceName);
  const rabbitLabel = makeLabel('MEADOW', '#d8ef85', '#23352d', 0.64);
  rabbitLabel.position.set(-9, 2.8, -10);
  world.add(rabbitLabel);
  const bugLabel = makeLabel('POLLINATOR', '#f2c84b', '#3c3220', 0.64);
  bugLabel.position.set(9, 2.8, -10);
  world.add(bugLabel);
  const aquariumLabel = makeLabel('WATER WING', '#8be0c3', '#183d3c', 0.68);
  aquariumLabel.position.set(0, 3.1, -22);
  world.add(aquariumLabel);

  createAquarium();
  createPracticePond();
  createPracticeDucks();
  createShowcaseGarden();
  createShowcaseCabin(13.8, 4.2);
  createRearShowcaseGreenSpace();

  const record = new THREE.Group();
  record.position.set(0, 0, -4.2);
  box(record, [2.5, 2.8, 0.24], 0x3f5f4c, [0, 1.4, 0]);
  box(record, [1.9, 1.3, 0.08], 0xd8ef85, [0, 1.55, -0.18]);
  cylinder(record, 0.15, 0.15, 0.38, 0x8fb7a0, [0, 0.2, 0], { segments: 6 });
  world.add(record);
  interactables.push({ type: 'collection', label: 'Open living collection', position: record.position.clone(), radius: 3.2 });

  createBranchTree(-17, -5, 1.2, 0x3d6249);
  createBranchTree(17, -5, 1.2, 0x3d6249);
  addExhibitAnimals(-9, -10, ['rabbit', 'squirrel', 'fox', 'turtle']);
  addExhibitAnimals(9, -10, ['butterfly', 'bee', 'dragonfly', 'owl']);
  createPollinatorGarden();
  addEnclosureInteractable('meadow', 'Clean meadow enclosure', -9, -5.55, 'Clear the meadow habitat so the ground animals have a safe field.');
  addEnclosureInteractable('pollinator', 'Clean pollinator enclosure', 9, -5.55, 'Clear the pollinator habitat so the flying animals can forage.');
  addEnclosureInteractable('water-wing', 'Clean water wing', 0, -18.65, 'Clear the water wing so the aquatic exhibit stays healthy.');
  createBraxYard();
  createFieldCharacter('brynlee', 'Brynlee', 'FIELD NATURALIST', -14.8, -3.8, 0xe889b0, 0xd8ef85);
  createFieldCharacter('brooks', 'Brooks', 'NIGHT GUARD', 14.8, -3.8, 0x476e78, 0xffc86b);
  createFieldCharacter('grayson', 'Grayson', 'SPECIMEN RESEARCH', 0, -5.4, 0x6d587e, 0x89e0c7);
}

function createFieldCharacter(id, name, role, x, z, coatColor, accentColor) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  const naturalist = id === 'brynlee';
  const guard = id === 'brooks';
  const builder = id === 'brax';
  const skin = naturalist ? 0xd69b78 : guard ? 0xb97c5b : builder ? 0x8a5a3a : 0xe0b190;
  const hair = naturalist ? 0xe8c568 : guard ? 0x35332e : builder ? 0x241d18 : 0x4d3c34;
  const leather = 0x614534;
  const dark = 0x293a36;
  const shirt = naturalist ? 0xf1dfb3 : guard ? 0xabc3b9 : builder ? 0xd9c9a4 : 0xf2ead6;
  // Joint-to-joint limbs keep the elbows, cuffs and carried props connected.
  const limb = (parent, from, to, radius, color, endRadius = radius) => {
    const a = new THREE.Vector3(...from);
    const b = new THREE.Vector3(...to);
    const mesh = cylinder(parent, endRadius, radius, a.distanceTo(b), color, a.clone().add(b).multiplyScalar(0.5).toArray());
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.sub(a).normalize());
    return mesh;
  };
  // Each leg hangs off a hip pivot so a patrol route can drive a real walk cycle.
  const legPivots = [];
  for (const side of [-1, 1]) {
    const hip = new THREE.Group();
    hip.position.set(side * 0.12, 0.76, 0);
    group.add(hip);
    const footX = side * 0.015;
    const footZ = side === -1 ? 0.035 : -0.035;
    box(hip, [0.205, 0.115, 0.33], dark, [footX, -0.7025, footZ + 0.055]);
    sphere(hip, 0.13, leather, [footX, -0.615, footZ + 0.07], { scale: [0.8, 0.65, 1.25] });
    cylinder(hip, 0.092, 0.1, 0.24, leather, [footX, -0.525, footZ]);
    cylinder(hip, 0.1, 0.105, 0.05, 0x96704b, [footX, -0.42, footZ]);
    limb(hip, [footX, -0.44, footZ], [0, 0, 0], 0.092, guard ? 0x34474a : 0x666852, 0.112);
    box(hip, [0.115, 0.018, 0.018], 0xc7b18b, [footX, -0.54, footZ + 0.096]);
    legPivots.push({ pivot: hip, side });
  }
  cylinder(group, 0.21, 0.245, 0.25, coatColor, [0, 0.79, 0], { scale: [1, 1, 0.72] });
  cylinder(group, naturalist ? 0.255 : 0.285, naturalist ? 0.185 : 0.22, 0.5, shirt, [0, 1.1, 0], { scale: [1, 1, 0.62] });
  // Open jacket panels, contrasting shirt and folded lapels, all facing +Z.
  for (const side of [-1, 1]) {
    box(group, [naturalist ? 0.125 : 0.15, guard ? 0.47 : 0.58, 0.27], coatColor, [side * (naturalist ? 0.157 : 0.178), guard ? 1.08 : 1.025, 0], { rotation: [0, 0, naturalist ? side * -0.075 : 0] });
    box(group, [0.08, 0.22, 0.035], naturalist ? 0xb9698a : guard ? 0x304e57 : 0xc2adca, [side * 0.097, 1.22, 0.16], { rotation: [0, 0, side * 0.28] });
    box(group, [0.105, 0.095, 0.025], coatColor, [side * 0.19, 0.94, 0.153]);
    box(group, [0.115, 0.022, 0.03], accentColor, [side * 0.19, 0.99, 0.17]);
  }
  cylinder(group, 0.24, 0.24, 0.055, leather, [0, 0.856, 0], { scale: [1, 1, 0.72] });
  box(group, [0.065, 0.06, 0.025], 0xdcbf79, [0, 0.856, 0.18]);
  for (const y of [1.03, 1.12, 1.21]) sphere(group, 0.014, leather, [0, y, 0.176]);
  cylinder(group, 0.085, 0.098, 0.16, skin, [0, 1.385, 0]);
  sphere(group, 0.245, skin, [0, 1.62, 0.012], { widthSegments: 12, heightSegments: 9, scale: [0.86, 1.08, 0.86] });
  sphere(group, 0.16, skin, [0, 1.505, 0.068], { scale: [naturalist ? 0.76 : 0.95, naturalist ? 0.65 : 0.75, 0.86] });
  for (const side of [-1, 1]) {
    sphere(group, 0.054, skin, [side * 0.207, 1.61, 0.004], { scale: [0.65, 1, 0.75] });
    sphere(group, 0.027, 0xb87962, [side * 0.222, 1.61, 0.025], { scale: [0.5, 1, 0.55] });
    sphere(group, 0.039, 0xfff2d9, [side * 0.081, 1.653, 0.193], { scale: [1, 0.7, 0.36] });
    sphere(group, 0.02, dark, [side * 0.077, 1.652, 0.206], { scale: [0.8, 1, 0.45] });
    box(group, [0.075, naturalist ? 0.012 : 0.018, 0.024], naturalist ? 0x967342 : hair, [side * 0.082, 1.712, 0.182], { rotation: [0, 0, side * -0.12] });
    sphere(group, 0.066, hair, [side * 0.176, 1.715, -0.005], { scale: [0.55, 1.4, 1.5] });
  }
  sphere(group, 0.045, skin, [0, 1.598, 0.209], { scale: [0.7, 1, 0.95] });
  box(group, [naturalist ? 0.074 : 0.065, naturalist ? 0.021 : 0.013, 0.016], naturalist ? 0xb96865 : 0x935b4e, [0, 1.523, 0.197]);
  sphere(group, 0.235, hair, [0, 1.752, -0.022], { scale: [0.92, 0.55, 0.94] });
  // Free arms get their own shoulder pivot; a hand that is holding something
  // (Brooks' lantern, Grayson's clipboard) stays welded to the torso instead.
  const armPivots = [];
  const shoulderPivots = {};
  for (const side of [-1, 1]) {
    const shoulder = [side * (naturalist ? 0.245 : 0.275), 1.275, 0];
    const elbow = [side * 0.36, 1.065, 0.055];
    const hand = naturalist ? [side * 0.32, 0.88, 0.16]
      : guard ? [side * 0.39, side === 1 ? 1.07 : 0.89, 0.22]
        : builder ? [side * 0.34, side === 1 ? 0.95 : 0.86, side === 1 ? 0.22 : 0.14]
          : [side * 0.19, 1.075, 0.34];
    const swings = naturalist || ((guard || builder) && side === -1);
    let parent = group;
    if (swings) {
      const pivot = new THREE.Group();
      pivot.position.set(...shoulder);
      group.add(pivot);
      parent = pivot;
      armPivots.push({ pivot, side });
    }
    shoulderPivots[side] = parent;
    const local = (point) => (parent === group ? point : [point[0] - shoulder[0], point[1] - shoulder[1], point[2] - shoulder[2]]);
    const localShoulder = local(shoulder);
    const localElbow = local(elbow);
    const localHand = local(hand);
    sphere(parent, 0.107, coatColor, localShoulder);
    limb(parent, localShoulder, localElbow, 0.102, coatColor, 0.083);
    sphere(parent, 0.084, coatColor, localElbow);
    limb(parent, localElbow, localHand, 0.081, coatColor, 0.063);
    const cuff = new THREE.Vector3(...localHand).lerp(new THREE.Vector3(...localElbow), 0.18).toArray();
    limb(parent, cuff, localHand, 0.069, shirt, 0.067);
    sphere(parent, 0.069, skin, localHand, { scale: [0.83, 1.05, 0.86] });
    sphere(parent, 0.027, skin, [localHand[0] - side * 0.04, localHand[1] + 0.015, localHand[2] + 0.035]);
  }
  if (naturalist) {
    cylinder(group, 0.34, 0.35, 0.035, 0xc8a269, [0, 1.82, 0], { segments: 12, scale: [1, 1, 0.87] });
    cylinder(group, 0.19, 0.235, 0.15, 0xddbb80, [0, 1.902, -0.015], { segments: 10 });
    cylinder(group, 0.227, 0.235, 0.045, leather, [0, 1.85, -0.015], { segments: 10 });
    box(group, [0.065, 0.07, 0.018], accentColor, [0.16, 1.871, 0.173], { rotation: [0, 0, -0.3] });
    // Golden side-swept fringe, soft cheek color and subtle outer lashes.
    for (const side of [-1, 1]) {
      sphere(group, 0.09, hair, [side * 0.177, 1.60, -0.02], { scale: [0.64, 2.0, 0.8] });
      sphere(group, 0.035, 0xd9927c, [side * 0.126, 1.585, 0.174], { scale: [1, 0.5, 0.18] });
      box(group, [0.029, 0.009, 0.015], 0x695134, [side * 0.111, 1.668, 0.203], { rotation: [0, 0, side * 0.35] });
    }
    sphere(group, 0.105, 0xf2d886, [-0.068, 1.754, 0.14], { scale: [1.35, 0.5, 0.55], rotation: [0, 0, -0.22] });
    // A fuller blonde braid curls over her shoulder, with pale woven highlights.
    for (let i = 0; i < 7; i += 1) {
      sphere(group, 0.072 - i * 0.003, i % 2 ? 0xf2d886 : hair, [0.184 + Math.sin(i * 0.6) * 0.022, 1.65 - i * 0.079, 0.055 + Math.min(i * 0.035, 0.16)], { scale: [0.9, 1.05, 0.8] });
    }
    sphere(group, 0.039, accentColor, [0.171, 1.155, 0.213], { scale: [1.1, 0.45, 1] });
    box(group, [0.044, 0.69, 0.035], leather, [0.015, 1.092, 0.207], { rotation: [0, 0, -0.59] });
    box(group, [0.24, 0.26, 0.15], leather, [-0.27, 0.775, 0.18]);
    box(group, [0.255, 0.1, 0.035], 0x9d744e, [-0.27, 0.88, 0.269]);
    box(group, [0.048, 0.063, 0.018], accentColor, [-0.27, 0.839, 0.294]);
  } else if (guard) {
    cylinder(group, 0.205, 0.235, 0.11, coatColor, [0, 1.83, 0], { segments: 10 });
    box(group, [0.32, 0.035, 0.19], dark, [0, 1.786, 0.175]);
    box(group, [0.062, 0.066, 0.025], accentColor, [0, 1.83, 0.231]);
    box(group, [0.08, 0.09, 0.025], accentColor, [-0.18, 1.2, 0.166]);
    // Closed bail joins his curled hand to a caged warm lantern.
    const lanternX = 0.39;
    for (const dx of [-0.085, 0.085]) limb(group, [lanternX + dx, 0.91, 0.22], [lanternX + dx, 1.07, 0.22], 0.014, dark);
    limb(group, [lanternX - 0.085, 1.07, 0.22], [lanternX + 0.085, 1.07, 0.22], 0.014, dark);
    cylinder(group, 0.11, 0.115, 0.035, dark, [lanternX, 0.91, 0.22]);
    const lanternGlass = cylinder(group, 0.09, 0.09, 0.2, accentColor, [lanternX, 0.793, 0.22], { material: { emissive: 0xffb64f, emissiveIntensity: 1.3 } });
    group.userData.lantern = lanternGlass;
    // An emissive material only looks bright; it lights nothing around it. A
    // point light in the same place is what actually makes the lantern glow.
    const lanternLight = new THREE.PointLight(0xffb257, 0, 11, 1.7);
    lanternLight.position.set(lanternX, 0.793, 0.22);
    group.add(lanternLight);
    group.userData.lanternLight = lanternLight;
    // A soft halo around the glass so the source reads as lit from a distance.
    const lanternHalo = sphere(group, 0.19, 0xffd39a, [lanternX, 0.793, 0.22], {
      material: { transparent: true, opacity: 0, depthWrite: false, emissive: 0xffb257, emissiveIntensity: 1.6 }
    });
    group.userData.lanternHalo = lanternHalo;
    cylinder(group, 0.12, 0.1, 0.04, dark, [lanternX, 0.675, 0.22]);
    for (const dx of [-0.078, 0.078]) for (const dz of [-0.065, 0.065]) {
      limb(group, [lanternX + dx, 0.69, 0.22 + dz], [lanternX + dx, 0.91, 0.22 + dz], 0.012, dark);
    }
  } else if (builder) {
    // Flat work cap, a loaded tool belt and a mallet held in the right hand.
    cylinder(group, 0.25, 0.255, 0.05, coatColor, [0, 1.845, -0.01], { segments: 10 });
    cylinder(group, 0.175, 0.235, 0.13, coatColor, [0, 1.92, -0.02], { segments: 10 });
    box(group, [0.31, 0.04, 0.22], 0x4a3a2c, [0, 1.835, 0.18], { rotation: [-0.08, 0, 0] });
    box(group, [0.5, 0.12, 0.3], leather, [0, 0.88, 0.02], { scale: [1, 1, 1.04] });
    box(group, [0.1, 0.09, 0.03], accentColor, [0, 0.88, 0.19]);
    for (const [bx, bw, bc] of [[-0.24, 0.13, 0x7d5f3f], [0.24, 0.15, 0x6b7f6a]]) {
      box(group, [bw, 0.2, 0.14], bc, [bx, 0.78, 0.14]);
    }
    // Chisels poking out of the belt pouch.
    for (const dx of [-0.03, 0.03]) cylinder(group, 0.016, 0.016, 0.2, 0xc8ccc2, [-0.24 + dx, 0.9, 0.16], { segments: 5 });
    // Shaft runs through the closed right hand, head just above the knuckles.
    const malletX = 0.35;
    cylinder(group, 0.028, 0.032, 0.54, 0x8a6440, [malletX, 0.88, 0.23], { rotation: [0.1, 0, 0.05], segments: 6 });
    box(group, [0.14, 0.2, 0.2], 0x6f5334, [malletX + 0.02, 1.21, 0.25], { rotation: [0, 0, 0.05] });
    box(group, [0.155, 0.05, 0.21], 0x4d3a26, [malletX + 0.02, 1.21, 0.25]);
    sphere(group, 0.032, 0x8a6440, [malletX - 0.01, 0.62, 0.22]);
    // Rolled sleeve cuff on the free arm.
    box(group, [0.11, 0.1, 0.15], shirt, [-0.33, 1.0, 0.08]);
  } else {
    for (const side of [-1, 1]) {
      addMesh(group, new THREE.TorusGeometry(0.055, 0.009, 5, 12), mat(0xb3c9b8, { metalness: 0.4 }), [side * 0.083, 1.653, 0.224]);
      limb(group, [side * 0.136, 1.66, 0.224], [side * 0.204, 1.665, 0.009], 0.008, dark);
      box(group, [0.17, 0.23, 0.265], coatColor, [side * 0.157, 0.728, -0.005]);
    }
    box(group, [0.06, 0.012, 0.016], dark, [0, 1.657, 0.226]);
    sphere(group, 0.1, hair, [-0.07, 1.792, 0.099], { scale: [1.5, 0.53, 0.7], rotation: [0, 0, -0.15] });
    box(group, [0.35, 0.35, 0.038], leather, [0, 1.095, 0.341]);
    box(group, [0.29, 0.285, 0.007], 0xf3e6c6, [0, 1.089, 0.364]);
    box(group, [0.105, 0.04, 0.019], 0xb2c3b7, [0, 1.255, 0.372]);
    for (const y of [1.16, 1.12, 1.08]) box(group, [0.17, 0.01, 0.008], 0x8d9c8d, [-0.017, y, 0.373]);
    box(group, [0.036, 0.16, 0.018], accentColor, [0.198, 1.095, 0.383], { rotation: [0, 0, -0.17] });
  }
  const label = makeLabel(`${name} · ${role}`, `#${new THREE.Color(accentColor).getHexString()}`, '#1c3028', 0.34);
  label.position.set(0, 2.15, 0);
  group.add(label);
  group.userData.legs = legPivots;
  group.userData.arms = armPivots;
  world.add(group);
  const interactable = { type: 'character', character: id, label: `Talk to ${name}`, position: new THREE.Vector3(x, 1, z), radius: 3.2 };
  interactables.push(interactable);
  const route = (STAFF_PATROLS[id] || []).map(([px, pz]) => new THREE.Vector3(px, 0, pz));
  const staff = {
    id,
    name,
    group,
    interactable,
    post: new THREE.Vector3(x, 0, z),
    route,
    target: 0,
    facing: 0,
    stride: Math.random() * Math.PI * 2,
    speed: 0,
    holdUntil: 0,
    greeted: 0
  };
  fieldCharacters.push(staff);
  return staff;
}

// Where each of the three keeps to. Every route loops inside that person's own
// corner of the showcase so they never wander into someone else's ground.
const STAFF_PATROLS = {
  // Brynlee works the west lawn, staying outside the meadow rail (x < -13).
  brynlee: [[-14.8, -3.8], [-14.6, -9.4], [-15.2, -13.9], [-17.8, -11.6], [-17.4, -6.2], [-16.6, -2.4]],
  // Brooks walks the east side, staying outside the pollinator rail (x > 13).
  brooks: [[14.8, -3.8], [16.4, -8.6], [15.2, -13.9], [17.8, -11.4], [17.4, -6.4], [13.6, -2.2]],
  // Grayson stays on the central path between the record board and water wing.
  grayson: [[0, -5.4], [-2.6, -9.6], [-2.4, -14.6], [2.4, -14.8], [2.8, -9.4]],
  // Brax works his build yard behind the showcase, circling the plots.
  brax: [[-9, -32.5], [-13.5, -35], [-13.5, -42.5], [-4.5, -42.5], [-4.5, -35]]
};

// Night guard works nights; the naturalist and the researcher work days.
const STAFF_SHIFTS = {
  brynlee: ['dawn', 'day'],
  grayson: ['dawn', 'day', 'dusk'],
  brooks: ['dusk', 'night'],
  brax: ['dawn', 'day', 'dusk']
};

function isStaffOnShift(id) {
  return (STAFF_SHIFTS[id] || ALWAYS_ACTIVE).includes(currentDayPeriod);
}

// Walks each staff member around their own beat: they hold at each waypoint for a
// beat, turn to face the player when spoken to, and slow to a stroll off-shift.
function updateFieldCharacters(delta) {
  if (currentZone !== 'zoo' || !fieldCharacters.length) return;
  for (const staff of fieldCharacters) {
    const group = staff.group;
    const onShift = isStaffOnShift(staff.id);
    const distance = distanceTo(group.position);
    const cruise = onShift ? 0.95 : 0.42;
    let desiredFacing = staff.facing;
    let moving = false;
    if (distance < 3.4) {
      // Stop and turn to the visitor while they are close enough to talk to.
      staff.holdUntil = Math.max(staff.holdUntil, elapsed + 1.4);
      desiredFacing = Math.atan2(player.x - group.position.x, player.z - group.position.z);
    } else if (staff.route.length && elapsed >= staff.holdUntil) {
      const target = staff.route[staff.target];
      tempVector.subVectors(target, group.position).setY(0);
      const remaining = tempVector.length();
      if (remaining < 0.35) {
        staff.target = (staff.target + 1) % staff.route.length;
        staff.holdUntil = elapsed + (onShift ? 1.6 + Math.random() * 2.6 : 4 + Math.random() * 5);
      } else {
        tempVector.normalize();
        moving = true;
        desiredFacing = Math.atan2(tempVector.x, tempVector.z);
        group.position.x += tempVector.x * cruise * delta;
        group.position.z += tempVector.z * cruise * delta;
      }
    }
    staff.speed += ((moving ? cruise : 0) - staff.speed) * Math.min(1, delta * 5);
    let turn = desiredFacing - staff.facing;
    while (turn > Math.PI) turn -= Math.PI * 2;
    while (turn < -Math.PI) turn += Math.PI * 2;
    staff.facing += clamp(turn, -delta * 3.2, delta * 3.2);
    // The models are built facing +Z, so the yaw is the facing angle itself.
    group.rotation.y = staff.facing;
    staff.stride += staff.speed * 5.6 * delta;
    const swing = Math.sin(staff.stride) * clamp(staff.speed / 0.95, 0, 1);
    for (const leg of group.userData.legs || []) leg.pivot.rotation.x = swing * 0.52 * leg.side;
    for (const arm of group.userData.arms || []) arm.pivot.rotation.x = -swing * 0.4 * arm.side;
    group.position.y = Math.abs(Math.sin(staff.stride)) * 0.035 * clamp(staff.speed / 0.95, 0, 1);
    staff.interactable.position.set(group.position.x, 1, group.position.z);
    if (group.userData.lantern) {
      // Brooks' lantern lights up as the daylight drains away, and is out cold
      // at midday. A little flicker keeps it from reading as a flat bulb.
      const darkness = clamp(1 - currentDaylight, 0, 1);
      const lit = Math.max(0, darkness - 0.18) / 0.82;
      const flicker = lit > 0 ? 0.92 + Math.sin(elapsed * 7.3 + staff.stride) * 0.05 + Math.sin(elapsed * 17.1) * 0.03 : 1;
      group.userData.lantern.material.emissiveIntensity = 0.2 + lit * 1.9 * flicker;
      if (group.userData.lanternLight) group.userData.lanternLight.intensity = lit * 5.2 * flicker;
      if (group.userData.lanternHalo) group.userData.lanternHalo.material.opacity = lit * 0.42 * flicker;
    }
  }
}

// --- Visiting members of the public -------------------------------------------
// A handful of people drift through the showcase and the depot: they park, walk
// a short loop of stops, linger at each one, then head back to the lot and go.

const VISITOR_PALETTES = [
  { coat: 0x8c6f9c, pants: 0x3f4a5c, shirt: 0xf0e5cf, skin: 0xe0b190, hair: 0x3a2e28, hat: 0, bag: 0xb5794e },
  { coat: 0x4f7f6d, pants: 0x5a5140, shirt: 0xe7dcc2, skin: 0xc08457, hair: 0x1f1b18, hat: 0xd9c48a, bag: 0 },
  { coat: 0xc2705a, pants: 0x39424a, shirt: 0xf3ecd8, skin: 0x8d5a3c, hair: 0x2a211c, hat: 0, bag: 0x66788a },
  { coat: 0x5f6f9c, pants: 0x4a4238, shirt: 0xdfe8dd, skin: 0xf0c9a4, hair: 0x8c6a3c, hat: 0, bag: 0 },
  { coat: 0xd0a94f, pants: 0x435049, shirt: 0xf5efdc, skin: 0xa9754d, hair: 0x4a3a2c, hat: 0x6d7f6a, bag: 0x8a6f4e },
  { coat: 0x7a8c72, pants: 0x2f3a44, shirt: 0xeee3c8, skin: 0xd9a077, hair: 0x60483a, hat: 0, bag: 0 }
];

const VISITOR_ROUTES = {
  zoo: {
    noun: 'visitor',
    gate: [-3.6, 5.0],
    capacity: 4,
    interval: [11, 24],
    stops: [[0, 3.2], [-4.4, -2.4], [-3.9, -8.4], [-2.2, -12.6], [3.9, -8.2], [4.4, -2.2], [0, -16.6]],
    lines: [
      'Is the tawny owl awake yet? We drove out just to see it.',
      'The meadow habitat looks spotless today.',
      'My kid has been counting butterflies since we walked in.',
      'Do the ducks by the practice pond really lay eggs out here?',
      'We saw the record board at the depot. That trout was enormous.'
    ]
  },
  store: {
    noun: 'customer',
    gate: [3.4, 4.4],
    capacity: 3,
    interval: [14, 28],
    stops: [[-6.5, -1.6], [-6.6, -5.3], [0, -3.7], [6.6, -5.2], [6.4, -1.4], [-3.2, -2.4]],
    lines: [
      'Do you know if the grub bait works on crappie?',
      'I am after a spare lens before the light goes.',
      'Picking up lantern oil. The night watch burns through it.',
      'Everyone says the spinner is worth the sixteen coins.',
      'Just browsing. The nets look better made than last season.'
    ]
  }
};

function createVisitorModel(palette) {
  const group = new THREE.Group();
  const dark = 0x2a3330;
  const legs = [];
  for (const side of [-1, 1]) {
    const hip = new THREE.Group();
    hip.position.set(side * 0.115, 0.74, 0);
    group.add(hip);
    cylinder(hip, 0.082, 0.095, 0.6, palette.pants, [0, -0.32, 0], { segments: 7 });
    box(hip, [0.175, 0.1, 0.3], dark, [0, -0.67, 0.06]);
    legs.push({ pivot: hip, side });
  }
  cylinder(group, 0.2, 0.235, 0.24, palette.coat, [0, 0.79, 0], { scale: [1, 1, 0.74] });
  cylinder(group, 0.245, 0.19, 0.5, palette.coat, [0, 1.1, 0], { scale: [1, 1, 0.66] });
  box(group, [0.15, 0.4, 0.03], palette.shirt, [0, 1.11, 0.145]);
  const arms = [];
  for (const side of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.25, 1.26, 0);
    group.add(pivot);
    cylinder(pivot, 0.072, 0.088, 0.46, palette.coat, [side * 0.035, -0.23, 0.015], { segments: 7 });
    sphere(pivot, 0.06, palette.skin, [side * 0.06, -0.46, 0.03], { scale: [0.85, 1, 0.9] });
    arms.push({ pivot, side });
  }
  cylinder(group, 0.075, 0.088, 0.14, palette.skin, [0, 1.38, 0]);
  sphere(group, 0.225, palette.skin, [0, 1.6, 0.01], { widthSegments: 12, heightSegments: 9, scale: [0.88, 1.06, 0.88] });
  sphere(group, 0.22, palette.hair, [0, 1.71, -0.02], { scale: [0.96, 0.62, 0.98] });
  for (const side of [-1, 1]) {
    sphere(group, 0.05, palette.skin, [side * 0.19, 1.6, 0.0], { scale: [0.6, 1, 0.72] });
    sphere(group, 0.034, 0xfff2d9, [side * 0.077, 1.632, 0.178], { scale: [1, 0.72, 0.36] });
    sphere(group, 0.018, dark, [side * 0.075, 1.631, 0.19], { scale: [0.8, 1, 0.45] });
  }
  sphere(group, 0.04, palette.skin, [0, 1.578, 0.192], { scale: [0.7, 1, 0.9] });
  box(group, [0.058, 0.012, 0.015], 0x8c5a4e, [0, 1.512, 0.182]);
  if (palette.hat) {
    cylinder(group, 0.31, 0.32, 0.03, palette.hat, [0, 1.79, -0.01], { segments: 12, scale: [1, 1, 0.9] });
    cylinder(group, 0.17, 0.215, 0.15, palette.hat, [0, 1.865, -0.01], { segments: 10 });
  }
  if (palette.bag) {
    box(group, [0.27, 0.31, 0.16], palette.bag, [0, 1.07, -0.25]);
    box(group, [0.28, 0.06, 0.03], 0x3c342a, [0, 1.16, -0.34]);
  }
  group.userData.legs = legs;
  group.userData.arms = arms;
  return group;
}

// `warmStart` drops someone in mid-visit with their car already parked, so
// arriving in a zone does not mean staring at an empty floor for the minute it
// takes the first person to drive in.
function spawnVisitor(zoneKey, warmStart = false) {
  const route = VISITOR_ROUTES[zoneKey];
  if (!route) return null;
  const stall = freeVisitorStall();
  if (!stall) return null;
  if (!warmStart && !approachIsClear()) return null;
  const palette = VISITOR_PALETTES[Math.floor(Math.random() * VISITOR_PALETTES.length)];
  const group = createVisitorModel(palette);
  const door = stallDoorPoint(stall);
  group.position.set(door.x, 0, door.z);
  group.visible = false;
  world.add(group);
  const gate = () => new THREE.Vector3(route.gate[0] + (Math.random() - 0.5) * 1.6, 0, route.gate[1]);
  const chosen = [...route.stops].sort(() => Math.random() - 0.5).slice(0, 2 + Math.floor(Math.random() * 3));
  const plan = [
    { point: new THREE.Vector3(stall.x, 0, PARKING_LOT.aisleZ), hold: 0 },
    { point: new THREE.Vector3((Math.random() - 0.5) * 2.4, 0, PARKING_LOT.minZ + 3.4), hold: 0 },
    { point: gate(), hold: 0 }
  ];
  for (const [stopX, stopZ] of chosen) {
    plan.push({ point: new THREE.Vector3(stopX + (Math.random() - 0.5) * 1.5, 0, stopZ + (Math.random() - 0.5) * 1.5), hold: 3.5 + Math.random() * 5.5 });
  }
  plan.push({ point: gate(), hold: 0 });
  plan.push({ point: new THREE.Vector3((Math.random() - 0.5) * 2.4, 0, PARKING_LOT.minZ + 3.4), hold: 0 });
  plan.push({ point: new THREE.Vector3(stall.x, 0, PARKING_LOT.aisleZ), hold: 0 });
  plan.push({ point: new THREE.Vector3(door.x, 0, door.z), hold: 0 });
  const visitor = {
    group,
    plan,
    index: 0,
    holdUntil: 0,
    facing: Math.PI,
    browseFacing: Math.PI,
    stride: Math.random() * Math.PI * 2,
    speed: 0,
    line: route.lines[Math.floor(Math.random() * route.lines.length)],
    noun: route.noun,
    stall,
    state: 'driving-in',
    car: null,
    interactable: null
  };
  visitors.push(visitor);

  const parkCar = (car) => {
    // Parked, not finished: the car stays in the world with its collider until
    // its owner walks back to it, so the traffic update has to leave it alone.
    car.parked = true;
    car.group.position.set(stall.x, 0.25, stall.z);
    car.group.rotation.y = carHeading(0, stall.facing);
    car.heading = car.group.rotation.y;
    holdCarCollider(car, stall.x, stall.z);
    visitor.state = 'touring';
    visitor.group.visible = true;
    visitor.group.position.set(door.x, 0, door.z);
    visitor.facing = Math.atan2(0 - 0, PARKING_LOT.aisleZ - door.z);
    visitor.group.rotation.y = visitor.facing;
    visitor.interactable = { type: 'visitor', visitor, label: `Greet the ${route.noun}`, position: new THREE.Vector3(door.x, 1, door.z), radius: 2.4 };
    interactables.push(visitor.interactable);
  };

  const car = spawnTrafficCar(warmStart ? [createRoadRun([[stall.x, stall.z + stall.facing * 0.4], [stall.x, stall.z]], { speed: 1 })] : lotApproachLegs(stall), {
    onFinish: parkCar
  });
  car.stall = stall;
  visitor.car = car;
  if (warmStart) {
    // Skip the drive and the walk in: put them somewhere in the middle of the
    // tour with the car already standing in its bay.
    parkCar(car);
    const at = 3 + Math.floor(Math.random() * Math.max(1, chosen.length));
    const step = visitor.plan[Math.min(at, visitor.plan.length - 4)];
    visitor.index = Math.min(at + 1, visitor.plan.length - 4);
    group.position.copy(step.point);
    visitor.holdUntil = elapsed + Math.random() * 3.5;
    visitor.facing = Math.random() * Math.PI * 2;
    visitor.browseFacing = visitor.facing;
    group.rotation.y = visitor.facing;
  }
  return visitor;
}

// The walk-out point sits just behind the parked car, between the bay and the
// aisle, so people step out of the car rather than through it.
function stallDoorPoint(stall) {
  return {
    x: stall.x,
    z: stall.z + (stall.z > PARKING_LOT.aisleZ ? -2.15 : 2.15)
  };
}

function despawnVisitor(visitor) {
  world.remove(visitor.group);
  if (visitor.interactable) interactables = interactables.filter((entry) => entry !== visitor.interactable);
  visitors = visitors.filter((entry) => entry !== visitor);
}

// Leaving is a drive, not a fade: the car backs out, takes the service drive to
// the street, runs east and turns out of sight behind the treeline.
function sendVisitorHome(visitor) {
  visitor.state = 'leaving';
  visitor.group.visible = false;
  if (visitor.interactable) {
    interactables = interactables.filter((entry) => entry !== visitor.interactable);
    visitor.interactable = null;
  }
  const car = visitor.car;
  despawnVisitor(visitor);
  if (!car) return;
  releaseCarCollider(car);
  car.parked = false;
  car.legs = lotDepartureLegs(visitor.stall);
  car.leg = 0;
  car.distance = 0;
  car.onFinish = null;
  // Hold the bay until the car has finished backing out of it, so the next
  // arrival is not aimed at a stall that is still occupied.
  car.onLeg = (leaving) => { leaving.stall = null; };
}

function greetVisitor(visitor) {
  toast(visitor.line, 'info');
  setStatus(`A ${visitor.noun} stopped to chat. They will be on their way shortly.`);
}

function updateVisitors(delta) {
  const route = VISITOR_ROUTES[currentZone];
  if (!route) {
    if (visitors.length) visitors = [];
    return;
  }
  // Far fewer people come through after dark, and the depot all but empties out.
  const afterHours = currentDayPeriod === 'night';
  const capacity = afterHours ? 1 : route.capacity;
  if (!visitorsSeeded) {
    visitorsSeeded = true;
    const alreadyHere = afterHours ? 0 : 1 + Math.floor(Math.random() * 2);
    for (let index = 0; index < alreadyHere; index += 1) spawnVisitor(currentZone, true);
  }
  if (elapsed >= visitorSpawnAt) {
    if (visitors.length < capacity) spawnVisitor(currentZone);
    const [min, max] = route.interval;
    visitorSpawnAt = elapsed + (afterHours ? 45 + Math.random() * 45 : min + Math.random() * (max - min));
  }
  for (const visitor of [...visitors]) {
    if (visitor.state !== 'touring') continue;
    const group = visitor.group;
    const step = visitor.plan[visitor.index];
    if (!step) {
      sendVisitorHome(visitor);
      continue;
    }
    let moving = false;
    let desiredFacing = visitor.facing;
    const nearPlayer = distanceTo(group.position) < 3;
    if (elapsed < visitor.holdUntil) {
      desiredFacing = nearPlayer
        ? Math.atan2(player.x - group.position.x, player.z - group.position.z)
        : visitor.browseFacing;
    } else {
      tempVector.subVectors(step.point, group.position).setY(0);
      if (tempVector.length() < 0.32) {
        visitor.index += 1;
        if (visitor.index >= visitor.plan.length) {
          sendVisitorHome(visitor);
          continue;
        }
        visitor.holdUntil = elapsed + step.hold;
        visitor.browseFacing = visitor.facing + (Math.random() - 0.5) * 2.2;
      } else {
        tempVector.normalize();
        moving = true;
        desiredFacing = Math.atan2(tempVector.x, tempVector.z);
        group.position.x += tempVector.x * 1.05 * delta;
        group.position.z += tempVector.z * 1.05 * delta;
      }
    }
    visitor.speed += ((moving ? 1.05 : 0) - visitor.speed) * Math.min(1, delta * 5);
    let turn = desiredFacing - visitor.facing;
    while (turn > Math.PI) turn -= Math.PI * 2;
    while (turn < -Math.PI) turn += Math.PI * 2;
    visitor.facing += clamp(turn, -delta * 3.4, delta * 3.4);
    group.rotation.y = visitor.facing;
    visitor.stride += visitor.speed * 5.4 * delta;
    const swing = Math.sin(visitor.stride) * clamp(visitor.speed / 1.05, 0, 1);
    for (const leg of group.userData.legs) leg.pivot.rotation.x = swing * 0.5 * leg.side;
    for (const arm of group.userData.arms) arm.pivot.rotation.x = -swing * 0.38 * arm.side;
    group.position.y = Math.abs(Math.sin(visitor.stride)) * 0.032 * clamp(visitor.speed / 1.05, 0, 1);
    if (visitor.interactable) visitor.interactable.position.set(group.position.x, 1, group.position.z);
  }
}

// Traffic keeps running in every hub zone, including the forest lot, so the
// street outside is never a dead prop.
function updateHubTraffic(delta) {
  if (!HUB_ZONES.includes(currentZone)) {
    if (trafficCars.length) trafficCars = [];
    return;
  }
  maybeSpawnPassingTraffic();
  updateTrafficCars(delta);
}

// --- Brax's build yard --------------------------------------------------------
// Sticks and stones gathered in the field are spent here. Each plot holds one
// project, and what stands on each plot is kept in the save.

const BUILD_PROJECTS = [
  { key: 'cairn', label: 'Stone cairn', note: 'A stacked waymarker for the field trail.', cost: { stones: 4 } },
  { key: 'firepit', label: 'Campfire ring', note: 'A ring of stones around a laid fire.', cost: { stones: 3, sticks: 2 } },
  { key: 'bench', label: 'Log bench', note: 'A split log resting on two stone footings.', cost: { sticks: 4, stones: 2 } },
  { key: 'trellis', label: 'Stick trellis', note: 'A lashed frame for climbing plants.', cost: { sticks: 6 } },
  { key: 'nestbox', label: 'Nest box on a post', note: 'A raised box the sparrows will use.', cost: { sticks: 5, stones: 1 } },
  { key: 'lamppost', label: 'Lantern post', note: 'A yard lamp that lights itself at dusk.', cost: { sticks: 3, stones: 3 } }
];

const BUILD_SITES = [
  [-13, -37], [-9, -37], [-5, -37],
  [-13, -41], [-9, -41], [-5, -41]
];

function materialCount(key) {
  return save.materials?.[key] || 0;
}

function canAffordBuild(project) {
  return Object.entries(project.cost).every(([key, amount]) => materialCount(key) >= amount);
}

function describeBuildCost(project) {
  return Object.entries(project.cost)
    .map(([key, amount]) => `${amount} ${key === 'sticks' ? 'stick' : 'stone'}${amount === 1 ? '' : 's'}`)
    .join(' + ');
}

// Each project is a small low-poly prop built around the plot origin.
function createBuildModel(key) {
  const group = new THREE.Group();
  if (key === 'cairn') {
    const stack = [[0.42, 0.16, 0x6d8073], [0.34, 0.44, 0x7b8d80], [0.27, 0.68, 0x66796c], [0.19, 0.86, 0x84958a], [0.12, 0.99, 0x6d8073]];
    stack.forEach(([radius, y, color], index) => {
      addMesh(group, new THREE.DodecahedronGeometry(radius, 0), mat(color, { roughness: 0.95 }), [Math.sin(index * 1.7) * 0.05, y, Math.cos(index * 2.1) * 0.05], [0.2, index * 0.9, 0.12], [1.25, 0.66, 1.1]);
    });
  } else if (key === 'firepit') {
    for (let index = 0; index < 9; index += 1) {
      const angle = (index / 9) * Math.PI * 2;
      addMesh(group, new THREE.DodecahedronGeometry(0.2, 0), mat(index % 2 ? 0x6d8073 : 0x7b8d80, { roughness: 0.95 }), [Math.cos(angle) * 0.66, 0.13, Math.sin(angle) * 0.66], [0.2, angle, 0.1], [1.2, 0.72, 1.1]);
    }
    addMesh(group, new THREE.CircleGeometry(0.56, 14), mat(0x3a3129, { roughness: 1 }), [0, 0.03, 0], [-Math.PI / 2, 0, 0]);
    for (const [rot, tilt] of [[0.5, 0.5], [2.6, -0.45], [4.4, 0.4]]) {
      cylinder(group, 0.045, 0.055, 0.8, 0x7d5c3d, [Math.cos(rot) * 0.16, 0.3, Math.sin(rot) * 0.16], { segments: 6, rotation: [tilt, rot, 0.5] });
    }
    cone(group, 0.2, 0.36, 0xe8913f, [0, 0.34, 0], { segments: 6, material: { emissive: 0xd2621f, emissiveIntensity: 0.9, transparent: true, opacity: 0.9 } });
  } else if (key === 'bench') {
    for (const x of [-0.62, 0.62]) {
      addMesh(group, new THREE.DodecahedronGeometry(0.24, 0), mat(0x70837a, { roughness: 0.95 }), [x, 0.17, 0], [0.1, x, 0.1], [1.2, 0.9, 1.2]);
    }
    cylinder(group, 0.19, 0.19, 1.85, 0x99703f, [0, 0.42, 0], { rotation: [0, 0, Math.PI / 2], segments: 10 });
    box(group, [1.85, 0.06, 0.44], 0xb5885a, [0, 0.5, 0]);
  } else if (key === 'trellis') {
    for (const x of [-0.5, 0.5]) cylinder(group, 0.045, 0.055, 1.7, 0x7d5c3d, [x, 0.85, 0], { segments: 6 });
    for (const y of [0.45, 0.9, 1.35]) cylinder(group, 0.035, 0.035, 1.06, 0x8b6848, [0, y, 0], { rotation: [0, 0, Math.PI / 2], segments: 5 });
    for (const [x, y] of [[-0.5, 0.45], [0.5, 0.9], [-0.5, 1.35]]) torus(group, 0.06, 0.014, 0xc7b18b, [x, y, 0], [0, Math.PI / 2, 0], 5, 10);
    for (let index = 0; index < 4; index += 1) {
      sphere(group, 0.12, 0x548a52, [-0.4 + index * 0.28, 0.36 + (index % 2) * 0.42, 0.06], { scale: [1.2, 0.5, 0.7] });
    }
  } else if (key === 'nestbox') {
    cylinder(group, 0.075, 0.09, 1.75, 0x7d5c3d, [0, 0.87, 0], { segments: 7 });
    for (const x of [-0.24, 0.24]) cylinder(group, 0.03, 0.03, 0.42, 0x8b6848, [x * 0.6, 1.36, 0], { rotation: [0, 0, x > 0 ? -0.7 : 0.7], segments: 5 });
    box(group, [0.46, 0.5, 0.42], 0xa8794c, [0, 1.94, 0]);
    box(group, [0.56, 0.07, 0.52], 0x6d5033, [0, 2.22, 0], { rotation: [0.16, 0, 0] });
    cylinder(group, 0.075, 0.075, 0.06, 0x3b2d1f, [0, 2.0, 0.215], { rotation: [Math.PI / 2, 0, 0], segments: 8 });
    cylinder(group, 0.02, 0.02, 0.16, 0x6d5033, [0, 1.85, 0.26], { rotation: [Math.PI / 2, 0, 0], segments: 5 });
  } else if (key === 'lamppost') {
    for (let index = 0; index < 6; index += 1) {
      const angle = (index / 6) * Math.PI * 2;
      addMesh(group, new THREE.DodecahedronGeometry(0.16, 0), mat(0x6d8073, { roughness: 0.95 }), [Math.cos(angle) * 0.3, 0.1, Math.sin(angle) * 0.3], [0.2, angle, 0.1], [1.2, 0.6, 1.1]);
    }
    cylinder(group, 0.06, 0.08, 2.15, 0x6b5138, [0, 1.07, 0], { segments: 7 });
    cylinder(group, 0.12, 0.1, 0.06, 0x4a3a2a, [0, 2.16, 0], { segments: 8 });
    const glass = cylinder(group, 0.13, 0.13, 0.3, 0xffd08a, [0, 2.34, 0], { segments: 8, material: { emissive: 0xffb257, emissiveIntensity: 1.2, transparent: true, opacity: 0.9 } });
    cone(group, 0.22, 0.2, 0x4a3a2a, [0, 2.58, 0], { segments: 8 });
    const light = new THREE.PointLight(0xffb257, 0, 13, 1.7);
    light.position.set(0, 2.34, 0);
    group.add(light);
    group.userData.yardLamp = { glass, light };
  }
  return group;
}

function createBuildSite(x, z, index) {
  const id = `yard-${index}`;
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  const pad = addMesh(group, new THREE.CircleGeometry(0.95, 20), mat(0x7a6c53, { roughness: 1, transparent: true, opacity: 0.7 }), [0, 0.03, 0], [-Math.PI / 2, 0, 0]);
  const ring = addMesh(group, new THREE.TorusGeometry(0.98, 0.05, 6, 22), mat(0xd8ef85, { emissive: 0x6f8a34, emissiveIntensity: 0.7, transparent: true, opacity: 0.85 }), [0, 0.05, 0], [-Math.PI / 2, 0, 0]);
  world.add(group);
  const site = {
    type: 'build-site',
    id,
    label: 'Build here',
    position: new THREE.Vector3(x, 0.6, z),
    radius: 2.1,
    group,
    pad,
    ring,
    model: null,
    project: null
  };
  buildSites.push(site);
  interactables.push(site);
  const existing = save.builds?.[id];
  if (existing && BUILD_PROJECTS.some((project) => project.key === existing)) placeBuild(site, existing, false);
  return site;
}

function placeBuild(site, projectKey, announce = true) {
  const project = BUILD_PROJECTS.find((candidate) => candidate.key === projectKey);
  if (!project) return;
  if (site.model) site.group.remove(site.model);
  const model = createBuildModel(projectKey);
  site.group.add(model);
  site.model = model;
  site.project = project;
  site.label = `${project.label} · inspect`;
  save.builds[site.id] = projectKey;
  site.ring.material.opacity = 0.12;
  site.pad.material.opacity = 0.38;
  if (announce) {
    saveGame();
    updateHUD();
    toast(`${project.label} built. Brax nods approvingly.`, 'success');
    setStatus(`${project.label} now stands in the yard. Gather more sticks and stones for the next plot.`);
  }
}

function clearBuild(site) {
  if (!site.project) return;
  const project = site.project;
  // Dismantling returns the full cost, so a plot can be reworked freely.
  for (const [key, amount] of Object.entries(project.cost)) {
    save.materials[key] = (save.materials[key] || 0) + amount;
  }
  site.group.remove(site.model);
  site.model = null;
  site.project = null;
  site.label = 'Build here';
  delete save.builds[site.id];
  site.ring.material.opacity = 0.85;
  site.pad.material.opacity = 0.7;
  saveGame();
  updateHUD();
  toast(`${project.label} dismantled. ${describeBuildCost(project)} returned.`, 'success');
}

function createBraxYard() {
  // A worked-earth pad behind the showcase, reached by the west path.
  createPath(-9, -25, 3.4, 22, 0xb0a077);
  const yard = addMesh(world, new THREE.PlaneGeometry(13, 11), mat(0x6f6247, { roughness: 1 }), [-9, -0.02, -39], [-Math.PI / 2, 0, 0]);
  yard.receiveShadow = true;
  const sign = makeLabel('BRAX · BUILD YARD', '#e2c78a', '#3a2f22', 0.62);
  sign.position.set(-9, 2.5, -32.6);
  world.add(sign);
  // Stockpiles either side of the entrance, so the yard reads as a work site.
  for (const [sx, sz] of [[-14.6, -33.6], [-3.4, -33.6]]) {
    for (let index = 0; index < 5; index += 1) {
      addMesh(world, new THREE.DodecahedronGeometry(0.26, 0), mat(index % 2 ? 0x6d8073 : 0x7b8d80, { roughness: 0.96 }), [sx + Math.sin(index * 2.2) * 0.4, 0.16 + (index % 2) * 0.22, sz + Math.cos(index * 1.8) * 0.36], [0.2, index, 0.1], [1.2, 0.7, 1.1]);
    }
  }
  for (let index = 0; index < 7; index += 1) {
    cylinder(world, 0.05, 0.06, 1.5, 0x7d5c3d, [-3.9 + (index % 3) * 0.16, 0.06 + Math.floor(index / 3) * 0.12, -35.6 + index * 0.07], { segments: 5, rotation: [Math.PI / 2, 0, 0.1 + index * 0.05] });
  }
  BUILD_SITES.forEach(([x, z], index) => createBuildSite(x, z, index));
  createFieldCharacter('brax', 'Brax', 'FIELD BUILDER', -9, -31.4, 0x9c6f42, 0xe2c78a);
}

// Plot rings fade out once something stands on them, and only show up close.
function updateBuildSites(delta) {
  if (currentZone !== 'zoo') return;
  for (const site of buildSites) {
    const near = distanceTo(site.position) < 16;
    site.group.visible = near || !site.project;
    if (!site.project) {
      site.ring.material.opacity = 0.55 + Math.sin(elapsed * 2.1 + site.position.x) * 0.22;
    }
    const lamp = site.model?.userData.yardLamp;
    if (lamp) {
      // Anything the player built that carries a light follows the same dusk
      // curve as Brooks' lantern.
      const lit = Math.max(0, clamp(1 - currentDaylight, 0, 1) - 0.18) / 0.82;
      const flicker = 0.94 + Math.sin(elapsed * 5.8 + site.position.z) * 0.05;
      lamp.light.intensity = lit * 4.6 * flicker;
      lamp.glass.material.emissiveIntensity = 0.25 + lit * 1.8 * flicker;
    }
  }
}

// The forest road, and the line the car drives, are the same centripetal
// Catmull-Rom curve: the tarmac bends the way the car does, and the car never
// has to snap between straight segments.
let jenkinsLakeRoadCurve = null;

function getJenkinsLakeRoadCurve() {
  if (!jenkinsLakeRoadCurve) {
    jenkinsLakeRoadCurve = new THREE.CatmullRomCurve3(
      JENKINS_LAKE_ROAD.map(([x, z]) => new THREE.Vector3(x, 0, z)),
      false,
      'centripetal',
      0.5
    );
  }
  return jenkinsLakeRoadCurve;
}

function createRoadRibbon(curve, width, color, y, segments = 120) {
  const positions = [];
  const normals = [];
  const indices = [];
  for (let index = 0; index <= segments; index += 1) {
    const point = curve.getPointAt(index / segments);
    const tangent = curve.getTangentAt(index / segments);
    const length = Math.hypot(tangent.x, tangent.z) || 1;
    const sideX = -tangent.z / length * width / 2;
    const sideZ = tangent.x / length * width / 2;
    positions.push(point.x + sideX, y, point.z + sideZ, point.x - sideX, y, point.z - sideZ);
    normals.push(0, 1, 0, 0, 1, 0);
    if (index === 0) continue;
    const corner = (index - 1) * 2;
    indices.push(corner, corner + 1, corner + 3, corner, corner + 3, corner + 2);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setIndex(indices);
  geometry.computeBoundingSphere();
  const mesh = new THREE.Mesh(geometry, mat(color, { roughness: 1, side: THREE.DoubleSide }));
  mesh.receiveShadow = true;
  world.add(mesh);
  return mesh;
}

function createJenkinsLakeRoad() {
  const curve = getJenkinsLakeRoadCurve();
  createRoadRibbon(curve, 4.6, 0x9a774f, 0.01);
  createRoadRibbon(curve, 3.7, 0xb18a59, 0.045);
  const roadSign = makeLabel('JENKINS LAKE ROAD', '#d8ef85', '#30442f', 0.48);
  roadSign.position.set(0, 2.8, 14.2);
  world.add(roadSign);
}

function isJenkinsLakeClearPosition(x, z, allowMeadow = false) {
  const water = JENKINS_LAKE_WATER;
  const waterDistance = ((x - water.centerX) / (water.radiusX + 1.5)) ** 2 + ((z - water.centerZ) / (water.radiusZ + 1.5)) ** 2;
  const onRoad = Math.abs(x) < 3.5 && z > -67 && z < 31;
  const inMeadow = Math.abs(x) < 15.2 && z > -120 && z < -78;
  const rightOfShackBarrier = x > 25.5 && z > -44 && z < -18;
  const inCabinYard = isJenkinsLakeYardPosition(x, z);
  const buildings = [
    [-18, -28, 18, 12],
    [17, -31, 12, 10],
    [-9.5, -72, 14, 14],
    [-34, -96, 14, 12],
    [-25, -108, 8.5, 7.2]
  ];
  const inBuilding = buildings.some(([centerX, centerZ, width, depth]) => Math.abs(x - centerX) < width / 2 + 1.1 && Math.abs(z - centerZ) < depth / 2 + 1.1);
  const bounds = ZONES.lake.bounds;
  return x > bounds.minX + 2.5 && x < bounds.maxX - 2.5 && z > bounds.minZ + 2.5 && z < bounds.maxZ - 2.5
    && waterDistance >= 1 && !onRoad && !inBuilding && !inCabinYard && !rightOfShackBarrier && (!inMeadow || allowMeadow);
}

function isJenkinsLakeYardPosition(x, z, padding = 0) {
  return JENKINS_LAKE_YARDS.some(({ centerX, centerZ, width, depth }) => (
    Math.abs(x - centerX) <= width / 2 - padding && Math.abs(z - centerZ) <= depth / 2 - padding
  ));
}

function createJenkinsLakeYards() {
  JENKINS_LAKE_YARDS.forEach(({ centerX, centerZ, width, depth }) => {
    addMesh(world, new THREE.PlaneGeometry(width, depth), mat(0x789762, { roughness: 1 }), [centerX, -0.035, centerZ], [-Math.PI / 2, 0, 0]);
    const borderColor = 0x4b8d58;
    box(world, [width, 0.075, 0.2], borderColor, [centerX, 0.015, centerZ - depth / 2]);
    box(world, [width, 0.075, 0.2], borderColor, [centerX, 0.015, centerZ + depth / 2]);
    box(world, [0.2, 0.075, depth], borderColor, [centerX - width / 2, 0.015, centerZ]);
    box(world, [0.2, 0.075, depth], borderColor, [centerX + width / 2, 0.015, centerZ]);
  });
}

function createJenkinsLakeForest() {
  const treeSpots = [];
  const addForestTree = (x, z, scale = 1, index = treeSpots.length) => {
    if (!isJenkinsLakeClearPosition(x, z)) return null;
    const create = index % 4 === 0 ? createBranchTree : createTree;
    const tree = create(x, z, scale, index % 2 ? 0x3f6d4b : 0x4b7950, index % 3 ? 0x6b4e36 : 0x5c4634);
    treeSpots.push({ tree, x, z });
    return tree;
  };

  // Dense staggered forest walls leave a clear road corridor and occasional pockets of grass.
  for (let row = 0, z = 27; z > -194; row += 1, z -= 6.5) {
    for (const side of [-1, 1]) {
      for (let layer = 0; layer < 8; layer += 1) {
        const x = side * (4.05 + layer * 6.5 + ((row + layer) % 2) * 0.55);
        addForestTree(x, z + ((layer % 2) * 1.4), 0.78 + ((row + layer) % 4) * 0.1, row * 6 + layer);
      }
    }
  }
  for (let row = 0, z = 22; z > -68; row += 1, z -= 8.2) {
    for (let column = 0, x = -82; x <= 82; column += 1, x += 7.6) {
      if (Math.abs(x) < 8 || (row + column) % 3 === 1) continue;
      addForestTree(x + ((row % 2) * 1.2), z, 0.72 + ((row + column) % 5) * 0.08, row * 11 + column);
    }
  }
  for (let row = 0, z = -118; z > -194; row += 1, z -= 7.2) {
    for (const side of [-1, 1]) {
      for (let layer = 0; layer < 3; layer += 1) {
        addForestTree(side * (22 + layer * 7.5 + (row % 2) * 1.1), z, 0.82 + ((row + layer) % 3) * 0.11, row * 5 + layer + 90);
      }
    }
  }
  for (let row = 0, z = 24; z > -194; row += 1, z -= 7.1) {
    for (const side of [-1, 1]) {
      addForestTree(side * (82 + (row % 2) * 1.2), z, 0.88 + (row % 3) * 0.08, 150 + row * 2 + (side > 0 ? 1 : 0));
    }
  }

  // A merged infill pass thickens the woods between the individual trees. These
  // are background trunks: one batch of a couple of hundred is one draw call, so
  // the forest can be dense without turning into thousands of extra objects.
  const backdrop = [];
  const spacing = makeSpacingGrid(2);
  treeSpots.forEach((spot) => spacing.add(spot.x, spot.z));
  const backdropTree = (x, z, index, scale) => {
    if (spacing.occupied(x, z, 1.6) || !isJenkinsLakeClearPosition(x, z)) return;
    spacing.add(x, z);
    backdrop.push([x, z, scale, index % 3 === 0 ? 0x38644a : index % 3 === 1 ? 0x44724d : 0x4d7c52,
      index % 2 ? 0x6b4e36 : 0x5c4634, index % 5 === 0]);
  };
  // Thick banks either side of the road corridor.
  for (let row = 0, z = 28; z > -196; row += 1, z -= 3.6) {
    for (const side of [-1, 1]) {
      for (let layer = 0; layer < 12; layer += 1) {
        backdropTree(side * (5.2 + layer * 3.7 + ((row + layer) % 3) * 0.9), z + ((layer % 3) * 1.1), row * 13 + layer, 0.7 + ((row + layer) % 5) * 0.09);
      }
    }
  }
  // Infill across the whole map, on a finer grid than the original stands.
  for (let row = 0, z = 26; z > -196; row += 1, z -= 4.3) {
    for (let column = 0, x = -90; x <= 90; column += 1, x += 4.1) {
      if ((row + column) % 3 === 1) continue;
      backdropTree(x + ((row % 2) * 1.5), z, row * 17 + column, 0.66 + ((row + column) % 6) * 0.08);
    }
  }
  createBackgroundForest(backdrop);

  for (let row = 0, z = 24; z > -194; row += 1, z -= 5.2) {
    for (let column = 0, x = -86; x <= 86; column += 1, x += 6.3) {
      if ((row + column) % 2 !== 0 || !isJenkinsLakeClearPosition(x, z)) continue;
      createGroundFoliage(x, z, 0.68 + ((row + column) % 4) * 0.13, (row + column) % 2 ? 0x4e8054 : 0x5a8958);
    }
  }
  for (let index = 0; index < 56; index += 1) {
    const x = -86 + (index * 17) % 172;
    const z = 22 - ((index * 23) % 214);
    if (isJenkinsLakeClearPosition(x, z)) {
      if (index % 2) addRock(x, 0.2, z, 0.24 + (index % 3) * 0.08, index % 3 ? 0x718474 : 0x667b6e);
      else createNatureStick(x, z, index);
    }
  }

  const hiveSpots = [[-31, 18], [30, 8], [-32, -14], [23.8, -24], [-30, -45], [29, -53], [-25, -83], [25, -87], [-57, -174], [56, -179]];
  hiveSpots.forEach(([x, z], index) => {
    const tree = addForestTree(x, z, 0.96 + (index % 3) * 0.1, 200 + index);
    if (tree) createBeehiveOnTree(tree, x, z, `lake-wild-hive-${index}`, true, 2.8 + (index % 2) * 0.35);
  });
  [[-29, 10, 3.2], [28, -4, 3.4], [-31, -34, 3.1], [30, -47, 3.5], [-23, -81, 3.1], [24, -90, 3.3], [-55, -171, 3.1], [54, -182, 3.3]].forEach(([x, z, y]) => {
    if (isJenkinsLakeClearPosition(x, z)) createSpiderWeb(x, z, y, 'lake');
  });

  // The field shack sits against a short local mountain wall. Its yard stays open,
  // while the player cannot thread through the forest behind it.
  for (let index = 0; index < 6; index += 1) {
    const z = -44 + index * 5.2;
    const mountain = addMesh(world, new THREE.DodecahedronGeometry(1.28 + (index % 2) * 0.18, 1), mat(index % 2 ? 0x4a5b4d : 0x596c5a), [27.5, 1.55 + (index % 3) * 0.25, z], [0.1, index * 0.4, 0.08], [1.2, 1.35, 1.05]);
    mountain.userData.edgeMountain = true;
  }
  addCollider(27.5, -28.5, 0.65, { type: 'rect', halfWidth: 0.65, halfDepth: 15.8, zone: 'lake' });
}

function createJenkinsLakeWater() {
  const { centerX, centerZ, radiusX, radiusZ } = JENKINS_LAKE_WATER;
  const water = addMesh(world, new THREE.CircleGeometry(31, 72), mat(0x2f8291, { roughness: 0.2, transparent: true, opacity: 0.9 }), [centerX, 0.08, centerZ], [-Math.PI / 2, 0, 0]);
  water.scale.set(radiusX / 31, radiusZ / 31, 1);
  const shoreline = addMesh(world, new THREE.RingGeometry(31.05, 31.75, 72), mat(0x8da36f, { roughness: 1 }), [centerX, 0.07, centerZ], [-Math.PI / 2, 0, 0]);
  shoreline.scale.set(radiusX / 31, radiusZ / 31, 1);
  const shoreGround = addMesh(world, new THREE.CircleGeometry(32.1, 72), mat(0x71865e, { roughness: 1 }), [centerX, 0.025, centerZ], [-Math.PI / 2, 0, 0]);
  shoreGround.scale.set(radiusX / 31, radiusZ / 31, 1);
  const lakeLabel = makeLabel('JENKINS LAKE', '#8be0c3', '#183d3c', 0.88);
  lakeLabel.position.set(0, 2.4, centerZ);
  world.add(lakeLabel);
  [[-68, -137], [-50, -124], [-27, -121], [2, -119], [31, -122], [55, -129], [69, -144], [-65, -169], [-42, -180], [-14, -186], [17, -187], [45, -180], [66, -169]].forEach(([x, z], index) => addRock(x, 0.24, z, 0.3 + (index % 2) * 0.12, 0x667b6e));
  [[-52, -137], [-24, -128], [9, -137], [39, -132], [58, -151], [-47, -163], [-13, -174], [24, -169], [51, -171]].forEach(([x, z], index) => createHotspot(x, z, index % 2 ? 'sunfish' : 'trout', index % 2 ? 'feather' : 'spinner', index % 2 ? 'grubs' : 'worms'));
  // Bass hold tight to the thicker lily-pad patches and take worms. Crappies suspend
  // in the open middle of the lake and also take worms.
  [[-67, -143], [-46, -161], [39, -140], [61, -164]].forEach(([x, z]) => createHotspot(x, z, 'bass', 'spinner', 'worms'));
  [[-9, -151], [8, -158], [2, -166]].forEach(([x, z]) => createHotspot(x, z, 'crappie', 'spinner', 'worms'));
  [[-67, -143, 1.05], [-56, -151, 0.82], [-46, -161, 1.18], [-34, -132, 0.9], [-19, -124, 0.74], [-7, -140, 0.94], [11, -128, 0.82], [26, -137, 1.14], [39, -140, 0.92], [52, -133, 0.8], [65, -148, 1.02], [61, -164, 0.88], [47, -172, 1.16], [31, -179, 0.78], [13, -183, 1.02], [-7, -178, 0.86], [-24, -181, 1.1], [-42, -174, 0.84], [-56, -166, 1.08], [-69, -157, 0.78]].forEach(([x, z, scale], index) => createLakeLilyPad(x, z, scale, index));
  JENKINS_LAKE_DOCKS.forEach((dock, index) => createLakeDock(dock, index));
  lakeBoat = createLakeBoat(JENKINS_LAKE_BOAT_SPAWN.x, JENKINS_LAKE_BOAT_SPAWN.z);
}

function isLakeGrassCompoundPosition(x, z, padding = 0) {
  return !isJenkinsLakeYardPosition(x, z, padding) && JENKINS_LAKE_GRASS_COMPOUNDS.some(({ centerX, centerZ, width, depth }) => (
    Math.abs(x - centerX) <= width / 2 - padding && Math.abs(z - centerZ) <= depth / 2 - padding
  ));
}

function createJenkinsLakeMeadow() {
  JENKINS_LAKE_GRASS_COMPOUNDS.forEach((compound) => createLakeGrassCompound(compound));
  const meadowTrees = [
    [-47, -79], [-21, -79], [-47, -91], [-21, -111],
    [-14, -81], [14, -81], [-14.5, -89], [14.5, -89], [-14, -108], [14, -108],
    [21, -79], [49, -79], [21, -111], [49, -111],
    [-45, -115], [-37, -118], [-29, -117], [25, -117], [35, -119], [45, -116]
  ];
  meadowTrees.forEach(([x, z], index) => {
    if (!isJenkinsLakeYardPosition(x, z, 0.4)) {
      (index % 3 === 0 ? createBranchTree : createTree)(x, z, 0.86 + (index % 3) * 0.08, index % 2 ? 0x3f6d4b : 0x4b7950);
    }
  });

  const meadowFoliage = [
    [-41, -86], [-35, -82], [-28, -89], [-43, -101], [-33, -103], [-26, -97],
    [-8, -86], [-3, -91], [4, -87], [9, -103], [-7, -110], [7, -113],
    [25, -85], [32, -82], [42, -87], [23, -100], [31, -105], [41, -101], [46, -109]
  ];
  meadowFoliage.forEach(([x, z], index) => {
    if (isLakeGrassCompoundPosition(x, z, 1.1)) createGroundFoliage(x, z, 0.66 + (index % 3) * 0.15, index % 2 ? 0x548454 : 0x68945a);
  });

  const meadowRocks = [[-42, -94, 0.24], [-28, -106, 0.3], [-5, -101, 0.22], [8, -94, 0.26], [26, -93, 0.25], [44, -96, 0.3]];
  meadowRocks.forEach(([x, z, scale], index) => {
    if (isLakeGrassCompoundPosition(x, z, 1.2)) addRock(x, 0.18, z, scale, index % 2 ? 0x718474 : 0x667b6e);
  });

  const meadowSticks = [[-38, -87], [-29, -100], [-4, -106], [10, -86], [28, -108], [43, -89]];
  meadowSticks.forEach(([x, z], index) => {
    if (isLakeGrassCompoundPosition(x, z, 1.1)) createNatureStick(x, z, 40 + index);
  });

  [[-39, -98, 0], [-30, -84, 1], [-5, -98, 2], [6, -107, 3], [28, -90, 4], [39, -103, 5], [45, -87, 6]].forEach(([x, z, index]) => {
    if (isLakeGrassCompoundPosition(x, z, 1.5)) createWildFlowerNode(x, z, [0xe889b0, 0xf1c84b, 0xb58ce0][index % 3], 100 + index);
  });
  [[-43, -106], [-22, -92], [2, -84], [10, -100], [24, -103], [42, -94]].forEach(([x, z], index) => {
    if (isLakeGrassCompoundPosition(x, z, 1.5)) createWildCarrot(x, z, 30 + index);
  });
  [[-35, -108], [-27, -87], [-11, -105], [4, -91], [34, -108], [45, -100]].forEach(([x, z], index) => {
    if (isLakeGrassCompoundPosition(x, z, 1.5)) createGroundMushroom(x, z, 30 + index, false);
  });
  if (isLakeGrassCompoundPosition(-34, -101, 1.5)) createGroundMushroom(-34, -101, 38, true);
  [[-41, -92], [11, -89], [37, -90]].forEach(([x, z], index) => {
    if (isLakeGrassCompoundPosition(x, z, 1.5)) createWildScallion(x, z, 30 + index);
  });
  [[-26, -101], [3, -104], [43, -106]].forEach(([x, z], index) => {
    if (isLakeGrassCompoundPosition(x, z, 1.5)) createBerryBush(x, z, 30 + index);
  });
  [[-40, -116], [-33, -119], [-26, -116], [25, -119], [34, -121], [43, -117]].forEach(([x, z], index) => {
    if (isLakeGrassCompoundPosition(x, z, 1.5)) createWildRicePlant(x, z, 30 + index);
  });

  const meadowCritters = [
    ['rabbit', [-39, 0.42, -88]], ['squirrel', [-28, 0.42, -104]], ['fox', [-41, 0.48, -107]],
    ['rabbit', [-5, 0.42, -89]], ['squirrel', [8, 0.42, -105]], ['frog', [11, 0.42, -113]],
    ['rabbit', [26, 0.42, -88]], ['squirrel', [42, 0.42, -103]], ['fox', [45, 0.48, -84]],
    ['butterfly', [-30, 1.85, -96]], ['bee', [4, 2.5, -96]], ['butterfly', [34, 1.9, -99]],
    ['dragonfly', [19, 2.2, -126]]
  ];
  meadowCritters.forEach(([species, position]) => spawnCritter(species, position));
}

function buildJenkinsLake() {
  setZonePalette('lake');
  addGround(ZONES.lake.ground, 440);
  createMountainBoundary('lake');
  createJenkinsLakeForest();
  createJenkinsLakeRoad();
  createPath(0, -91, 3.2, 58, 0x9a774f);
  createJenkinsLakeMeadow();
  createJenkinsLakeWater();
  createJenkinsLakeYards();
  createLakeBarn(-18, -28);
  createLakeShack(17, -31);
  createLakeCabin(-9.5, -72);
  createLakeCabin(-34, -96);
  createLakeGarage(-25, -108, 'WEST GARAGE · CLOSED');
  lakeParkedCar = createCar();
  lakeParkedCar.position.set(0, 0.25, -63.5);
  lakeParkedCar.visible = false;
  world.add(lakeParkedCar);
  lakeCaptain = createLakeCaptain(3.6, -78);
  const gateLabel = makeLabel('LAKE ACCESS · CAPTAIN MARK', '#f2b268', '#2f3d30', 0.42);
  gateLabel.position.set(3.6, 2.9, -79.8);
  world.add(gateLabel);
  lakeGateCollider = addCollider(0, -117.2, 0.2, { type: 'rect', halfWidth: 73.5, halfDepth: 0.22, zone: 'lake', debugLabel: 'captain-mark-lake-gate' });
  setLakeGateAccess(Boolean(save.jenkinsLakePass && JENKINS_LAKE_PLACEHOLDER_ACCESS));
  lakeGateNotified = false;
  lakeCabinBoundaryNotified = false;

  const lakeCritters = [
    ['rabbit', [-25, 0.42, 9]], ['squirrel', [25, 0.42, 8]], ['rabbit', [-33, 0.42, -2]], ['squirrel', [32, 0.42, -8]],
    ['rabbit', [-27, 0.42, -16]], ['squirrel', [28, 0.42, -19]], ['fox', [-34, 0.48, -31]], ['frog', [31, 0.42, -35]],
    ['rabbit', [-28, 0.42, -42]], ['squirrel', [29, 0.42, -48]], ['rabbit', [-25, 0.42, -58]], ['squirrel', [24, 0.42, -60]],
    ['fox', [-27, 0.48, -82]], ['frog', [28, 0.42, -86]], ['rabbit', [-30, 0.42, -104]], ['squirrel', [29, 0.42, -111]],
    ['owl', [16, 2.1, -22]], ['owl', [-17, 2.2, -49]], ['owl', [18, 2.3, -127]],
    ['butterfly', [-21, 1.85, -11]], ['butterfly', [20, 2.1, -39]], ['bee', [-29, 2.6, -25]], ['bee', [27, 2.7, -56]],
    ['dragonfly', [8, 2.2, -124]], ['dragonfly', [-10, 2.35, -135]]
  ];
  lakeCritters.forEach(([species, position]) => spawnCritter(species, position));
  createDuck(-6.5, -132, 0);
  createDuck(6.2, -141, 1);
  createDuck(0.8, -150, 2);
  createBugNode('caterpillar', [8.1, 0.05, -28], 0xd59c3a);
  createBugNode('worm', [-8.8, 0.05, -48], 0xb7775b);
}

function setLakeGateAccess(open) {
  lakeGateOpen = Boolean(open);
  if (lakeGateCollider) lakeGateCollider.enabled = !lakeGateOpen;
  if (lakeCaptain?.group) lakeCaptain.group.userData.gateOpen = lakeGateOpen;
}

function startJenkinsLakeArrival() {
  const curve = getJenkinsLakeRoadCurve();
  const start = curve.getPointAt(0);
  const tangent = curve.getTangentAt(0);
  // The camera looks along (-sin yaw, -cos yaw), so this faces it down the road.
  const heading = Math.atan2(-tangent.x, -tangent.z);
  lakeArrival = { active: true, progress: 0, duration: 13, heading, roll: 0 };
  lakeCarInterior = createLakeCarInterior();
  player.set(start.x, 1.72, start.z);
  // Aim is pointed down the road once, here, and then left alone. The drive
  // used to rewrite yaw every frame, which snatched the view back on every bend.
  yaw = heading;
  pitch = -0.05;
  setStatus('The car is following the winding road to Jenkins Lake. You can look around as you ride.');
  updateJenkinsLakeArrival(0);
}

// Smooth start and stop, so the car pulls away and slows into the clearing
// rather than travelling the whole road at one constant speed.
function easeDriveProgress(t) {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function updateJenkinsLakeArrival(delta) {
  if (!lakeArrival?.active) return false;
  lakeArrival.progress = clamp(lakeArrival.progress + delta / lakeArrival.duration, 0, 1);
  const curve = getJenkinsLakeRoadCurve();
  const along = easeDriveProgress(lakeArrival.progress);
  const point = curve.getPointAt(along);
  const tangent = curve.getTangentAt(along);
  player.x = point.x;
  player.z = point.z;
  const heading = Math.atan2(-tangent.x, -tangent.z);
  let turn = heading - lakeArrival.heading;
  while (turn > Math.PI) turn -= Math.PI * 2;
  while (turn < -Math.PI) turn += Math.PI * 2;
  // The body lags the road slightly and banks into the lag, which is what makes
  // a corner read as a corner instead of a step change in direction.
  lakeArrival.heading += turn * (delta > 0 ? Math.min(1, delta * 3.2) : 1);
  const targetRoll = clamp(turn * 1.1, -0.1, 0.1);
  lakeArrival.roll += (targetRoll - lakeArrival.roll) * (delta > 0 ? Math.min(1, delta * 3) : 1);
  if (lakeCarInterior) {
    lakeCarInterior.position.set(player.x, player.y, player.z);
    lakeCarInterior.rotation.set(0, lakeArrival.heading, lakeArrival.roll);
  }
  // A shallow suspension bob. The player's aim is never touched.
  camera.position.set(player.x, player.y + Math.sin(elapsed * 2.6) * 0.014, player.z);
  if (lakeArrival.progress >= 1) {
    lakeArrival.active = false;
    lakeArrival = null;
    if (lakeCarInterior) {
      world.remove(lakeCarInterior);
      lakeCarInterior = null;
    }
    if (lakeParkedCar) lakeParkedCar.visible = true;
    player.set(0, 1.72, -66.7);
    interactables.push({ type: 'car', label: 'Drive back from Jenkins Lake', position: new THREE.Vector3(0, 1.1, -63.5), radius: 3.4 });
    setStatus('The car is parked in the clearing. Captain Mark is ahead by the lake path.');
    toast('You arrived at Jenkins Lake.', 'success');
  }
  return true;
}

function updateJenkinsLakeGate() {
  if (currentZone !== 'lake' || lakeGateOpen || !lakeCaptain) return;
  if (player.z > -68) lakeCabinBoundaryNotified = false;
  if (!lakeCabinBoundaryNotified && player.z < -80.2) {
    lakeCabinBoundaryNotified = true;
    player.set(0, 1.72, -66.7);
    camera.position.set(player.x, player.y, player.z);
    yaw = 0;
    pitch = -0.08;
    updateCameraRotation();
    const message = 'Captain Mark requires 1 grilled fish and 1 glazed carrot before you can access Jenkins Lake.';
    toast(message, 'warning');
    setStatus(message);
    return;
  }
  if (!lakeGateNotified && player.z < -75.2) {
    lakeGateNotified = true;
    setStatus('Captain Mark is ahead. Bring him 1 grilled fish and 1 glazed carrot to access the lake.');
  }
}

function talkToCaptainMark() {
  if (currentZone !== 'lake') return;
  if (lakeGateOpen) {
    toast('Captain Mark nods. The lake path is open.', 'success');
    setStatus('The lake is open for future fieldwork.');
    return;
  }
  const hasFish = (save.cooked?.grilledFish || 0) > 0;
  const hasCarrots = (save.cooked?.glazedCarrots || 0) > 0;
  if (!hasFish || !hasCarrots) {
    toast('Captain Mark is hungry for grilled fish and glazed carrots.', 'warning');
    setStatus('Bring Captain Mark 1 grilled fish and 1 glazed carrot to pass the lake gate.');
    return;
  }
  save.cooked.grilledFish -= 1;
  save.cooked.glazedCarrots -= 1;
  save.jenkinsLakePass = true;
  saveGame();
  if (JENKINS_LAKE_PLACEHOLDER_ACCESS) {
    setLakeGateAccess(true);
    toast('Captain Mark accepts the meal and lets you pass to Jenkins Lake.', 'success');
    setStatus('The gate is open. The placeholder lake is ready for future fishing work.');
  } else {
    toast('Captain Mark accepts the meal, but the lake path is still closed for now.', 'warning');
    setStatus('Your pass is recorded. An invisible barrier remains until the lake is attached.');
  }
  updateHUD();
}

function addEnclosureInteractable(id, label, x, z, message) {
  const marker = new THREE.Group();
  const ring = addMesh(marker, new THREE.TorusGeometry(0.34, 0.045, 6, 18), mat(0xf2b268, { emissive: 0x8a4f24, emissiveIntensity: 0.9, transparent: true, opacity: 0.9 }), [0, 0, 0], [-Math.PI / 2, 0, 0]);
  const core = sphere(marker, 0.08, 0xf2b268, [0, 0, 0], { material: { emissive: 0x8a4f24, emissiveIntensity: 1.3 } });
  marker.position.set(x, 1.15, z);
  world.add(marker);
  const enclosure = {
    type: 'enclosure',
    id,
    label,
    cleanLabel: label.replace('Clean ', 'Inspect '),
    message,
    position: new THREE.Vector3(x, 1.05, z),
    radius: 3.8,
    marker,
    ring,
    core,
    cleaned: Boolean(save.cleanedEnclosures[id])
  };
  interactables.push(enclosure);
  zooEnclosures.push(enclosure);
  updateEnclosureVisual(enclosure);
}

function updateEnclosureVisual(enclosure) {
  enclosure.label = enclosure.cleaned ? enclosure.cleanLabel : enclosure.label.replace('Inspect ', 'Clean ');
  const color = enclosure.cleaned ? 0x89e0c7 : 0xf2b268;
  enclosure.ring.material.color.set(color);
  enclosure.ring.material.emissive.set(color);
  enclosure.core.material.color.set(color);
  enclosure.core.material.emissive.set(color);
  if (enclosure.id === 'water-wing') aquariumSmudges.forEach((smudge) => { smudge.visible = !enclosure.cleaned; });
}

function updateEnclosureMarkers() {
  for (const enclosure of zooEnclosures) {
    const near = distanceTo(enclosure.position) < 9.5;
    enclosure.marker.visible = near;
    if (near) {
      const pulse = 1 + Math.sin(elapsed * 4 + enclosure.position.x) * 0.12;
      enclosure.marker.scale.setScalar(pulse);
      enclosure.marker.rotation.y += 0.018;
      enclosure.core.material.emissiveIntensity = enclosure.cleaned ? 1.05 : 1.35 + Math.sin(elapsed * 5) * 0.28;
    }
  }
}

function startCleaning(enclosure) {
  if (!enclosure) return;
  if (enclosure.cleaned) {
    setStatus(`${enclosure.message} This habitat is already clean.`);
    toast('Habitat care is up to date.', 'success');
    return;
  }
  if (enclosure.id === 'water-wing') {
    startAquariumCleaning(enclosure);
    return;
  }
  const positions = [[14, 26], [68, 22], [36, 49], [80, 67], [56, 80], [20, 74]];
  const symbols = ['✦', '◆', '⌁', '●', '✧', '◼'];
  cleaningState = { mode: 'debris', enclosure, nextIndex: 0, total: positions.length };
  dom.cleaningField.innerHTML = positions.map(([left, top], index) => `<button class="debris-spot ${index === 0 ? 'is-next' : ''}" data-cleaning-index="${index}" style="left:${left}%;top:${top}%" type="button" aria-label="Clear debris ${index + 1}">${symbols[index]}</button>`).join('');
  dom.cleaningCopy.textContent = `${enclosure.message} Clear the highlighted debris in sequence.`;
  dom.cleaningAction.textContent = 'SWEEP HIGHLIGHTED SPOT';
  updateCleaningUI();
  openModal(dom.cleaningModal);
}

function startAquariumCleaning(enclosure) {
  cleaningState = { mode: 'aquarium', enclosure, round: 0, nextIndex: 0, total: 5, totalRounds: 3 };
  dom.cleaningModal.classList.add('is-aquarium');
  renderAquariumCleaningRound();
  dom.cleaningAction.textContent = 'MOUSE OVER THE NUMBERED SMUDGES';
  openModal(dom.cleaningModal);
}

function renderAquariumCleaningRound() {
  if (!cleaningState || cleaningState.mode !== 'aquarium') return;
  const positions = [[18, 26], [48, 18], [76, 31], [63, 68], [28, 72]];
  dom.cleaningField.innerHTML = positions.map(([left, top], index) => `<button class="debris-spot smudge-spot ${index === 0 ? 'is-next' : ''}" data-cleaning-index="${index}" style="left:${left}%;top:${top}%" type="button" aria-label="Polish smudge ${index + 1}">${index + 1}</button>`).join('');
  dom.cleaningCopy.textContent = `Glass smudge pass ${cleaningState.round + 1} of ${cleaningState.totalRounds}. Mouse over each number in order three times to clear the aquarium glass.`;
  updateCleaningUI();
}

function updateCleaningUI() {
  if (!cleaningState) return;
  const { nextIndex, total } = cleaningState;
  if (cleaningState.mode === 'aquarium') {
    dom.cleaningCount.textContent = `${cleaningState.round} / ${cleaningState.totalRounds} SMUDGE LAYERS CLEARED · ${nextIndex} / ${total}`;
    dom.cleaningProgress.style.width = `${((cleaningState.round + nextIndex / total) / cleaningState.totalRounds) * 100}%`;
    dom.cleaningField.querySelectorAll('.debris-spot').forEach((spot, index) => spot.classList.toggle('is-next', index === nextIndex));
    return;
  }
  dom.cleaningCount.textContent = `${nextIndex} / ${total} CLEARED`;
  dom.cleaningProgress.style.width = `${(nextIndex / total) * 100}%`;
  dom.cleaningField.querySelectorAll('.debris-spot').forEach((spot, index) => spot.classList.toggle('is-next', index === nextIndex));
}

function clearCleaningSpot(index) {
  if (!cleaningState) return;
  const spot = dom.cleaningField.querySelector(`[data-cleaning-index="${index}"]`);
  if (index !== cleaningState.nextIndex) {
    spot?.classList.add('is-wrong');
    window.setTimeout(() => spot?.classList.remove('is-wrong'), 220);
    toast('Start with the highlighted debris spot.', 'warning');
    return;
  }
  spot?.classList.remove('is-next');
  spot?.classList.add('is-cleaned');
  cleaningState.nextIndex += 1;
  if (cleaningState.mode === 'aquarium') {
    if (cleaningState.nextIndex >= cleaningState.total) {
      aquariumSmudges[cleaningState.round].visible = false;
      cleaningState.round += 1;
      if (cleaningState.round >= cleaningState.totalRounds) {
        completeCleaning();
        return;
      }
      cleaningState.nextIndex = 0;
      renderAquariumCleaningRound();
      return;
    }
    updateCleaningUI();
    return;
  }
  if (cleaningState.nextIndex >= cleaningState.total) {
    completeCleaning();
    return;
  }
  updateCleaningUI();
}

function sweepHighlightedSpot() {
  if (cleaningState) clearCleaningSpot(cleaningState.nextIndex);
}

function completeCleaning() {
  if (!cleaningState) return;
  const enclosure = cleaningState.enclosure;
  enclosure.cleaned = true;
  updateEnclosureVisual(enclosure);
  save.cleanedEnclosures[enclosure.id] = true;
  save.coins += 12;
  saveGame();
  updateHUD();
  cleaningState = null;
  dom.cleaningModal.classList.remove('is-aquarium');
  closeModal(dom.cleaningModal);
  toast(`${enclosure.label.replace('Inspect ', '')} is clean. +12¢`, 'success');
  setStatus('Habitat care complete. Keep the other exhibits on the same route.');
}

function addExhibitAnimals(x, z, fallbackSpecies) {
  const available = fallbackSpecies.filter((species) => (save.caught[species] || 0) > 0);
  const speciesToShow = available.length ? [...available, ...fallbackSpecies.filter((species) => !available.includes(species))] : fallbackSpecies;
  speciesToShow.slice(0, 3).forEach((species, index) => {
    const model = createAnimalModel(species, species === 'butterfly' || species === 'bee' || species === 'dragonfly' ? 0.68 : 0.75);
    const isGround = SPECIES[species].type === 'ground';
    model.position.set(x - 2.4 + index * 2.4, isGround ? 0.5 : 1.7, z - 0.3 + index * 0.25);
    world.add(model);
    const type = isGround ? 'ground' : 'flying';
    zooAnimals.push({ group: model, species, type, center: model.position.clone(), phase: index * 1.7 + x * 0.08, travel: index * 1.7 + x * 0.08, radiusX: type === 'ground' ? 2.1 : 1.45, radiusZ: type === 'ground' ? 1.25 : 0.85, speed: type === 'ground' ? 0.18 : 0.5, rest: 1 });
  });
}

function createAnimalModel(species, scale = 1) {
  const group = new THREE.Group();
  group.scale.setScalar(scale);
  const details = SPECIES[species] || SPECIES.rabbit;

  if (species === 'rabbit') {
    const body = sphere(group, 0.46, details.color, [0, 0.52, 0], { scale: [1.2, 0.9, 1.45] });
    body.userData.idleBob = 0.52;
    sphere(group, 0.31, details.color, [0, 0.82, -0.4], { scale: [1, 0.94, 0.94] });
    sphere(group, 0.08, 0x2b2723, [-0.13, 0.89, -0.65], { material: { emissive: 0x111111, emissiveIntensity: 0.3 } });
    sphere(group, 0.08, 0x2b2723, [0.13, 0.89, -0.65], { material: { emissive: 0x111111, emissiveIntensity: 0.3 } });
    sphere(group, 0.07, 0xf3b4b2, [0, 0.8, -0.7]);
    box(group, [0.16, 0.62, 0.1], details.color, [-0.15, 1.27, -0.4], { rotation: [-0.08, 0, -0.1] });
    box(group, [0.16, 0.62, 0.1], details.color, [0.15, 1.27, -0.4], { rotation: [-0.08, 0, 0.1] });
    sphere(group, 0.2, 0xf2ede0, [0, 0.6, 0.75], { scale: [1.05, 1, 0.7] });
  } else if (species === 'squirrel') {
    sphere(group, 0.46, details.color, [0, 0.58, 0], { scale: [1.05, 0.95, 1.5] });
    sphere(group, 0.2, 0xd38e5b, [0.11, 0.62, 0.44], { scale: [0.75, 1, 1.25] });
    // Head, tail and limbs hang off their own hinges so the scamper-and-freeze
    // gait can turn the head, flick the tail and swing the legs independently.
    const squirrelHead = new THREE.Group();
    squirrelHead.position.set(0, 0.84, -0.3);
    group.add(squirrelHead);
    sphere(squirrelHead, 0.3, 0xc8875d, [0, 0.04, -0.08], { scale: [1, 0.95, 0.96] });
    sphere(squirrelHead, 0.065, 0x241d1a, [-0.12, 0.1, -0.32]);
    sphere(squirrelHead, 0.065, 0x241d1a, [0.12, 0.1, -0.32]);
    sphere(squirrelHead, 0.05, 0x7d4b39, [0, 0.0, -0.42]);
    cone(squirrelHead, 0.15, 0.34, details.color, [-0.19, 0.34, -0.08], { rotation: [0, 0, -0.22] });
    cone(squirrelHead, 0.15, 0.34, details.color, [0.19, 0.34, -0.08], { rotation: [0, 0, 0.22] });
    group.userData.head = squirrelHead;
    const squirrelTail = new THREE.Group();
    squirrelTail.position.set(0, 0.66, 0.5);
    group.add(squirrelTail);
    sphere(squirrelTail, 0.28, 0xb96843, [0, 0.22, 0.28], { scale: [1.45, 1.55, 0.7], rotation: [0.5, 0, 0] });
    group.userData.tail = squirrelTail;
    const squirrelLegs = [];
    for (const side of [-1, 1]) {
      for (const front of [true, false]) {
        const hip = new THREE.Group();
        hip.position.set(side * (front ? 0.16 : 0.21), front ? 0.46 : 0.5, front ? -0.3 : 0.26);
        group.add(hip);
        cylinder(hip, front ? 0.055 : 0.085, front ? 0.05 : 0.07, front ? 0.28 : 0.34, 0xa85f3d, [0, front ? -0.14 : -0.17, 0], { segments: 6 });
        sphere(hip, front ? 0.06 : 0.08, 0x8d4f34, [0, front ? -0.28 : -0.34, -0.03], { scale: [0.85, 0.6, 1.3] });
        // Bounding gait: both front legs reach together, both hind legs push together.
        squirrelLegs.push({ pivot: hip, phase: front ? 0 : Math.PI, front });
      }
    }
    group.userData.legs = squirrelLegs;
  } else if (species === 'fox') {
    sphere(group, 0.5, details.color, [0, 0.58, 0], { scale: [1.15, 0.88, 1.5] });
    const foxHead = new THREE.Group();
    foxHead.position.set(0, 0.82, -0.34);
    group.add(foxHead);
    sphere(foxHead, 0.32, details.color, [0, 0.08, -0.11], { scale: [1, 0.92, 0.95] });
    cone(foxHead, 0.16, 0.4, details.color, [-0.18, 0.38, -0.08], { rotation: [0, 0, -0.2] });
    cone(foxHead, 0.16, 0.4, details.color, [0.18, 0.38, -0.08], { rotation: [0, 0, 0.2] });
    sphere(foxHead, 0.06, 0x20231f, [-0.12, 0.13, -0.39]);
    sphere(foxHead, 0.06, 0x20231f, [0.12, 0.13, -0.39]);
    sphere(foxHead, 0.075, 0x29231f, [0, 0.04, -0.43]);
    sphere(foxHead, 0.13, 0xf0e2cd, [0, -0.03, -0.31], { scale: [0.8, 0.6, 0.95] });
    group.userData.head = foxHead;
    const foxLegs = [];
    for (const x of [-0.25, 0.25]) {
      for (const z of [-0.34, 0.34]) {
        const hip = new THREE.Group();
        hip.position.set(x, 0.51, z);
        group.add(hip);
        box(hip, [0.14, 0.46, 0.14], details.color, [0, -0.23, 0]);
        sphere(hip, 0.075, 0x30281f, [0, -0.45, -0.02], { scale: [0.9, 0.6, 1.25] });
        // Diagonal pairs swing together, which is what a trotting fox does.
        foxLegs.push({ pivot: hip, phase: (x > 0 ? 0 : Math.PI) + (z > 0 ? Math.PI : 0), front: z < 0 });
      }
    }
    group.userData.legs = foxLegs;
    const foxTail = new THREE.Group();
    foxTail.position.set(0, 0.66, 0.52);
    group.add(foxTail);
    sphere(foxTail, 0.28, details.color, [0, 0.06, 0.3], { scale: [0.72, 1.15, 1.8], rotation: [0.44, 0, 0] });
    sphere(foxTail, 0.16, 0xf0d3a5, [0, 0.14, 0.86], { scale: [0.78, 0.92, 0.75] });
    group.userData.tail = foxTail;
  } else if (species === 'frog') {
    sphere(group, 0.43, details.color, [0, 0.4, 0], { scale: [1.25, 0.72, 1.3] });
    sphere(group, 0.34, details.color, [0, 0.62, -0.28], { scale: [1.18, 0.78, 0.9] });
    for (const x of [-0.18, 0.18]) {
      sphere(group, 0.12, 0xd9e28b, [x, 0.82, -0.48]);
      sphere(group, 0.045, 0x20251d, [x, 0.84, -0.57]);
      sphere(group, 0.2, 0x588e58, [x * 1.9, 0.25, -0.18], { scale: [1.1, 0.55, 1.5] });
      sphere(group, 0.2, 0x588e58, [x * 1.9, 0.25, 0.28], { scale: [1.1, 0.55, 1.5] });
    }
    box(group, [0.22, 0.05, 0.12], 0x2b4f35, [0, 0.51, -0.63]);
  } else if (species === 'turtle') {
    sphere(group, 0.5, 0x3f664d, [0, 0.46, 0], { scale: [1.3, 0.58, 1.45] });
    sphere(group, 0.43, details.color, [0, 0.62, 0.03], { scale: [1.15, 0.38, 1.28] });
    sphere(group, 0.2, 0x6e9a69, [0, 0.5, -0.64], { scale: [0.9, 0.8, 1.15] });
    for (const x of [-0.48, 0.48]) {
      sphere(group, 0.18, 0x5b8860, [x, 0.32, -0.36], { scale: [1.15, 0.5, 1.35] });
      sphere(group, 0.18, 0x5b8860, [x, 0.32, 0.36], { scale: [1.15, 0.5, 1.35] });
    }
    sphere(group, 0.035, 0x20251d, [-0.08, 0.58, -0.79]);
    sphere(group, 0.035, 0x20251d, [0.08, 0.58, -0.79]);
  } else if (species === 'owl') {
    sphere(group, 0.43, details.color, [0, 0.62, 0], { scale: [1, 1.18, 0.86] });
    sphere(group, 0.37, details.color, [0, 1.03, -0.02], { scale: [1.05, 0.94, 0.88] });
    for (const x of [-0.15, 0.15]) {
      sphere(group, 0.13, 0xf0e2ba, [x, 1.05, -0.35]);
      sphere(group, 0.055, 0x20231f, [x, 1.05, -0.46]);
      // Ear tufts, so the silhouette still reads as an owl with the wings folded.
      cone(group, 0.07, 0.19, details.color, [x * 1.5, 1.32, -0.05], { rotation: [0, 0, x * 0.9], segments: 5 });
    }
    cone(group, 0.08, 0.2, 0xd68b4e, [0, 0.96, -0.54], { rotation: [Math.PI / 2, 0, 0], segments: 5 });
    // Barred tail and talons anchor the body over a branch.
    box(group, [0.3, 0.07, 0.36], 0x7d6347, [0, 0.32, 0.34], { rotation: [0.34, 0, 0] });
    for (const x of [-0.12, 0.12]) cylinder(group, 0.035, 0.03, 0.16, 0xd8b06d, [x, 0.18, -0.06], { segments: 5 });
    // Wings hinge at the shoulder instead of floating beside the body, so the
    // flap sweeps the whole wing up and down the way a real downstroke does.
    const owlWings = [];
    for (const side of [-1, 1]) {
      const pivot = new THREE.Group();
      pivot.position.set(side * 0.26, 0.86, 0);
      group.add(pivot);
      sphere(pivot, 0.33, 0x8c7152, [side * 0.3, -0.07, 0.02], { scale: [1.25, 0.26, 1.0] });
      sphere(pivot, 0.21, 0x9d8360, [side * 0.08, -0.02, 0.0], { scale: [1.1, 0.5, 1.15] });
      // Layered primaries fan out toward the wingtip.
      for (let feather = 0; feather < 3; feather += 1) {
        box(pivot, [0.32, 0.03, 0.12], feather % 2 ? 0x6f5840 : 0x7f6749,
          [side * (0.62 + feather * 0.02), -0.09, -0.16 + feather * 0.16],
          { rotation: [0, 0, side * 0.06] });
      }
      pivot.userData.wingSide = side;
      // Resting droop: wings folded down against the flanks.
      pivot.rotation.z = side * -0.14;
      owlWings.push(pivot);
    }
    group.userData.wings = owlWings;
    group.userData.wingSpeed = 5.4;
    group.userData.wingSwing = 0.85;
  } else if (species === 'raccoon') {
    sphere(group, 0.48, details.color, [0, 0.58, 0], { scale: [1.1, 0.9, 1.48] });
    sphere(group, 0.31, details.color, [0, 0.88, -0.43], { scale: [1.02, 0.95, 0.94] });
    box(group, [0.5, 0.16, 0.06], 0x454c4a, [0, 0.9, -0.65]);
    sphere(group, 0.065, 0xe9e3cc, [-0.12, 0.91, -0.7]);
    sphere(group, 0.065, 0xe9e3cc, [0.12, 0.91, -0.7]);
    sphere(group, 0.05, 0x20231f, [-0.12, 0.91, -0.75]);
    sphere(group, 0.05, 0x20231f, [0.12, 0.91, -0.75]);
    cone(group, 0.14, 0.3, details.color, [-0.18, 1.14, -0.42], { rotation: [0, 0, -0.2] });
    cone(group, 0.14, 0.3, details.color, [0.18, 1.14, -0.42], { rotation: [0, 0, 0.2] });
    sphere(group, 0.27, details.color, [0, 0.72, 0.82], { scale: [0.7, 1.25, 1.8], rotation: [0.45, 0, 0] });
    box(group, [0.31, 0.12, 0.12], 0x474b46, [0, 0.78, 0.58]);
    box(group, [0.31, 0.12, 0.12], 0xe2c18b, [0, 0.82, 0.95]);
    box(group, [0.31, 0.12, 0.12], 0x474b46, [0, 0.86, 1.27]);
  } else if (species === 'sparrow') {
    sphere(group, 0.34, details.color, [0, 0, 0], { scale: [1.25, 0.9, 1.45] });
    sphere(group, 0.25, 0xc9b18d, [0, 0.17, -0.37], { scale: [1, 0.96, 0.92] });
    cone(group, 0.09, 0.24, 0xd68b4e, [0, 0.13, -0.66], { rotation: [Math.PI / 2, 0, 0], segments: 5 });
    sphere(group, 0.045, 0x20231f, [-0.1, 0.25, -0.57]);
    sphere(group, 0.045, 0x20231f, [0.1, 0.25, -0.57]);
    const sparrowWings = [];
    for (const side of [-1, 1]) {
      const pivot = new THREE.Group();
      pivot.position.set(side * 0.16, 0.04, 0);
      group.add(pivot);
      sphere(pivot, 0.22, 0x765c4b, [side * 0.16, -0.02, 0], { scale: [1.05, 0.28, 1.1] });
      box(pivot, [0.22, 0.025, 0.1], 0x63503f, [side * 0.32, -0.04, 0.12], { rotation: [0, 0, side * 0.06] });
      pivot.userData.wingSide = side;
      pivot.rotation.z = side * -0.2;
      sparrowWings.push(pivot);
    }
    group.userData.wings = sparrowWings;
    group.userData.wingSpeed = 13;
    group.userData.wingSwing = 0.66;
    cone(group, 0.15, 0.38, details.color, [0, 0.02, 0.68], { rotation: [Math.PI / 2, 0, 0], segments: 5 });
  } else if (species === 'duck') {
    sphere(group, 0.45, details.color, [0, 0.34, 0], { scale: [1.28, 0.72, 1.52] });
    sphere(group, 0.25, 0x466449, [0, 0.62, -0.42], { scale: [0.88, 0.95, 0.98] });
    sphere(group, 0.15, 0x587a61, [0, 0.73, -0.55]);
    cone(group, 0.085, 0.22, 0xe0a24c, [0, 0.68, -0.74], { rotation: [Math.PI / 2, 0, 0], segments: 5 });
    const leftWing = sphere(group, 0.28, 0x3f5d46, [-0.34, 0.42, 0], { scale: [0.65, 0.32, 1.12], rotation: [0, 0, -0.3] });
    const rightWing = sphere(group, 0.28, 0x3f5d46, [0.34, 0.42, 0], { scale: [0.65, 0.32, 1.12], rotation: [0, 0, 0.3] });
    group.userData.wings = [leftWing, rightWing];
    group.userData.wingSpeed = 10;
  } else if (details.type === 'fish') {
    const bodyColor = details.color;
    const bellyColor = species === 'trout' ? 0xf0c18e : species === 'bass' ? 0xb5c98c : species === 'crappie' ? 0xd8d2bf : 0xb8d9d0;
    const accentColor = species === 'trout' ? 0x8d4d3e : species === 'bass' ? 0x355d3c : species === 'crappie' ? 0x50586b : 0x315f7a;
    const body = sphere(group, 0.48, bodyColor, [0, 0, 0], { scale: [1.62, 0.7, 0.66], widthSegments: 16, heightSegments: 10, material: { flatShading: false, roughness: 0.48 } });
    sphere(group, 0.34, bellyColor, [0.18, -0.16, 0], { scale: [1.2, 0.46, 0.7], widthSegments: 12, heightSegments: 8, material: { flatShading: false, roughness: 0.56 } });
    const tail = cone(group, 0.36, 0.7, bodyColor, [-1.02, 0, 0], { rotation: [0, 0, -Math.PI / 2], segments: 6 });
    const dorsal = cone(group, 0.19, 0.52, accentColor, [-0.05, 0.34, 0], { rotation: [0, 0, Math.PI], segments: 4 });
    const anal = cone(group, 0.16, 0.42, accentColor, [0.02, -0.31, 0], { segments: 4 });
    const nearFin = cone(group, 0.15, 0.42, accentColor, [0.28, -0.02, -0.39], { rotation: [Math.PI / 2, 0, 0], segments: 4 });
    const farFin = cone(group, 0.15, 0.42, accentColor, [0.28, -0.02, 0.39], { rotation: [-Math.PI / 2, 0, 0], segments: 4 });
    for (const stripeX of [-0.38, -0.08, 0.22]) {
      addMesh(group, new THREE.TorusGeometry(0.35, 0.025, 5, 14), mat(accentColor, { roughness: 0.62 }), [stripeX, 0, 0], [0, Math.PI / 2, 0]);
    }
    addMesh(group, new THREE.TorusGeometry(0.24, 0.026, 5, 14), mat(accentColor, { roughness: 0.54 }), [0.44, 0, 0], [0, Math.PI / 2, 0]);
    for (const z of [-0.27, 0.27]) {
      sphere(group, 0.075, 0xf4e9c7, [0.63, 0.16, z]);
      sphere(group, 0.043, 0x17272a, [0.68, 0.17, z]);
      sphere(group, 0.016, 0xffffff, [0.7, 0.19, z - Math.sign(z) * 0.01]);
    }
    body.userData.fishBody = true;
    group.userData.fishTail = tail;
    group.userData.fishFins = [dorsal, anal, nearFin, farFin].map((fin) => ({ mesh: fin, baseRotation: fin.rotation.clone() }));
  } else if (species === 'butterfly') {
    // Body runs fore-and-aft along -Z, and both wing pairs hinge on that axis so
    // they close over the back like a book rather than pivoting mid-panel.
    const wingMaterial = { emissive: details.color, emissiveIntensity: 0.16, transparent: true, opacity: 0.94, side: THREE.DoubleSide, roughness: 0.72 };
    const hindColor = new THREE.Color(details.color).offsetHSL(0.02, -0.06, -0.07).getHex();
    const butterflyWings = [];
    for (const side of [-1, 1]) {
      const pivot = new THREE.Group();
      pivot.position.set(0, 0.05, 0);
      group.add(pivot);
      // Larger fore wing forward, rounder hind wing behind it.
      sphere(pivot, 0.3, details.color, [side * 0.27, 0, -0.13], { scale: [0.95, 0.055, 0.78], widthSegments: 8, heightSegments: 6, material: wingMaterial });
      sphere(pivot, 0.23, hindColor, [side * 0.22, -0.005, 0.19], { scale: [0.95, 0.055, 0.86], widthSegments: 8, heightSegments: 6, material: wingMaterial });
      // Wing markings: a pale eyespot and a dark leading edge.
      sphere(pivot, 0.075, 0xf7ecd6, [side * 0.33, 0.012, -0.16], { scale: [1, 0.16, 1], material: { side: THREE.DoubleSide } });
      box(pivot, [0.36, 0.01, 0.038], 0x6d4a4e, [side * 0.3, 0.018, -0.3], { rotation: [0, side * 0.2, 0] });
      pivot.userData.wingSide = side;
      // At rest the wings sit a little above horizontal, as a settled butterfly does.
      pivot.rotation.z = side * 0.16;
      butterflyWings.push(pivot);
    }
    group.userData.wings = butterflyWings;
    group.userData.wingSpeed = 9;
    group.userData.wingSwing = 0.95;
    cylinder(group, 0.032, 0.048, 0.42, 0x483c35, [0, 0.03, 0.07], { rotation: [Math.PI / 2, 0, 0], segments: 7 });
    sphere(group, 0.058, 0x3d332e, [0, 0.05, -0.2], { scale: [1, 0.95, 0.9] });
    for (const side of [-1, 1]) {
      sphere(group, 0.022, 0x1d1a17, [side * 0.036, 0.062, -0.235]);
      cylinder(group, 0.008, 0.008, 0.24, 0x483c35, [side * 0.05, 0.13, -0.3], { rotation: [-0.9, 0, side * 0.4], segments: 5 });
      sphere(group, 0.018, 0x483c35, [side * 0.088, 0.22, -0.38]);
    }
  } else if (species === 'bee') {
    sphere(group, 0.3, details.color, [0, 0, 0], { scale: [1.15, 0.8, 0.8] });
    for (const x of [-0.1, 0.12]) torus(group, 0.245, 0.035, 0x262a20, [x, 0, 0], [0, Math.PI / 2, 0], 8, 18);
    // Body runs along X, so the wing pairs sit out to ±Z and hinge on the thorax.
    const beeWingMaterial = mat(0xdcefe3, { transparent: true, opacity: 0.62, side: THREE.DoubleSide, depthWrite: false });
    const beeWings = [];
    for (const side of [-1, 1]) {
      for (const [anchorX, radius, wingPhase] of [[0.08, 0.2, 0], [-0.09, 0.15, Math.PI]]) {
        const pivot = new THREE.Group();
        pivot.position.set(anchorX, 0.19, 0);
        group.add(pivot);
        const wing = addMesh(pivot, new THREE.CircleGeometry(radius, 9), beeWingMaterial, [0, 0, side * (radius + 0.05)], [-Math.PI / 2, 0, 0]);
        wing.scale.set(0.66, 1.1, 1);
        pivot.userData.wingSide = side;
        pivot.userData.wingPhase = wingPhase;
        pivot.rotation.x = side * -0.1;
        beeWings.push(pivot);
      }
    }
    group.userData.wings = beeWings;
    group.userData.wingAxis = 'x';
    group.userData.wingSpeed = 22;
    group.userData.wingSwing = 0.4;
    sphere(group, 0.05, 0x24211c, [0.32, 0.1, -0.18]);
    sphere(group, 0.05, 0x24211c, [0.32, 0.1, 0.18]);
  } else if (species === 'dragonfly') {
    cylinder(group, 0.025, 0.09, 1.08, 0x6d8ca2, [0, 0, 0], { rotation: [0, 0, Math.PI / 2], segments: 7 });
    sphere(group, 0.075, 0x26333e, [0.58, 0, 0], { scale: [1.25, 0.82, 0.82] });
    const wingMaterial = { transparent: true, opacity: 0.86, emissive: details.color, emissiveIntensity: 0.52, side: THREE.DoubleSide, depthWrite: false };
    // Fore and hind wings beat half a cycle apart, hinged on the thorax.
    const dragonflyWings = [];
    for (const side of [-1, 1]) {
      for (const [anchorX, anchorY, width, span, wingPhase] of [[-0.12, 0.12, 0.14, 1.08, 0], [0.18, 0.08, 0.12, 0.9, Math.PI]]) {
        const pivot = new THREE.Group();
        pivot.position.set(anchorX, anchorY, 0);
        group.add(pivot);
        box(pivot, [width, 0.018, span], details.color, [0, 0, side * (span * 0.39)], { material: wingMaterial, rotation: [0, side * 0.08, 0] });
        pivot.userData.wingSide = side;
        pivot.userData.wingPhase = wingPhase;
        dragonflyWings.push(pivot);
      }
    }
    group.userData.wings = dragonflyWings;
    group.userData.wingAxis = 'x';
    group.userData.wingSwing = 0.3;
    group.userData.wingSpeed = 34;
    for (const x of [-0.32, -0.02, 0.28]) cylinder(group, 0.01, 0.01, 0.22, 0x4c6e7e, [x, 0.15, 0], { rotation: [Math.PI / 2, 0, 0], segments: 5 });
  } else if (species === 'caterpillar') {
    for (let index = 0; index < 5; index += 1) {
      sphere(group, 0.12, index % 2 ? 0x263b2f : details.color, [(index - 2) * 0.13, 0.08, 0], { scale: [1.05, 0.72, 0.82] });
    }
    sphere(group, 0.035, 0x1e211a, [0.28, 0.14, -0.08]);
  } else if (species === 'worm') {
    const wormMat = mat(details.color, { roughness: 0.95 });
    for (let index = 0; index < 7; index += 1) {
      addMesh(group, new THREE.TorusGeometry(0.11, 0.028, 5, 12), wormMat, [(index - 3) * 0.09, Math.sin(index) * 0.035, 0], [Math.PI / 2, 0, 0]);
    }
  } else if (species === 'spider') {
    sphere(group, 0.13, details.color, [0, 0.1, 0]);
    sphere(group, 0.09, 0x392e43, [0, 0.1, -0.14]);
    for (let index = 0; index < 4; index += 1) {
      const side = index % 2 ? 1 : -1;
      cylinder(group, 0.016, 0.016, 0.3, details.color, [side * 0.12, 0.1, (index - 1.5) * 0.08], { rotation: [0, side * 0.55, side * 0.72], segments: 5 });
    }
  }

  return group;
}

function resetWorld() {
  clearDebugCollisionVisuals();
  disposeGrassMeshes();
  disposeBackgroundForest();
  while (world.children.length) {
    world.remove(world.children[0]);
  }
  if (lakeCarInterior) {
    world.remove(lakeCarInterior);
    lakeCarInterior = null;
  }
  interactables = [];
  hotspots = [];
  critters = [];
  bugNodes = [];
  treeInteractions = [];
  zooAnimals = [];
  zooEnclosures = [];
  fieldCharacters = [];
  buildSites = [];
  visitors = [];
  visitorSpawnAt = 0;
  visitorsSeeded = false;
  trafficCars = [];
  passingTrafficAt = 0;
  aquariumBubbles = [];
  pollinatorFlowers = [];
  wildFlowerNodes = [];
  beehives = [];
  spiderWebs = [];
  gardenPlots = [];
  natureLoot = [];
  natureResourceNodes = [];
  aquariumSmudges = [];
  carrotNodes = [];
  ducks = [];
  duckEggNodes = [];
  colliders = [];
  lakeArrival = null;
  lakeParkedCar = null;
  lakeCaptain = null;
  lakeBoat = null;
  lakeBoatPilot = null;
  lakeGateCollider = null;
  lakeGateOpen = false;
  lakeGateNotified = false;
  lakeCabinBoundaryNotified = false;
  storeRecordBoard = null;
  cleaningState = null;
  toolAction = { name: '', startedAt: 0, duration: 0 };
  removeFishingVisuals();
  resetFishing();
}

function enterZone(zoneKey, announce = false) {
  if (!ZONES[zoneKey]) return;
  closeAllModals(false);
  resetWorld();
  currentZone = zoneKey;
  spookRisk = 0.02;
  // In the hub zones the lot now runs deeper, so arrive on the painted walkway
  // in front of the stalls rather than standing in the drive aisle.
  player.set(0, 1.72, HUB_ZONES.includes(zoneKey) ? 8 : 15);
  spawnPoint.copy(player);
  yaw = 0;
  pitch = -0.08;
  if (zoneKey === 'store') buildStore();
  if (zoneKey === 'forest') buildForest();
  if (zoneKey === 'zoo') buildZoo();
  if (zoneKey === 'lake') {
    buildJenkinsLake();
    startJenkinsLakeArrival();
  }
  // Ground cover goes down last: it reads the finished collider list so nothing
  // sprouts through a wall, a trunk or a shop display.
  dressZoneFlora(zoneKey);
  flushGrassBlades();
  if (debugCollisionVisible) rebuildDebugCollisionVisuals();
  camera.position.copy(player);
  updateCameraRotation();
  save.lastZone = zoneKey;
  saveGame();
  updateHUD();
  // A fresh page load cannot request pointer lock without a trusted gesture.
  // Travel buttons are trusted gestures, so only that path restores field mode here.
  if (zoneKey === 'lake' && announce) restoreFieldMode();
  if (announce) toast(`Arrived at ${ZONES[zoneKey].label.toLowerCase()}.`, 'success');
}

function resetFishing() {
  fishing.phase = 'idle';
  fishing.charge = 0;
  fishing.castTarget = null;
  fishing.castLanding = null;
  fishing.castBait = null;
  fishing.castLure = null;
  fishing.baitConsumed = false;
  fishing.biteAt = 0;
  fishing.biteDeadline = 0;
  fishing.reelProgress = 0;
  fishing.reelHeld = false;
  fishing.fishSpecies = null;
  fishing.fishSize = 0;
  fishing.fishWeight = 0;
  fishing.practice = false;
  fishing.hookClicks = 0;
  fishing.hookTarget = 0;
  fishing.hookStartedAt = 0;
  fishing.tensionState = 'clear';
  fishing.nextTensionAt = 0;
  fishing.tensionEndsAt = 0;
  fishing.invalidCast = false;
}

function removeFishingVisuals() {
  if (!fishingVisuals) return;
  world.remove(fishingVisuals.group);
  fishingVisuals = null;
}

function createFishingVisuals(landingPoint, hotspot = null) {
  removeFishingVisuals();
  const group = new THREE.Group();
  const flightStart = camera.position.clone();
  const bobber = sphere(group, 0.14, 0xff7c63, [flightStart.x, flightStart.y - 0.28, flightStart.z], { material: { emissive: 0x7a261d, emissiveIntensity: 1.05 } });
  const bobberTop = sphere(group, 0.06, 0xf8ead0, [flightStart.x, flightStart.y - 0.14, flightStart.z]);
  const lineGeometry = new THREE.BufferGeometry().setFromPoints([camera.position.clone(), bobber.position.clone()]);
  const line = new THREE.Line(lineGeometry, new THREE.LineBasicMaterial({ color: 0xf3dfb5, transparent: true, opacity: 0.8 }));
  group.add(line);
  world.add(group);
  fishingVisuals = { group, bobber, bobberTop, line, hotspot, landingPoint: landingPoint.clone(), flightStart: new THREE.Vector3(flightStart.x, flightStart.y - 0.28, flightStart.z), flightTarget: new THREE.Vector3(landingPoint.x, 0.3, landingPoint.z), flightProgress: 0, isFlying: true };
}

function updateCastPreview() {
  if (fishing.phase !== 'charging') {
    if (fishingVisuals?.preview) removeFishingVisuals();
    return;
  }
  const landingPoint = getCastLandingPoint();
  if (!fishingVisuals?.preview) {
    const group = new THREE.Group();
    const ring = addMesh(group, new THREE.RingGeometry(0.32, 0.48, 24), mat(0x9fead4, { transparent: true, opacity: 0.72, emissive: 0x286d6b, emissiveIntensity: 0.8, side: THREE.DoubleSide }), [landingPoint.x, 0.2, landingPoint.z], [-Math.PI / 2, 0, 0]);
    const core = sphere(group, 0.08, 0xd7f7ec, [landingPoint.x, 0.25, landingPoint.z], { material: { emissive: 0x75e0bd, emissiveIntensity: 1.2 } });
    world.add(group);
    fishingVisuals = { group, ring, core, preview: true };
  } else {
    fishingVisuals.ring.position.set(landingPoint.x, 0.2, landingPoint.z);
    fishingVisuals.core.position.set(landingPoint.x, 0.25, landingPoint.z);
  }
  fishingVisuals.ring.scale.setScalar(0.92 + Math.sin(elapsed * 4.5) * 0.08);
}

function updateFishingVisuals(delta = 0) {
  if (!fishingVisuals) return;
  if (fishingVisuals.preview) return;
  const { bobber, bobberTop, line } = fishingVisuals;
  if (fishingVisuals.isFlying) {
    fishingVisuals.flightProgress = clamp(fishingVisuals.flightProgress + delta * 2.15, 0, 1);
    const progress = fishingVisuals.flightProgress;
    bobber.position.lerpVectors(fishingVisuals.flightStart, fishingVisuals.flightTarget, progress);
    bobber.position.y += Math.sin(progress * Math.PI) * 2.4;
    if (progress >= 1) fishingVisuals.isFlying = false;
  }
  const linePositions = line.geometry.attributes.position.array;
  linePositions[0] = camera.position.x;
  linePositions[1] = camera.position.y - 0.28;
  linePositions[2] = camera.position.z;
  linePositions[3] = bobber.position.x;
  linePositions[4] = bobber.position.y;
  linePositions[5] = bobber.position.z;
  line.geometry.attributes.position.needsUpdate = true;
  const wave = Math.sin(elapsed * 3.2) * 0.035;
  if (!fishingVisuals.isFlying) bobber.position.y = 0.28 + wave;
  bobberTop.position.set(bobber.position.x, bobber.position.y + 0.14, bobber.position.z);
  if (fishing.phase === 'bite') {
    const pulse = 1 + Math.sin(elapsed * 18) * 0.28;
    bobber.scale.setScalar(pulse);
    bobberTop.scale.setScalar(pulse);
  } else {
    bobber.scale.setScalar(1);
    bobberTop.scale.setScalar(1);
  }
}

function startCast() {
  if (!['forest', 'zoo', 'lake'].includes(currentZone) || activeTool !== 'rod') return;
  if (fishing.phase !== 'idle') return;
  if (['forest', 'lake'].includes(currentZone) && (save.supplies[selectedBait] || 0) <= 0) {
    toast(`No ${selectedBait} left. Visit the field store.`, 'warning');
    return;
  }
  fishing.phase = 'charging';
  fishing.charge = 0;
  triggerToolAction('rod-charge', 0.38);
  setStatus('Hold to load the cast. Aim at a water disturbance before releasing.');
}

function finishCast() {
  if (fishing.phase !== 'charging') return;
  fishing.charge = clamp(fishing.charge, 0.18, 1);
  const target = getAimedHotspot();
  const landingPoint = target ? target.position.clone() : getCastLandingPoint();
  fishing.castBait = selectedBait;
  fishing.castLure = selectedLure;
  fishing.practice = Boolean(target?.practice && currentZone === 'zoo');
  fishing.phase = 'waiting';
  fishing.castTarget = target;
  fishing.castLanding = landingPoint;
  fishing.invalidCast = !target || (!fishing.practice && (target.lure !== fishing.castLure || target.bait !== fishing.castBait));
  fishing.biteAt = fishing.invalidCast ? Number.POSITIVE_INFINITY : elapsed + 2.6 + Math.random() * 2;
  triggerToolAction('rod-cast', 0.55);
  createFishingVisuals(landingPoint, target);
  saveGame();
  if (!target) {
    setStatus('The lure landed outside a feeding disturbance. Reel it back and cast again.');
    toast('Lure landed. No fish are responding at this spot.', 'warning');
  } else if (fishing.invalidCast) {
    setStatus(`No response. This disturbance calls for ${formatName(target.lure)} + ${formatName(target.bait)}.`);
    toast('Wrong presentation for this hot spot. Reel back and change the bait or lure.', 'warning');
  } else {
    setStatus('The bobber is in the hot spot. Listen for the bite.');
    toast(`${formatName(fishing.castLure)} landed in the disturbance.`, 'success');
  }
}

function startReelIn() {
  if (fishing.phase !== 'waiting') return;
  fishing.phase = 'returning';
  fishing.reelHeld = true;
  setStatus('Reeling the line back to shore.');
}

function setHook() {
  if (fishing.phase === 'bite') {
    if (elapsed > fishing.biteDeadline) {
      failHook();
      return;
    }
    fishing.phase = 'hooking';
    fishing.hookClicks = 1;
    fishing.hookTarget = Math.round(clamp(4 + fishing.fishWeight * 2.15, 5, 18));
    fishing.hookStartedAt = elapsed;
    triggerToolAction('rod-hook', 0.32);
    setStatus(`Set the hook: click ${fishing.hookTarget} times over 2 seconds.`);
    return;
  }
  if (fishing.phase !== 'hooking') return;
  fishing.hookClicks += 1;
  triggerToolAction('rod-hook', 0.16);
  if (fishing.hookClicks > fishing.hookTarget + 2) failHook('You over-set the hook and the fish tore free.');
}

function completeHooking() {
  const clicks = fishing.hookClicks;
  const target = fishing.hookTarget;
  if (clicks < target - 1 || clicks > target + 2) {
    failHook(clicks < target ? 'The hook never seated. The fish slipped away.' : 'You over-set the hook and the fish tore free.');
    return;
  }
  fishing.phase = 'reeling';
  fishing.reelProgress = 0.18;
  fishing.reelHeld = false;
  fishing.tensionState = 'clear';
  fishing.nextTensionAt = elapsed + 3.5 + Math.random() * 4.5;
  setStatus(`Hook set. Reel in the ${SPECIES[fishing.fishSpecies].label.toLowerCase()}.`);
  toast('Hook set — watch the callout and stop reeling when the fish surges.', 'success');
}

function failHook(message = '') {
  const species = fishing.fishSpecies ? SPECIES[fishing.fishSpecies].label : 'fish';
  resetFishing();
  removeFishingVisuals();
  toast(message || `Too slow. The ${species.toLowerCase()} slipped the hook.`, 'danger');
  setStatus('The disturbance is quiet again. Try another cast.');
}

function breakFishingLine() {
  const lure = fishing.castLure;
  if (lure) save.supplies[lure] = Math.max(0, (save.supplies[lure] || 0) - 1);
  resetFishing();
  removeFishingVisuals();
  saveGame();
  updateHUD();
  toast(`The line snapped. Your ${formatName(lure || 'lure')} was lost.`, 'danger');
  setStatus('The fish is gone. Revisit the store if you need another lure.');
}

function landFish() {
  const species = fishing.fishSpecies;
  if (fishing.practice) {
    resetFishing();
    removeFishingVisuals();
    toast('Practice catch released. No bait, lure, coins, or records were used.', 'success');
    setStatus('Practice pond reset. Try another cast without affecting your field notes.');
    return;
  }
  spookRisk = clamp(spookRisk + 0.12, 0, 1);
  const record = {
    species,
    size: Number(fishing.fishSize.toFixed(1)),
    weight: Number(fishing.fishWeight.toFixed(2)),
    caughtAt: new Date().toISOString(),
    bait: fishing.castBait,
    lure: fishing.castLure
  };
  const previous = save.records[species];
  const isRecord = !previous || record.weight > previous.weight || (record.weight === previous.weight && record.size > previous.size);
  save.caught[species] = (save.caught[species] || 0) + 1;
  save.ingredients[species] = (save.ingredients[species] || 0) + 1;
  save.coins += species === 'trout' ? 18 : 22;
  if (isRecord) save.records[species] = record;
  resetFishing();
  removeFishingVisuals();
  saveGame();
  refreshStoreRecordBoard();
  updateHUD();
  toast(`${SPECIES[species].label}: ${record.size} in / ${record.weight} lb${isRecord ? ' — NEW PERSONAL RECORD' : ''}`, isRecord ? 'success' : 'success');
  setStatus(isRecord ? 'New record logged. The field store record board has been updated.' : 'A clean landing. You can cast again or head back to the car.');
}

function formatFishRecord(record) {
  if (!record) return 'No personal record yet.';
  const caught = new Date(record.caughtAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
  return `${SPECIES[record.species]?.label || formatName(record.species)} · ${record.size} in · ${record.weight} lb · ${caught} · ${formatName(record.bait || 'unknown bait')} + ${formatName(record.lure || 'unknown lure')}`;
}

function updateFishing(delta) {
  if (fishing.phase === 'charging') {
    fishing.charge = clamp(fishing.charge + delta * 0.72, 0, 1);
  }
  if (fishing.phase === 'waiting' && fishing.castTarget && elapsed >= fishing.biteAt) {
    fishing.phase = 'bite';
    fishing.fishSpecies = fishing.castTarget.fishSpecies;
    const fishProfile = {
      trout: { size: 13.5, weightBase: 0.7, weightRange: 4.3 },
      sunfish: { size: 8.5, weightBase: 0.25, weightRange: 1.8 },
      bass: { size: 18, weightBase: 1.1, weightRange: 8.5 },
      crappie: { size: 12, weightBase: 0.35, weightRange: 2.7 }
    }[fishing.fishSpecies] || { size: 8.5, weightBase: 0.25, weightRange: 1.8 };
    fishing.fishSize = 7.5 + Math.random() * fishProfile.size;
    fishing.fishWeight = fishProfile.weightBase + Math.random() * fishProfile.weightRange;
    fishing.biteDeadline = elapsed + 1.3;
    if (!fishing.practice && !fishing.baitConsumed && fishing.castBait) {
      save.supplies[fishing.castBait] = Math.max(0, save.supplies[fishing.castBait] - 1);
      fishing.baitConsumed = true;
      saveGame();
      updateHUD();
    }
    setStatus(`BITE — click now to set the hook.`);
    toast('BITE! Click the action button or left mouse now.', 'success');
  }
  if (fishing.phase === 'bite' && elapsed > fishing.biteDeadline) {
    failHook();
  }
  if (fishing.phase === 'hooking' && elapsed - fishing.hookStartedAt >= 2) completeHooking();
  if (fishing.phase === 'returning' && fishingVisuals) {
    tempVector.set(camera.position.x, 0.3, camera.position.z);
    fishingVisuals.bobber.position.lerp(tempVector, clamp(delta * 2.6, 0, 1));
    if (fishingVisuals.bobber.position.distanceTo(tempVector) < 0.5) {
      resetFishing();
      removeFishingVisuals();
      setStatus('Line retrieved. Choose a better angle or presentation.');
    }
  }
  if (fishing.phase === 'reeling') {
    const held = fishing.reelHeld || primaryHeld || actionHeld;
    if (fishing.tensionState === 'clear' && elapsed >= fishing.nextTensionAt) {
      fishing.tensionState = 'stop';
      fishing.tensionEndsAt = elapsed + 1.35;
      setStatus('STOP REELING. The fish is surging and the line is under tension.');
      toast('Let the fish run — do not reel during the surge.', 'warning');
    }
    if (fishing.tensionState === 'stop') {
      if (held && Math.random() < delta * 0.035) {
        breakFishingLine();
        return;
      }
      if (elapsed >= fishing.tensionEndsAt) {
        if (!held) {
          fishing.reelProgress = Math.max(0, fishing.reelProgress - 0.16);
          setStatus('The fish gained line. Resume reeling carefully.');
        }
        fishing.tensionState = 'clear';
        fishing.nextTensionAt = elapsed + 3.5 + Math.random() * 4.5;
      }
      return;
    }
    const weightFactor = clamp(fishing.fishWeight / 5, 0, 1);
    const reelRate = 0.34 - weightFactor * 0.16;
    fishing.reelProgress += delta * (held ? reelRate : -0.035);
    fishing.reelProgress = clamp(fishing.reelProgress, 0, 1);
    if (fishingVisuals) {
      const start = fishing.castLanding || fishingVisuals.hotspot?.position || fishingVisuals.bobber.position;
      tempVector.set(camera.position.x, 0.3, camera.position.z);
      fishingVisuals.bobber.position.lerp(tempVector, clamp(delta * (held ? 1.9 - weightFactor * 0.8 : 0.35), 0, 1));
      fishingVisuals.bobber.position.y = 0.3 + Math.sin(elapsed * 12) * 0.06;
      fishingVisuals.bobberTop.position.set(fishingVisuals.bobber.position.x, fishingVisuals.bobber.position.y + 0.14, fishingVisuals.bobber.position.z);
      if (fishingVisuals.bobber.position.distanceTo(start) < 0.8 && held) {
        fishingVisuals.bobber.position.lerp(tempVector, 0.04);
      }
      if (held && fishingVisuals.bobber.position.distanceTo(tempVector) < 0.58) fishing.reelProgress = 1;
    }
    if (fishing.reelProgress >= 1) landFish();
  }
}

function useNet() {
  if (!['forest', 'store', 'zoo', 'lake'].includes(currentZone) || activeTool !== 'net') return;
  triggerToolAction('net-swing', 0.42);
  const critter = getNetCritterTarget();
  if (!critter) {
    const duck = getNetDuckTarget();
    if (duck) {
      const distance = distanceTo(duck.group.position);
      if (duck.state !== 'flee' && distance <= 5.5 && currentNoise < 0.7) {
        catchDuck(duck);
        return;
      }
    }
    toast('No clear net target. Sneak close and line up the animal.', 'warning');
    return;
  }
  if (critter.state === 'flee') {
    toast('The animal already knows you are there.', 'warning');
    return;
  }
  const distance = distanceTo(critter.group.position);
  const noisyOutsideCloseRange = currentNoise > 0.56 && distance > 3.1;
  if (distance > 5.5 || noisyOutsideCloseRange) {
    scareCritter(critter);
    toast('The net rustled too loudly. It fled into the brush.', 'warning');
    return;
  }
  catchCritter(critter);
}

function catchDuck(duck) {
  duck.state = 'captured';
  spookRisk = clamp(spookRisk + 0.2, 0, 1);
  save.caught.duck = (save.caught.duck || 0) + 1;
  save.coins += 15;
  world.remove(duck.group);
  saveGame();
  updateHUD();
  toast('Mallard duck captured. It will settle by the practice pond.', 'success');
  setStatus('The duck is now part of the showcase flock and may lay lootable eggs.');
}

function catchCritter(critter) {
  critter.caught = true;
  spookRisk = clamp(spookRisk + 0.2, 0, 1);
  save.caught[critter.species] = (save.caught[critter.species] || 0) + 1;
  save.coins += 15;
  world.remove(critter.group);
  saveGame();
  updateHUD();
  toast(`${SPECIES[critter.species].label} recorded. +15¢`, 'success');
  setStatus('A quiet capture. There are more field notes to fill.');
}

function scareCritter(critter) {
  spookRisk = clamp(spookRisk + 0.08, 0, 1);
  critter.state = 'flee';
  critter.fleeTime = 3.8;
  tempVector.subVectors(critter.group.position, player).setY(0).normalize();
  critter.direction = Math.atan2(tempVector.x, tempVector.z);
  critter.targetDirection = critter.direction;
  if (critter.gait) critter.gait.mode = 'move';
}

function catchBug(bug) {
  spookRisk = clamp(spookRisk + 0.14, 0, 1);
  bug.revealed = false;
  bug.cooldown = 8;
  bug.bugModel.visible = false;
  bug.marker.visible = false;
  save.caught[bug.species] = (save.caught[bug.species] || 0) + 1;
  save.coins += 12;
  saveGame();
  updateHUD();
  toast(`${SPECIES[bug.species].label} recorded. +12¢`, 'success');
  setStatus('The wingbeat is safely logged. Watch for another trace.');
}

function startBugObservation() {
  if (!['forest', 'zoo', 'lake'].includes(currentZone) || activeTool !== 'magnifier') return;
  const bug = getAimBug(false);
  if (!bug) {
    toast('Aim at the subtle pulse on the plant branch before inspecting.', 'warning');
    return;
  }
  triggerToolAction('magnifier-inspect', 0.5);
  dom.inspectionZoom.innerHTML = '<div class="inspection-plant-shape"></div><div class="inspection-branch-shape branch-left"></div><div class="inspection-branch-shape branch-right"></div><div class="inspection-branch-shape branch-top"></div><div class="inspection-leaf-shape leaf-one"></div><div class="inspection-leaf-shape leaf-two"></div><div class="inspection-leaf-shape leaf-three"></div><button id="capture-jar" class="capture-jar is-closed" type="button" aria-label="Open capture jar"></button><button id="inspection-bug" class="inspection-bug" type="button" aria-label="Moving bug">✣</button>';
  const bugElement = dom.inspectionZoom.querySelector('#inspection-bug');
  dom.captureJar = dom.inspectionZoom.querySelector('#capture-jar');
  const spider = bug.species === 'spider';
  const branchPath = spider
    ? [[76, 24], [67, 31], [59, 41], [50, 49], [39, 55], [29, 62]]
    : bug.species === 'worm'
      ? [[16, 67], [29, 61], [42, 55], [55, 60], [68, 66], [80, 69]]
      : [[20, 67], [32, 60], [44, 51], [55, 40], [66, 30], [79, 24]];
  qteState = { kind: 'inspection', bug, x: branchPath[0][0], y: branchPath[0][1], vx: spider ? -8 : 10, vy: spider ? 5 : -7, branchPath, pathProgress: 0, pathSpeed: spider ? 0.27 : 0.36, hovering: false, hoverTime: 0, frozen: false, frozenAt: 0, dragging: false, jarOpen: false, bugInJar: false, jarLidOn: false };
  bugElement.classList.toggle('is-spider', spider);
  bugElement.textContent = bug.species === 'worm' ? '≈' : bug.species === 'caterpillar' ? '◍' : '✣';
  bugElement.addEventListener('pointerenter', () => { if (qteState) qteState.hovering = true; });
  bugElement.addEventListener('pointerleave', () => { if (qteState && !qteState.dragging) qteState.hovering = false; });
  bugElement.addEventListener('pointerdown', (event) => {
    if (!qteState?.frozen) return;
    qteState.dragging = true;
    bugElement.setPointerCapture(event.pointerId);
  });
  bugElement.addEventListener('pointermove', (event) => {
    if (!qteState?.dragging) return;
    const rect = dom.inspectionZoom.getBoundingClientRect();
    qteState.x = clamp(((event.clientX - rect.left) / rect.width) * 100, 8, 92);
    qteState.y = clamp(((event.clientY - rect.top) / rect.height) * 100, 10, 88);
  });
  bugElement.addEventListener('pointerup', (event) => {
    if (!qteState?.dragging) return;
    qteState.dragging = false;
    const bugRect = bugElement.getBoundingClientRect();
    const jarRect = dom.captureJar.getBoundingClientRect();
    const centerX = bugRect.left + bugRect.width / 2;
    const centerY = bugRect.top + bugRect.height / 2;
    const inside = centerX > jarRect.left && centerX < jarRect.right && centerY > jarRect.top && centerY < jarRect.bottom;
    if (inside && qteState.jarOpen) {
      qteState.bugInJar = true;
      bugElement.classList.add('is-in-jar');
      qteState.x = ((jarRect.left + jarRect.width * 0.5 - dom.inspectionZoom.getBoundingClientRect().left) / dom.inspectionZoom.getBoundingClientRect().width) * 100;
      qteState.y = ((jarRect.top + jarRect.height * 0.45 - dom.inspectionZoom.getBoundingClientRect().top) / dom.inspectionZoom.getBoundingClientRect().height) * 100;
      dom.captureJar.classList.add('has-bug');
      dom.qteAction.classList.remove('is-hidden');
      dom.inspectionState.textContent = 'Bug captured. Put the lid on the jar.';
    } else resumeInspectionBug(qteState.jarOpen ? 'It slipped free. Track it again, then drag carefully into the open jar.' : 'Open the jar first. The bug is moving again.');
    bugElement.releasePointerCapture?.(event.pointerId);
  });
  dom.captureJar.addEventListener('click', () => {
    if (!qteState || qteState.bugInJar) return;
    qteState.jarOpen = true;
    dom.captureJar.classList.remove('is-closed');
    dom.captureJar.classList.add('is-open');
    dom.inspectionState.textContent = qteState.frozen ? 'Jar open. Drag the frozen bug into it.' : 'Jar open. Hold the lens over the moving bug.';
  });
  modalOpen = true;
  dom.qteCopy.textContent = `A ${SPECIES[bug.species].label.toLowerCase()} is moving along this branch. Open the jar, hold the lens over it until it freezes, then drag it into the jar within 2 seconds.`;
  dom.inspectionState.textContent = 'Open the capture jar before handling the bug.';
  dom.qteAction.classList.add('is-hidden');
  dom.qteModal.classList.remove('is-hidden');
  releaseFieldModeForModal();
  setStatus('Movement paused for close observation.');
}

function resolveBugObservation() {
  if (qteState?.kind !== 'inspection') return;
  if (!qteState.bugInJar) {
    dom.inspectionState.textContent = 'Drag the frozen bug into the open capture jar first.';
    return;
  }
  if (!qteState.jarLidOn) {
    qteState.jarLidOn = true;
    dom.captureJar.classList.remove('is-open');
    dom.captureJar.classList.add('is-closed');
    dom.qteAction.classList.add('is-hidden');
    dom.inspectionState.textContent = 'Jar sealed. The specimen is secure.';
    completeBugCapture(qteState.bug);
  }
}

function completeBugCapture(bug) {
  if (!bug) return;
  qteState = null;
  modalOpen = false;
  dom.qteModal.classList.add('is-hidden');
  restoreFieldMode();
  bug.cooldown = 10;
  bug.revealed = false;
  bug.bugModel.visible = false;
  bug.marker.visible = false;
  save.caught[bug.species] = (save.caught[bug.species] || 0) + 1;
  if (bug.species === 'worm') save.supplies.worms = (save.supplies.worms || 0) + 1;
  save.coins += bug.species === 'worm' ? 4 : 8;
  saveGame();
  updateHUD();
  toast(`${SPECIES[bug.species].label} sealed in the capture jar${bug.species === 'worm' ? ' — fishing lure added' : ''}.`, 'success');
  setStatus(bug.species === 'worm' ? 'The worm is ready to use as fishing bait.' : 'The tiny field note is safely recorded.');
}

function getAimedHotspot() {
  if (!hotspots.length) return null;
  raycaster.setFromCamera(centerScreen, camera);
  const hits = raycaster.intersectObjects(hotspots.map((hotspot) => hotspot.target), false);
  return hits.length ? hotspots.find((hotspot) => hotspot.target === hits[0].object) : null;
}

function getCastLandingPoint() {
  raycaster.setFromCamera(centerScreen, camera);
  const origin = raycaster.ray.origin;
  const direction = raycaster.ray.direction;
  const water = currentZone === 'zoo' ? PRACTICE_POND : getNatureWater();
  const landing = new THREE.Vector3(water.centerX, 0.18, water.centerZ);
  if (Math.abs(direction.y) > 0.01) {
    const distance = (0.18 - origin.y) / direction.y;
    if (distance > 0) landing.copy(origin).addScaledVector(direction, distance);
  }
  landing.y = 0.18;
  const castRadiusX = water.castRadiusX || water.castRadius;
  const castRadiusZ = water.castRadiusZ || water.castRadius;
  const offsetX = landing.x - water.centerX;
  const offsetZ = landing.z - water.centerZ;
  const distance = (offsetX / castRadiusX) ** 2 + (offsetZ / castRadiusZ) ** 2;
  if (distance > 1) {
    const scale = 1 / Math.sqrt(distance);
    landing.x = water.centerX + offsetX * scale;
    landing.z = water.centerZ + offsetZ * scale;
  }
  return landing;
}

function getAimTarget(items, maxDistance, maxAngle = 0.34) {
  camera.getWorldDirection(lookDirection);
  let best = null;
  for (const item of items) {
    const targetPosition = item.aimPosition || (item.group ? item.group.position : item.position);
    const distance = distanceTo(targetPosition);
    if (distance > maxDistance) continue;
    tempVector.subVectors(targetPosition, camera.position).normalize();
    const angle = lookDirection.angleTo(tempVector);
    if (angle > maxAngle) continue;
    if (!best || distance < best.distance) best = { item, distance, angle };
  }
  return best?.item || null;
}

function getAimCritter() {
  return getAimTarget(critters.filter((critter) => !critter.caught && !critter.hidden), 8.5, 0.34);
}

function getNetCritterTarget() {
  const candidates = critters.filter((critter) => !critter.caught && !critter.hidden && critter.state !== 'flee');
  const closeCandidates = candidates
    .filter((critter) => distanceTo(critter.group.position) <= 5.5)
    .sort((a, b) => distanceTo(a.group.position) - distanceTo(b.group.position));
  const aimedClose = getAimTarget(closeCandidates, 5.5, 1.05);
  if (aimedClose) return aimedClose;
  if (closeCandidates.length) return closeCandidates[0];
  return getAimTarget(candidates, 8.5, 0.75);
}

function getNetDuckTarget() {
  if (!['forest', 'lake'].includes(currentZone)) return null;
  return getAimTarget(ducks.filter((duck) => duck.state === 'float'), 7.5, 0.72);
}

function getAimBug(revealedOnly = false) {
  return getAimTarget(bugNodes.filter((bug) => bug.cooldown <= 0 && isSpeciesActive(bug.species) && ['worm', 'caterpillar', 'spider'].includes(bug.species) && (!revealedOnly || bug.revealed)), 7.5, 0.62);
}

function getNearbyBug() {
  return bugNodes.filter((bug) => bug.cooldown <= 0 && isSpeciesActive(bug.species) && ['worm', 'caterpillar', 'spider'].includes(bug.species) && !bug.revealed).sort((a, b) => distanceTo(a.position) - distanceTo(b.position))[0] || null;
}

function getNearestRevealedBug() {
  return bugNodes
    .filter((bug) => bug.cooldown <= 0 && bug.revealed && distanceTo(bug.position) <= 5.8)
    .sort((a, b) => distanceTo(a.position) - distanceTo(b.position))[0] || null;
}

// Every winged model registers hinge groups in `userData.wings`, each tagged with
// the side of the body it belongs to. `wingAxis` says which body axis the stroke
// turns around: 'z' for wings that reach out along ±X (birds, butterflies), 'x'
// for insects whose body runs along X and whose wings reach out along ±Z.
// `strength` scales the whole stroke, so a resting animal can hold its wings still.
function animateWings(group, phase = 0, speed = group.userData.wingSpeed || 12, strength = 1) {
  const wings = group.userData.wings;
  if (!wings?.length) return;
  const swing = (group.userData.wingSwing ?? 0.45) * strength;
  const axis = group.userData.wingAxis || 'z';
  for (const wing of wings) {
    if (!wing.userData.baseRotation) wing.userData.baseRotation = wing.rotation.clone();
    const side = wing.userData.wingSide ?? 1;
    const flap = Math.sin(elapsed * speed + phase + (wing.userData.wingPhase || 0));
    if (axis === 'x') {
      wing.rotation.x = wing.userData.baseRotation.x + flap * swing * side;
      wing.rotation.y = wing.userData.baseRotation.y + flap * 0.06 * side;
      continue;
    }
    // Rolling the hinge about Z lifts the whole panel from the shoulder; the small
    // pitch offset gives the downstroke its forward sweep.
    wing.rotation.z = wing.userData.baseRotation.z + flap * swing * side;
    wing.rotation.x = wing.userData.baseRotation.x + Math.cos(elapsed * speed + phase) * swing * 0.16;
  }
}

// Ground locomotion profiles. Everything that separates a fox's steady, wary
// trot from a squirrel's short scamper-and-freeze lives in these numbers.
const GROUND_GAITS = {
  fox: {
    moveSpeed: 1.42, fleeSpeed: 4.1, moveFor: [2.2, 4.8], pauseFor: [1.3, 3.1],
    turnRate: 1.15, wanderTurn: 0.55, strideRate: 4.6, strideLift: 0.42,
    bodyLift: 0.05, tailSway: 0.2, roam: 6.6, sniffs: true, bounds: false
  },
  squirrel: {
    moveSpeed: 2.7, fleeSpeed: 4.8, moveFor: [0.4, 1.15], pauseFor: [0.65, 2.0],
    turnRate: 5.4, wanderTurn: 2.3, strideRate: 6.4, strideLift: 0.72,
    bodyLift: 0.17, tailSway: 0.5, roam: 4.4, sniffs: false, bounds: true
  }
};

function randomBetween([min, max]) {
  return min + Math.random() * (max - min);
}

function ensureCritterGait(critter, gait) {
  if (!critter.gait) {
    critter.gait = {
      mode: 'pause',
      until: elapsed + randomBetween(gait.pauseFor) * Math.random(),
      stride: Math.random() * Math.PI * 2,
      speed: 0
    };
    critter.targetDirection = critter.direction;
  }
  return critter.gait;
}

// Poses the body for whatever speed it is currently travelling at: the legs swing
// from their hips, the spine lifts with each bound or footfall, and the head and
// tail keep working while the animal is standing still.
function poseGroundCritter(critter, gait, delta, speed, paused) {
  const state = ensureCritterGait(critter, gait);
  const animal = critter.group;
  const effort = clamp(speed / gait.moveSpeed, 0, 1.6);
  state.stride += (paused ? 0 : Math.max(speed, 0.2)) * gait.strideRate * delta;
  const stride = Math.sin(state.stride);
  if (gait.bounds) {
    // Each bound throws the whole body forward and up, then lands nose-first.
    const hop = Math.max(0, stride);
    animal.position.y = 0.42 + hop * gait.bodyLift * effort;
    animal.rotation.x = -Math.cos(state.stride) * 0.26 * effort;
  } else {
    animal.position.y = 0.42 + Math.abs(stride) * gait.bodyLift * effort;
    animal.rotation.x = stride * 0.035 * effort + (paused && gait.sniffs ? 0.05 : 0);
  }
  const legs = animal.userData.legs;
  if (legs) {
    const amplitude = gait.strideLift * Math.max(effort, paused ? 0 : 0.12);
    for (const leg of legs) {
      leg.pivot.rotation.x = Math.sin(state.stride + leg.phase) * amplitude;
    }
  }
  const head = animal.userData.head;
  if (head) {
    if (paused) {
      // Frozen and checking the field: squirrels snap their heads around, foxes
      // drop their nose to the ground and work it slowly back and forth.
      const scan = Math.sin(elapsed * (gait.bounds ? 3.6 : 1.4) + critter.home.x);
      head.rotation.y = scan * (gait.bounds ? 0.62 : 0.34);
      head.rotation.x = gait.sniffs ? 0.34 + Math.sin(elapsed * 2.4) * 0.09 : -0.16 + Math.abs(scan) * 0.1;
    } else {
      const ease = Math.min(1, delta * 6);
      head.rotation.y += (Math.sin(state.stride * 0.5) * 0.06 - head.rotation.y) * ease;
      head.rotation.x += ((gait.bounds ? -0.1 : 0.05) - head.rotation.x) * ease;
    }
  }
  const tail = animal.userData.tail;
  if (tail) {
    if (gait.bounds) {
      // The squirrel's tail arcs over its back on each bound and flicks when frozen.
      tail.rotation.x = -0.2 - Math.max(0, stride) * 0.5 * effort - (paused ? Math.abs(Math.sin(elapsed * 5.4)) * 0.32 : 0);
      tail.rotation.z = Math.sin(elapsed * 4.6 + critter.home.z) * gait.tailSway * 0.3;
    } else {
      // The fox's brush sways with the trot and hangs low when it stops.
      tail.rotation.y = Math.sin(state.stride * 0.5) * gait.tailSway;
      tail.rotation.x = paused ? 0.2 : -0.05 + stride * 0.07 * effort;
    }
  }
}

// Bursts of travel separated by stationary beats, rather than a constant drift.
function updateGroundGait(critter, gait, delta) {
  const state = ensureCritterGait(critter, gait);
  const animal = critter.group;
  const wary = distanceTo(animal.position) < 9 && currentNoise > 0.22;
  if (elapsed >= state.until) {
    if (state.mode === 'move') {
      state.mode = 'pause';
      state.until = elapsed + randomBetween(gait.pauseFor) * (wary ? 1.6 : 1);
    } else {
      state.mode = 'move';
      state.until = elapsed + randomBetween(gait.moveFor);
      critter.targetDirection = critter.direction + (Math.random() - 0.5) * gait.wanderTurn * 2;
    }
  }
  if (animal.position.distanceTo(critter.home) > gait.roam) {
    tempVector.subVectors(critter.home, animal.position).setY(0).normalize();
    critter.targetDirection = Math.atan2(tempVector.x, tempVector.z);
  }
  steerCritterFromEdge(critter, delta);
  let turn = (critter.targetDirection ?? critter.direction) - critter.direction;
  while (turn > Math.PI) turn -= Math.PI * 2;
  while (turn < -Math.PI) turn += Math.PI * 2;
  critter.direction += clamp(turn, -gait.turnRate * delta, gait.turnRate * delta);
  const target = state.mode === 'move' ? gait.moveSpeed * (wary ? 1.2 : 1) : 0;
  state.speed += (target - state.speed) * Math.min(1, delta * (gait.bounds ? 11 : 4.5));
  animal.position.x += Math.sin(critter.direction) * state.speed * delta;
  animal.position.z += Math.cos(critter.direction) * state.speed * delta;
  keepGroundAnimalOnLand(animal, critter);
  poseGroundCritter(critter, gait, delta, state.speed, state.mode === 'pause' && state.speed < 0.12);
}

function updateCritters(delta) {
  for (const critter of critters) {
    if (critter.caught) continue;
    const onSchedule = isSpeciesActive(critter.species);
    if (critter.hidden) {
      if (onSchedule && elapsed >= critter.respawnAt) respawnCritter(critter);
      continue;
    }
    // Off-hours animals slip away rather than standing around out of season.
    if (!onSchedule) {
      retireCritter(critter);
      continue;
    }
    const animal = critter.group;
    const gait = GROUND_GAITS[critter.species];
    const isFlying = SPECIES[critter.species].type === 'flying' || ['butterfly', 'bee', 'dragonfly'].includes(critter.species);
    if (isFlying) animateWings(animal, critter.home.x);
    critter.stateTime += delta;
    const distance = distanceTo(animal.position);
    if (critter.state === 'idle') {
      const attracting = activeTool === 'food' && (selectedFood === 'carrots') && (critter.species === 'rabbit' || critter.species === 'squirrel') && distance < 9;
      const threat = distance < 5.2 && currentNoise > 0.34 && !(activeTool === 'net' && distance < 2.6 && currentNoise < 0.56);
      if (attracting) {
        tempVector.subVectors(player, animal).setY(0).normalize();
        critter.direction = Math.atan2(tempVector.x, tempVector.z);
        if (gait) critter.targetDirection = critter.direction;
        animal.position.x += tempVector.x * delta * 0.42;
        animal.position.z += tempVector.z * delta * 0.42;
        keepGroundAnimalOnLand(animal, critter);
        if (gait) poseGroundCritter(critter, gait, delta, 0.42, false);
        else animal.position.y = 0.42 + Math.sin(elapsed * 2.4 + critter.home.x) * 0.035;
      } else if (threat) {
        scareCritter(critter);
      } else if (gait) {
        updateGroundGait(critter, gait, delta);
      } else {
        steerCritterFromEdge(critter, delta);
        critter.direction += Math.sin(elapsed * 0.28 + critter.home.x) * delta * 0.07;
        const drift = Math.sin(critter.stateTime * 0.65 + critter.home.z) * 0.035;
        animal.position.x += Math.sin(critter.direction) * delta * 0.28;
        animal.position.z += Math.cos(critter.direction) * delta * 0.28;
        if (animal.position.distanceTo(critter.home) > 4.1) {
          tempVector.subVectors(critter.home, animal.position).setY(0).normalize();
          critter.direction = Math.atan2(tempVector.x, tempVector.z);
        }
        if (!isFlying) keepGroundAnimalOnLand(animal, critter);
        animal.position.y = isFlying ? critter.home.y + Math.sin(elapsed * 2.1 + critter.home.x) * 0.11 + Math.cos(elapsed * 1.15 + critter.home.z) * 0.05 : 0.42 + drift;
      }
    } else if (critter.state === 'flee') {
      critter.fleeTime -= delta;
      const fleeSpeed = gait?.fleeSpeed ?? 3.4;
      animal.position.x += Math.sin(critter.direction) * delta * fleeSpeed;
      animal.position.z += Math.cos(critter.direction) * delta * fleeSpeed;
      if (gait) {
        keepGroundAnimalOnLand(animal, critter);
        poseGroundCritter(critter, gait, delta, fleeSpeed, false);
      } else {
        animal.position.y = isFlying ? critter.home.y + Math.sin(elapsed * 2.6 + critter.home.x) * 0.08 : 0.42 + Math.abs(Math.sin(elapsed * 9)) * 0.1;
        if (!isFlying) keepGroundAnimalOnLand(animal, critter);
      }
      const bounds = ZONES[currentZone].bounds;
      if (animal.position.x < bounds.minX - 1 || animal.position.x > bounds.maxX + 1 || animal.position.z < bounds.minZ - 1 || animal.position.z > bounds.maxZ + 1) {
        world.remove(animal);
        critter.hidden = true;
        critter.respawnAt = elapsed + 1.6 + Math.random() * 2.4;
        continue;
      }
      if (critter.fleeTime <= 0) {
        critter.state = 'idle';
        critter.home.copy(animal.position);
        critter.stateTime = 0;
        critter.targetDirection = critter.direction;
        if (critter.gait) {
          critter.gait.mode = 'pause';
          critter.gait.until = elapsed + 1.2;
        }
      }
    }
    animal.rotation.y = critter.species === 'dragonfly' ? critter.direction - Math.PI / 2 : critter.direction + Math.PI;
    const aimed = getNetCritterTarget() === critter;
    if (aimed && distance < 5.5 && (currentNoise < 0.56 || distance <= 3.1)) {
      animal.userData.highlight = true;
    } else {
      animal.userData.highlight = false;
    }
  }
}

function updateBugNodes(delta) {
  for (const bug of bugNodes) {
    bug.cooldown = Math.max(0, bug.cooldown - delta);
    const near = distanceTo(bug.position) < 8.6;
    bug.scheduled = isSpeciesActive(bug.species);
    if (!bug.scheduled && bug.revealed) {
      bug.revealed = false;
      bug.bugModel.visible = false;
    }
    bug.marker.visible = bug.scheduled && bug.cooldown <= 0 && (!bug.revealed || near);
    if (bug.marker.visible) {
      const pulse = 1 + Math.sin(elapsed * 2.2 + bug.position.x) * 0.1;
      bug.marker.scale.setScalar(pulse);
      bug.marker.rotation.y += delta * 0.18;
      bug.markerCore.material.emissiveIntensity = 0.7 + Math.sin(elapsed * 3.2) * 0.18;
    }
    if (bug.revealed) {
      bug.bugModel.position.y = 1.1 + Math.sin(elapsed * 4 + bug.position.x) * 0.14;
      bug.bugModel.rotation.y += delta * 2.6;
    }
    if (bug.revealed) bug.aimPosition.set(bug.group.position.x + bug.bugModel.position.x, bug.group.position.y + bug.bugModel.position.y, bug.group.position.z + bug.bugModel.position.z);
    else bug.aimPosition.copy(bug.focusPoint);
  }
}

function updateHotspots(delta) {
  for (const hotspot of hotspots) {
    hotspot.ringOne.rotation.z += delta * 0.22;
    hotspot.ringTwo.rotation.z -= delta * 0.16;
    const pulse = 0.96 + Math.sin(elapsed * 2.1 + hotspot.position.x) * 0.08;
    hotspot.ringOne.scale.setScalar(pulse);
    hotspot.ringTwo.scale.setScalar(1.04 - (pulse - 0.96));
    hotspot.center.position.y = 0.23 + Math.sin(elapsed * 4.2) * 0.06;
    hotspot.bubbleA.position.y = 0.34 + Math.abs(Math.sin(elapsed * 1.8 + 1)) * 0.22;
    hotspot.bubbleB.position.y = 0.33 + Math.abs(Math.sin(elapsed * 2.1 + 2)) * 0.19;
  }
}

function updateZooAnimals(delta) {
  if (currentZone !== 'zoo') return;
  for (const exhibit of zooAnimals) {
    // Showcase animals stay on view around the clock, but they wind down to a
    // slow shuffle outside the hours their species is actually awake.
    const onDuty = exhibit.species ? isSpeciesActive(exhibit.species) : true;
    exhibit.rest = (exhibit.rest ?? 1) + ((onDuty ? 1 : 0.1) - (exhibit.rest ?? 1)) * Math.min(1, delta * 0.9);
    exhibit.travel = (exhibit.travel ?? exhibit.phase) + delta * exhibit.speed * exhibit.rest;
    const angle = exhibit.travel;
    const nextX = exhibit.center.x + Math.cos(angle) * exhibit.radiusX;
    const nextZ = exhibit.center.z + Math.sin(angle) * exhibit.radiusZ;
    const deltaX = nextX - exhibit.group.position.x;
    const deltaZ = nextZ - exhibit.group.position.z;
    exhibit.group.position.x = nextX;
    exhibit.group.position.z = nextZ;
    if (exhibit.type === 'fish') {
      exhibit.group.position.y = exhibit.center.y + Math.sin(elapsed * 1.8 + exhibit.phase) * 0.12;
      exhibit.group.rotation.y = Math.atan2(-deltaZ, deltaX);
      if (exhibit.group.userData.fishTail) exhibit.group.userData.fishTail.rotation.y = Math.sin(elapsed * 8.5 + exhibit.phase) * 0.24;
      if (exhibit.group.userData.fishFins) exhibit.group.userData.fishFins.forEach((fin, index) => {
        fin.mesh.rotation.x = fin.baseRotation.x + Math.sin(elapsed * 5.5 + exhibit.phase + index) * 0.045;
        fin.mesh.rotation.z = fin.baseRotation.z + Math.cos(elapsed * 4.8 + exhibit.phase + index) * 0.035;
      });
    } else if (exhibit.type === 'duck') {
      exhibit.group.position.y = exhibit.center.y + Math.sin(elapsed * 2.2 + exhibit.phase) * 0.035;
      exhibit.group.rotation.y = Math.atan2(deltaX, deltaZ) + Math.PI;
      if (elapsed >= exhibit.nextEggAt) {
        createDuckEgg(exhibit.group.position.x + 0.32, exhibit.group.position.z + 0.18, exhibit.phase);
        exhibit.nextEggAt = elapsed + 18 + Math.random() * 16;
        toast('A showcase duck laid an egg by the practice pond.', 'success');
      }
    } else if (exhibit.type === 'ground') {
      // Resting animals settle onto the bedding instead of pacing the enclosure.
      exhibit.group.position.y = exhibit.center.y + Math.abs(Math.sin(elapsed * 2.4 + exhibit.phase)) * 0.045 * exhibit.rest - (1 - exhibit.rest) * 0.12;
      if (Math.hypot(deltaX, deltaZ) > 0.0001) exhibit.group.rotation.y = Math.atan2(deltaX, -deltaZ);
    } else {
      // A dozing owl drops to its perch height; an active one works the enclosure.
      exhibit.group.position.y = exhibit.center.y - (1 - exhibit.rest) * 0.55
        + (Math.sin(elapsed * 2.1 + exhibit.phase) * 0.1 + Math.cos(elapsed * 1.1 + exhibit.phase) * 0.04) * exhibit.rest;
      if (exhibit.group.userData.wings) animateWings(exhibit.group, exhibit.phase, exhibit.group.userData.wingSpeed || 12, 0.12 + exhibit.rest * 0.88);
      if (Math.hypot(deltaX, deltaZ) > 0.0001) exhibit.group.rotation.y = exhibit.group.userData.wingAxis === 'x' ? Math.atan2(-deltaZ, deltaX) : Math.atan2(deltaX, -deltaZ);
      exhibit.group.rotation.z = Math.sin(elapsed * 3.2 + exhibit.phase) * 0.16 * exhibit.rest;
    }
  }
}


function constrainNatureWaterBoundary() {
  if (!['forest', 'lake'].includes(currentZone)) return;
  const water = getNatureWater();
  const offsetX = player.x - water.centerX;
  const offsetZ = player.z - water.centerZ;
  const onForestDock = currentZone === 'forest' && Math.abs(offsetX) <= FOREST_DOCK.halfWidth && player.z <= FOREST_DOCK.shoreZ + 0.7;
  const onLakeDock = currentZone === 'lake' && JENKINS_LAKE_DOCKS.some((dock) => (
    Math.abs(player.x - dock.x) <= dock.width / 2 + 0.8
      && player.z <= dock.shoreZ + 0.7
      && player.z >= dock.endZ - 0.7
  ));
  const onDockCorridor = onForestDock || onLakeDock;
  if (onDockCorridor) return;
  const radiusX = (water.playerRadiusX || water.playerRadius || water.waterRadius) - ((save.supplies.waders || 0) > 0 ? 2.7 : 1.35);
  const radiusZ = (water.playerRadiusZ || water.playerRadius || water.waterRadius) - ((save.supplies.waders || 0) > 0 ? 2.7 : 1.35);
  const distance = (offsetX / radiusX) ** 2 + (offsetZ / radiusZ) ** 2;
  if (distance >= 1) return;
  if (distance < 0.001) {
    player.x = water.centerX;
    player.z = water.centerZ + radiusZ;
    return;
  }
  const scale = 1 / Math.sqrt(Math.max(0.001, distance));
  player.x = water.centerX + offsetX * scale;
  player.z = water.centerZ + offsetZ * scale;
  if (fishing.phase === 'idle') setStatus('The shoreline drops off here. Stay on the bank and follow the marked shore path.');
}

function getDockSurfaceHeight(x, z) {
  const docks = currentZone === 'lake' ? JENKINS_LAKE_DOCKS : currentZone === 'forest' ? [{ x: 0, shoreZ: FOREST_DOCK.shoreZ, endZ: FOREST_DOCK.endZ, width: FOREST_DOCK.halfWidth * 2 }] : [];
  for (const dock of docks) {
    if (Math.abs(x - dock.x) > dock.width / 2 + 0.12 || z < dock.endZ - 0.35 || z > dock.shoreZ + 1.5) continue;
    if (z > dock.shoreZ) {
      return 0.48 * clamp((dock.shoreZ + 1.5 - z) / 1.5, 0, 1);
    }
    return 0.48;
  }
  return 0;
}

function updateMovement(delta) {
  if (modalOpen || qteState) return;
  if (currentZone === 'lake' && lakeArrival?.active) {
    updateJenkinsLakeArrival(delta);
    return;
  }
  if (lakeBoatPilot?.active) {
    updateLakeBoatMovement(delta);
    return;
  }
  const forwardInput = (isKeyDown('KeyW', 'w') ? 1 : 0) - (isKeyDown('KeyS', 's') ? 1 : 0);
  const strafeInput = (isKeyDown('KeyD', 'd') ? 1 : 0) - (isKeyDown('KeyA', 'a') ? 1 : 0);
  moveDirection.set(strafeInput, 0, forwardInput);
  const moving = moveDirection.lengthSq() > 0;
  const sneaking = isKeyDown('ShiftLeft', 'ShiftRight', 'shift');
  const speed = sneaking ? 2.1 : 4.2;

  camera.getWorldDirection(forwardDirection);
  forwardDirection.y = 0;
  forwardDirection.normalize();
  rightDirection.crossVectors(forwardDirection, camera.up).normalize();
  tempVector.copy(forwardDirection).multiplyScalar(forwardInput);
  tempVector.addScaledVector(rightDirection, strafeInput);
  if (tempVector.lengthSq() > 1) tempVector.normalize();
  player.addScaledVector(tempVector, speed * delta);
  resolveWorldCollisions();

  const bounds = ZONES[currentZone].bounds;
  player.x = clamp(player.x, bounds.minX, bounds.maxX);
  player.z = clamp(player.z, bounds.minZ, bounds.maxZ);
  constrainNatureWaterBoundary();
  player.y = 1.72 + getDockSurfaceHeight(player.x, player.z);
  if (!grounded || jumpOffset > 0) {
    jumpVelocity -= GRAVITY * delta;
    jumpOffset += jumpVelocity * delta;
    if (jumpOffset <= 0) {
      jumpOffset = 0;
      jumpVelocity = 0;
      grounded = true;
    }
  }
  const riskTarget = moving ? (sneaking ? 0.06 : 0.82) : 0.02;
  const riskRate = moving ? (sneaking ? 0.8 : 0.18) : 0.42;
  spookRisk = clamp(spookRisk + (riskTarget - spookRisk) * delta * riskRate, 0.02, 1);
  currentNoise = spookRisk;
  dom.noiseValue.textContent = currentNoise > 0.55 ? 'HIGH' : currentNoise > 0.25 ? 'MEDIUM' : 'LOW';
  dom.noiseValue.style.color = currentNoise > 0.55 ? 'var(--danger)' : currentNoise > 0.25 ? 'var(--orange)' : 'var(--lime)';
  dom.noiseMeter.style.width = `${Math.max(4, currentNoise * 100)}%`;
  dom.noiseMeter.style.background = currentNoise > 0.55 ? 'var(--danger)' : currentNoise > 0.25 ? 'var(--orange)' : 'var(--lime)';
  if (moving && fishing.phase === 'waiting') startReelIn();
  camera.position.set(player.x, player.y + jumpOffset + (moving ? Math.sin(elapsed * (sneaking ? 5 : 7)) * 0.025 : 0), player.z);
}

function updateCameraRotation() {
  pitch = clamp(pitch, -1.35, 1.35);
  camera.rotation.set(pitch, yaw, 0, 'YXZ');
}

function isKeyDown(...values) {
  return values.some((value) => keys.has(value));
}

function updatePrompt() {
  if (modalOpen || qteState) {
    dom.promptCard.classList.add('is-hidden');
    return;
  }
  if (lakeBoatPilot?.active) {
    dom.promptKey.textContent = 'E';
    dom.promptText.textContent = 'Exit boat';
    dom.promptCard.classList.remove('is-hidden');
    lastPromptKey = 'lake:exit-boat';
    return;
  }
  const target = getInteractionTarget();
  let label = '';
  if (target) label = target.label;
  const aimedBug = ['forest', 'zoo', 'lake'].includes(currentZone) && activeTool === 'magnifier' ? getAimBug(false) : null;
  if (!target && aimedBug && distanceTo(aimedBug.focusPoint) < 7.2 && !aimedBug.revealed) {
    label = 'Hold lens on pulsing plant section';
  }
  if (!label) {
    dom.promptCard.classList.add('is-hidden');
    lastPromptKey = '';
    return;
  }
  const promptKey = `${currentZone}:${label}:${activeTool}`;
  if (promptKey !== lastPromptKey) {
    dom.promptKey.textContent = 'E';
    dom.promptText.textContent = label;
    lastPromptKey = promptKey;
  }
  dom.promptCard.classList.remove('is-hidden');
}

function getInteractionTarget() {
  camera.getWorldDirection(lookDirection);
  return interactables
    .map((item) => {
      const distance = distanceTo(item.position);
      tempVector.subVectors(item.position, camera.position).normalize();
      return { item, distance, angle: lookDirection.angleTo(tempVector) };
    })
    .filter((entry) => entry.distance <= entry.item.radius && entry.angle < 0.9)
    .sort((a, b) => a.distance - b.distance)[0]?.item || null;
}

function updateCrosshair() {
  let targeted = false;
  if (['forest', 'zoo', 'lake'].includes(currentZone) && activeTool === 'rod' && fishing.phase === 'idle') targeted = Boolean(getAimedHotspot());
  if (['forest', 'zoo', 'lake'].includes(currentZone) && activeTool === 'net') targeted = Boolean(getAimCritter() || getAimBug(true) || getNearestRevealedBug());
  if (['forest', 'zoo', 'lake'].includes(currentZone) && activeTool === 'magnifier') targeted = Boolean(getAimBug(false));
  dom.crosshair.classList.toggle('is-targeted', targeted);
}

function renderInventoryPanel() {
  const ingredients = save.ingredients || DEFAULT_SAVE.ingredients;
  const cooked = save.cooked || DEFAULT_SAVE.cooked;
  if (activeInventoryTab === 'loot') {
    return `
      <div class="equipment-item"><strong>CARROTS</strong><em>${ingredients.carrots || 0}</em></div>
      <div class="equipment-item"><strong>MUSHROOMS</strong><em>${ingredients.mushrooms || 0}</em></div>
      <div class="equipment-item"><strong>MORELS</strong><em>${ingredients.morels || 0}</em></div>
      <div class="equipment-item"><strong>TREE MUSHROOMS</strong><em>${ingredients.treeMushrooms || 0}</em></div>
      <div class="equipment-item"><strong>WILD RICE</strong><em>${ingredients.wildRice || 0}</em></div>
      <div class="equipment-item"><strong>SCALLIONS</strong><em>${ingredients.scallions || 0}</em></div>
      <div class="equipment-item"><strong>BERRIES</strong><em>${ingredients.berries || 0}</em></div>
      <div class="equipment-item"><strong>DUCK EGGS</strong><em>${ingredients.duckEggs || 0}</em></div>
      <div class="equipment-item"><strong>HONEY</strong><em>${save.honey || 0}</em></div>
      <div class="equipment-item"><strong>PICKED FLOWERS</strong><em>${ingredients.flowers || 0}</em></div>
      <div class="equipment-item"><strong>GRILLED FISH</strong><em>${cooked.grilledFish || 0}</em></div>
      <div class="equipment-item"><strong>GLAZED CARROTS</strong><em>${cooked.glazedCarrots || 0}</em></div>
      <div class="equipment-item"><strong>MUSHROOM RISOTTO</strong><em>${cooked.risotto || 0}</em></div>
      <div class="equipment-item"><strong>SUNFISH SALAD</strong><em>${cooked.sunfishSalad || 0}</em></div>
      <div class="equipment-item"><strong>TROUT BENEDICT</strong><em>${cooked.troutEggsBenedict || 0}</em></div>
    `;
  }
  if (activeInventoryTab === 'animals') {
    const animals = Object.entries(save.caught || {}).filter(([key, count]) => count > 0 && SPECIES[key]);
    if (!animals.length) return '<div class="inventory-empty">Catch an animal and it will appear here at the showcase.</div>';
    return `${animals.map(([key, count]) => {
      const record = SPECIES[key].type === 'fish' && save.records?.[key] ? ` · record ${save.records[key].weight}lb` : '';
      return `<div class="equipment-item"><strong>${SPECIES[key].label}<small>${SPECIES[key].note}${record}</small></strong><em>${count}</em></div>`;
    }).join('')}`;
  }
  const baitLabel = formatName(selectedBait);
  const lureLabel = formatName(selectedLure);
  const heldFood = getAvailableFoods().find((food) => food.key === selectedFood);
  return `
    <div class="equipment-item"><strong>BAIT <small>${baitLabel}</small></strong><em>${save.supplies[selectedBait] || 0}</em></div>
    <div class="equipment-item"><strong>LURE <small>${lureLabel}</small></strong><em>REUSABLE</em></div>
    <div class="equipment-item"><strong>NETS</strong><em>${save.supplies.nets || 0}</em></div>
    <div class="equipment-item"><strong>GLASSES</strong><em>${save.supplies.magnifiers || 0}</em></div>
    <div class="equipment-item"><strong>WADERS</strong><em>${save.supplies.waders || 0}</em></div>
    <div class="equipment-item"><strong>PANS</strong><em>${save.supplies.pans || 0}</em></div>
    <div class="equipment-item"><strong>SEEDS</strong><em>${save.supplies.flowerSeeds || 0}</em></div>
    <div class="equipment-item"><strong>HELD FOOD <small>${heldFood ? heldFood.label : 'none available'}</small></strong><em>${heldFood ? ingredients[heldFood.key] || 0 : 0}</em></div>
    <div class="equipment-item equipment-help"><span>B / L / F</span><span>cycle bait, lure, food</span></div>
  `;
}

function setInventoryTab(tab) {
  if (!['kit', 'loot', 'animals'].includes(tab)) return;
  activeInventoryTab = tab;
  updateHUD();
}

// Surfaces the field clock in the topbar, so the day cycle is legible without
// opening the journal, and dims it once the light goes.
function updateFieldClockLabel() {
  if (!dom.clockLabel) return;
  const period = getDayPeriod();
  dom.clockLabel.textContent = `${getFieldClockLabel()} ${(DAY_PERIOD_LABELS[period] || period).toUpperCase()}`;
  dom.clockLabel.style.color = period === 'night' ? 'var(--aqua)' : period === 'day' ? 'var(--lime)' : 'var(--orange)';
}

function updateHUD() {
  dom.zoneLabel.textContent = ZONES[currentZone].label;
  updateFieldClockLabel();
  dom.coinLabel.textContent = `${save.coins}¢`;
  const baitLabel = formatName(selectedBait);
  const lureLabel = formatName(selectedLure);
  dom.equipmentList.innerHTML = `
    <div class="equipment-item"><strong>BAIT <small>${baitLabel}</small></strong><em>${save.supplies[selectedBait] || 0}</em></div>
    <div class="equipment-item"><strong>LURE <small>${lureLabel}</small></strong><em>REUSABLE</em></div>
    <div class="equipment-item"><strong>NETS</strong><em>${save.supplies.nets || 0}</em></div>
    <div class="equipment-item"><strong>GLASSES</strong><em>${save.supplies.magnifiers || 0}</em></div>
    <div class="equipment-item"><strong>SEEDS</strong><em>${save.supplies.goldenSeeds || 0}</em></div>
    <div class="equipment-item"><strong>OIL</strong><em>${save.supplies.lanternOil || 0}</em></div>
    <div class="equipment-item"><strong>FIELD NOTES</strong><em>${Object.values(save.caught).reduce((sum, count) => sum + count, 0)}</em></div>
    <div class="equipment-item equipment-help"><span>B / L</span><span>cycle kit</span></div>
  `;
  dom.noiseValue.textContent = currentNoise > 0.55 ? 'HIGH' : currentNoise > 0.25 ? 'MEDIUM' : 'LOW';
  dom.noiseValue.style.color = currentNoise > 0.55 ? 'var(--danger)' : currentNoise > 0.25 ? 'var(--orange)' : 'var(--lime)';
  dom.noiseMeter.style.width = `${Math.max(4, currentNoise * 100)}%`;
  dom.noiseMeter.style.background = currentNoise > 0.55 ? 'var(--danger)' : currentNoise > 0.25 ? 'var(--orange)' : 'var(--lime)';
  if (dom.tipsEnabled) dom.tipsEnabled.checked = save.tipsEnabled !== false;
  updateActionDock();
  updateFishingTips();
}

function updateFishingTips() {
  const visible = save.tipsEnabled !== false && ['forest', 'zoo', 'lake'].includes(currentZone) && activeTool === 'rod';
  dom.fishingTips.classList.toggle('is-hidden', !visible);
  if (!visible) {
    dom.actionHint.textContent = '';
    return;
  }

  const currentStep = {
    idle: 'loadout',
    charging: 'cast',
    waiting: 'cast',
    bite: 'hook',
    hooking: 'hook',
    returning: 'cast',
    reeling: 'reel'
  }[fishing.phase] || 'loadout';
  dom.tipSteps.forEach((step) => step.classList.toggle('is-current', step.dataset.tipStep === currentStep));
  dom.actionHint.textContent = {
    idle: 'Use B / L to match the kit, then aim at a circular water disturbance.',
    charging: 'Hold to load the cast. Release while the crosshair is over the disturbance.',
    waiting: fishing.castTarget ? (fishing.invalidCast ? `Wrong presentation. Switch to ${formatName(fishing.castTarget.bait)} + ${formatName(fishing.castTarget.lure)}.` : 'Viable spot. Wait for the bite.') : 'No hot spot. Reel the line back in.',
    bite: 'BITE! Click SET HOOK, then click enough times over 2 seconds.',
    hooking: `Set hook: ${fishing.hookClicks} / ${fishing.hookTarget} clicks.`,
    returning: 'The line is coming back. Change the bait or lure before trying again.',
    reeling: fishing.tensionState === 'stop' ? 'STOP REELING — let the fish run.' : 'Hold REEL LINE / left click until the fish reaches shore.'
  }[fishing.phase] || '';
}

function updateFishingCallout() {
  const liveState = fishing.phase === 'reeling' ? `${fishing.phase}:${fishing.tensionState}` : fishing.phase;
  const previousState = feedbackHub.dataset.fishingState;
  feedbackHub.dataset.fishingActive = String(['forest', 'zoo', 'lake'].includes(currentZone) && activeTool === 'rod' && !modalOpen && !qteState && !lakeBoatPilot?.active && fishing.phase !== 'idle');
  feedbackHub.dataset.fishingState = liveState;
  if (previousState && previousState !== liveState && dom.toastStack.firstElementChild?.dataset.fishingState === previousState) {
    window.clearTimeout(feedbackTimer);
    feedbackTimer = null;
    dom.toastStack.replaceChildren();
  }
  const visible = ['forest', 'zoo', 'lake'].includes(currentZone) && activeTool === 'rod' && !modalOpen && !qteState;
  dom.fishingCallout.classList.toggle('is-hidden', !visible || lakeBoatPilot?.active);
  if (!visible || lakeBoatPilot?.active) return;
  let message = 'AIM FOR A WATER HOT SPOT';
  let tone = '';
  if (fishing.phase === 'charging') message = `HOLD TO CAST · ${Math.round(fishing.charge * 100)}%`;
  if (fishing.phase === 'waiting' && !fishing.castTarget) { message = 'REEL LINE · NOT IN A HOT SPOT'; tone = 'is-warning'; }
  if (fishing.phase === 'waiting' && fishing.invalidCast && fishing.castTarget) { message = `SWITCH TO ${formatName(fishing.castTarget.bait)} + ${formatName(fishing.castTarget.lure)}`; tone = 'is-warning'; }
  if (fishing.phase === 'waiting' && fishing.castTarget && !fishing.invalidCast) { message = 'WAIT · VIABLE HOT SPOT'; tone = 'is-ready'; }
  if (fishing.phase === 'bite') { message = 'BITE · CLICK SET HOOK NOW'; tone = 'is-bite'; }
  if (fishing.phase === 'hooking') { message = `SET HOOK · ${fishing.hookClicks} / ${fishing.hookTarget} CLICKS`; tone = 'is-bite'; }
  if (fishing.phase === 'returning') { message = 'REEL LINE · WATER IS QUIET'; tone = 'is-warning'; }
  if (fishing.phase === 'reeling') {
    message = fishing.tensionState === 'stop' ? 'STOP REELING · FISH IS SURGING' : 'REEL LINE · KEEP THE FISH MOVING HOME';
    tone = fishing.tensionState === 'stop' ? 'is-warning' : 'is-ready';
  }
  dom.fishingCallout.textContent = message;
  dom.fishingCallout.className = `fishing-callout ${tone}`;
}

function updateActionDock() {
  const fishingActive = ['forest', 'zoo', 'lake'].includes(currentZone) && ['charging', 'waiting', 'bite', 'hooking', 'returning', 'reeling'].includes(fishing.phase);
  if (modalOpen || qteState) {
    dom.actionDock.classList.add('is-hidden');
    return;
  }
  dom.actionDock.classList.remove('is-hidden');
  if (lakeBoatPilot?.active) {
    dom.reelAction.classList.add('is-hidden');
    dom.primaryAction.classList.remove('is-hidden');
    dom.primaryAction.textContent = 'EXIT BOAT · E';
    return;
  }
  if (fishing.phase === 'waiting') {
    dom.primaryAction.classList.add('is-hidden');
    dom.reelAction.classList.remove('is-hidden');
    dom.reelAction.textContent = 'REEL LINE';
    return;
  }
  if (fishing.phase === 'bite') {
    dom.primaryAction.classList.add('is-hidden');
    dom.reelAction.classList.remove('is-hidden');
    dom.reelAction.textContent = 'SET HOOK';
    return;
  }
  if (fishing.phase === 'hooking') {
    dom.primaryAction.classList.add('is-hidden');
    dom.reelAction.classList.remove('is-hidden');
    dom.reelAction.textContent = `SET HOOK ${fishing.hookClicks}/${fishing.hookTarget}`;
    return;
  }
  if (fishing.phase === 'reeling') {
    dom.primaryAction.classList.add('is-hidden');
    dom.reelAction.classList.remove('is-hidden');
    dom.reelAction.textContent = 'HOLD TO REEL';
    return;
  }
  dom.reelAction.classList.add('is-hidden');
  dom.primaryAction.classList.remove('is-hidden');
  if (!pointerLocked) {
    dom.primaryAction.textContent = 'CLICK TO ENTER FIELD';
  } else if (fishing.phase === 'charging') {
    dom.primaryAction.textContent = `RELEASE CAST ${Math.round(fishing.charge * 100)}%`;
  } else if (['forest', 'zoo', 'lake'].includes(currentZone) && activeTool === 'rod') {
    dom.primaryAction.textContent = 'HOLD TO CAST';
  } else if (['forest', 'zoo', 'lake'].includes(currentZone) && activeTool === 'magnifier') {
    dom.primaryAction.textContent = 'INSPECT TRACE';
  } else if (['forest', 'store', 'zoo', 'lake'].includes(currentZone) && activeTool === 'net') {
    dom.primaryAction.textContent = 'USE NET';
  } else {
    dom.primaryAction.textContent = 'LOOK AROUND';
  }
  if (fishingActive && fishing.phase === 'returning') dom.primaryAction.textContent = 'RETRIEVING LINE';
}

function setStatus(message) {
  // Persistent guidance returns after the latest interaction result is read.
  // A result from the previous zone must not obscure new arrival instructions.
  if (dom.toastStack.firstElementChild?.dataset.zone !== undefined && dom.toastStack.firstElementChild.dataset.zone !== currentZone) {
    window.clearTimeout(feedbackTimer);
    feedbackTimer = null;
    dom.toastStack.replaceChildren();
  }
  if (dom.statusMessage.textContent !== message) dom.statusMessage.textContent = message;
}

function toast(message, tone = 'success') {
  // One stable location and one current result, never a growing corner stack.
  const kind = tone === 'warning' ? 'warning' : tone === 'danger' ? 'danger' : 'success';
  const current = dom.toastStack.firstElementChild;
  window.clearTimeout(feedbackTimer);
  if (!current || current.dataset.message !== message || current.dataset.tone !== kind) {
    const element = document.createElement('div');
    element.className = `toast is-${kind}`;
    element.dataset.toastId = String(++toastId);
    element.dataset.message = message;
    element.dataset.tone = kind;
    element.dataset.zone = currentZone;
    if (fishing.phase !== 'idle') element.dataset.fishingState = fishing.phase === 'reeling' ? `${fishing.phase}:${fishing.tensionState}` : fishing.phase;
    const label = document.createElement('strong');
    label.className = 'feedback-label';
    label.textContent = kind === 'warning' ? 'ATTENTION' : kind === 'danger' ? 'UNABLE TO COMPLETE' : 'FIELD UPDATE';
    const text = document.createElement('span');
    text.textContent = message;
    element.append(label, text);
    dom.toastStack.replaceChildren(element);
  }
  // Long dialogue gets longer reading time; repeated messages refresh, not stack.
  const duration = Math.min(16000, Math.max(8000, message.length * 55));
  feedbackTimer = window.setTimeout(() => {
    dom.toastStack.replaceChildren();
    feedbackTimer = null;
  }, duration);
}

function setTool(tool) {
  if (!['rod', 'net', 'magnifier', 'food'].includes(tool)) return;
  if (tool === 'net' && (save.supplies.nets || 0) <= 0) {
    toast('You need a field net. Visit the supply store.', 'warning');
    return;
  }
  if (tool === 'magnifier' && (save.supplies.magnifiers || 0) <= 0) {
    toast('You need a magnifying glass. Visit the supply store.', 'warning');
    return;
  }
  if (tool === 'food' && !getAvailableFoods().length) {
    toast('You do not have any carrots or fish to hold yet.', 'warning');
    return;
  }
  if (tool === 'food' && !getAvailableFoods().some((food) => food.key === selectedFood)) {
    selectedFood = getAvailableFoods()[0].key;
  }
  activeTool = tool;
  createHeldToolModel(tool);
  document.querySelectorAll('.tool-button').forEach((button) => button.classList.toggle('active', button.dataset.tool === tool));
  updateHUD();
  setStatus(tool === 'rod' ? 'Aim for water, then hold to preview the landing ring.' : tool === 'net' ? 'Sneak close. A fast swing is only useful at short range.' : tool === 'magnifier' ? 'Hold the lens on a subtle pulse at the plant branch to inspect it.' : `${formatName(selectedFood)} is held out. Nearby animals may be drawn closer.`);
}

function refreshFieldModeUI() {
  dom.lockDot.classList.toggle('is-live', pointerLocked);
  dom.lockLabel.textContent = pointerLocked ? 'FIELD MODE ACTIVE' : 'CLICK TO ENTER FIELD MODE';
  document.body.classList.toggle('field-mode-active', pointerLocked);
  document.body.classList.toggle('field-mode-fallback', pointerLocked && fallbackFieldMode);
  document.body.style.cursor = pointerLocked && fallbackFieldMode ? 'none' : '';
  dom.canvas.style.cursor = pointerLocked ? 'none' : 'crosshair';
  updateActionDock();
}

function activateFieldMode() {
  if (pointerLocked || modalOpen || qteState) return;
  fallbackPointer = null;
  dom.canvas.focus({ preventScroll: true });
  try {
    const request = dom.canvas.requestPointerLock?.();
    if (request?.catch) request.catch(() => {});
  } catch (error) {
    // The embedded browser can reject pointer lock even after a trusted click.
  }
  window.setTimeout(() => {
    if (!modalOpen && !qteState && document.pointerLockElement !== dom.canvas && !pointerLocked) {
      fallbackFieldMode = true;
      pointerLocked = true;
      dom.canvas.focus({ preventScroll: true });
      refreshFieldModeUI();
    }
  }, 120);
}

function setTipsMenuOpen(open) {
  dom.tipsMenu.classList.toggle('is-hidden', !open);
  dom.tipsToggleButton.setAttribute('aria-expanded', String(open));
}

function cycleBait() {
  const available = BAITS.filter((item) => (save.supplies[item.key] || 0) > 0);
  const list = available.length ? available : BAITS;
  const index = Math.max(0, list.findIndex((item) => item.key === selectedBait));
  selectedBait = list[(index + 1) % list.length].key;
  updateHUD();
  toast(`Bait selected: ${formatName(selectedBait)}.`, 'success');
}

function cycleLure() {
  const available = LURES.filter((item) => (save.supplies[item.key] || 0) > 0);
  const list = available.length ? available : LURES;
  const index = Math.max(0, list.findIndex((item) => item.key === selectedLure));
  selectedLure = list[(index + 1) % list.length].key;
  updateHUD();
  toast(`Lure selected: ${formatName(selectedLure)}.`, 'success');
}

function getAvailableFoods() {
  return FOOD_OPTIONS.filter((food) => (save.ingredients[food.key] || 0) > 0);
}

function cycleFood() {
  const available = getAvailableFoods();
  if (!available.length) {
    toast('No carrots or fish are available to hold.', 'warning');
    return;
  }
  const index = Math.max(0, available.findIndex((food) => food.key === selectedFood));
  selectedFood = available[(index + 1) % available.length].key;
  if (activeTool === 'food') createHeldToolModel('food');
  updateHUD();
  toast(`Food held: ${formatName(selectedFood)}.`, 'success');
}

function openModal(element) {
  modalOpen = true;
  element.classList.remove('is-hidden');
  element.appendChild(feedbackHub);
  releaseFieldModeForModal();
}

function releaseFieldModeForModal() {
  fallbackFieldMode = false;
  pointerLocked = false;
  fallbackPointer = null;
  if (fallbackPointerId !== null) {
    try { dom.canvas.releasePointerCapture?.(fallbackPointerId); } catch (error) { /* already released */ }
    fallbackPointerId = null;
  }
  document.exitPointerLock?.();
  refreshFieldModeUI();
}

function restoreFieldMode() {
  if (!modalOpen && !qteState) activateFieldMode();
}

function closeModal(element) {
  document.querySelector('#game-shell').appendChild(feedbackHub);
  element.classList.add('is-hidden');
  modalOpen = false;
  if (element === dom.journalModal) dom.journalToggleButton?.setAttribute('aria-expanded', 'false');
  if (element === dom.qteModal) qteState = null;
  if (element === dom.cleaningModal) {
    cleaningState = null;
    dom.cleaningModal.classList.remove('is-aquarium');
  }
  restoreFieldMode();
}

function closeAllModals(restore = true) {
  document.querySelector('#game-shell').appendChild(feedbackHub);
  [dom.travelModal, dom.shopModal, dom.stoveModal, dom.qteModal, dom.cleaningModal, dom.collectionModal, dom.journalModal, dom.buildModal, dom.sleepModal].forEach((modal) => modal.classList.add('is-hidden'));
  dom.journalToggleButton?.setAttribute('aria-expanded', 'false');
  modalOpen = false;
  qteState = null;
  cleaningState = null;
  dom.cleaningModal.classList.remove('is-aquarium');
  if (restore) restoreFieldMode();
}

function openTravel() {
  dom.travelOptions.innerHTML = ZONE_ORDER.map((zoneKey) => {
    const zone = ZONES[zoneKey];
    const disabled = zoneKey === currentZone ? 'disabled' : '';
    return `<button class="travel-option" data-travel-zone="${zoneKey}" type="button" ${disabled}>
      <span class="travel-option-copy"><span class="travel-option-title">${zone.title}</span><span class="travel-option-note">${zone.note}</span></span>
      <span class="travel-option-arrow">${zoneKey === currentZone ? 'HERE' : '→'}</span>
    </button>`;
  }).join('');
  openModal(dom.travelModal);
}

function openShop() {
  dom.shopItems.innerHTML = SHOP_ITEMS.map((item) => {
    const canBuy = save.coins >= item.cost;
    return `<div class="shop-item">
      <span class="shop-item-copy"><strong class="shop-item-name">${item.label}</strong><span class="shop-item-note">${item.note} · +${item.amount}</span></span>
      <button class="buy-button" data-buy-item="${item.key}" data-buy-group="${item.group}" type="button" ${canBuy ? '' : 'disabled'}>${item.cost}¢</button>
    </div>`;
  }).join('');
  if (dom.shopRecord) {
    const records = Object.values(save.records || {});
    dom.shopRecord.innerHTML = records.length
      ? `<strong>PERSONAL RECORDS</strong>${records.map((record) => `<span>${formatFishRecord(record)}</span>`).join('')}`
      : '<strong>PERSONAL RECORDS</strong><span>Catch a fish to start the record board.</span>';
  }
  openModal(dom.shopModal);
}

function openCollection() {
  const remaining = zooEnclosures.filter((enclosure) => !enclosure.cleaned);
  if (remaining.length) {
    const names = remaining.map((enclosure) => enclosure.label.replace('Clean ', '')).join(', ');
    toast(`Care required: ${names}.`, 'warning');
    setStatus('Clean every zoo habitat before opening the living collection.');
    return;
  }
  dom.collectionGrid.innerHTML = Object.entries(SPECIES).map(([key, species]) => {
    const count = save.caught[key] || 0;
    return `<div class="collection-item ${count ? 'is-found' : ''}"><span class="collection-sigil">${count ? species.sigil : '·'}</span><strong>${count ? species.label : 'Unrecorded field note'}</strong><span>${count ? `${count} recorded · ${species.note}` : species.note}</span></div>`;
  }).join('');
  openModal(dom.collectionModal);
}


// --- Field journal ------------------------------------------------------------
// A read-only reference the player can pull up at any moment. It reads live game
// state, so it doubles as the answer to "what is even out right now?".

function formatDuration(seconds) {
  const whole = Math.max(0, Math.round(seconds));
  if (whole < 60) return `${whole}s`;
  return `${Math.floor(whole / 60)}m ${String(whole % 60).padStart(2, '0')}s`;
}

function journalRow(label, value, dim = false) {
  return `<div class="journal-row"><span>${label}</span><em class="${dim ? 'is-dim' : ''}">${value}</em></div>`;
}

function renderJournal() {
  if (!dom.journalBody) return;
  const phase = getDayPhase();
  const period = getDayPeriod(phase);
  const nextPeriod = DAY_PERIODS[(DAY_PERIODS.indexOf(period) + 1) % DAY_PERIODS.length];
  const supplies = save.supplies || {};
  const ingredients = save.ingredients || {};
  const cooked = save.cooked || {};
  const caught = save.caught || {};
  const recordable = Object.keys(SPECIES);
  const landSpecies = recordable.filter((key) => SPECIES[key].type !== 'fish');
  const recorded = recordable.filter((key) => (caught[key] || 0) > 0);
  const notes = Object.values(caught).reduce((sum, count) => sum + (count || 0), 0);
  const outNow = listActiveSpecies(period);

  const activity = Object.entries(SPECIES)
    .filter(([, species]) => species.type !== 'fish')
    .map(([key, species]) => {
      const out = isSpeciesActive(key, period);
      const count = caught[key] || 0;
      return `<div class="journal-animal ${out ? 'is-out' : ''}">
        <span class="journal-animal-sigil">${species.sigil}</span>
        <span><strong>${species.label}</strong><small>${describeSpeciesActivity(key)}${count ? ` · ${count} recorded` : ''}</small></span>
        <span class="journal-chip">${out ? 'OUT NOW' : 'RESTING'}</span>
      </div>`;
    }).join('');

  const records = Object.values(save.records || {});
  const habitats = zooEnclosures.length
    ? `${zooEnclosures.filter((enclosure) => enclosure.cleaned).length} / ${zooEnclosures.length} clean`
    : 'Visit the showcase';
  const brynlee = serviceActive(save.brynleeCaretakerUntil)
    ? `${Math.ceil((save.brynleeCaretakerUntil - Date.now()) / 60000)}m left`
    : 'Off shift';
  const brooks = serviceActive(save.brooksWatchUntil)
    ? `${Math.ceil((save.brooksWatchUntil - Date.now()) / 60000)}m left`
    : 'Off shift';

  dom.journalBody.innerHTML = `
    <div class="journal-clock">
      <span class="journal-clock-time">${getFieldClockLabel(phase)}</span>
      <span class="journal-clock-copy">
        <strong>${(DAY_PERIOD_LABELS[period] || period).toUpperCase()} · ${ZONES[currentZone].title.toUpperCase()}</strong>
        <span>${DAY_PERIOD_LABELS[nextPeriod]} begins in ${formatDuration(getPeriodSecondsRemaining(phase))}. ${outNow.length} of ${landSpecies.length} land species are out right now.</span>
      </span>
    </div>

    <div class="journal-section">
      <p class="eyebrow">FIELD RECORD</p>
      <div class="journal-rows">
        ${journalRow('Species recorded', `${recorded.length} / ${recordable.length}`)}
        ${journalRow('Field notes logged', notes)}
        ${journalRow('Coins', `${save.coins}¢`)}
        ${journalRow('Specimens researched', save.graysonResearch || 0)}
      </div>
      ${records.length
        ? `<p class="journal-note">Personal bests · ${records.map((record) => formatFishRecord(record)).join(' · ')}</p>`
        : '<p class="journal-note">No personal bests yet. Land a fish and the record board fills in.</p>'}
    </div>

    <div class="journal-section">
      <p class="eyebrow">ACTIVITY BOARD</p>
      <div class="journal-species">${activity}</div>
      <p class="journal-note">Animals keep their own hours. Off-duty species leave the field until their part of the day comes back around; showcase animals stay on view but settle down and rest.</p>
    </div>

    <div class="journal-section">
      <p class="eyebrow">FIELD KIT</p>
      <div class="journal-rows">
        ${journalRow('Worms', supplies.worms || 0, !supplies.worms)}
        ${journalRow('Grubs', supplies.grubs || 0, !supplies.grubs)}
        ${journalRow('Nets', supplies.nets || 0, !supplies.nets)}
        ${journalRow('Magnifying glasses', supplies.magnifiers || 0, !supplies.magnifiers)}
        ${journalRow('Golden seeds', supplies.goldenSeeds || 0, !supplies.goldenSeeds)}
        ${journalRow('Lantern oil', supplies.lanternOil || 0, !supplies.lanternOil)}
        ${journalRow('Sticks · for Brax', materialCount('sticks'), !materialCount('sticks'))}
        ${journalRow('Stones · for Brax', materialCount('stones'), !materialCount('stones'))}
      </div>
    </div>

    <div class="journal-section">
      <p class="eyebrow">LARDER</p>
      <div class="journal-rows">
        ${journalRow('Carrots', ingredients.carrots || 0, !ingredients.carrots)}
        ${journalRow('Honey', save.honey || 0, !save.honey)}
        ${journalRow('Berries', ingredients.berries || 0, !ingredients.berries)}
        ${journalRow('Duck eggs', ingredients.duckEggs || 0, !ingredients.duckEggs)}
        ${journalRow('Grilled fish', cooked.grilledFish || 0, !cooked.grilledFish)}
        ${journalRow('Glazed carrots', cooked.glazedCarrots || 0, !cooked.glazedCarrots)}
      </div>
    </div>

    <div class="journal-section">
      <p class="eyebrow">CONSERVATORY DUTIES</p>
      <div class="journal-rows">
        ${journalRow('Habitats', habitats)}
        ${journalRow('Brynlee · caretaker', brynlee, brynlee === 'Off shift')}
        ${journalRow('Brooks · night watch', brooks, brooks === 'Off shift')}
        ${journalRow('On patrol now', ['brynlee', 'grayson', 'brooks'].filter((id) => isStaffOnShift(id)).map(formatName).join(', ') || 'Nobody')}
      </div>
    </div>
  `;
}

function openJournal() {
  renderJournal();
  dom.journalToggleButton?.setAttribute('aria-expanded', 'true');
  openModal(dom.journalModal);
}

function toggleJournal() {
  if (!dom.journalModal) return;
  if (!dom.journalModal.classList.contains('is-hidden')) {
    closeModal(dom.journalModal);
    return;
  }
  // The journal is checkable at any time, so it takes over from whatever else
  // happened to be open rather than refusing to appear.
  if (modalOpen) closeAllModals(false);
  if (qteState) {
    qteState = null;
    dom.qteModal.classList.add('is-hidden');
  }
  openJournal();
}

function applyPurchase(item) {
  save.coins -= item.cost;
  save.supplies[item.key] = (save.supplies[item.key] || 0) + item.amount;
  saveGame();
  updateHUD();
  toast(`${item.label} added to the field kit. -${item.cost}¢`, 'success');
}

function buyItem(itemKey, group) {
  const item = SHOP_ITEMS.find((candidate) => candidate.key === itemKey && candidate.group === group);
  if (!item || save.coins < item.cost) return;
  applyPurchase(item);
  // The counter list is already on screen; re-render it in place.
  openShop();
}

// --- Pantry, cooking and counter purchases ------------------------------------
// Honey lives at the top level of the save while everything else a recipe can
// ask for sits under `ingredients`, so both reads and writes go through here.

function pantryCount(key) {
  if (key === 'honey') return save.honey || 0;
  return save.ingredients?.[key] || 0;
}

function spendPantry(key, amount) {
  if (key === 'honey') save.honey = Math.max(0, (save.honey || 0) - amount);
  else save.ingredients[key] = Math.max(0, (save.ingredients[key] || 0) - amount);
}

// Resolves one recipe line to the key it will actually consume: an `anyOf` line
// takes whichever stocked option the player has most of, so cooking never
// silently burns the last of an ingredient another recipe needs more.
function resolveRecipeIngredient(entry) {
  const options = entry.anyOf || [entry.key];
  const stocked = options
    .map((key) => ({ key, held: pantryCount(key) }))
    .sort((a, b) => b.held - a.held)[0];
  return { ...entry, resolvedKey: stocked.key, held: stocked.held, ready: stocked.held >= entry.amount };
}

function describeRecipe(recipe) {
  const lines = recipe.ingredients.map(resolveRecipeIngredient);
  const ready = lines.every((line) => line.ready);
  const partial = !ready && lines.some((line) => line.held > 0);
  return { lines, ready, partial };
}

function renderStoveRecipes() {
  const hasPan = (save.supplies.pans || 0) > 0;
  dom.stoveRecipes.innerHTML = COOKING_RECIPES.map((recipe) => {
    const { lines, ready, partial } = describeRecipe(recipe);
    const requirements = lines
      .map((line) => `${line.label} ${Math.min(line.held, line.amount)}/${line.amount}`)
      .join(' · ');
    const state = !hasPan ? 'NEEDS PAN' : ready ? 'COOK' : partial ? 'PARTLY STOCKED' : 'MISSING';
    return `<button class="recipe-option ${ready && hasPan ? 'is-complete' : partial ? 'is-partial' : ''}" type="button"
      data-cook-recipe="${recipe.key}" ${ready && hasPan ? '' : 'disabled'}>
      <span class="recipe-copy">
        <span class="recipe-name">${recipe.label}</span>
        <span class="recipe-note">${recipe.note}</span>
        <span class="recipe-requirements">${requirements}</span>
      </span>
      <span class="recipe-status">${state}</span>
    </button>`;
  }).join('');
}

function cookAtStove() {
  renderStoveRecipes();
  openModal(dom.stoveModal);
  if ((save.supplies.pans || 0) <= 0) {
    setStatus('The stove needs a camp cooking pan before anything can be prepared.');
  }
}

function cookRecipe(recipeKey) {
  const recipe = COOKING_RECIPES.find((candidate) => candidate.key === recipeKey);
  if (!recipe) return;
  if ((save.supplies.pans || 0) <= 0) {
    toast('A camp cooking pan is required to use the stove.', 'warning');
    return;
  }
  const { lines, ready } = describeRecipe(recipe);
  if (!ready) {
    toast('Some ingredients are still missing for that recipe.', 'warning');
    return;
  }
  for (const line of lines) spendPantry(line.resolvedKey, line.amount);
  for (const output of recipe.outputs) {
    save.cooked[output.key] = (save.cooked[output.key] || 0) + output.amount;
  }
  saveGame();
  updateHUD();
  renderStoveRecipes();
  toast(`${recipe.label} is ready.`, 'success');
  setStatus('Cooked dishes are kept in the LOOT + FOOD tab and the field journal.');
}

function inspectFridge() {
  const stock = Object.entries(save.ingredients || {})
    .filter(([, count]) => count > 0)
    .map(([key, count]) => `${formatName(key)} ${count}`);
  if (save.honey) stock.push(`Honey ${save.honey}`);
  if (!stock.length) {
    toast('The fridge is empty. Forage the field for ingredients.', 'warning');
    setStatus('Pull carrots, pick berries and land fish to stock the cabin fridge.');
    return;
  }
  toast(`Fridge: ${stock.slice(0, 4).join(' · ')}${stock.length > 4 ? '…' : ''}`, 'success');
  setStatus(`The fridge holds ${stock.length} ingredient type${stock.length === 1 ? '' : 's'}. Press J for the full larder.`);
}

// Quick purchase straight off a shop display, without opening the counter list.
function buyShopDisplay(target) {
  const item = SHOP_ITEMS.find((candidate) => candidate.key === target.itemKey && candidate.group === target.group);
  if (!item) return;
  if (save.coins < item.cost) {
    toast(`${item.label} costs ${item.cost}¢. Record more field notes first.`, 'warning');
    setStatus('Catch animals and log bugs to earn coins for the supply counter.');
    return;
  }
  applyPurchase(item);
  setStatus(`${item.label} bought from the shelf. ${save.coins}¢ left.`);
}

// --- Build menu ---------------------------------------------------------------

let activeBuildSite = null;

function renderBuildMenu() {
  if (!activeBuildSite) return;
  const site = activeBuildSite;
  dom.buildStock.innerHTML = `<strong>MATERIALS ON HAND</strong><span>${materialCount('sticks')} stick${materialCount('sticks') === 1 ? '' : 's'} · ${materialCount('stones')} stone${materialCount('stones') === 1 ? '' : 's'}</span>`;
  const standing = site.project
    ? `<button class="recipe-option is-complete" type="button" data-clear-build="1">
        <span class="recipe-copy">
          <span class="recipe-name">Dismantle ${site.project.label}</span>
          <span class="recipe-note">Take this plot back to bare earth.</span>
          <span class="recipe-requirements">Returns ${describeBuildCost(site.project)}</span>
        </span>
        <span class="recipe-status">DISMANTLE</span>
      </button>`
    : '';
  const options = BUILD_PROJECTS.map((project) => {
    const affordable = canAffordBuild(project);
    const isHere = site.project?.key === project.key;
    const held = Object.entries(project.cost)
      .map(([key, amount]) => `${key === 'sticks' ? 'Sticks' : 'Stones'} ${Math.min(materialCount(key), amount)}/${amount}`)
      .join(' · ');
    const partial = !affordable && Object.keys(project.cost).some((key) => materialCount(key) > 0);
    const state = isHere ? 'BUILT' : affordable ? 'BUILD' : partial ? 'SHORT' : 'MISSING';
    return `<button class="recipe-option ${isHere ? '' : affordable ? 'is-complete' : partial ? 'is-partial' : ''}" type="button"
      data-build-project="${project.key}" ${affordable && !isHere ? '' : 'disabled'}>
      <span class="recipe-copy">
        <span class="recipe-name">${project.label}</span>
        <span class="recipe-note">${project.note}</span>
        <span class="recipe-requirements">${held}</span>
      </span>
      <span class="recipe-status">${state}</span>
    </button>`;
  }).join('');
  dom.buildOptions.innerHTML = standing + options;
}

function openBuildMenu(site) {
  activeBuildSite = site;
  renderBuildMenu();
  openModal(dom.buildModal);
  if (!materialCount('sticks') && !materialCount('stones')) {
    setStatus('Loot fallen sticks and field stones out in the forest, then come back to build.');
  }
}

function buildProject(projectKey) {
  const site = activeBuildSite;
  const project = BUILD_PROJECTS.find((candidate) => candidate.key === projectKey);
  if (!site || !project) return;
  if (!canAffordBuild(project)) {
    toast(`Not enough materials: ${project.label} needs ${describeBuildCost(project)}.`, 'warning');
    return;
  }
  // A plot holds one project, so rebuilding refunds whatever stood there first.
  if (site.project) clearBuild(site);
  for (const [key, amount] of Object.entries(project.cost)) {
    save.materials[key] = Math.max(0, materialCount(key) - amount);
  }
  placeBuild(site, project.key, true);
  renderBuildMenu();
}

// --- Sleeping -----------------------------------------------------------------

const WAKE_TIMES = [
  { hour: 6, label: 'First light', note: 'Rabbits and foxes are still out; the day shift is waking.' },
  { hour: 12, label: 'Midday', note: 'Full sun. Butterflies, bees and squirrels are working.' },
  { hour: 19, label: 'Dusk', note: 'Owls and raccoons start their rounds.' },
  { hour: 0, label: 'Midnight', note: 'Only the nocturnal animals are moving.' }
];

let sleepTimer = null;

function formatSleepLength(seconds) {
  const gameHours = (seconds / SKY_CYCLE_SECONDS) * 24;
  const whole = Math.floor(gameHours);
  const minutes = Math.round((gameHours - whole) * 60);
  return `${whole}h ${String(minutes).padStart(2, '0')}m`;
}

function sleepAtCabin() {
  const phase = getDayPhase();
  dom.sleepCopy.textContent = `It is ${getFieldClockLabel(phase)}. Choose when to get up.`;
  dom.sleepOptions.innerHTML = WAKE_TIMES.map((wake) => {
    const target = phaseForHour(wake.hour);
    let delta = target - phase;
    if (delta <= 0.0005) delta += 1;
    const clock = `${String(wake.hour).padStart(2, '0')}:00`;
    return `<button class="travel-option" data-wake-hour="${wake.hour}" type="button">
      <span class="travel-option-copy">
        <span class="travel-option-title">${wake.label} · ${clock}</span>
        <span class="travel-option-note">${wake.note}</span>
      </span>
      <span class="wake-option-time">${formatSleepLength(delta * SKY_CYCLE_SECONDS)}</span>
    </button>`;
  }).join('');
  openModal(dom.sleepModal);
}

function wakeAt(hour) {
  const wake = WAKE_TIMES.find((candidate) => candidate.hour === hour);
  if (!wake) return;
  closeModal(dom.sleepModal);
  window.clearTimeout(sleepTimer);
  dom.sleepVeil.classList.add('is-sleeping');
  const slept = advanceDayToPhase(phaseForHour(hour));
  // The period jumped, so adopt it silently rather than letting the ordinary
  // dawn/dusk announcement fire on top of the wake-up message.
  currentDayPeriod = getDayPeriod();
  updateSkyCycle();
  // A rested caretaker moves quietly again.
  spookRisk = 0.02;
  currentNoise = spookRisk;
  saveGame();
  updateHUD();
  sleepTimer = window.setTimeout(() => {
    dom.sleepVeil.classList.remove('is-sleeping');
    toast(`You slept ${formatSleepLength(slept)}. It is ${getFieldClockLabel()}.`, 'success');
    setStatus(`${wake.label} at the field cabin. ${wake.note}`);
  }, 640);
}

// --- Save slots ----------------------------------------------------------------
// Three independent field records, each with its own kit, coins, collection,
// builds and field clock. Switching writes the outgoing record first, so
// nothing is lost by changing slots mid-session.

let armedEraseSlot = null;

function formatSavedAgo(timestamp) {
  if (!timestamp) return 'not saved yet';
  const seconds = Math.max(0, Math.round((Date.now() - timestamp) / 1000));
  if (seconds < 60) return 'saved moments ago';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `saved ${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `saved ${hours}h ago`;
  return `saved ${Math.round(hours / 24)}d ago`;
}

function describeSlot(slot) {
  // The active slot reports live values, which may be ahead of what is on disk.
  const record = slot === activeSlot ? save : readRawSlot(slot);
  if (!record) return null;
  return {
    name: record.profileName || defaultProfileName(slot),
    coins: Number(record.coins || 0),
    caught: Object.keys(record.caught || {}).length,
    records: Object.keys(record.records || {}).length,
    zone: ZONES[record.lastZone]?.title || 'the field',
    savedAt: Number(record.savedAt || 0)
  };
}

function renderProfileSlots() {
  if (!dom.profileSlots) return;
  dom.profileSlots.innerHTML = SAVE_SLOTS.map((slot) => {
    const summary = describeSlot(slot);
    const isActive = slot === activeSlot;
    const state = isActive ? 'In play' : summary ? 'Saved' : 'Empty';
    const meta = summary
      ? `${summary.coins}¢ · ${summary.caught} species · ${summary.records} fish records · ${summary.zone} · ${formatSavedAgo(summary.savedAt)}`
      : 'No field record yet. Start one here.';
    const armed = armedEraseSlot === slot;
    return `<div class="profile-slot ${isActive ? 'is-active' : ''} ${summary ? '' : 'is-empty'}">
      <div class="profile-slot-head">
        <span class="profile-slot-index">Slot ${slot}</span>
        <span class="profile-slot-state">${state}</span>
      </div>
      <input class="profile-name-input" type="text" maxlength="22" data-profile-name="${slot}"
        value="${(summary?.name || defaultProfileName(slot)).replace(/"/g, '&quot;')}"
        aria-label="Name for slot ${slot}" ${summary ? '' : 'disabled'} />
      <p class="profile-slot-meta">${meta}</p>
      <div class="profile-slot-actions">
        <button type="button" data-profile-load="${slot}" data-profile-fresh="${summary ? 'false' : 'true'}" ${isActive ? 'disabled' : ''}>
          ${isActive ? 'Currently loaded' : summary ? 'Continue' : 'Start here'}
        </button>
        <button type="button" class="is-danger ${armed ? 'is-armed' : ''}" data-profile-delete="${slot}" ${summary ? '' : 'disabled'}>
          ${armed ? 'Confirm' : 'Erase'}
        </button>
      </div>
    </div>`;
  }).join('');
}

function openProfileMenu() {
  armedEraseSlot = null;
  renderProfileSlots();
  openModal(dom.profileModal);
}

function updateProfileLabel() {
  if (dom.profileLabel) dom.profileLabel.textContent = save.profileName || defaultProfileName(activeSlot);
}

// Line the running clock up with the phase this record was saved at. The clock
// only ever moves forward, the same rule sleeping follows.
function applySavedDayPhase() {
  const saved = Number(save.dayPhase);
  if (Number.isFinite(saved)) {
    const running = ((elapsed / SKY_CYCLE_SECONDS + SKY_PHASE_OFFSET) % 1 + 1) % 1;
    let delta = saved - running;
    if (delta < 0) delta += 1;
    dayTimeOffset = delta * SKY_CYCLE_SECONDS;
  } else {
    dayTimeOffset = 0;
  }
  // Adopt the new period silently rather than announcing a dawn that did not
  // happen while anyone was watching.
  currentDayPeriod = getDayPeriod();
  updateSkyCycle();
}

function activateProfile(slot, options = {}) {
  if (!SAVE_SLOTS.includes(slot) || (slot === activeSlot && !options.fresh)) return;
  if (slot !== activeSlot) saveGame();
  if (options.fresh) {
    try {
      window.localStorage.removeItem(slotStorageKey(slot));
    } catch (error) {
      console.warn('Could not clear that field record.', error);
    }
  }
  activeSlot = slot;
  try {
    window.localStorage.setItem(ACTIVE_SLOT_KEY, String(slot));
  } catch (error) {
    console.warn('Could not remember the active field record.', error);
  }
  save = loadSave(slot);
  window.clearTimeout(sleepTimer);
  dom.sleepVeil?.classList.remove('is-sleeping');
  selectedBait = 'worms';
  selectedLure = 'spinner';
  selectedFood = 'carrots';
  spookRisk = 0.02;
  currentNoise = spookRisk;
  applySavedDayPhase();
  closeAllModals(false);
  setTool('rod');
  enterZone(save.lastZone && ZONES[save.lastZone] ? save.lastZone : 'forest');
  updateHUD();
  updateFishingTips();
  updateProfileLabel();
  armedEraseSlot = null;
  toast(`${save.profileName} loaded.`, 'success');
  setStatus(`Field record: ${save.profileName}. Everything you gather from here is written to slot ${slot}.`);
}

function eraseProfile(slot) {
  if (!SAVE_SLOTS.includes(slot)) return;
  if (armedEraseSlot !== slot) {
    armedEraseSlot = slot;
    renderProfileSlots();
    setStatus(`Press confirm to erase slot ${slot}. This cannot be undone.`);
    return;
  }
  armedEraseSlot = null;
  if (slot === activeSlot) {
    // Erasing the record you are standing in restarts it rather than leaving
    // the world running on data that no longer exists.
    activateProfile(slot, { fresh: true });
    openProfileMenu();
    toast(`Slot ${slot} erased and restarted.`, 'warning');
    return;
  }
  try {
    window.localStorage.removeItem(slotStorageKey(slot));
  } catch (error) {
    console.warn('Could not erase that field record.', error);
  }
  renderProfileSlots();
  toast(`Slot ${slot} erased.`, 'warning');
}

function renameProfile(slot, rawName) {
  const name = String(rawName || '').trim().slice(0, 22) || defaultProfileName(slot);
  if (slot === activeSlot) {
    save.profileName = name;
    saveGame();
    updateProfileLabel();
    renderProfileSlots();
    return;
  }
  const record = readRawSlot(slot);
  if (!record) return;
  record.profileName = name;
  try {
    window.localStorage.setItem(slotStorageKey(slot), JSON.stringify(record));
  } catch (error) {
    console.warn('Could not rename that field record.', error);
  }
  renderProfileSlots();
}

function serviceActive(until) {
  return Number(until || 0) > Date.now();
}

function setAllHabitatsClean(cleaned) {
  zooEnclosures.forEach((enclosure) => {
    enclosure.cleaned = cleaned;
    updateEnclosureVisual(enclosure);
    save.cleanedEnclosures[enclosure.id] = cleaned;
  });
  saveGame();
}

function updateCharacterServices() {
  const brynleeActive = serviceActive(save.brynleeCaretakerUntil);
  const brooksActive = serviceActive(save.brooksWatchUntil);
  if (brynleeActive) {
    setAllHabitatsClean(true);
  } else if (save.brynleeCaretakerUntil && !save.brynleeCaretakerExpired) {
    save.brynleeCaretakerExpired = true;
    setAllHabitatsClean(false);
    toast('Brynlee’s caretaker shift ended. The habitats need attention again.', 'warning');
  }
  if (!brooksActive && save.brooksWatchUntil && !save.brooksWatchExpired) {
    save.brooksWatchExpired = true;
    toast('Brooks’ night watch has ended. Assign him another shift.', 'warning');
  }
}

function talkToCharacter(character) {
  if (character === 'brynlee') {
    if (serviceActive(save.brynleeCaretakerUntil)) {
      const remaining = Math.ceil((save.brynleeCaretakerUntil - Date.now()) / 60000);
      setStatus(`Brynlee is on caretaker duty for about ${remaining} more minute${remaining === 1 ? '' : 's'}.`);
      toast('Brynlee is keeping the Conservatory tidy.', 'success');
      return;
    }
    if ((save.supplies.goldenSeeds || 0) <= 0) {
      setStatus('Brynlee needs a Golden Seed Bundle to start her next caretaker shift.');
      toast('Bring Brynlee a Golden Seed Bundle.', 'warning');
      return;
    }
    save.supplies.goldenSeeds -= 1;
    save.brynleeCaretakerUntil = Date.now() + 15 * 60 * 1000;
    save.brynleeCaretakerExpired = false;
    setAllHabitatsClean(true);
    updateHUD();
    toast('Brynlee started a 15-minute caretaker shift.', 'success');
    setStatus('Brynlee is cleaning the Conservatory automatically. Come back before her shift ends.');
    return;
  }
  if (character === 'brooks') {
    if (serviceActive(save.brooksWatchUntil)) {
      setStatus(`Brooks is watching the ${save.brooksAssignment} route tonight.`);
      toast('Brooks is already on night watch.', 'success');
      return;
    }
    if ((save.supplies.lanternOil || 0) <= 0) {
      setStatus('Brooks needs Lantern Oil before he can start a night watch.');
      toast('Bring Brooks Lantern Oil.', 'warning');
      return;
    }
    save.supplies.lanternOil -= 1;
    save.brooksWatchUntil = Date.now() + 30 * 60 * 1000;
    save.brooksWatchExpired = false;
    save.brooksAssignment = 'conservatory';
    save.coins += 6;
    saveGame();
    updateHUD();
    toast('Brooks started a 30-minute Conservatory night watch. +6¢', 'success');
    setStatus('Brooks is patrolling the Conservatory. Night disturbances will be reported.');
    return;
  }
  if (character === 'brax') {
    const sticks = materialCount('sticks');
    const stones = materialCount('stones');
    const free = buildSites.filter((site) => !site.project).length;
    if (!sticks && !stones) {
      setStatus('Brax needs sticks and field stones. Loot the fallen sticks and loose rocks out in the forest.');
      toast('Brax: "Bring me sticks and stones and I will put up whatever you like."', 'info');
      return;
    }
    const affordable = BUILD_PROJECTS.filter(canAffordBuild).map((project) => project.label);
    toast(`Brax: "${sticks} stick${sticks === 1 ? '' : 's'}, ${stones} stone${stones === 1 ? '' : 's'}. ${affordable.length ? `We can put up a ${affordable[0].toLowerCase()} today.` : 'Not quite enough for anything yet.'}"`, 'success');
    setStatus(free
      ? `${free} open plot${free === 1 ? '' : 's'} in the yard. Stand on a marked ring and press E to build.`
      : 'Every plot is built out. Dismantle one to free up its materials.');
    return;
  }
  if (character === 'grayson') {
    const researchable = Object.entries(save.caught).filter(([, count]) => count > 0);
    if (!researchable.length) {
      setStatus('Grayson needs a recorded specimen before he can begin research.');
      toast('Bring Grayson a specimen from the field.', 'warning');
      return;
    }
    const [speciesKey] = researchable.sort((a, b) => b[1] - a[1])[0];
    save.graysonResearch += 1;
    save.coins += 8;
    save.caught[speciesKey] -= 1;
    saveGame();
    updateHUD();
    toast(`Grayson analyzed your ${SPECIES[speciesKey].label}. +8¢`, 'success');
    setStatus(`${SPECIES[speciesKey].label} research complete: look for it near its preferred field habitat.`);
  }
}

function handleInteract() {
  if (lakeBoatPilot?.active) {
    exitLakeBoat();
    return;
  }
  const target = getInteractionTarget();
  if (target?.type === 'character') {
    talkToCharacter(target.character);
    return;
  }
  if (target?.type === 'visitor') {
    greetVisitor(target.visitor);
    return;
  }
  if (target?.type === 'car') {
    openTravel();
    return;
  }
  if (target?.type === 'shop') {
    openShop();
    return;
  }
  if (target?.type === 'shop-item') {
    buyShopDisplay(target);
    return;
  }
  if (target?.type === 'captain') {
    talkToCaptainMark();
    return;
  }
  if (target?.type === 'lake-boat') {
    enterLakeBoat(target);
    return;
  }
  if (target?.type === 'closed-door') {
    toast('That door is secured for now.', 'warning');
    setStatus('Captain Mark has the keys, but these doors are not part of the current field route.');
    return;
  }
  if (target?.type === 'collection') {
    openCollection();
    return;
  }
  if (target?.type === 'tree') {
    inspectTree(target);
    return;
  }
  if (target?.type === 'hive') {
    lootHive(target.hive);
    return;
  }
  if (target?.type === 'wild-flower') {
    harvestWildFlower(target);
    return;
  }
  if (target?.type === 'carrot') {
    pullWildCarrot(target);
    return;
  }
  if (target?.type === 'nature-resource') {
    lootNatureResource(target);
    return;
  }
  if (target?.type === 'seed-plot') {
    if (isGardenPlotOccupied(target)) {
      setStatus('That planting spot is occupied. Choose an empty marked spot.');
      return;
    }
    plantFlowerSeed(target);
    return;
  }
  if (target?.type === 'nature-loot') {
    lootNatureStick(target);
    return;
  }
  if (target?.type === 'nature-rock') {
    lootNatureRock(target);
    return;
  }
  if (target?.type === 'build-site') {
    openBuildMenu(target);
    return;
  }
  if (target?.type === 'enclosure') {
    startCleaning(target);
    return;
  }
  if (target?.type === 'fridge') {
    inspectFridge();
    return;
  }
  if (target?.type === 'stove') {
    cookAtStove();
    return;
  }
  if (target?.type === 'bed') {
    sleepAtCabin();
    return;
  }
  if (target?.type === 'desk') {
    toast('The field desk is ready for future research notes.', 'success');
    setStatus('A tidy desk overlooks the showcase. It is decorative for now.');
    return;
  }
  if (['forest', 'zoo', 'lake'].includes(currentZone) && activeTool === 'magnifier') startBugObservation();
}

function handlePrimaryDown() {
  if (modalOpen || qteState) return;
  if (!pointerLocked) {
    activateFieldMode();
    return;
  }
  primaryHeld = true;
  const target = getInteractionTarget();
  if (target?.type === 'carrot') {
    pullWildCarrot(target);
    return;
  }
  if (['forest', 'zoo', 'lake'].includes(currentZone) && activeTool === 'rod') {
    if (fishing.phase === 'idle') startCast();
    else if (fishing.phase === 'bite') setHook();
    else if (fishing.phase === 'hooking') setHook();
    else if (fishing.phase === 'waiting') startReelIn();
    else if (fishing.phase === 'reeling') fishing.reelHeld = true;
  } else if (['forest', 'store', 'zoo', 'lake'].includes(currentZone) && activeTool === 'net') {
    useNet();
  } else if (['forest', 'zoo', 'lake'].includes(currentZone) && activeTool === 'magnifier') {
    startBugObservation();
  }
}

function handlePrimaryUp() {
  primaryHeld = false;
  if (fishing.phase === 'charging') finishCast();
  if (fishing.phase === 'reeling') fishing.reelHeld = false;
}

function handleActionDown() {
  if (lakeBoatPilot?.active) {
    exitLakeBoat();
    return;
  }
  if (fishing.phase === 'reeling') {
    actionHeld = true;
    fishing.reelHeld = true;
    return;
  }
  if (fishing.phase === 'bite') {
    setHook();
    return;
  }
  if (fishing.phase === 'hooking') {
    setHook();
    return;
  }
  if (fishing.phase === 'waiting') {
    startReelIn();
    return;
  }
  if (!pointerLocked) {
    activateFieldMode();
    return;
  }
  if (['forest', 'zoo', 'lake'].includes(currentZone) && activeTool === 'rod') startCast();
  if (['forest', 'store', 'zoo', 'lake'].includes(currentZone) && activeTool === 'net') useNet();
  if (['forest', 'zoo', 'lake'].includes(currentZone) && activeTool === 'magnifier') startBugObservation();
}

function handleActionUp() {
  actionHeld = false;
  if (fishing.phase === 'reeling') fishing.reelHeld = false;
  if (fishing.phase === 'charging') finishCast();
}

function resumeInspectionBug(message) {
  if (!qteState || qteState.bugInJar) return;
  qteState.frozen = false;
  qteState.frozenAt = 0;
  qteState.dragging = false;
  qteState.hovering = false;
  qteState.hoverTime = 0;
  qteState.vx = (Math.random() > 0.5 ? 1 : -1) * (7 + Math.random() * 4);
  qteState.vy = (Math.random() > 0.5 ? 1 : -1) * (4 + Math.random() * 4);
  const bugElement = dom.inspectionZoom.querySelector('#inspection-bug');
  bugElement?.classList.remove('is-frozen');
  dom.inspectionState.textContent = message;
}

function updateQTE(delta) {
  if (!qteState || qteState.kind !== 'inspection') return;
  const bugElement = dom.inspectionZoom.querySelector('#inspection-bug');
  if (!bugElement) return;
  if (!qteState.frozen && !qteState.dragging && !qteState.bugInJar) {
    if (qteState.hovering) qteState.hoverTime += delta;
    else qteState.hoverTime = Math.max(0, qteState.hoverTime - delta * 0.7);
    const path = qteState.branchPath;
    qteState.pathProgress = (qteState.pathProgress + delta * qteState.pathSpeed) % (path.length - 1);
    const step = Math.floor(qteState.pathProgress);
    const blend = qteState.pathProgress - step;
    const from = path[step];
    const to = path[(step + 1) % path.length];
    qteState.x = from[0] + (to[0] - from[0]) * blend;
    qteState.y = from[1] + (to[1] - from[1]) * blend;
    if (qteState.hoverTime >= 1.15) {
      qteState.frozen = true;
      qteState.frozenAt = elapsed;
      qteState.vx = 0;
      qteState.vy = 0;
      dom.inspectionState.textContent = qteState.jarOpen ? 'Frozen. Drag it into the open jar.' : 'Frozen, but the jar is closed. Open it before dragging.';
      toast('The bug froze under the lens. Drag it carefully into the jar.', 'success');
    }
  }
  if (qteState.frozen && !qteState.dragging && !qteState.bugInJar && elapsed >= qteState.frozenAt + 2) {
    resumeInspectionBug('The bug thawed and started moving. Hold the lens over it again.');
  }
  bugElement.style.left = `${qteState.x}%`;
  bugElement.style.top = `${qteState.y}%`;
  bugElement.classList.toggle('is-frozen', qteState.frozen);
}

function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.05);
  elapsed += delta;
  updateCameraRotation();
  updateMovement(delta);
  GRASS_SWAY_UNIFORM.value = elapsed;
  updateSkyCycle();
  updateHeldTool();
  updateFishing(delta);
  updateCastPreview();
  updateFishingVisuals(delta);
  updateCritters(delta);
  updateDucks(delta);
  updateBugNodes(delta);
  updateTreeInteractions();
  updateEnclosureMarkers();
  updateHotspots(delta);
  updateZooAnimals(delta);
  updateFieldCharacters(delta);
  updateBuildSites(delta);
  updateVisitors(delta);
  updateHubTraffic(delta);
  updateJenkinsLakeGate();
  updateAquarium();
  updatePollinatorGarden();
  if (elapsed > serviceCheckAt) {
    serviceCheckAt = elapsed + 3;
    updateCharacterServices();
  }
  // Keep the clock and the open journal ticking without redrawing every frame.
  if (elapsed > journalRefreshAt) {
    journalRefreshAt = elapsed + 0.5;
    updateFieldClockLabel();
    if (dom.journalModal && !dom.journalModal.classList.contains('is-hidden')) renderJournal();
  }
  updateQTE(delta);
  updatePrompt();
  updateCrosshair();
  updateFishingCallout();
  updateActionDock();
  updateFishingTips();
  updateCameraRotation();
  renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
});

window.addEventListener('keydown', (event) => {
  const normalizedKey = rememberKey(event, true);
  if (event.code === 'F3' && !event.repeat) {
    event.preventDefault();
    debugCollisionVisible = !debugCollisionVisible;
    rebuildDebugCollisionVisuals();
    const message = debugCollisionVisible
      ? `Collision debug ON: ${colliders.length} colliders labeled. Red = rectangles, gold = circles. Press F3 to hide.`
      : 'Collision debug OFF.';
    toast(message, debugCollisionVisible ? 'success' : 'info');
    setStatus(message);
    return;
  }
  if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'w', 'a', 's', 'd', 'Space', ' '].includes(event.code) || ['w', 'a', 's', 'd', ' '].includes(normalizedKey)) {
    event.preventDefault();
  }
  if (lakeBoatPilot?.active && !event.repeat && event.code === 'KeyW') cycleLakeBoatSpeed(1);
  if (lakeBoatPilot?.active && !event.repeat && event.code === 'KeyS') cycleLakeBoatSpeed(-1);
  if (event.code === 'Space' && !event.repeat && !modalOpen && !qteState && grounded && !lakeBoatPilot?.active) {
    jumpVelocity = JUMP_VELOCITY;
    grounded = false;
    setStatus('Jumping. Keep moving to clear rocks, roots, and shop displays.');
  }
  if (event.code === 'Escape' || normalizedKey === 'escape') {
    keys.clear();
    if (qteState) {
      closeModal(dom.qteModal);
      setStatus('You stepped away from the observation.');
    } else if (modalOpen) {
      closeAllModals();
    }
  }
  if (event.code === 'KeyE' || normalizedKey === 'e') handleInteract();
  if (event.code === 'Digit1') setTool('rod');
  if (event.code === 'Digit2') setTool('net');
  if (event.code === 'Digit3') setTool('magnifier');
  if (event.code === 'Digit4') setTool('food');
  if (event.code === 'KeyJ' && !event.repeat) toggleJournal();
  if (event.code === 'KeyB') cycleBait();
  if (event.code === 'KeyL') cycleLure();
  if (event.code === 'KeyF') cycleFood();
  if (event.code === 'KeyR' && fishing.phase === 'reeling') fishing.reelHeld = true;
});

window.addEventListener('keyup', (event) => {
  const normalizedKey = rememberKey(event, false);
  if (event.code === 'KeyR' && fishing.phase === 'reeling') fishing.reelHeld = false;
  if (normalizedKey === 'r' && fishing.phase === 'reeling') fishing.reelHeld = false;
});

function rememberKey(event, isDown) {
  const normalizedKey = typeof event.key === 'string' ? event.key.toLowerCase() : '';
  if (isDown) {
    keys.add(event.code);
    if (normalizedKey) keys.add(normalizedKey);
  } else {
    keys.delete(event.code);
    if (normalizedKey) keys.delete(normalizedKey);
  }
  return normalizedKey;
}

window.addEventListener('blur', () => {
  keys.clear();
  primaryHeld = false;
  actionHeld = false;
  fishing.reelHeld = false;
  fallbackPointer = null;
});

dom.canvas.addEventListener('pointerdown', (event) => {
  if (event.button !== 0) return;
  event.preventDefault();
  if (!pointerLocked && event.pointerId !== undefined) {
    fallbackPointerId = event.pointerId;
    try { dom.canvas.setPointerCapture?.(event.pointerId); } catch (error) { /* pointer capture is optional */ }
  }
  handlePrimaryDown();
});
window.addEventListener('pointerup', (event) => {
  if (event.button !== 0) return;
  if (fallbackPointerId !== null) {
    try { dom.canvas.releasePointerCapture?.(fallbackPointerId); } catch (error) { /* already released */ }
    fallbackPointerId = null;
  }
  handlePrimaryUp();
});

dom.canvas.addEventListener('click', () => {
  if (!pointerLocked && !modalOpen && !qteState) activateFieldMode();
});

document.addEventListener('pointerlockchange', () => {
  const hasPointerLock = document.pointerLockElement === dom.canvas;
  if (hasPointerLock) {
    fallbackFieldMode = false;
    pointerLocked = true;
    dom.canvas.focus();
  } else if (!fallbackFieldMode) {
    pointerLocked = false;
  }
  refreshFieldModeUI();
});

document.addEventListener('mousemove', (event) => {
  if (!pointerLocked || fallbackFieldMode || modalOpen || qteState) return;
  let movementX = event.movementX;
  let movementY = event.movementY;
  yaw -= movementX * 0.0021;
  pitch -= movementY * 0.0018;
  pitch = clamp(pitch, -1.32, 1.32);
});

document.addEventListener('pointermove', (event) => {
  if (!pointerLocked || !fallbackFieldMode || modalOpen || qteState) return;
  if (!fallbackPointer) {
    fallbackPointer = { x: event.clientX, y: event.clientY };
    return;
  }
  yaw -= (event.clientX - fallbackPointer.x) * 0.0021;
  pitch -= (event.clientY - fallbackPointer.y) * 0.0018;
  pitch = clamp(pitch, -1.32, 1.32);
  fallbackPointer = { x: event.clientX, y: event.clientY };
});

dom.primaryAction.addEventListener('pointerdown', (event) => {
  event.preventDefault();
  handleActionDown();
});
dom.reelAction.addEventListener('pointerdown', (event) => {
  event.preventDefault();
  handleActionDown();
});
window.addEventListener('pointerup', () => handleActionUp());

dom.qteAction.addEventListener('click', resolveBugObservation);
dom.cleaningAction.addEventListener('click', sweepHighlightedSpot);
dom.cleaningField.addEventListener('pointerover', (event) => {
  const spot = event.target.closest('[data-cleaning-index]');
  if (spot && cleaningState?.mode === 'aquarium') clearCleaningSpot(Number(spot.dataset.cleaningIndex));
});

dom.journalToggleButton?.addEventListener('click', () => toggleJournal());

dom.profileToggleButton?.addEventListener('click', () => {
  if (dom.profileModal?.classList.contains('is-hidden')) openProfileMenu();
  else closeModal(dom.profileModal);
});

dom.profileSlots?.addEventListener('click', (event) => {
  const load = event.target.closest('[data-profile-load]');
  if (load && !load.disabled) {
    activateProfile(Number(load.dataset.profileLoad), { fresh: load.dataset.profileFresh === 'true' });
    return;
  }
  const erase = event.target.closest('[data-profile-delete]');
  if (erase && !erase.disabled) eraseProfile(Number(erase.dataset.profileDelete));
});

dom.profileSlots?.addEventListener('change', (event) => {
  const input = event.target.closest('[data-profile-name]');
  if (input) renameProfile(Number(input.dataset.profileName), input.value);
});

dom.tipsToggleButton.addEventListener('click', () => {
  setTipsMenuOpen(dom.tipsMenu.classList.contains('is-hidden'));
});
dom.tipsMenuClose.addEventListener('click', () => setTipsMenuOpen(false));
dom.tipsEnabled.addEventListener('change', () => {
  save.tipsEnabled = dom.tipsEnabled.checked;
  saveGame();
  updateFishingTips();
});

dom.equipmentDock.addEventListener('click', (event) => {
  const button = event.target.closest('[data-tool]');
  if (button) setTool(button.dataset.tool);
});

dom.inventoryTabs?.addEventListener('click', (event) => {
  const button = event.target.closest('[data-inventory-tab]');
  if (button) setInventoryTab(button.dataset.inventoryTab);
});

dom.travelOptions.addEventListener('click', (event) => {
  const button = event.target.closest('[data-travel-zone]');
  if (!button || button.disabled) return;
  enterZone(button.dataset.travelZone, true);
});

dom.shopItems.addEventListener('click', (event) => {
  const button = event.target.closest('[data-buy-item]');
  if (!button || button.disabled) return;
  buyItem(button.dataset.buyItem, button.dataset.buyGroup);
});

dom.sleepOptions?.addEventListener('click', (event) => {
  const button = event.target.closest('[data-wake-hour]');
  if (button) wakeAt(Number(button.dataset.wakeHour));
});

dom.buildOptions?.addEventListener('click', (event) => {
  const clear = event.target.closest('[data-clear-build]');
  if (clear) {
    clearBuild(activeBuildSite);
    renderBuildMenu();
    return;
  }
  const button = event.target.closest('[data-build-project]');
  if (!button || button.disabled) return;
  buildProject(button.dataset.buildProject);
});

dom.stoveRecipes.addEventListener('click', (event) => {
  const button = event.target.closest('[data-cook-recipe]');
  if (!button || button.disabled) return;
  cookRecipe(button.dataset.cookRecipe);
});

document.querySelectorAll('[data-close-modal]').forEach((button) => {
  button.addEventListener('click', () => {
    const modal = document.querySelector(`#${button.dataset.closeModal}`);
    if (modal) closeModal(modal);
  });
});

createHeldToolModel(activeTool);
applySavedDayPhase();
updateProfileLabel();
renderProfileSlots();
enterZone(currentZone);
updateHUD();
setStatus('Find the car to choose a destination. The field is quiet for now.');
window.setTimeout(() => dom.loadingScreen.classList.add('is-loaded'), 420);
animate();
