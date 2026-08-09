import * as THREE from 'three';
import './style.css';

const SAVE_KEY = 'jenkins-conservatory-save-v1';
const ZONE_ORDER = ['store', 'forest', 'zoo'];
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
    bounds: { minX: -22, maxX: 22, minZ: -30, maxZ: 18 }
  },
  zoo: {
    label: 'CONSERVATORY ZOO',
    title: 'The Showcase',
    note: 'Review the animals in your growing collection.',
    background: 0x7d9587,
    fog: 0x7d9587,
    ground: 0x697862,
    accent: 0xd8ef85,
    bounds: { minX: -23, maxX: 23, minZ: -26, maxZ: 18 }
  }
};

const FOREST_WATER = {
  centerX: 0,
  centerZ: -17,
  waterRadius: 10,
  playerRadius: 8.65,
  castRadius: 9.25
};

const FOREST_DOCK = {
  halfWidth: 1.85,
  shoreZ: -7.15,
  endZ: -15.55
};

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
  butterfly: { label: 'Painted butterfly', type: 'bug', sigil: '✦', color: 0xf0a4c1, note: 'Magnify + net' },
  bee: { label: 'Meadow bee', type: 'bug', sigil: '✧', color: 0xf2c84b, note: 'Magnify + net' },
  dragonfly: { label: 'Blue dragonfly', type: 'bug', sigil: '⌁', color: 0x83cfe7, note: 'Magnify + net' }
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
    flowerSeeds: 2,
  },
  caught: {},
  cleanedEnclosures: {},
  gardenFlowers: null,
  records: {},
  honey: 0,
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
  qteModal: document.querySelector('#qte-modal'),
  qteCursor: document.querySelector('.qte-cursor'),
  qteAction: document.querySelector('#qte-action'),
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
const heldToolGroup = new THREE.Group();
heldToolGroup.name = 'held-tool';
heldToolGroup.frustumCulled = false;
camera.add(heldToolGroup);
const world = new THREE.Group();
scene.add(world);
scene.add(camera);

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
let pointerLocked = false;
let yaw = 0;
let pitch = -0.08;
let elapsed = 0;
let currentNoise = 0;
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
let colliders = [];
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
      honey: Number(parsed.honey || 0)
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
  colliders.push({ x, z, radius, ...options });
}

function resolveWorldCollisions() {
  for (const collider of colliders) {
    if (collider.zone && collider.zone !== currentZone) continue;
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
    addMesh(root, new THREE.CircleGeometry(0.32, 18), mat(0xbad9cb, { transparent: true, opacity: 0.28, depthWrite: false, side: THREE.DoubleSide }), [0, 1.04, 0.02]);
  }

  if (tool === 'magnifier') {
    cylinder(root, 0.045, 0.07, 0.82, 0x76533f, [0, -0.02, 0.02], { segments: 8, rotation: [0, 0, -0.42] });
    torus(root, 0.3, 0.055, 0xc9ad68, [0.29, 0.62, 0], [0, 0, 0], 8, 24);
    addMesh(root, new THREE.CircleGeometry(0.25, 20), mat(0xbde9e3, { transparent: true, opacity: 0.38, depthWrite: false, side: THREE.DoubleSide, emissive: 0x3a7770, emissiveIntensity: 0.24 }), [0.29, 0.62, -0.02]);
    sphere(root, 0.035, 0xf4edc9, [0.19, 0.76, -0.08], { material: { emissive: 0xffffff, emissiveIntensity: 0.8 } });
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

function torus(parent, majorRadius, tubeRadius, color, position, rotation = [0, 0, 0], radialSegments = 8, tubularSegments = 18) {
  return addMesh(parent, new THREE.TorusGeometry(majorRadius, tubeRadius, radialSegments, tubularSegments), mat(color), position, rotation);
}

function triggerToolAction(name, duration = 0.45) {
  toolAction = { name, startedAt: elapsed, duration };
}

function updateHeldTool() {
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
    root.position.z += actionPulse * 0.06;
    root.rotation.x -= actionPulse * 0.18;
  }
  if (actionName && actionProgress >= 1) toolAction = { name: '', startedAt: 0, duration: 0 };
}


function setZonePalette(zoneKey) {
  const zone = ZONES[zoneKey];
  scene.background = new THREE.Color(zone.background);
  scene.fog = new THREE.Fog(zone.fog, 34, 100);
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

function createBeehiveOnTree(tree, x, z, id, wild = false) {
  const hive = new THREE.Group();
  hive.position.set(x + 0.45, 3.1, z - 0.22);
  const body = cylinder(hive, 0.42, 0.52, 0.82, 0xd59b4d, [0, 0, 0], { segments: 10, rotation: [0, 0, 0.12] });
  for (const y of [-0.23, 0, 0.23]) {
    torus(hive, 0.44, 0.035, 0x513c2c, [0, y, 0], [0, 0, 0], 8, 20);
  }
  cylinder(hive, 0.17, 0.17, 0.05, 0x2c2921, [0, -0.12, -0.47], { rotation: [Math.PI / 2, 0, 0], segments: 10 });
  const marker = makeLabel(wild ? 'WILD HIVE' : 'HIVE', wild ? '#f2b268' : '#f6d56b', '#3b2b20', 0.38);
  marker.position.set(0, 0.78, 0);
  hive.add(marker);
  world.add(hive);
  const entry = { id, group: hive, body, marker, position: new THREE.Vector3(x + 0.45, 3.1, z - 0.22), radius: 2.8, wild, lootedAt: 0, baseScale: 1 };
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
  saveGame();
  updateHUD();
  toast('Wild flower seeds collected. Plant them in the pollinator field.', 'success');
  setStatus('The wild flower will return after the next field reset.');
}

function plantFlowerSeed() {
  if (currentZone !== 'zoo') return;
  if ((save.supplies.flowerSeeds || 0) <= 0) {
    toast('No flower seeds in the field kit. Harvest wild flowers or visit the store.', 'warning');
    return;
  }
  const occupied = (save.gardenFlowers || []).map((flower) => new THREE.Vector3(flower.x, 0, flower.z));
  const plots = [[6.5, -11.0], [7.8, -9.6], [9.2, -12.1], [10.8, -10.2], [11.8, -8.9], [7.1, -7.5], [10.4, -7.6]];
  const plot = plots.find(([x, z]) => !occupied.some((entry) => entry.distanceTo(new THREE.Vector3(x, 0, z)) < 0.7));
  if (!plot) {
    toast('The pollinator field is full. Wait for a flower to despawn.', 'warning');
    return;
  }
  const now = Date.now();
  const record = { id: `planted-${now}-${Math.floor(Math.random() * 1000)}`, x: plot[0], z: plot[1], scale: 0.68 + Math.random() * 0.22, color: [0xf1c84b, 0xe889b0, 0xb58ce0, 0xf3d667][Math.floor(Math.random() * 4)], seededAt: now, bloomsAt: now + FLOWER_GROW_MS, despawnsAt: now + FLOWER_GROW_MS + FLOWER_LIFE_MS };
  save.supplies.flowerSeeds -= 1;
  save.gardenFlowers = [...(save.gardenFlowers || []), record];
  createPollinatorFlower(record.x, record.z, record.scale, record.color, pollinatorFlowers.length * 0.8, record);
  saveGame();
  updateHUD();
  toast('Seed planted. It will bloom in 5 minutes and remain for 2 hours.', 'success');
  setStatus('A new seed is taking root. Check back after it blooms.');
}

function updateBeehives() {
  const flowerCount = pollinatorFlowers.filter((flower) => flower.record ? flower.record.bloomsAt <= Date.now() : true).length;
  const beeCount = 3 + (save.caught.bee || 0);
  for (const hive of beehives) {
    const size = clamp(0.72 + beeCount * 0.045 + flowerCount * 0.075, 0.72, 1.9);
    hive.group.scale.setScalar(size);
    hive.marker.visible = distanceTo(hive.position) < 9 && elapsed > hive.lootedAt + 1.5;
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
    hiddenBug.revealed = true;
    hiddenBug.bugModel.visible = true;
    toast(`The tree revealed a ${SPECIES[hiddenBug.species].label.toLowerCase()} trace. Equip the net.`, 'success');
    setStatus(`${interaction.message} A bug is moving above the leaves.`);
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
    [7.1, -11.8, 0.82, 0xf1c84b], [9.2, -10.6, 0.72, 0xe889b0],
    [11.2, -11.7, 0.9, 0xb58ce0], [8.2, -8.2, 0.78, 0xf3d667]
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
  const seedBed = { type: 'seed-bed', label: 'Plant a flower seed', position: new THREE.Vector3(9, 0.9, -5.2), radius: 3.2 };
  interactables.push(seedBed);
  box(world, [2.2, 0.12, 1.3], 0x7b6a4b, [9, 0.08, -5.2]);
  const seedLabel = makeLabel('PLANT SEEDS', '#f3d667', '#30442f', 0.34);
  seedLabel.position.set(9, 1.35, -5.2);
  world.add(seedLabel);
  addCollider(9, -5.2, 0.72, { zone: 'zoo' });
  const gardenTrees = [[6.4, -8.2], [12.8, -8.5]];
  gardenTrees.forEach(([x, z], index) => {
    const tree = createTree(x, z, 0.82, index ? 0x3e724f : 0x477957);
    createBeehiveOnTree(tree, x, z, `garden-hive-${index}`);
    createSpiderWeb(x + (index ? -0.35 : 0.3), z - 0.22, 2.75, 'zoo');
  });
  spawnCritter('butterfly', [8.1, 2.2, -9.1]);
  spawnCritter('bee', [12.0, 2.7, -8.8]);
  addPollinatorDragonflies();
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

function createShopDisplay(item, x, z, row = 0) {
  const display = new THREE.Group();
  const displayY = row ? 1.75 : 0;
  display.position.set(x, displayY, z);
  box(display, [1.9, 2.05, 0.14], 0x405d48, [0, 1.05, 0]);
  box(display, [1.72, 0.12, 0.72], 0xc29a62, [0, 0.48, 0.12]);
  box(display, [1.72, 0.1, 0.72], 0x334f3d, [0, 0.56, 0.1]);
  if (item.group === 'tool') {
    cylinder(display, 0.06, 0.08, 0.9, item.key === 'nets' ? 0x80634b : 0x76533f, [0, 1.15, 0], { rotation: [0.1, 0, 0.18], segments: 8 });
    torus(display, item.key === 'nets' ? 0.3 : 0.22, 0.035, 0xd1b77e, [0, 1.62, 0], [0, 0, 0], 8, 18);
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

  const shopXs = [-5.6, 0, 5.6];
  SHOP_ITEMS.forEach((item, index) => createShopDisplay(item, shopXs[index % 3], -7.9, Math.floor(index / 3)));
  createTree(-14, -4, 1.1, 0x44694e);
  createTree(14, -3, 1.05, 0x44694e);
  addSmallCrates(-4, 0, -2);
  addSmallCrates(5, 0, -1);
  spawnCritter('raccoon', [-5.1, 0.42, -1.5]);
  spawnCritter('sparrow', [5.2, 1.9, 0.4]);
}

function addSmallCrates(x, y, z) {
  box(world, [0.8, 0.8, 0.8], 0xb5794e, [x, y + 0.4, z], { rotation: [0, 0.08, 0.05] });
  box(world, [0.68, 0.68, 0.68], 0xe0a566, [x + 0.7, y + 0.34, z + 0.2], { rotation: [0.03, -0.1, 0] });
}

function buildForest() {
  setZonePalette('forest');
  addGround(ZONES.forest.ground);
  createMountainBoundary('forest');
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
    [-6, 6, 0.78], [6, 7, 0.82], [-19, -4, 0.88], [19, -4, 0.86]
  ];
  treeSpots.forEach(([x, z, scale], index) => createTree(x, z, scale, index % 2 ? 0x315a41 : 0x3f6b47));
  createBeehiveOnTree(null, -16, -15, 'wild-hive-west', true);
  createBeehiveOnTree(null, 17, -16, 'wild-hive-east', true);
  createSpiderWeb(-13.1, -3.2, 2.8, 'forest');
  createSpiderWeb(14.4, -2.1, 3.0, 'forest');
  createSpiderWeb(-10.3, 5.0, 2.7, 'forest');
  createWildFlowerNode(-7.6, -4.7, 0xe889b0, 0);
  createWildFlowerNode(5.7, -8.4, 0xf1c84b, 1);
  createWildFlowerNode(10.9, -6.8, 0xb58ce0, 2);
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
  spawnCritter('frog', [4.2, 0.42, -7.8]);
  spawnCritter('owl', [12.8, 2.1, -22.5]);

  addTreeInteraction(-13, -3, 'Check tree hollow', 'A squirrel has been using this hollow as a field cache.', 5);
  addTreeInteraction(14, -2, 'Read bark marks', 'Fresh claw marks point toward the lake trail.', 4);
  addTreeInteraction(-17, -25, 'Collect pinecone', 'A tidy pinecone cache marks a quiet animal route.', 3);
  addTreeInteraction(15, -28, 'Inspect fallen branch', 'The branch is warm from a recent animal crossing.', 4);
  addTreeInteraction(-10, 5, 'Listen at the trunk', 'A soft rustle answers from somewhere in the canopy.', 5);

  createBugNode('butterfly', [-10.5, 0.05, -1.8], 0xe7a6c4);
  createBugNode('bee', [11.2, 0.05, -10.2], 0xf0c849);
  createBugNode('dragonfly', [8.8, 0.05, -22.1], 0x81c9e4);
  createBugNode('butterfly', [-7.2, 0.05, -25.2], 0xe7a6c4);
  spawnCritter('butterfly', [-8.6, 1.85, -5.5]);
  spawnCritter('bee', [-15.2, 2.6, -14.2]);
  spawnCritter('dragonfly', [7.2, 2.2, -21.5]);

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
  hotspots.push({ group, target, ringOne, ringTwo, center, bubbleA, bubbleB, fishSpecies, lure, bait, position: new THREE.Vector3(x, 0.18, z) });
}

function spawnCritter(species, position) {
  const group = createAnimalModel(species, 0.9);
  group.position.set(...position);
  world.add(group);
  critters.push({ species, group, home: new THREE.Vector3(...position), direction: Math.random() * Math.PI * 2, state: 'idle', stateTime: Math.random() * 2, fleeTime: 0, caught: false });
}

function createBugNode(species, position, color) {
  const group = new THREE.Group();
  group.position.set(...position);
  const plant = new THREE.Group();
  cylinder(plant, 0.07, 0.1, 0.85, 0x5b7448, [0, 0.42, 0], { segments: 5, rotation: [0.1, 0, 0.08] });
  for (let i = 0; i < 4; i += 1) {
    sphere(plant, 0.17, 0x5b8b54, [Math.sin(i * 1.7) * 0.2, 0.45 + i * 0.12, Math.cos(i * 1.7) * 0.18], { scale: [1.4, 0.55, 0.7] });
  }
  group.add(plant);
  const bugModel = createAnimalModel(species, 0.43);
  bugModel.position.set(0.3, 1.1, 0);
  bugModel.visible = false;
  group.add(bugModel);
  const marker = new THREE.Group();
  const markerRing = addMesh(marker, new THREE.TorusGeometry(0.34, 0.035, 5, 18), mat(color, { emissive: color, emissiveIntensity: 0.9, transparent: true, opacity: 0.92 }), [0, 1.48, 0], [-Math.PI / 2, 0, 0]);
  markerRing.rotation.z = 0.3;
  const markerCore = sphere(marker, 0.08, color, [0, 1.48, 0], { material: { emissive: color, emissiveIntensity: 1.4 } });
  group.add(marker);
  world.add(group);
  bugNodes.push({ species, group, plant, bugModel, marker, markerCore, position: new THREE.Vector3(...position), aimPosition: new THREE.Vector3(position[0] + 0.3, 1.1, position[2]), revealed: false, cooldown: 0, color });
}

function buildZoo() {
  setZonePalette('zoo');
  addGround(ZONES.zoo.ground);
  createMountainBoundary('zoo');
  createParkingHub('CONSERVATORY', ZONES.zoo.accent);
  createPath(0, -2.5, 6, 25, 0xc0ad78);
  createPath(-9, -9, 3.2, 15, 0xc0ad78);
  createPath(9, -9, 3.2, 15, 0xc0ad78);

  createFence(-9, -10, 8, 8, 0x806e53, false);
  createFence(9, -10, 8, 8, 0x806e53, false);
  createFence(0, -22, 14, 5, 0x66806d, false);
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

  const record = new THREE.Group();
  record.position.set(0, 0, -4.2);
  box(record, [2.5, 2.8, 0.24], 0x3f5f4c, [0, 1.4, 0]);
  box(record, [1.9, 1.3, 0.08], 0xd8ef85, [0, 1.55, -0.18]);
  cylinder(record, 0.15, 0.15, 0.38, 0x8fb7a0, [0, 0.2, 0], { segments: 6 });
  world.add(record);
  interactables.push({ type: 'collection', label: 'Open living collection', position: record.position.clone(), radius: 3.2 });

  createTree(-17, -5, 1.2, 0x3d6249);
  createTree(17, -5, 1.2, 0x3d6249);
  addExhibitAnimals(-9, -10, ['rabbit', 'squirrel', 'fox', 'turtle']);
  addExhibitAnimals(9, -10, ['butterfly', 'bee', 'dragonfly', 'owl']);
  createPollinatorGarden();
  spawnCritter('frog', [-17.2, 0.42, -4.8]);
  spawnCritter('raccoon', [17.1, 0.42, -4.6]);
  addEnclosureInteractable('meadow', 'Clean meadow enclosure', -9, -5.55, 'Clear the meadow habitat so the ground animals have a safe field.');
  addEnclosureInteractable('pollinator', 'Clean pollinator enclosure', 9, -5.55, 'Clear the pollinator habitat so the flying animals can forage.');
  addEnclosureInteractable('water-wing', 'Clean water wing', 0, -18.65, 'Clear the water wing so the aquatic exhibit stays healthy.');
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
  const positions = [[14, 26], [68, 22], [36, 49], [80, 67], [56, 80], [20, 74]];
  const symbols = ['✦', '◆', '⌁', '●', '✧', '◼'];
  cleaningState = { enclosure, nextIndex: 0, total: positions.length };
  dom.cleaningField.innerHTML = positions.map(([left, top], index) => `<button class="debris-spot ${index === 0 ? 'is-next' : ''}" data-cleaning-index="${index}" style="left:${left}%;top:${top}%" type="button" aria-label="Clear debris ${index + 1}">${symbols[index]}</button>`).join('');
  dom.cleaningCopy.textContent = `${enclosure.message} Clear the highlighted debris in sequence.`;
  dom.cleaningAction.textContent = 'SWEEP HIGHLIGHTED SPOT';
  updateCleaningUI();
  openModal(dom.cleaningModal);
}

function updateCleaningUI() {
  if (!cleaningState) return;
  const { nextIndex, total } = cleaningState;
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
    const wingMat = mat(details.color, { emissive: details.color, emissiveIntensity: 0.18, transparent: true, opacity: 0.88, side: THREE.DoubleSide });
    addMesh(group, new THREE.CircleGeometry(0.36, 6), wingMat, [-0.3, 0.1, 0], [0, Math.PI / 2.5, -0.35], [1.1, 1.35, 1]);
    addMesh(group, new THREE.CircleGeometry(0.36, 6), wingMat, [0.3, 0.1, 0], [0, -Math.PI / 2.5, 0.35], [1.1, 1.35, 1]);
    cylinder(group, 0.055, 0.055, 0.8, 0x483c35, [0, 0.08, 0], { rotation: [0, 0, Math.PI / 2], segments: 6 });
    cylinder(group, 0.015, 0.015, 0.35, 0x483c35, [-0.1, 0.36, 0], { rotation: [0, 0, -0.35], segments: 5 });
    cylinder(group, 0.015, 0.015, 0.35, 0x483c35, [0.1, 0.36, 0], { rotation: [0, 0, 0.35], segments: 5 });
  } else if (species === 'bee') {
    sphere(group, 0.3, details.color, [0, 0, 0], { scale: [1.15, 0.8, 0.8] });
    for (const x of [-0.1, 0.12]) {
      box(group, [0.08, 0.65, 0.78], 0x262a20, [x, 0, 0], { rotation: [0, 0, 0] });
    }
    addMesh(group, new THREE.CircleGeometry(0.23, 8), mat(0xdcefe3, { transparent: true, opacity: 0.7, side: THREE.DoubleSide }), [-0.18, 0.28, 0], [0.1, Math.PI / 2, 0.2]);
    addMesh(group, new THREE.CircleGeometry(0.23, 8), mat(0xdcefe3, { transparent: true, opacity: 0.7, side: THREE.DoubleSide }), [0.18, 0.28, 0], [-0.1, Math.PI / 2, -0.2]);
    sphere(group, 0.05, 0x24211c, [0.32, 0.1, -0.18]);
    sphere(group, 0.05, 0x24211c, [0.32, 0.1, 0.18]);
  } else if (species === 'dragonfly') {
    cylinder(group, 0.055, 0.075, 0.9, 0x6d8ca2, [0, 0, 0], { rotation: [0, 0, Math.PI / 2], segments: 6 });
    const wingMaterial = mat(details.color, { transparent: true, opacity: 0.86, emissive: details.color, emissiveIntensity: 0.52, side: THREE.DoubleSide, depthWrite: false });
    addMesh(group, new THREE.CircleGeometry(0.25, 6), wingMaterial, [-0.18, 0.12, -0.1], [0, 0, -0.28], [1.3, 0.58, 1]);
    addMesh(group, new THREE.CircleGeometry(0.25, 6), wingMaterial, [0.18, 0.12, -0.1], [0, 0, 0.28], [1.3, 0.58, 1]);
    addMesh(group, new THREE.CircleGeometry(0.2, 6), wingMaterial, [-0.28, 0.08, 0.1], [0, 0, -0.42], [1.15, 0.48, 1]);
    addMesh(group, new THREE.CircleGeometry(0.2, 6), wingMaterial, [0.28, 0.08, 0.1], [0, 0, 0.42], [1.15, 0.48, 1]);
    sphere(group, 0.06, 0x26333e, [0.42, 0, 0]);
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
  colliders = [];
  storeRecordBoard = null;
  cleaningState = null;
  toolAction = { name: '', startedAt: 0, duration: 0 };
  removeFishingVisuals();
  resetFishing();
}

function enterZone(zoneKey, announce = false) {
  if (!ZONES[zoneKey]) return;
  closeAllModals();
  resetWorld();
  currentZone = zoneKey;
  player.set(0, 1.72, 15);
  spawnPoint.copy(player);
  yaw = 0;
  pitch = -0.08;
  if (zoneKey === 'store') buildStore();
  if (zoneKey === 'forest') buildForest();
  if (zoneKey === 'zoo') buildZoo();
  camera.position.copy(player);
  updateCameraRotation();
  save.lastZone = zoneKey;
  saveGame();
  updateHUD();
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
  const bobber = sphere(group, 0.14, 0xff7c63, [landingPoint.x, 0.3, landingPoint.z], { material: { emissive: 0x7a261d, emissiveIntensity: 1.05 } });
  const bobberTop = sphere(group, 0.06, 0xf8ead0, [landingPoint.x, 0.44, landingPoint.z]);
  const lineGeometry = new THREE.BufferGeometry().setFromPoints([camera.position.clone(), bobber.position.clone()]);
  const line = new THREE.Line(lineGeometry, new THREE.LineBasicMaterial({ color: 0xf3dfb5, transparent: true, opacity: 0.8 }));
  group.add(line);
  world.add(group);
  fishingVisuals = { group, bobber, bobberTop, line, hotspot, landingPoint: landingPoint.clone() };
}

function updateFishingVisuals() {
  if (!fishingVisuals) return;
  const { bobber, bobberTop, line } = fishingVisuals;
  const linePositions = line.geometry.attributes.position.array;
  linePositions[0] = camera.position.x;
  linePositions[1] = camera.position.y - 0.28;
  linePositions[2] = camera.position.z;
  linePositions[3] = bobber.position.x;
  linePositions[4] = bobber.position.y;
  linePositions[5] = bobber.position.z;
  line.geometry.attributes.position.needsUpdate = true;
  const wave = Math.sin(elapsed * 3.2) * 0.035;
  bobber.position.y = 0.28 + wave;
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
  if (currentZone !== 'forest' || activeTool !== 'rod') return;
  if (fishing.phase !== 'idle') return;
  if ((save.supplies[selectedBait] || 0) <= 0) {
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
  fishing.phase = 'waiting';
  fishing.castTarget = target;
  fishing.castLanding = landingPoint;
  fishing.invalidCast = !target || target.lure !== fishing.castLure || target.bait !== fishing.castBait;
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
    if (!fishing.baitConsumed && fishing.castBait) {
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
    }
    if (fishing.reelProgress >= 1) landFish();
  }
}

function useNet() {
  if (!['forest', 'store', 'zoo'].includes(currentZone) || activeTool !== 'net') return;
  triggerToolAction('net-swing', 0.42);
  const bug = getAimBug(true) || getNearestRevealedBug();
  if (bug && bug.revealed) {
    catchBug(bug);
    return;
  }
  const critter = getNetCritterTarget();
  if (!critter) {
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

function catchCritter(critter) {
  critter.caught = true;
  save.caught[critter.species] = (save.caught[critter.species] || 0) + 1;
  save.coins += 15;
  world.remove(critter.group);
  saveGame();
  updateHUD();
  toast(`${SPECIES[critter.species].label} recorded. +15¢`, 'success');
  setStatus('A quiet capture. There are more field notes to fill.');
}

function scareCritter(critter) {
  critter.state = 'flee';
  critter.fleeTime = 3.8;
  tempVector.subVectors(critter.group.position, player).setY(0).normalize();
  critter.direction = Math.atan2(tempVector.x, tempVector.z);
}

function catchBug(bug) {
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
  if (!['forest', 'zoo'].includes(currentZone) || activeTool !== 'magnifier') return;
  const bug = getAimBug(false) || getNearbyBug();
  if (!bug) {
    toast('No moving trace nearby. Follow the little light above the leaves.', 'warning');
    return;
  }
  if (bug.revealed) {
    toast('The bug is visible. Equip the net to make the capture.', 'success');
    return;
  }
  triggerToolAction('magnifier-inspect', 0.5);
  qteState = { bug, position: 0.12, direction: 1 };
  modalOpen = true;
  dom.qteCopy.textContent = `A ${SPECIES[bug.species].label.toLowerCase()} is hiding here. Center the marker in the observation band.`;
  dom.qteModal.classList.remove('is-hidden');
  document.exitPointerLock?.();
  setStatus('Movement paused for close observation.');
}

function resolveBugObservation() {
  if (!qteState) return;
  const success = qteState.position >= 0.42 && qteState.position <= 0.59;
  const bug = qteState.bug;
  qteState = null;
  modalOpen = false;
  dom.qteModal.classList.add('is-hidden');
  if (success) {
    bug.revealed = true;
    bug.bugModel.visible = true;
    bug.marker.visible = true;
    if (['worm', 'caterpillar', 'spider'].includes(bug.species)) {
      bug.cooldown = 10;
      bug.revealed = false;
      bug.bugModel.visible = false;
      bug.marker.visible = false;
      save.caught[bug.species] = (save.caught[bug.species] || 0) + 1;
      if (bug.species === 'worm') save.supplies.worms = (save.supplies.worms || 0) + 1;
      save.coins += bug.species === 'worm' ? 4 : 8;
      saveGame();
      updateHUD();
      toast(`${SPECIES[bug.species].label} collected${bug.species === 'worm' ? ' — fishing lure added' : ''}.`, 'success');
      setStatus(bug.species === 'worm' ? 'The worm is ready to use as fishing bait.' : 'The tiny field note is safely recorded.');
    } else {
      setTool('net');
      toast(`${SPECIES[bug.species].label} revealed. Net it before it disappears.`, 'success');
      setStatus('The bug is visible. Equip the net and make a clean swing.');
    }
  } else {
    bug.cooldown = 3;
    toast('The lens slipped off the movement. Try the trace again.', 'warning');
    setStatus('The leaves settle. The visual trace will return.');
  }
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
  const landing = new THREE.Vector3(FOREST_WATER.centerX, 0.18, FOREST_WATER.centerZ);
  if (Math.abs(direction.y) > 0.01) {
    const distance = (0.18 - origin.y) / direction.y;
    if (distance > 0) landing.copy(origin).addScaledVector(direction, distance);
  }
  landing.y = 0.18;
  const offset = new THREE.Vector3(landing.x - FOREST_WATER.centerX, 0, landing.z - FOREST_WATER.centerZ);
  if (offset.lengthSq() > FOREST_WATER.castRadius * FOREST_WATER.castRadius) {
    offset.normalize().multiplyScalar(FOREST_WATER.castRadius);
    landing.x = FOREST_WATER.centerX + offset.x;
    landing.z = FOREST_WATER.centerZ + offset.z;
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

function getAimBug(revealedOnly = false) {
  return getAimTarget(bugNodes.filter((bug) => bug.cooldown <= 0 && (!revealedOnly || bug.revealed)), 7.5, 0.62);
}

function getNearbyBug() {
  return bugNodes.filter((bug) => bug.cooldown <= 0 && !bug.revealed).sort((a, b) => distanceTo(a.position) - distanceTo(b.position))[0] || null;
}

function getNearestRevealedBug() {
  return bugNodes
    .filter((bug) => bug.cooldown <= 0 && bug.revealed && distanceTo(bug.position) <= 5.8)
    .sort((a, b) => distanceTo(a.position) - distanceTo(b.position))[0] || null;
}

function updateCritters(delta) {
  for (const critter of critters) {
    if (critter.caught) continue;
    const animal = critter.group;
    const isFlying = SPECIES[critter.species].type === 'flying' || ['butterfly', 'bee', 'dragonfly'].includes(critter.species);
    critter.stateTime += delta;
    const distance = distanceTo(animal.position);
    if (critter.state === 'idle') {
      const threat = distance < 5.2 && currentNoise > 0.34 && !(activeTool === 'net' && distance < 2.6 && currentNoise < 0.56);
      if (threat) {
        scareCritter(critter);
      } else {
        critter.direction += Math.sin(elapsed * 0.28 + critter.home.x) * delta * 0.07;
        const drift = Math.sin(critter.stateTime * 0.65 + critter.home.z) * 0.035;
        animal.position.x += Math.sin(critter.direction) * delta * 0.28;
        animal.position.z += Math.cos(critter.direction) * delta * 0.28;
        if (animal.position.distanceTo(critter.home) > 4.1) critter.direction += Math.PI * 0.76;
        animal.position.y = isFlying ? critter.home.y + Math.sin(elapsed * 3 + critter.home.x) * 0.2 : 0.42 + drift;
      }
    } else if (critter.state === 'flee') {
      critter.fleeTime -= delta;
      animal.position.x += Math.sin(critter.direction) * delta * 3.4;
      animal.position.z += Math.cos(critter.direction) * delta * 3.4;
      animal.position.y = isFlying ? critter.home.y + Math.abs(Math.sin(elapsed * 9)) * 0.18 : 0.42 + Math.abs(Math.sin(elapsed * 9)) * 0.1;
      if (critter.fleeTime <= 0) {
        critter.state = 'idle';
        critter.home.copy(animal.position);
        critter.stateTime = 0;
      }
    }
    animal.rotation.y = critter.direction + Math.PI;
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
      const pulse = 1 + Math.sin(elapsed * 4.5 + bug.position.x) * 0.18;
      bug.marker.scale.setScalar(pulse);
      bug.marker.rotation.y += delta * 0.65;
      bug.markerCore.material.emissiveIntensity = 0.95 + Math.sin(elapsed * 6) * 0.4;
    }
    if (bug.revealed) {
      bug.bugModel.position.y = 1.1 + Math.sin(elapsed * 4 + bug.position.x) * 0.14;
      bug.bugModel.rotation.y += delta * 2.6;
    }
    bug.aimPosition.set(bug.group.position.x + bug.bugModel.position.x, bug.group.position.y + bug.bugModel.position.y, bug.group.position.z + bug.bugModel.position.z);
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
    } else if (exhibit.type === 'ground') {
      exhibit.group.position.y = exhibit.center.y + Math.abs(Math.sin(elapsed * 2.4 + exhibit.phase)) * 0.045;
      exhibit.group.rotation.y = Math.atan2(deltaX, -deltaZ);
    } else {
      exhibit.group.position.y = exhibit.center.y + Math.sin(elapsed * 2.8 + exhibit.phase) * 0.24;
      exhibit.group.rotation.y = Math.atan2(deltaX, -deltaZ);
      exhibit.group.rotation.z = Math.sin(elapsed * 3.2 + exhibit.phase) * 0.16;
    }
  }
}


function constrainForestWaterBoundary() {
  if (currentZone !== 'forest') return;
  const offsetX = player.x - FOREST_WATER.centerX;
  const offsetZ = player.z - FOREST_WATER.centerZ;
  const distance = Math.hypot(offsetX, offsetZ);
  const onDockCorridor = Math.abs(offsetX) <= FOREST_DOCK.halfWidth && player.z <= FOREST_DOCK.shoreZ + 0.7;
  if (onDockCorridor) return;
  if (distance >= FOREST_WATER.playerRadius) return;
  if (distance < 0.001) {
    player.x = FOREST_WATER.centerX;
    player.z = FOREST_WATER.centerZ + FOREST_WATER.playerRadius;
  } else {
    const scale = FOREST_WATER.playerRadius / distance;
    player.x = FOREST_WATER.centerX + offsetX * scale;
    player.z = FOREST_WATER.centerZ + offsetZ * scale;
  }
  if (fishing.phase === 'idle') setStatus('The shoreline drops off here. Stay on the bank or use the pond dock.');
}

function updateMovement(delta) {
  if (modalOpen || qteState) return;
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
  constrainForestWaterBoundary();
  if (!grounded || jumpOffset > 0) {
    jumpVelocity -= GRAVITY * delta;
    jumpOffset += jumpVelocity * delta;
    if (jumpOffset <= 0) {
      jumpOffset = 0;
      jumpVelocity = 0;
      grounded = true;
    }
  }
  currentNoise = moving ? (sneaking ? 0.16 : 0.78) : 0.02;
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
  const nearbyBug = ['forest', 'zoo'].includes(currentZone) && activeTool === 'magnifier' ? getNearbyBug() : null;
  if (!target && nearbyBug && distanceTo(nearbyBug.position) < 8.6 && !nearbyBug.revealed) {
    label = 'Inspect bug trace';
  }
  if (!label) {
    dom.promptCard.classList.add('is-hidden');
    lastPromptKey = '';
    return;
  }
  const promptKey = `${currentZone}:${label}:${activeTool}`;
  if (promptKey !== lastPromptKey) {
    dom.promptKey.textContent = activeTool === 'magnifier' && nearbyBug ? 'E' : 'E';
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
  if (currentZone === 'forest' && activeTool === 'rod' && fishing.phase === 'idle') targeted = Boolean(getAimedHotspot());
  if (['forest', 'zoo'].includes(currentZone) && activeTool === 'net') targeted = Boolean(getAimCritter() || getAimBug(true) || getNearestRevealedBug());
  if (['forest', 'zoo'].includes(currentZone) && activeTool === 'magnifier') targeted = Boolean(getAimBug(false));
  dom.crosshair.classList.toggle('is-targeted', targeted);
}

function updateHUD() {
  dom.zoneLabel.textContent = ZONES[currentZone].label;
  dom.coinLabel.textContent = `${save.coins}¢`;
  const baitLabel = formatName(selectedBait);
  const lureLabel = formatName(selectedLure);
  dom.equipmentList.innerHTML = `
    <div class="equipment-item"><strong>BAIT <small>${baitLabel}</small></strong><em>${save.supplies[selectedBait] || 0}</em></div>
    <div class="equipment-item"><strong>LURE <small>${lureLabel}</small></strong><em>REUSABLE</em></div>
    <div class="equipment-item"><strong>NETS</strong><em>${save.supplies.nets || 0}</em></div>
    <div class="equipment-item"><strong>GLASSES</strong><em>${save.supplies.magnifiers || 0}</em></div>
    <div class="equipment-item"><strong>SEEDS</strong><em>${save.supplies.flowerSeeds || 0}</em></div>
    <div class="equipment-item"><strong>HONEY</strong><em>${save.honey || 0}</em></div>
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
  const visible = save.tipsEnabled !== false && currentZone === 'forest' && activeTool === 'rod';
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
  const visible = currentZone === 'forest' && activeTool === 'rod' && !modalOpen && !qteState;
  dom.fishingCallout.classList.toggle('is-hidden', !visible);
  if (!visible) return;
  let message = 'AIM FOR A WATER HOT SPOT';
  let tone = '';
  if (fishing.phase === 'charging') message = `HOLD TO CAST · ${Math.round(fishing.charge * 100)}%`;
  if (fishing.phase === 'waiting' && !fishing.castTarget) { message = 'REEL LINE · NOT IN A HOT SPOT'; tone = 'is-warning'; }
  if (fishing.phase === 'waiting' && fishing.invalidCast) { message = `SWITCH TO ${formatName(fishing.castTarget.bait)} + ${formatName(fishing.castTarget.lure)}`; tone = 'is-warning'; }
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
  const fishingActive = currentZone === 'forest' && ['charging', 'waiting', 'bite', 'hooking', 'returning', 'reeling'].includes(fishing.phase);
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
  } else if (currentZone === 'forest' && activeTool === 'rod') {
    dom.primaryAction.textContent = 'HOLD TO CAST';
  } else if (['forest', 'zoo'].includes(currentZone) && activeTool === 'magnifier') {
    dom.primaryAction.textContent = 'INSPECT TRACE';
  } else if (['forest', 'store', 'zoo'].includes(currentZone) && activeTool === 'net') {
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
  if (!['rod', 'net', 'magnifier'].includes(tool)) return;
  if (tool === 'net' && (save.supplies.nets || 0) <= 0) {
    toast('You need a field net. Visit the supply store.', 'warning');
    return;
  }
  if (tool === 'magnifier' && (save.supplies.magnifiers || 0) <= 0) {
    toast('You need a magnifying glass. Visit the supply store.', 'warning');
    return;
  }
  activeTool = tool;
  createHeldToolModel(tool);
  document.querySelectorAll('.tool-button').forEach((button) => button.classList.toggle('active', button.dataset.tool === tool));
  updateHUD();
  setStatus(tool === 'rod' ? 'Aim for a circular disturbance in the lake.' : tool === 'net' ? 'Sneak close. A fast swing is only useful at short range.' : 'Watch for a pulse above the leaves, then inspect it.');
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

function openModal(element) {
  modalOpen = true;
  element.classList.remove('is-hidden');
  document.exitPointerLock?.();
}

function closeModal(element) {
  element.classList.add('is-hidden');
  modalOpen = false;
  if (element === dom.qteModal) qteState = null;
  if (element === dom.cleaningModal) cleaningState = null;
}

function closeAllModals() {
  [dom.travelModal, dom.shopModal, dom.qteModal, dom.cleaningModal, dom.collectionModal].forEach((modal) => modal.classList.add('is-hidden'));
  modalOpen = false;
  qteState = null;
  cleaningState = null;
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
  if (target?.type === 'seed-bed') {
    plantFlowerSeed();
    return;
  }
  if (target?.type === 'enclosure') {
    startCleaning(target);
    return;
  }
  if (['forest', 'zoo'].includes(currentZone) && activeTool === 'magnifier') startBugObservation();
}

function handlePrimaryDown() {
  if (modalOpen || qteState) return;
  if (!pointerLocked) {
    dom.canvas.requestPointerLock?.();
    return;
  }
  primaryHeld = true;
  if (currentZone === 'forest' && activeTool === 'rod') {
    if (fishing.phase === 'idle') startCast();
    else if (fishing.phase === 'bite') setHook();
    else if (fishing.phase === 'hooking') setHook();
    else if (fishing.phase === 'waiting') startReelIn();
    else if (fishing.phase === 'reeling') fishing.reelHeld = true;
  } else if (['forest', 'store', 'zoo'].includes(currentZone) && activeTool === 'net') {
    useNet();
  } else if (['forest', 'zoo'].includes(currentZone) && activeTool === 'magnifier') {
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
    dom.canvas.requestPointerLock?.();
    return;
  }
  if (currentZone === 'forest' && activeTool === 'rod') startCast();
  if (['forest', 'store', 'zoo'].includes(currentZone) && activeTool === 'net') useNet();
  if (['forest', 'zoo'].includes(currentZone) && activeTool === 'magnifier') startBugObservation();
}

function handleActionUp() {
  actionHeld = false;
  if (fishing.phase === 'reeling') fishing.reelHeld = false;
  if (fishing.phase === 'charging') finishCast();
}

function updateQTE(delta) {
  if (!qteState) return;
  qteState.position += qteState.direction * delta * 0.88;
  if (qteState.position >= 1) {
    qteState.position = 1;
    qteState.direction = -1;
  }
  if (qteState.position <= 0) {
    qteState.position = 0;
    qteState.direction = 1;
  }
  dom.qteCursor.style.left = `${qteState.position * 100}%`;
}

function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.05);
  elapsed += delta;
  updateCameraRotation();
  updateMovement(delta);
  updateHeldTool();
  updateFishing(delta);
  updateFishingVisuals();
  updateCritters(delta);
  updateBugNodes(delta);
  updateTreeInteractions();
  updateEnclosureMarkers();
  updateHotspots(delta);
  updateZooAnimals(delta);
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
  if (event.code === 'KeyB') cycleBait();
  if (event.code === 'KeyL') cycleLure();
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
});

dom.canvas.addEventListener('pointerdown', (event) => {
  if (event.button !== 0) return;
  event.preventDefault();
  handlePrimaryDown();
});
window.addEventListener('pointerup', (event) => {
  if (event.button !== 0) return;
  handlePrimaryUp();
});

dom.canvas.addEventListener('click', () => {
  if (!pointerLocked && !modalOpen && !qteState) dom.canvas.requestPointerLock?.();
});

document.addEventListener('pointerlockchange', () => {
  pointerLocked = document.pointerLockElement === dom.canvas;
  if (pointerLocked) dom.canvas.focus();
  dom.lockDot.classList.toggle('is-live', pointerLocked);
  dom.lockLabel.textContent = pointerLocked ? 'FIELD MODE ACTIVE' : 'CLICK TO ENTER FIELD MODE';
  updateActionDock();
});

document.addEventListener('mousemove', (event) => {
  if (!pointerLocked || modalOpen || qteState) return;
  yaw -= event.movementX * 0.0021;
  pitch -= event.movementY * 0.0018;
  pitch = clamp(pitch, -1.32, 1.32);
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
