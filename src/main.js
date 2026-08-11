import * as THREE from 'three';
import './style.css';

const SAVE_KEY = 'jenkins-conservatory-save-v1';
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
    bounds: { minX: -21, maxX: 21, minZ: -22, maxZ: 18 }
  },
  forest: {
    label: 'LAKE FOREST',
    title: 'Northwater Field',
    note: 'Disturbances mark the lake hot spots.',
    background: 0x91aa92,
    fog: 0x91aa92,
    ground: 0x46684e,
    accent: 0x8be0c3,
    bounds: { minX: -28, maxX: 28, minZ: -40, maxZ: 20 }
  },
  zoo: {
    label: 'CONSERVATORY ZOO',
    title: 'The Showcase',
    note: 'Review the animals in your growing collection.',
    background: 0x7d9587,
    fog: 0x7d9587,
    ground: 0x697862,
    accent: 0xd8ef85,
    bounds: { minX: -23, maxX: 23, minZ: -64, maxZ: 18 }
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
    fogFar: 148,
    bounds: { minX: -74, maxX: 74, minZ: -198, maxZ: 34 }
  }
};

const JENKINS_LAKE_PLACEHOLDER_ACCESS = true;
const JENKINS_LAKE_ROAD = [
  [0, 28], [-1.4, 17], [1.8, 5], [-1.9, -8], [1.5, -21], [-1.6, -34], [1.1, -47], [-0.5, -63]
];

const JENKINS_LAKE_WATER = {
  centerX: 0,
  centerZ: -153,
  radiusX: 61,
  radiusZ: 34,
  playerRadiusX: 59.2,
  playerRadiusZ: 32.2,
  castRadiusX: 58.2,
  castRadiusZ: 31.2
};

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
  { key: 'sunfish', label: 'Sunfish', icon: '◌', note: 'A fresh fish offering' }
];

const COOKING_RECIPES = [
  {
    key: 'grilled-fish-glazed-carrots',
    label: 'Grilled fish + glazed carrots',
    note: 'A simple field supper with any fish.',
    ingredients: [
      { anyOf: ['trout', 'sunfish'], label: 'Any fish', amount: 1 },
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

const SPECIES = {
  trout: { label: 'Brook trout', type: 'fish', sigil: '≈', color: 0xd78155, note: 'Spinner + worms' },
  sunfish: { label: 'Bluegill sunfish', type: 'fish', sigil: '◌', color: 0x70a6be, note: 'Feather + grubs' },
  rabbit: { label: 'Cottontail rabbit', type: 'ground', sigil: '◒', color: 0xe6d7bf, note: 'Sneak + net' },
  squirrel: { label: 'Red squirrel', type: 'ground', sigil: '◓', color: 0xb56843, note: 'Sneak + net' },
  fox: { label: 'Red fox', type: 'ground', sigil: '◇', color: 0xc96c3e, note: 'Sneak + net' },
  frog: { label: 'Green frog', type: 'ground', sigil: '◉', color: 0x6fb36d, note: 'Sneak + net' },
  turtle: { label: 'Pond turtle', type: 'ground', sigil: '⊙', color: 0x71926b, note: 'Sneak + net' },
  owl: { label: 'Tawny owl', type: 'flying', sigil: '◎', color: 0xb79a70, note: 'Sneak + net' },
  raccoon: { label: 'Raccoon', type: 'ground', sigil: '◐', color: 0x899291, note: 'Sneak + net' },
  sparrow: { label: 'House sparrow', type: 'flying', sigil: '⌁', color: 0x9a8064, note: 'Sneak + net' },
  duck: { label: 'Mallard duck', type: 'water', sigil: '◒', color: 0x587a61, note: 'Floats on the lake' },
  butterfly: { label: 'Painted butterfly', type: 'bug', sigil: '✦', color: 0xf0a4c1, note: 'Catch with net' },
  bee: { label: 'Meadow bee', type: 'bug', sigil: '✧', color: 0xf2c84b, note: 'Catch with net' },
  dragonfly: { label: 'Blue dragonfly', type: 'bug', sigil: '⌁', color: 0x83cfe7, note: 'Catch with net' }
  ,caterpillar: { label: 'Monarch caterpillar', type: 'bug', sigil: '◍', color: 0xd59c3a, note: 'Magnify on flowers' }
  ,worm: { label: 'Earthworm', type: 'bug', sigil: '≈', color: 0xb7775b, note: 'Magnify on plants · fishing lure' }
  ,spider: { label: 'Garden spider', type: 'bug', sigil: '✣', color: 0x81768c, note: 'Magnify near webs' }
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
  { key: 'pans', group: 'tool', label: 'Camp cooking pan', note: 'Needed to cook at the cabin stove.', cost: 30, amount: 1 },
  { key: 'waders', group: 'tool', label: 'Field waders', note: 'Walk twice as far into lake water.', cost: 38, amount: 1 },
  { key: 'flowerSeeds', group: 'seed', label: 'Flower seed packet', note: 'Plant in the pollinator field. Blooms in 5 minutes.', cost: 12, amount: 3 }
];

const DEFAULT_SAVE = {
  tipsEnabled: true,
  coins: 120,
  supplies: {
    worms: 6,
    grubs: 4,
    spinner: 2,
    feather: 2,
    nets: 2,
    magnifiers: 1,
    pans: 0,
    waders: 0,
    flowerSeeds: 2,
    carrotSeeds: 0,
  },
  caught: {},
  cleanedEnclosures: {},
  gardenFlowers: null,
  records: {},
  honey: 0,
  ingredients: { carrots: 0, flowers: 0, trout: 0, sunfish: 0, mushrooms: 0, morels: 0, treeMushrooms: 0, wildRice: 0, scallions: 0, berries: 0, duckEggs: 0 },
  cooked: { grilledFish: 0, glazedCarrots: 0, risotto: 0, sunfishSalad: 0, troutEggsBenedict: 0 },
  meals: 0,
  jenkinsLakePass: false,
  lastZone: 'forest'
};

const dom = {
  canvas: document.querySelector('#game-canvas'),
  zoneLabel: document.querySelector('#zone-label'),
  coinLabel: document.querySelector('#coin-label'),
  lockDot: document.querySelector('#lock-dot'),
  lockLabel: document.querySelector('#lock-label'),
  statusMessage: document.querySelector('#status-message'),
  promptCard: document.querySelector('#prompt-card'),
  promptKey: document.querySelector('#prompt-key'),
  promptText: document.querySelector('#prompt-text'),
  equipmentList: document.querySelector('#equipment-list'),
  inventoryTabs: document.querySelector('#inventory-tabs'),
  saveStatus: document.querySelector('#save-status'),
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
const camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.08, 160);
camera.rotation.order = 'YXZ';
let skybox = null;
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
let currentNoise = 0;
let spookRisk = 0.02;
let toastId = 0;
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
let lakeArrival = null;
let lakeCarInterior = null;
let lakeParkedCar = null;
let lakeCaptain = null;
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

function loadSave() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(SAVE_KEY) || 'null');
    if (!parsed) return structuredClone(DEFAULT_SAVE);
    return {
      ...structuredClone(DEFAULT_SAVE),
      ...parsed,
      supplies: { ...DEFAULT_SAVE.supplies, ...(parsed.supplies || {}) },
      caught: { ...(parsed.caught || {}) },
      cleanedEnclosures: { ...(parsed.cleanedEnclosures || {}) },
      gardenFlowers: Array.isArray(parsed.gardenFlowers) ? parsed.gardenFlowers : null,
      records: { ...(parsed.records || {}) },
      honey: Number(parsed.honey || 0),
      ingredients: { ...DEFAULT_SAVE.ingredients, ...(parsed.ingredients || {}) },
      cooked: { ...DEFAULT_SAVE.cooked, ...(parsed.cooked || {}) },
      meals: Number(parsed.meals || 0)
    };
  } catch (error) {
    console.warn('Save data unavailable; using a fresh field kit.', error);
    return structuredClone(DEFAULT_SAVE);
  }
}

function saveGame() {
  try {
    save.lastZone = currentZone;
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(save));
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
  const collider = { x, z, radius, enabled: true, ...options };
  colliders.push(collider);
  return collider;
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
        continue;
      }
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
  const skyMaterial = new THREE.MeshBasicMaterial({ color: 0xb2c6b8, side: THREE.BackSide, fog: false, depthWrite: false });
  skybox = new THREE.Mesh(new THREE.BoxGeometry(420, 420, 420), skyMaterial);
  skybox.renderOrder = -10;
  scene.add(skybox);
}

function torus(parent, majorRadius, tubeRadius, color, position, rotation = [0, 0, 0], radialSegments = 8, tubularSegments = 18) {
  return addMesh(parent, new THREE.TorusGeometry(majorRadius, tubeRadius, radialSegments, tubularSegments), mat(color), position, rotation);
}

function triggerToolAction(name, duration = 0.45) {
  toolAction = { name, startedAt: elapsed, duration };
}

function updateHeldTool() {
  heldToolGroup.visible = !(currentZone === 'lake' && lakeArrival?.active);
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
  scene.background = new THREE.Color(zone.background);
  if (skybox) skybox.material.color.set(zoneKey === 'forest' ? 0x9ab9c3 : zoneKey === 'zoo' ? 0xb2c6b8 : zoneKey === 'lake' ? 0xa4b7b0 : 0xb8bd9d);
  scene.fog = new THREE.Fog(zone.fog, zone.fogNear || 34, zone.fogFar || 100);
  hemiLight.color.set(zoneKey === 'forest' ? 0xd6efcb : 0xe9efcf);
  hemiLight.groundColor.set(zoneKey === 'zoo' ? 0x2f4034 : 0x20352a);
  sunLight.color.set(zoneKey === 'forest' ? 0xfff3ce : 0xffedc3);
  sunLight.intensity = zoneKey === 'forest' ? 3.45 : 3.05;
}

function addGround(color, size = 90) {
  return addMesh(world, new THREE.PlaneGeometry(size, size), mat(color), [0, -0.08, 0], [-Math.PI / 2, 0, 0]);
}

function createParkingHub(label, accent) {
  box(world, [17, 0.08, 14], 0x333f38, [0, 0, 10], { material: { roughness: 1 } });
  box(world, [15.5, 0.025, 12.5], 0x4f5b4e, [0, 0.06, 10], { material: { roughness: 1 } });
  for (let x = -6; x <= 6; x += 3) {
    box(world, [0.12, 0.035, 4.6], 0xd4c78e, [x, 0.09, 10], { material: { roughness: 0.8 } });
  }
  box(world, [17, 0.4, 0.35], 0x26352d, [0, 0.2, 16.85]);
  box(world, [0.35, 0.4, 14], 0x26352d, [-8.35, 0.2, 10]);
  box(world, [0.35, 0.4, 14], 0x26352d, [8.35, 0.2, 10]);
  addCollider(0, 16.85, 0.2, { type: 'rect', halfWidth: 8.5, halfDepth: 0.2, zone: currentZone });
  addCollider(-8.35, 10, 0.2, { type: 'rect', halfWidth: 0.2, halfDepth: 7, zone: currentZone });
  addCollider(8.35, 10, 0.2, { type: 'rect', halfWidth: 0.2, halfDepth: 7, zone: currentZone });

  const car = createCar();
  car.position.set(0, 0.25, 10);
  world.add(car);
  addCollider(0, 10, 2.1, { zone: currentZone });
  interactables.push({ type: 'car', label: 'Open travel map', position: car.position.clone(), radius: 3.5 });

  const sign = makeLabel(label, `#${new THREE.Color(accent).getHexString()}`, '#1c3025', 1.12);
  sign.position.set(-6.8, 3.4, 8.1);
  sign.rotation.y = 0.22;
  world.add(sign);

  for (const x of [-15, 15]) {
    createTree(x, 11, 1.35, 0x376045, 0x6f4e39);
  }
}

function createCar() {
  const group = new THREE.Group();
  const body = box(group, [3.6, 0.65, 1.7], 0xd76d4d, [0, 0.78, 0]);
  body.castShadow = true;
  box(group, [2.05, 0.65, 1.4], 0xc8d8d1, [0, 1.28, -0.08], { material: { color: 0x263c3a, roughness: 0.5, metalness: 0.15 } });
  box(group, [0.3, 0.24, 1.9], 0xffcc69, [-1.83, 0.78, 0], { material: { emissive: 0x8a3d1c, emissiveIntensity: 0.45 } });
  box(group, [0.18, 0.23, 1.92], 0xfff2b0, [1.82, 0.8, 0], { material: { emissive: 0x76522b, emissiveIntensity: 0.25 } });
  for (const x of [-1.2, 1.2]) {
    cylinder(group, 0.34, 0.34, 0.22, 0x1a201c, [x, 0.38, -0.75], { rotation: [Math.PI / 2, 0, 0], segments: 10 });
    cylinder(group, 0.34, 0.34, 0.22, 0x1a201c, [x, 0.38, 0.75], { rotation: [Math.PI / 2, 0, 0], segments: 10 });
  }
  const roofLine = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-1, 1.64, -0.72), new THREE.Vector3(1, 1.64, -0.72)]),
    new THREE.LineBasicMaterial({ color: 0xd8ef85 })
  );
  group.add(roofLine);
  const label = makeLabel('TRAVEL', '#d8ef85', '#1b3024', 0.48);
  label.position.set(0, 2.55, 0);
  group.add(label);
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
  const label = makeLabel(index === 1 ? 'MAIN DOCK' : 'DOCK', '#d8ef85', '#30442f', 0.34);
  label.position.set(dock.x, 1.35, dock.shoreZ - 0.7);
  world.add(label);
  return group;
}

function createLakeLilyPad(x, z, scale = 1, index = 0) {
  const pad = new THREE.Group();
  pad.position.set(x, 0.19, z);
  sphere(pad, 0.42, index % 2 ? 0x168e68 : 0x1b9a70, [0, 0, 0], { scale: [scale * 1.2, 0.08, scale], widthSegments: 10, heightSegments: 5 });
  const flower = index % 3 === 0 ? sphere(pad, 0.075, 0xf4e7ab, [0.08 * scale, 0.075, -0.04 * scale], { scale: [1.25, 0.55, 1.25] }) : null;
  pad.rotation.y = index * 0.8;
  world.add(pad);
  return { pad, flower };
}

function createLakeBoat(x, z) {
  const boat = new THREE.Group();
  boat.position.set(x, 0.33, z);
  addMesh(boat, new THREE.CylinderGeometry(0.92, 0.74, 0.18, 4), mat(0xd2d5d0, { metalness: 0.25, roughness: 0.55 }), [0, 0, 0], [0, Math.PI / 4, 0]);
  box(boat, [0.12, 0.18, 1.15], 0x707a75, [0, 0.13, 0]);
  box(boat, [0.82, 0.08, 0.1], 0x8b938d, [0, 0.24, 0]);
  const label = makeLabel('BOAT', '#d8ef85', '#30442f', 0.3);
  label.position.set(0, 1.0, 0);
  boat.add(label);
  world.add(boat);
  return boat;
}

function createLakeCaptain(x, z) {
  const captain = new THREE.Group();
  captain.position.set(x, 0, z);
  sphere(captain, 0.3, 0xb98262, [0, 1.5, 0]);
  cylinder(captain, 0.42, 0.5, 1.15, 0x455f69, [0, 0.82, 0], { segments: 8 });
  box(captain, [0.62, 0.08, 0.44], 0xc29a62, [0, 1.82, 0]);
  cylinder(captain, 0.16, 0.2, 0.16, 0x374a4c, [0, 1.97, 0], { segments: 8 });
  cylinder(captain, 0.07, 0.07, 0.78, 0xb98262, [-0.5, 0.8, 0], { rotation: [0, 0, Math.PI / 2], segments: 7 });
  cylinder(captain, 0.07, 0.07, 0.78, 0xb98262, [0.5, 0.8, 0], { rotation: [0, 0, -Math.PI / 2], segments: 7 });
  const label = makeLabel('CAPTAIN MARK', '#f2b268', '#2f3d30', 0.38);
  label.position.set(0, 2.45, 0);
  captain.add(label);
  world.add(captain);
  const interactable = { type: 'captain', label: 'Talk to Captain Mark', position: new THREE.Vector3(x, 1.05, z), radius: 3.1, group: captain };
  interactables.push(interactable);
  lakeCaptain = interactable;
  return interactable;
}

function createLakeCarInterior() {
  const interior = new THREE.Group();
  box(interior, [2.2, 0.12, 0.72], 0x342e2a, [0, -0.48, -0.78]);
  box(interior, [1.95, 0.09, 0.1], 0xd0a25f, [0, -0.37, -0.98]);
  box(interior, [0.12, 1.35, 0.12], 0x342e2a, [-1.02, 0.12, -1.3]);
  box(interior, [0.12, 1.35, 0.12], 0x342e2a, [1.02, 0.12, -1.3]);
  box(interior, [2.15, 0.12, 0.12], 0x342e2a, [0, 0.76, -1.3]);
  box(interior, [0.78, 0.07, 0.78], 0x253837, [0.48, -0.24, -0.92], { material: { transparent: true, opacity: 0.78 } });
  torus(interior, 0.2, 0.035, 0x1c2422, [0.5, -0.18, -0.68], [Math.PI / 2, 0, 0], 8, 18);
  const dashLabel = makeLabel('JENKINS LAKE TRANSIT', '#d8ef85', '#1d3027', 0.25);
  dashLabel.position.set(0, -0.26, -1.05);
  interior.add(dashLabel);
  camera.add(interior);
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


function createFence(x, z, width, depth, color = 0x806e53, solid = true) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  const railY = [0.7, 1.3];
  for (const y of railY) {
    box(group, [width, 0.12, 0.12], color, [0, y, -depth / 2]);
    box(group, [width, 0.12, 0.12], color, [0, y, depth / 2]);
    box(group, [0.12, 0.12, depth], color, [-width / 2, y, 0]);
    box(group, [0.12, 0.12, depth], color, [width / 2, y, 0]);
  }
  for (const post of [[-width / 2, -depth / 2], [width / 2, -depth / 2], [-width / 2, depth / 2], [width / 2, depth / 2]]) {
    cylinder(group, 0.11, 0.14, 1.9, color, [post[0], 0.9, post[1]], { segments: 6 });
  }
  world.add(group);
  if (solid) {
    addCollider(x, z - depth / 2, width / 2, { type: 'rect', halfWidth: width / 2, halfDepth: 0.18, zone: currentZone });
    addCollider(x, z + depth / 2, width / 2, { type: 'rect', halfWidth: width / 2, halfDepth: 0.18, zone: currentZone });
    addCollider(x - width / 2, z, 0.18, { type: 'rect', halfWidth: 0.18, halfDepth: depth / 2, zone: currentZone });
    addCollider(x + width / 2, z, 0.18, { type: 'rect', halfWidth: 0.18, halfDepth: depth / 2, zone: currentZone });
  }
  return group;
}

function createMountainBoundary(zoneKey) {
  const bounds = ZONES[zoneKey].bounds;
  const points = [];
  for (let x = bounds.minX + 1.5; x <= bounds.maxX - 1.5; x += 2.6) {
    points.push([x, bounds.minZ]);
    points.push([x, bounds.maxZ]);
  }
  for (let z = bounds.minZ + 2.6; z <= bounds.maxZ - 2.6; z += 2.6) {
    points.push([bounds.minX, z]);
    points.push([bounds.maxX, z]);
  }
  points.forEach(([x, z], index) => {
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
  interactables.push({ type: 'bed', label: 'Sleep until morning', position: new THREE.Vector3(x - 1.15, 0.7, z + 0.95), radius: 2.4 });
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

function createPondDock() {
  const group = new THREE.Group();
  const length = FOREST_DOCK.shoreZ - FOREST_DOCK.endZ;
  const centerZ = (FOREST_DOCK.shoreZ + FOREST_DOCK.endZ) / 2;
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
  sphere(npc, 0.34, 0xc88561, [0, 1.35, 0]);
  sphere(npc, 0.25, 0x2b322d, [-0.1, 1.41, -0.22], { scale: [0.25, 0.18, 0.08] });
  cylinder(npc, 0.48, 0.58, 0.9, 0x4f6c65, [0, 0.66, 0], { segments: 8 });
  box(npc, [0.72, 0.12, 0.62], 0xd4b67b, [0, 1.18, 0]);
  cylinder(npc, 0.08, 0.08, 0.72, 0xc88561, [-0.55, 0.67, 0], { rotation: [0, 0, Math.PI / 2], segments: 7 });
  cylinder(npc, 0.08, 0.08, 0.72, 0xc88561, [0.55, 0.67, 0], { rotation: [0, 0, -Math.PI / 2], segments: 7 });
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
    if (item.key === 'waders') {
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
  addGround(ZONES.store.ground);
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

  const backXs = [-5.8, 0, 5.8];
  SHOP_ITEMS.slice(0, 3).forEach((item, index) => createShopDisplay(item, backXs[index], -6.72, 1));
  const sideSpots = [
    [-8.62, -1.5, Math.PI / 2, 0], [-8.62, -4.55, Math.PI / 2, 0],
    [8.62, -1.5, -Math.PI / 2, 0], [8.62, -4.55, -Math.PI / 2, 0],
    [-8.62, -6.7, Math.PI / 2, 1], [8.62, -6.7, -Math.PI / 2, 1]
  ];
  SHOP_ITEMS.slice(3).forEach((item, index) => {
    const [x, z, rotation, row] = sideSpots[index];
    createShopDisplay(item, x, z, row, rotation);
  });
  createTree(-14, -4, 1.1, 0x44694e);
  createTree(14, -3, 1.05, 0x44694e);
  addSmallCrates(-4, 0, -2);
  addSmallCrates(5, 0, -1);
}

function addSmallCrates(x, y, z) {
  box(world, [0.8, 0.8, 0.8], 0xb5794e, [x, y + 0.4, z], { rotation: [0, 0.08, 0.05] });
  box(world, [0.68, 0.68, 0.68], 0xe0a566, [x + 0.7, y + 0.34, z + 0.2], { rotation: [0.03, -0.1, 0] });
}

function buildForest() {
  setZonePalette('forest');
  addGround(ZONES.forest.ground);
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
  const critter = { species, group, home: new THREE.Vector3(...position), direction: Math.random() * Math.PI * 2, state: 'idle', stateTime: Math.random() * 2, fleeTime: 0, caught: false, hidden: false, respawnAt: 0 };
  critters.push(critter);
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
    if (isGrassNaturePosition(zoneKey, x, z)) addRock(x, 0.18, z, scale, index % 2 ? 0x718474 : 0x667b6e);
  });
  layouts.sticks.forEach(([x, z], index) => {
    if (isGrassNaturePosition(zoneKey, x, z)) createNatureStick(x, z, index);
  });
}

function isGrassNaturePosition(zoneKey, x, z) {
  if (zoneKey === 'forest') {
    const inWater = Math.hypot(x - FOREST_WATER.centerX, z - FOREST_WATER.centerZ) < FOREST_WATER.waterRadius + 1.1;
    const onDock = Math.abs(x) < FOREST_DOCK.halfWidth + 0.45 && z > FOREST_DOCK.endZ - 0.6 && z < FOREST_DOCK.shoreZ + 0.8;
    const onParkingHub = Math.abs(x) < 9.2 && z > 3.1;
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
  save.coins += 2;
  saveGame();
  updateHUD();
  toast('Fallen stick looted. +2¢', 'success');
  setStatus('The ground cover is full of small field finds.');
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
    critter.home.copy(critter.group.position);
    critter.direction = Math.random() * Math.PI * 2;
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
    if (duck.state === 'float') {
      const holdingFish = activeTool === 'food' && (selectedFood === 'trout' || selectedFood === 'sunfish') && distance < 9;
      const attractionRadiusX = (water.radiusX || water.waterRadius) * 0.72;
      const attractionRadiusZ = (water.radiusZ || water.waterRadius) * 0.72;
      const nextX = holdingFish ? clamp(player.x, water.centerX - attractionRadiusX, water.centerX + attractionRadiusX) : duck.home.x + Math.cos(elapsed * 0.22 + duck.phase) * 1.05;
      const nextZ = holdingFish ? clamp(player.z, water.centerZ - attractionRadiusZ, water.centerZ + attractionRadiusZ) : duck.home.z + Math.sin(elapsed * 0.22 + duck.phase) * 0.78;
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
  createPath(-9, -9, 3.2, 15, 0xc0ad78);
  createPath(9, -9, 3.2, 15, 0xc0ad78);

  createFence(-9, -10, 8, 8, 0x806e53, false);
  createFence(9, -10, 8, 8, 0x806e53, false);
  createFence(0, -22, 14, 5, 0x66806d, false);
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
}

function createJenkinsLakeRoad() {
  for (let index = 0; index < JENKINS_LAKE_ROAD.length - 1; index += 1) {
    const [fromX, fromZ] = JENKINS_LAKE_ROAD[index];
    const [toX, toZ] = JENKINS_LAKE_ROAD[index + 1];
    const dx = toX - fromX;
    const dz = toZ - fromZ;
    const length = Math.hypot(dx, dz);
    const angle = Math.atan2(dx, dz);
    const centerX = (fromX + toX) / 2;
    const centerZ = (fromZ + toZ) / 2;
    box(world, [4.6, 0.06, length + 1.2], 0x9a774f, [centerX, 0.01, centerZ], { rotation: [0, angle, 0] });
    box(world, [3.7, 0.025, length + 0.9], 0xb18a59, [centerX, 0.045, centerZ], { rotation: [0, angle, 0] });
  }
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
  const buildings = [
    [-18, -28, 18, 12],
    [17, -31, 12, 10],
    [-9.5, -72, 14, 14],
    [-34, -96, 14, 12],
    [-25, -108, 8.5, 7.2],
    [35, -92, 14, 12],
    [29, -108, 8.5, 7.2],
    [45, -105, 9, 8]
  ];
  const inBuilding = buildings.some(([centerX, centerZ, width, depth]) => Math.abs(x - centerX) < width / 2 + 1.1 && Math.abs(z - centerZ) < depth / 2 + 1.1);
  const bounds = ZONES.lake.bounds;
  return x > bounds.minX + 2.5 && x < bounds.maxX - 2.5 && z > bounds.minZ + 2.5 && z < bounds.maxZ - 2.5
    && waterDistance >= 1 && !onRoad && !inBuilding && !rightOfShackBarrier && (!inMeadow || allowMeadow);
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
    for (let column = 0, x = -67; x <= 67; column += 1, x += 7.6) {
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
      addForestTree(side * (61.5 + (row % 2) * 1.2), z, 0.88 + (row % 3) * 0.08, 150 + row * 2 + (side > 0 ? 1 : 0));
    }
  }

  for (let row = 0, z = 24; z > -194; row += 1, z -= 5.2) {
    for (let column = 0, x = -68; x <= 68; column += 1, x += 6.3) {
      if ((row + column) % 2 !== 0 || !isJenkinsLakeClearPosition(x, z)) continue;
      createGroundFoliage(x, z, 0.68 + ((row + column) % 4) * 0.13, (row + column) % 2 ? 0x4e8054 : 0x5a8958);
    }
  }
  for (let index = 0; index < 56; index += 1) {
    const x = -68 + (index * 17) % 136;
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

  // The field shack sits against a short local mountain wall. A couple trees remain visible,
  // but the player cannot thread through the forest behind it.
  [[23.8, -23], [24.2, -38]].forEach(([x, z], index) => createBranchTree(x, z, 0.82 + index * 0.08, 0x3f6d4b, 0x604733));
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
  [[-54, -130], [-39, -119], [-18, -121], [18, -121], [41, -127], [56, -144], [-48, -173], [-16, -184], [20, -185], [49, -173]].forEach(([x, z], index) => addRock(x, 0.24, z, 0.3 + (index % 2) * 0.12, 0x667b6e));
  [[-45, -135], [-28, -126], [-10, -139], [12, -128], [31, -143], [45, -157], [-34, -164], [-7, -174], [22, -169], [49, -151]].forEach(([x, z], index) => createHotspot(x, z, index % 2 ? 'sunfish' : 'trout', index % 2 ? 'feather' : 'spinner', index % 2 ? 'grubs' : 'worms'));
  [[-47, -142, 0.9], [-40, -153, 0.72], [-12, -149, 0.82], [7, -158, 0.7], [29, -132, 0.86], [37, -165, 0.75], [53, -157, 0.64], [-24, -177, 0.9]].forEach(([x, z, scale], index) => createLakeLilyPad(x, z, scale, index));
  JENKINS_LAKE_DOCKS.forEach((dock, index) => createLakeDock(dock, index));
  createLakeBoat(29.2, -136.5);
}

function isLakeGrassCompoundPosition(x, z, padding = 0) {
  return JENKINS_LAKE_GRASS_COMPOUNDS.some(({ centerX, centerZ, width, depth }) => (
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
  meadowTrees.forEach(([x, z], index) => (index % 3 === 0 ? createBranchTree : createTree)(x, z, 0.86 + (index % 3) * 0.08, index % 2 ? 0x3f6d4b : 0x4b7950));

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
  createGroundMushroom(-34, -101, 38, true);
  [[-41, -92], [11, -89], [37, -90]].forEach(([x, z], index) => createWildScallion(x, z, 30 + index));
  [[-26, -101], [3, -104], [43, -106]].forEach(([x, z], index) => createBerryBush(x, z, 30 + index));
  [[-40, -116], [-33, -119], [-26, -116], [25, -119], [34, -121], [43, -117]].forEach(([x, z], index) => createWildRicePlant(x, z, 30 + index));

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
  createLakeBarn(-18, -28);
  createLakeShack(17, -31);
  createLakeCabin(-9.5, -72);
  createLakeCabin(-34, -96);
  createLakeGarage(-25, -108, 'WEST GARAGE · CLOSED');
  createLakeCabin(35, -92);
  createLakeGarage(29, -108, 'EAST GARAGE · CLOSED');
  createLakeShack(45, -105);
  lakeParkedCar = createCar();
  lakeParkedCar.position.set(0, 0.25, -63.5);
  lakeParkedCar.visible = false;
  world.add(lakeParkedCar);
  lakeCaptain = createLakeCaptain(3.6, -78);
  const gateLabel = makeLabel('LAKE ACCESS · CAPTAIN MARK', '#f2b268', '#2f3d30', 0.42);
  gateLabel.position.set(3.6, 2.9, -79.8);
  world.add(gateLabel);
  lakeGateCollider = addCollider(0, -117.2, 0.2, { type: 'rect', halfWidth: 58.5, halfDepth: 0.22, zone: 'lake' });
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
  lakeArrival = { active: true, progress: 0, duration: 10.5 };
  lakeCarInterior = createLakeCarInterior();
  player.set(JENKINS_LAKE_ROAD[0][0], 1.72, JENKINS_LAKE_ROAD[0][1]);
  setStatus('The car is following the winding road to Jenkins Lake.');
  updateJenkinsLakeArrival(0);
}

function updateJenkinsLakeArrival(delta) {
  if (!lakeArrival?.active) return false;
  lakeArrival.progress = clamp(lakeArrival.progress + delta / lakeArrival.duration, 0, 1);
  const scaled = lakeArrival.progress * (JENKINS_LAKE_ROAD.length - 1);
  const index = Math.min(JENKINS_LAKE_ROAD.length - 2, Math.floor(scaled));
  const blend = scaled - index;
  const from = JENKINS_LAKE_ROAD[index];
  const to = JENKINS_LAKE_ROAD[index + 1];
  player.x = from[0] + (to[0] - from[0]) * blend;
  player.z = from[1] + (to[1] - from[1]) * blend;
  const nextX = to[0] - from[0];
  const nextZ = to[1] - from[1];
  yaw = Math.atan2(nextX, -nextZ);
  camera.position.set(player.x, player.y, player.z);
  if (lakeArrival.progress >= 1) {
    lakeArrival.active = false;
    lakeArrival = null;
    if (lakeCarInterior) {
      camera.remove(lakeCarInterior);
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
  const hasFish = (save.cooked.grilledFish || 0) > 0;
  const hasCarrots = (save.cooked.glazedCarrots || 0) > 0;
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
    zooAnimals.push({ group: model, type, center: model.position.clone(), phase: index * 1.7 + x * 0.08, radiusX: type === 'ground' ? 2.1 : 1.45, radiusZ: type === 'ground' ? 1.25 : 0.85, speed: type === 'ground' ? 0.18 : 0.5 });
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
    sphere(group, 0.3, 0xc8875d, [0, 0.88, -0.38], { scale: [1, 0.95, 0.96] });
    sphere(group, 0.065, 0x241d1a, [-0.12, 0.94, -0.62]);
    sphere(group, 0.065, 0x241d1a, [0.12, 0.94, -0.62]);
    cone(group, 0.15, 0.34, details.color, [-0.19, 1.18, -0.38], { rotation: [0, 0, -0.22] });
    cone(group, 0.15, 0.34, details.color, [0.19, 1.18, -0.38], { rotation: [0, 0, 0.22] });
    sphere(group, 0.28, 0xb96843, [0, 0.88, 0.78], { scale: [1.45, 1.55, 0.7], rotation: [0.5, 0, 0] });
    sphere(group, 0.2, 0xd38e5b, [0.11, 0.62, 0.44], { scale: [0.75, 1, 1.25] });
  } else if (species === 'fox') {
    sphere(group, 0.5, details.color, [0, 0.58, 0], { scale: [1.15, 0.88, 1.5] });
    sphere(group, 0.32, details.color, [0, 0.9, -0.45], { scale: [1, 0.92, 0.95] });
    cone(group, 0.16, 0.4, details.color, [-0.18, 1.2, -0.42], { rotation: [0, 0, -0.2] });
    cone(group, 0.16, 0.4, details.color, [0.18, 1.2, -0.42], { rotation: [0, 0, 0.2] });
    sphere(group, 0.06, 0x20231f, [-0.12, 0.95, -0.73]);
    sphere(group, 0.06, 0x20231f, [0.12, 0.95, -0.73]);
    sphere(group, 0.075, 0x29231f, [0, 0.86, -0.77]);
    for (const x of [-0.25, 0.25]) {
      box(group, [0.14, 0.46, 0.14], details.color, [x, 0.28, -0.34]);
      box(group, [0.14, 0.46, 0.14], details.color, [x, 0.28, 0.34]);
    }
    sphere(group, 0.28, details.color, [0, 0.72, 0.82], { scale: [0.72, 1.15, 1.8], rotation: [0.44, 0, 0] });
    sphere(group, 0.16, 0xf0d3a5, [0, 0.8, 1.38], { scale: [0.78, 0.92, 0.75] });
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
    }
    cone(group, 0.08, 0.2, 0xd68b4e, [0, 0.96, -0.54], { rotation: [Math.PI / 2, 0, 0], segments: 5 });
    box(group, [0.16, 0.58, 0.42], 0x8c7152, [-0.39, 0.66, 0], { rotation: [0, 0.16, -0.18] });
    box(group, [0.16, 0.58, 0.42], 0x8c7152, [0.39, 0.66, 0], { rotation: [0, -0.16, 0.18] });
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
    box(group, [0.08, 0.42, 0.48], 0x765c4b, [-0.27, 0.02, 0], { rotation: [0, 0, -0.22] });
    box(group, [0.08, 0.42, 0.48], 0x765c4b, [0.27, 0.02, 0], { rotation: [0, 0, 0.22] });
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
  } else if (species === 'trout' || species === 'sunfish') {
    const bodyColor = details.color;
    const bellyColor = species === 'trout' ? 0xf0c18e : 0xb8d9d0;
    const accentColor = species === 'trout' ? 0x8d4d3e : 0x315f7a;
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
    const leftWing = sphere(group, 0.32, details.color, [-0.11, 0.1, 0], { scale: [0.82, 0.12, 1.25], widthSegments: 7, heightSegments: 5, material: { emissive: details.color, emissiveIntensity: 0.18, transparent: true, opacity: 0.9, side: THREE.DoubleSide } });
    const rightWing = sphere(group, 0.32, details.color, [0.11, 0.1, 0], { scale: [0.82, 0.12, 1.25], widthSegments: 7, heightSegments: 5, material: { emissive: details.color, emissiveIntensity: 0.18, transparent: true, opacity: 0.9, side: THREE.DoubleSide } });
    group.userData.wings = [leftWing, rightWing];
    group.userData.wingSpeed = 12;
    group.userData.isButterfly = true;
    cylinder(group, 0.043, 0.052, 0.38, 0x483c35, [0, 0.13, 0], { segments: 6 });
    cylinder(group, 0.012, 0.012, 0.22, 0x483c35, [-0.04, 0.4, 0], { rotation: [0, 0, -0.42], segments: 5 });
    cylinder(group, 0.012, 0.012, 0.22, 0x483c35, [0.04, 0.4, 0], { rotation: [0, 0, 0.42], segments: 5 });
  } else if (species === 'bee') {
    sphere(group, 0.3, details.color, [0, 0, 0], { scale: [1.15, 0.8, 0.8] });
    for (const x of [-0.1, 0.12]) torus(group, 0.245, 0.035, 0x262a20, [x, 0, 0], [0, Math.PI / 2, 0], 8, 18);
    const leftWing = addMesh(group, new THREE.CircleGeometry(0.23, 8), mat(0xdcefe3, { transparent: true, opacity: 0.7, side: THREE.DoubleSide }), [-0.18, 0.28, 0], [0.1, Math.PI / 2, 0.2]);
    const rightWing = addMesh(group, new THREE.CircleGeometry(0.23, 8), mat(0xdcefe3, { transparent: true, opacity: 0.7, side: THREE.DoubleSide }), [0.18, 0.28, 0], [-0.1, Math.PI / 2, -0.2]);
    group.userData.wings = [leftWing, rightWing];
    group.userData.wingSpeed = 18;
    sphere(group, 0.05, 0x24211c, [0.32, 0.1, -0.18]);
    sphere(group, 0.05, 0x24211c, [0.32, 0.1, 0.18]);
  } else if (species === 'dragonfly') {
    cylinder(group, 0.025, 0.09, 1.08, 0x6d8ca2, [0, 0, 0], { rotation: [0, 0, Math.PI / 2], segments: 7 });
    sphere(group, 0.075, 0x26333e, [0.58, 0, 0], { scale: [1.25, 0.82, 0.82] });
    const wingMaterial = { transparent: true, opacity: 0.86, emissive: details.color, emissiveIntensity: 0.52, side: THREE.DoubleSide, depthWrite: false };
    const frontLeftWing = box(group, [0.14, 0.018, 1.08], details.color, [-0.12, 0.12, -0.42], { material: wingMaterial, rotation: [0, 0.08, -0.05] });
    const rearLeftWing = box(group, [0.12, 0.018, 0.9], details.color, [0.18, 0.08, -0.36], { material: wingMaterial, rotation: [0, -0.08, 0.06] });
    const frontRightWing = box(group, [0.14, 0.018, 1.08], details.color, [-0.12, 0.12, 0.42], { material: wingMaterial, rotation: [0, -0.08, 0.05] });
    const rearRightWing = box(group, [0.12, 0.018, 0.9], details.color, [0.18, 0.08, 0.36], { material: wingMaterial, rotation: [0, 0.08, -0.06] });
    group.userData.wings = [frontLeftWing, rearLeftWing, frontRightWing, rearRightWing];
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
  while (world.children.length) {
    world.remove(world.children[0]);
  }
  if (lakeCarInterior) {
    camera.remove(lakeCarInterior);
    lakeCarInterior = null;
  }
  interactables = [];
  hotspots = [];
  critters = [];
  bugNodes = [];
  treeInteractions = [];
  zooAnimals = [];
  zooEnclosures = [];
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
  player.set(0, 1.72, 15);
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
    fishing.hookTarget = Math.round(clamp(4 + fishing.fishWeight * 2.15, 5, 14));
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
    fishing.fishSize = 7.5 + Math.random() * (fishing.fishSpecies === 'trout' ? 13.5 : 8.5);
    fishing.fishWeight = fishing.fishSpecies === 'trout' ? 0.7 + Math.random() * 4.3 : 0.25 + Math.random() * 1.8;
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
  return getAimTarget(critters.filter((critter) => !critter.caught), 8.5, 0.34);
}

function getNetCritterTarget() {
  const candidates = critters.filter((critter) => !critter.caught && critter.state !== 'flee');
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
  return getAimTarget(bugNodes.filter((bug) => bug.cooldown <= 0 && ['worm', 'caterpillar', 'spider'].includes(bug.species) && (!revealedOnly || bug.revealed)), 7.5, 0.62);
}

function getNearbyBug() {
  return bugNodes.filter((bug) => bug.cooldown <= 0 && ['worm', 'caterpillar', 'spider'].includes(bug.species) && !bug.revealed).sort((a, b) => distanceTo(a.position) - distanceTo(b.position))[0] || null;
}

function getNearestRevealedBug() {
  return bugNodes
    .filter((bug) => bug.cooldown <= 0 && bug.revealed && distanceTo(bug.position) <= 5.8)
    .sort((a, b) => distanceTo(a.position) - distanceTo(b.position))[0] || null;
}

function animateWings(group, phase = 0, speed = group.userData.wingSpeed || 12) {
  const wings = group.userData.wings;
  if (!wings?.length) return;
  const flap = Math.sin(elapsed * speed + phase);
  wings.forEach((wing, index) => {
    if (!wing.userData.baseRotation) wing.userData.baseRotation = wing.rotation.clone();
    if (!wing.userData.baseScale) wing.userData.baseScale = wing.scale.clone();
    if (!wing.userData.basePosition) wing.userData.basePosition = wing.position.clone();
    const side = group.userData.isButterfly ? (index === 0 ? -1 : 1) : (index % 2 === 0 ? 1 : -1);
    if (group.userData.isButterfly) {
      const spread = 0.065 + Math.abs(flap) * 0.16;
      wing.position.x = side * spread;
      wing.rotation.y = wing.userData.baseRotation.y + flap * 0.58 * side;
      wing.rotation.z = wing.userData.baseRotation.z + flap * 0.16 * side;
      wing.scale.y = wing.userData.baseScale.y * (0.82 + Math.abs(flap) * 0.22);
      return;
    }
    wing.rotation.x = wing.userData.baseRotation.x + flap * 0.42 * side;
    wing.rotation.z = wing.userData.baseRotation.z + flap * 0.08 * side;
    wing.scale.y = wing.userData.baseScale.y * (0.82 + Math.abs(flap) * 0.18);
  });
}

function updateCritters(delta) {
  for (const critter of critters) {
    if (critter.caught) continue;
    if (critter.hidden) {
      if (elapsed >= critter.respawnAt) respawnCritter(critter);
      continue;
    }
    const animal = critter.group;
    const isFlying = SPECIES[critter.species].type === 'flying' || ['butterfly', 'bee', 'dragonfly'].includes(critter.species);
    if (isFlying) animateWings(animal, critter.home.x, SPECIES[critter.species].type === 'bug' && critter.species === 'dragonfly' ? 34 : critter.species === 'bee' ? 18 : 12);
    critter.stateTime += delta;
    const distance = distanceTo(animal.position);
    if (critter.state === 'idle') {
      const attracting = activeTool === 'food' && (selectedFood === 'carrots') && (critter.species === 'rabbit' || critter.species === 'squirrel') && distance < 9;
      const threat = distance < 5.2 && currentNoise > 0.34 && !(activeTool === 'net' && distance < 2.6 && currentNoise < 0.56);
      if (attracting) {
        tempVector.subVectors(player, animal).setY(0).normalize();
        critter.direction = Math.atan2(tempVector.x, tempVector.z);
        animal.position.x += tempVector.x * delta * 0.42;
        animal.position.z += tempVector.z * delta * 0.42;
        keepGroundAnimalOnLand(animal, critter);
        animal.position.y = 0.42 + Math.sin(elapsed * 2.4 + critter.home.x) * 0.035;
      } else if (threat) {
        scareCritter(critter);
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
      animal.position.x += Math.sin(critter.direction) * delta * 3.4;
      animal.position.z += Math.cos(critter.direction) * delta * 3.4;
      animal.position.y = isFlying ? critter.home.y + Math.sin(elapsed * 2.6 + critter.home.x) * 0.08 : 0.42 + Math.abs(Math.sin(elapsed * 9)) * 0.1;
      if (!isFlying) keepGroundAnimalOnLand(animal, critter);
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
    bug.marker.visible = bug.cooldown <= 0 && (!bug.revealed || near);
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
    const angle = elapsed * exhibit.speed + exhibit.phase;
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
      exhibit.group.position.y = exhibit.center.y + Math.abs(Math.sin(elapsed * 2.4 + exhibit.phase)) * 0.045;
      exhibit.group.rotation.y = Math.atan2(deltaX, -deltaZ);
    } else {
      exhibit.group.position.y = exhibit.center.y + Math.sin(elapsed * 2.1 + exhibit.phase) * 0.1 + Math.cos(elapsed * 1.1 + exhibit.phase) * 0.04;
      if (exhibit.group.userData.wings) animateWings(exhibit.group, exhibit.phase, exhibit.group.userData.wingSpeed || 12);
      exhibit.group.rotation.y = exhibit.group.userData.wingSpeed === 34 ? Math.atan2(-deltaZ, deltaX) : Math.atan2(deltaX, -deltaZ);
      exhibit.group.rotation.z = Math.sin(elapsed * 3.2 + exhibit.phase) * 0.16;
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

function updateMovement(delta) {
  if (modalOpen || qteState) return;
  if (currentZone === 'lake' && lakeArrival?.active) {
    updateJenkinsLakeArrival(delta);
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

function updateHUD() {
  dom.zoneLabel.textContent = ZONES[currentZone].label;
  dom.coinLabel.textContent = `${save.coins}¢`;
  dom.equipmentList.innerHTML = renderInventoryPanel();
  dom.inventoryTabs?.querySelectorAll('[data-inventory-tab]').forEach((button) => {
    const active = button.dataset.inventoryTab === activeInventoryTab;
    button.classList.toggle('active', active);
    button.setAttribute('aria-selected', String(active));
  });
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
  const visible = ['forest', 'zoo', 'lake'].includes(currentZone) && activeTool === 'rod' && !modalOpen && !qteState;
  dom.fishingCallout.classList.toggle('is-hidden', !visible);
  if (!visible) return;
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
  dom.statusMessage.textContent = message;
}

function toast(message, tone = 'success') {
  const element = document.createElement('div');
  element.className = `toast ${tone === 'warning' ? 'is-warning' : tone === 'danger' ? 'is-danger' : ''}`;
  element.dataset.toastId = String(++toastId);
  element.textContent = message;
  dom.toastStack.appendChild(element);
  window.setTimeout(() => element.remove(), 4000);
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
  element.classList.add('is-hidden');
  modalOpen = false;
  if (element === dom.qteModal) qteState = null;
  if (element === dom.cleaningModal) {
    cleaningState = null;
    dom.cleaningModal.classList.remove('is-aquarium');
  }
  restoreFieldMode();
}

function closeAllModals(restore = true) {
  [dom.travelModal, dom.shopModal, dom.stoveModal, dom.qteModal, dom.cleaningModal, dom.collectionModal].forEach((modal) => modal.classList.add('is-hidden'));
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


function buyItem(itemKey, group) {
  const item = SHOP_ITEMS.find((candidate) => candidate.key === itemKey && candidate.group === group);
  if (!item || save.coins < item.cost) return;
  save.coins -= item.cost;
  save.supplies[item.key] = (save.supplies[item.key] || 0) + item.amount;
  saveGame();
  updateHUD();
  openShop();
  toast(`${item.label} added to the field kit.`, 'success');
}

function buyShopDisplay(display) {
  if (!display) return;
  const item = SHOP_ITEMS.find((candidate) => candidate.key === display.itemKey && candidate.group === display.group);
  if (!item) return;
  if (save.coins < item.cost) {
    toast(`You need ${item.cost}¢ for ${item.label}.`, 'warning');
    return;
  }
  buyItem(item.key, item.group);
  setStatus(`${item.label} purchased from the display. Walk to another display or return to the counter.`);
}

function inspectFridge() {
  const ingredients = save.ingredients || DEFAULT_SAVE.ingredients;
  const cooked = save.cooked || DEFAULT_SAVE.cooked;
  const inventory = `Fish ${ingredients.trout || 0} trout / ${ingredients.sunfish || 0} sunfish · carrots ${ingredients.carrots || 0} · mushrooms ${(ingredients.mushrooms || 0) + (ingredients.morels || 0) + (ingredients.treeMushrooms || 0)} · rice ${ingredients.wildRice || 0} · scallions ${ingredients.scallions || 0} · berries ${ingredients.berries || 0} · duck eggs ${ingredients.duckEggs || 0} · honey ${save.honey || 0} · flowers ${ingredients.flowers || 0} · cooked ${Object.values(cooked).reduce((sum, count) => sum + (count || 0), 0)}`;
  toast(`Fridge inventory — ${inventory}`, 'success');
  setStatus(inventory);
}

function getRecipeIngredientCount(ingredient) {
  if (ingredient.anyOf) return ingredient.anyOf.reduce((total, key) => total + (key === 'honey' ? save.honey || 0 : save.ingredients[key] || 0), 0);
  return ingredient.key === 'honey' ? save.honey || 0 : save.ingredients[ingredient.key] || 0;
}

function getRecipeStatus(recipe) {
  const progress = recipe.ingredients.reduce((total, ingredient) => total + Math.min(1, getRecipeIngredientCount(ingredient) / ingredient.amount), 0);
  const complete = recipe.ingredients.every((ingredient) => getRecipeIngredientCount(ingredient) >= ingredient.amount);
  return { complete, partial: !complete && progress > 0, progress };
}

function formatRecipeIngredient(ingredient) {
  const owned = getRecipeIngredientCount(ingredient);
  const label = ingredient.anyOf ? ingredient.label : ingredient.label;
  return `${label} ${Math.min(owned, ingredient.amount)}/${ingredient.amount}`;
}

function chooseRecipeIngredient(ingredient) {
  if (!ingredient.anyOf) return ingredient.key;
  return ingredient.anyOf.find((key) => (key === 'honey' ? save.honey || 0 : save.ingredients[key] || 0) >= ingredient.amount) || ingredient.anyOf[0];
}

function consumeRecipeIngredient(ingredient) {
  const key = chooseRecipeIngredient(ingredient);
  if (key === 'honey') save.honey -= ingredient.amount;
  else save.ingredients[key] -= ingredient.amount;
}

function openStoveMenu() {
  const hasPan = (save.supplies.pans || 0) > 0;
  dom.stoveRecipes.innerHTML = COOKING_RECIPES.map((recipe) => {
    const status = getRecipeStatus(recipe);
    const statusLabel = !hasPan ? 'NEED PAN' : status.complete ? 'READY' : status.partial ? 'PARTIAL' : 'MISSING';
    const disabled = !hasPan || !status.complete ? 'disabled' : '';
    const stateClass = status.complete ? 'is-complete' : status.partial ? 'is-partial' : '';
    return `<button class="recipe-option ${stateClass}" data-cook-recipe="${recipe.key}" type="button" ${disabled}>
      <span class="recipe-copy"><span class="recipe-name">${recipe.label}</span><span class="recipe-note">${recipe.note}</span><span class="recipe-requirements">${recipe.ingredients.map(formatRecipeIngredient).join(' · ')}</span></span>
      <span class="recipe-status">${statusLabel}</span>
    </button>`;
  }).join('');
  openModal(dom.stoveModal);
}

function cookAtStove() {
  openStoveMenu();
}

function cookRecipe(recipeKey) {
  const recipe = COOKING_RECIPES.find((candidate) => candidate.key === recipeKey);
  if (!recipe) return;
  const status = getRecipeStatus(recipe);
  if ((save.supplies.pans || 0) <= 0) {
    toast('The stove needs a camp cooking pan. Buy one at the field store.', 'warning');
    setStatus('A pan is required before the cabin stove can be used.');
    return;
  }
  if (!status.complete) {
    toast('That recipe still needs ingredients.', 'warning');
    setStatus(`${recipe.label} needs ${recipe.ingredients.map(formatRecipeIngredient).join(', ')}.`);
    return;
  }
  recipe.ingredients.forEach(consumeRecipeIngredient);
  recipe.outputs.forEach((output) => {
    save.cooked[output.key] = (save.cooked[output.key] || 0) + output.amount;
  });
  save.meals = (save.meals || 0) + recipe.outputs.reduce((total, output) => total + output.amount, 0);
  saveGame();
  updateHUD();
  closeModal(dom.stoveModal);
  toast(`${recipe.label} added to the inventory.`, 'success');
  setStatus(`${recipe.label} is stored for a future consumption system.`);
}

function sleepAtCabin() {
  const advanceMs = 60 * 60 * 1000;
  for (const flower of save.gardenFlowers || []) {
    flower.seededAt -= advanceMs;
    flower.bloomsAt -= advanceMs;
    flower.despawnsAt -= advanceMs;
  }
  for (const node of wildFlowerNodes) {
    node.harvested = false;
    node.group.visible = true;
    node.marker.visible = true;
  }
  for (const node of carrotNodes) {
    node.harvested = false;
    node.pulls = 0;
    node.group.position.y = 0;
    node.group.visible = true;
    node.marker.visible = true;
  }
  for (const node of natureResourceNodes) {
    if (node.type !== 'carrot') {
      node.used = false;
      node.group.visible = true;
      node.marker.visible = true;
    }
  }
  for (const bug of bugNodes) {
    bug.cooldown = 0;
    bug.revealed = false;
    bug.bugModel.visible = false;
  }
  for (const hive of beehives) hive.lootedAt = -1000;
  for (const critter of critters) {
    if (critter.hidden && !critter.caught) critter.respawnAt = elapsed;
  }
  saveGame();
  updateHUD();
  toast('You rest at the cabin. Plants age and field resources recover.', 'success');
  setStatus('Morning light returns. The garden and nature areas have advanced by one hour.');
}

function handleInteract() {
  const target = getInteractionTarget();
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
  updateJenkinsLakeGate();
  updateAquarium();
  updatePollinatorGarden();
  updateBeehives();
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
  if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'w', 'a', 's', 'd', 'Space', ' '].includes(event.code) || ['w', 'a', 's', 'd', ' '].includes(normalizedKey)) {
    event.preventDefault();
  }
  if (event.code === 'Space' && !event.repeat && !modalOpen && !qteState && grounded) {
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
enterZone(currentZone);
updateHUD();
setStatus('Find the car to choose a destination. The field is quiet for now.');
window.setTimeout(() => dom.loadingScreen.classList.add('is-loaded'), 420);
animate();
