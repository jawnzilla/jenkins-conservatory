import * as THREE from 'three';
import './style.css';

const SAVE_KEY = 'jenkins-conservatory-save-v1';
const ZONE_ORDER = ['store', 'forest', 'zoo'];

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

const SPECIES = {
  trout: { label: 'Brook trout', type: 'fish', sigil: '≈', color: 0xd78155, note: 'Spinner + worms' },
  sunfish: { label: 'Bluegill sunfish', type: 'fish', sigil: '◌', color: 0x70a6be, note: 'Feather + grubs' },
  rabbit: { label: 'Cottontail rabbit', type: 'ground', sigil: '◒', color: 0xe6d7bf, note: 'Sneak + net' },
  squirrel: { label: 'Red squirrel', type: 'ground', sigil: '◓', color: 0xb56843, note: 'Sneak + net' },
  butterfly: { label: 'Painted butterfly', type: 'bug', sigil: '✦', color: 0xf0a4c1, note: 'Magnify + net' },
  bee: { label: 'Meadow bee', type: 'bug', sigil: '✧', color: 0xf2c84b, note: 'Magnify + net' },
  dragonfly: { label: 'Blue dragonfly', type: 'bug', sigil: '⌁', color: 0x83cfe7, note: 'Magnify + net' }
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
  { key: 'magnifiers', group: 'tool', label: 'Magnifying glass', note: 'Reveals hidden bug movement.', cost: 22, amount: 1 }
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
    magnifiers: 1
  },
  caught: {},
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
  qteModal: document.querySelector('#qte-modal'),
  qteCursor: document.querySelector('.qte-cursor'),
  qteAction: document.querySelector('#qte-action'),
  qteCopy: document.querySelector('#qte-copy'),
  collectionModal: document.querySelector('#collection-modal'),
  collectionGrid: document.querySelector('#collection-grid'),
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
let fishingVisuals = null;
let spawnPoint = new THREE.Vector3(0, 1.72, 15);
const player = new THREE.Vector3(0, 1.72, 15);

const fishing = {
  phase: 'idle',
  charge: 0,
  castTarget: null,
  biteAt: 0,
  biteDeadline: 0,
  reelProgress: 0,
  reelHeld: false,
  fishSpecies: null,
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
      caught: { ...(parsed.caught || {}) }
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

function updateHeldTool() {
  const root = heldToolGroup.userData.root;
  const basePosition = heldToolGroup.userData.basePosition;
  const baseRotation = heldToolGroup.userData.baseRotation;
  if (!root || !basePosition || !baseRotation) return;
  const moving = isKeyDown('KeyW', 'KeyA', 'KeyS', 'KeyD', 'w', 'a', 's', 'd');
  const stride = moving ? Math.sin(elapsed * 8.2) : Math.sin(elapsed * 1.8) * 0.2;
  root.position.copy(basePosition);
  root.position.y += stride * (moving ? 0.018 : 0.004);
  root.rotation.copy(baseRotation);
  root.rotation.z += stride * (moving ? 0.035 : 0.008);
  if (fishing.phase === 'charging') root.rotation.x -= fishing.charge * 0.2;
  if (fishing.phase === 'reeling') root.rotation.x += Math.sin(elapsed * 10) * 0.035;
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

  const car = createCar();
  car.position.set(0, 0.25, 10);
  world.add(car);
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
  return group;
}

function createFence(x, z, width, depth, color = 0x806e53) {
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
  return group;
}

function createPath(x, z, width, length, color = 0xb3a47a) {
  box(world, [width, 0.04, length], color, [x, 0, z], { material: { roughness: 1 } });
}

function buildStore() {
  setZonePalette('store');
  addGround(ZONES.store.ground);
  createParkingHub('FIELD DEPOT', ZONES.store.accent);
  createPath(0, 0, 7, 20, 0x9f956d);

  box(world, [15, 0.6, 0.45], 0x2e4936, [0, 3.6, -8.5]);
  box(world, [0.45, 3.6, 9], 0x35523e, [-7.3, 1.8, -4.3]);
  box(world, [0.45, 3.6, 9], 0x35523e, [7.3, 1.8, -4.3]);
  box(world, [15, 0.25, 9], 0x283b31, [0, 3.9, -4.3], { rotation: [0.06, 0, -0.04] });
  box(world, [15, 0.28, 0.35], 0x7a6445, [0, 0.25, -8.5]);
  box(world, [4.5, 2.6, 0.2], 0xa86f49, [0, 1.4, -8.7]);
  const storefront = makeLabel('SUPPLIES', '#f2b268', '#3a2b25', 1.14);
  storefront.position.set(0, 3.0, -8.96);
  world.add(storefront);

  const counter = new THREE.Group();
  counter.position.set(0, 0, -5.5);
  box(counter, [7.2, 0.9, 1.2], 0x8f6948, [0, 0.55, 0]);
  box(counter, [6.7, 0.06, 1.05], 0xd4b67b, [0, 1.03, -0.03]);
  box(counter, [0.8, 0.65, 0.38], 0x2d503d, [0, 1.36, -0.08]);
  world.add(counter);
  interactables.push({ type: 'shop', label: 'Open supply counter', position: counter.position.clone(), radius: 3.6 });

  for (const x of [-5.6, -3.1, 3.1, 5.6]) {
    box(world, [1.4, 2.4, 0.65], 0x58765a, [x, 1.2, -6.9]);
    box(world, [1.1, 0.08, 0.7], 0xf2b268, [x, 2.42, -6.9]);
  }
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
  createParkingHub('LAKE FIELD', ZONES.forest.accent);
  createPath(0, -1.7, 5.5, 25, 0x9d946e);
  box(world, [5.5, 0.07, 7], 0x7f815e, [0, 0, -10], { rotation: [0, 0, 0.04] });

  const water = addMesh(world, new THREE.CircleGeometry(10, 48), mat(0x2f8291, { roughness: 0.24, metalness: 0.05, transparent: true, opacity: 0.9 }), [0, 0.08, -17], [-Math.PI / 2, 0, 0]);
  water.receiveShadow = true;
  const shoreline = addMesh(world, new THREE.RingGeometry(10.1, 10.45, 48), mat(0x8da36f, { roughness: 1 }), [0, 0.07, -17], [-Math.PI / 2, 0, 0]);
  shoreline.receiveShadow = true;
  addMesh(world, new THREE.CircleGeometry(10.7, 48), mat(0x6a7d55, { roughness: 1 }), [0, 0.02, -17], [-Math.PI / 2, 0, 0]);

  const treeSpots = [
    [-16, -15, 1.3], [-13, -3, 1.5], [-10, 5, 1.1], [14, -2, 1.45], [17, -16, 1.2],
    [-17, -25, 1.1], [15, -28, 1.35], [9, 4, 1.15], [-4, 2, 0.9], [18, 5, 0.8],
    [-20, -8, 1.1], [-19, 2, 0.95], [-21, -19, 1.25], [-18, -29, 1.05],
    [20, -8, 1.05], [19, 2, 0.92], [21, -21, 1.18], [18, -29, 1.08],
    [-12, -29, 0.9], [11, -27, 0.95], [-15, -7, 0.84], [15, -7, 0.88]
  ];
  treeSpots.forEach(([x, z, scale], index) => createTree(x, z, scale, index % 2 ? 0x315a41 : 0x3f6b47));
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

  createBugNode('butterfly', [-10.5, 0.05, -1.8], 0xe7a6c4);
  createBugNode('bee', [11.2, 0.05, -10.2], 0xf0c849);
  createBugNode('dragonfly', [8.8, 0.05, -22.1], 0x81c9e4);
  createBugNode('butterfly', [-7.2, 0.05, -25.2], 0xe7a6c4);

  const trailLabel = makeLabel('LAKE TRAIL', '#d8ef85', '#1c3025', 0.72);
  trailLabel.position.set(0, 2.9, -3.2);
  world.add(trailLabel);
}

function addRock(x, y, z, scale, color) {
  const rock = addMesh(world, new THREE.DodecahedronGeometry(scale, 0), mat(color), [x, y, z], [0.1, 0.25, 0.08], [1.3, 0.8, 1]);
  rock.castShadow = true;
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
  createParkingHub('CONSERVATORY', ZONES.zoo.accent);
  createPath(0, -2.5, 6, 25, 0xc0ad78);
  createPath(-9, -9, 3.2, 15, 0xc0ad78);
  createPath(9, -9, 3.2, 15, 0xc0ad78);

  createFence(-9, -10, 8, 8);
  createFence(9, -10, 8, 8);
  createFence(0, -22, 14, 5, 0x66806d);
  const rabbitLabel = makeLabel('MEADOW', '#d8ef85', '#23352d', 0.64);
  rabbitLabel.position.set(-9, 2.8, -10);
  world.add(rabbitLabel);
  const bugLabel = makeLabel('POLLINATOR', '#f2c84b', '#3c3220', 0.64);
  bugLabel.position.set(9, 2.8, -10);
  world.add(bugLabel);
  const aquariumLabel = makeLabel('WATER WING', '#8be0c3', '#183d3c', 0.68);
  aquariumLabel.position.set(0, 3.1, -22);
  world.add(aquariumLabel);

  box(world, [15, 3.4, 0.35], 0x456254, [0, 1.7, -24.4]);
  box(world, [0.35, 3.4, 5.2], 0x456254, [-7.3, 1.7, -22]);
  box(world, [0.35, 3.4, 5.2], 0x456254, [7.3, 1.7, -22]);
  const tank = box(world, [11.5, 3.1, 3.8], 0x73b9b1, [0, 1.65, -21.8], { material: { transparent: true, opacity: 0.19, roughness: 0.18, metalness: 0.12 } });
  tank.castShadow = false;
  tank.receiveShadow = false;
  for (let i = 0; i < 4; i += 1) {
    const fish = createAnimalModel(i % 2 ? 'sunfish' : 'trout', 0.85);
    fish.position.set(-3.2 + i * 2.1, 1.15 + (i % 2) * 0.5, -21.8 + (i % 3) * 0.4);
    fish.rotation.y = i * 0.8;
    fish.userData.zooFish = true;
    world.add(fish);
  }

  const record = new THREE.Group();
  record.position.set(0, 0, -4.2);
  box(record, [2.5, 2.8, 0.24], 0x3f5f4c, [0, 1.4, 0]);
  box(record, [1.9, 1.3, 0.08], 0xd8ef85, [0, 1.55, -0.18]);
  cylinder(record, 0.15, 0.15, 0.38, 0x8fb7a0, [0, 0.2, 0], { segments: 6 });
  world.add(record);
  interactables.push({ type: 'collection', label: 'Open living collection', position: record.position.clone(), radius: 3.2 });

  createTree(-17, -5, 1.2, 0x3d6249);
  createTree(17, -5, 1.2, 0x3d6249);
  addExhibitAnimals(-9, -10, ['rabbit', 'squirrel']);
  addExhibitAnimals(9, -10, ['butterfly', 'bee', 'dragonfly']);
}

function addExhibitAnimals(x, z, fallbackSpecies) {
  const available = fallbackSpecies.filter((species) => (save.caught[species] || 0) > 0);
  const speciesToShow = available.length ? available : [fallbackSpecies[0]];
  speciesToShow.slice(0, 2).forEach((species, index) => {
    const model = createAnimalModel(species, species === 'butterfly' || species === 'bee' || species === 'dragonfly' ? 0.68 : 0.75);
    model.position.set(x - 1.2 + index * 2.4, species === 'rabbit' || species === 'squirrel' ? 0.5 : 1.7, z - 0.3 + index * 0.25);
    world.add(model);
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
  } else if (species === 'trout' || species === 'sunfish') {
    const bodyColor = details.color;
    sphere(group, 0.48, bodyColor, [0, 0, 0], { scale: [1.65, 0.72, 0.62], widthSegments: 12, heightSegments: 8 });
    cone(group, 0.33, 0.64, bodyColor, [-0.98, 0, 0], { rotation: [0, 0, -Math.PI / 2], segments: 6 });
    cone(group, 0.22, 0.48, 0xe7c46a, [0.08, 0.26, 0], { rotation: [0, 0, 0], segments: 5 });
    cone(group, 0.18, 0.46, 0xc9edf0, [0.13, -0.24, 0], { rotation: [0, 0, Math.PI], segments: 5 });
    sphere(group, 0.06, 0x20241e, [0.68, 0.16, -0.28]);
    sphere(group, 0.06, 0x20241e, [0.68, 0.16, 0.28]);
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
    for (const x of [-0.2, 0.2]) {
      addMesh(group, new THREE.CircleGeometry(0.2, 6), mat(details.color, { transparent: true, opacity: 0.62, side: THREE.DoubleSide }), [x, 0.12, 0], [0, Math.PI / 2, x > 0 ? -0.45 : 0.45]);
    }
    sphere(group, 0.06, 0x26333e, [0.42, 0, 0]);
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
  fishing.biteAt = 0;
  fishing.biteDeadline = 0;
  fishing.reelProgress = 0;
  fishing.reelHeld = false;
  fishing.fishSpecies = null;
  fishing.invalidCast = false;
}

function removeFishingVisuals() {
  if (!fishingVisuals) return;
  world.remove(fishingVisuals.group);
  fishingVisuals = null;
}

function createFishingVisuals(hotspot) {
  removeFishingVisuals();
  const group = new THREE.Group();
  const bobber = sphere(group, 0.14, 0xff7c63, [hotspot.position.x, 0.3, hotspot.position.z], { material: { emissive: 0x7a261d, emissiveIntensity: 1.05 } });
  const bobberTop = sphere(group, 0.06, 0xf8ead0, [hotspot.position.x, 0.44, hotspot.position.z]);
  const lineGeometry = new THREE.BufferGeometry().setFromPoints([camera.position.clone(), bobber.position.clone()]);
  const line = new THREE.Line(lineGeometry, new THREE.LineBasicMaterial({ color: 0xf3dfb5, transparent: true, opacity: 0.8 }));
  group.add(line);
  world.add(group);
  fishingVisuals = { group, bobber, bobberTop, line, hotspot };
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
  if ((save.supplies[selectedLure] || 0) <= 0) {
    toast(`Your ${selectedLure} lure is out of stock.`, 'warning');
    return;
  }
  fishing.phase = 'charging';
  fishing.charge = 0;
  setStatus('Hold to load the cast. Aim at a water disturbance before releasing.');
}

function finishCast() {
  if (fishing.phase !== 'charging') return;
  fishing.charge = clamp(fishing.charge, 0.18, 1);
  const target = getAimedHotspot();
  if (!target) {
    resetFishing();
    toast('The cast fell short of a disturbance. Aim for the circular splash.', 'warning');
    return;
  }
  save.supplies[selectedBait] = Math.max(0, save.supplies[selectedBait] - 1);
  save.supplies[selectedLure] = Math.max(0, save.supplies[selectedLure] - 1);
  fishing.phase = 'waiting';
  fishing.castTarget = target;
  fishing.invalidCast = target.lure !== selectedLure || target.bait !== selectedBait;
  fishing.biteAt = fishing.invalidCast ? Number.POSITIVE_INFINITY : elapsed + 2.6 + Math.random() * 2;
  createFishingVisuals(target);
  saveGame();
  if (fishing.invalidCast) {
    setStatus(`No response. This disturbance calls for ${formatName(target.lure)} + ${formatName(target.bait)}.`);
    toast('Wrong presentation for this hot spot. Reel back and change the field kit.', 'warning');
  } else {
    setStatus('The bobber is in the hot spot. Listen for the bite.');
    toast(`${formatName(selectedLure)} landed in the disturbance.`, 'success');
  }
}

function startReelIn() {
  if (fishing.phase !== 'waiting') return;
  fishing.phase = 'returning';
  fishing.reelHeld = true;
  setStatus('Reeling the line back to shore.');
}

function setHook() {
  if (fishing.phase !== 'bite') return;
  if (elapsed > fishing.biteDeadline) {
    failHook();
    return;
  }
  fishing.phase = 'reeling';
  fishing.reelProgress = 0.18;
  fishing.reelHeld = false;
  setStatus(`Hook set. Reel in the ${SPECIES[fishing.fishSpecies].label.toLowerCase()}.`);
  toast('Hook set — keep reeling until the fish reaches shore.', 'success');
}

function failHook() {
  const species = fishing.fishSpecies ? SPECIES[fishing.fishSpecies].label : 'fish';
  resetFishing();
  removeFishingVisuals();
  toast(`Too slow. The ${species.toLowerCase()} slipped the hook.`, 'danger');
  setStatus('The disturbance is quiet again. Try another cast.');
}

function landFish() {
  const species = fishing.fishSpecies;
  save.caught[species] = (save.caught[species] || 0) + 1;
  save.coins += species === 'trout' ? 18 : 22;
  resetFishing();
  removeFishingVisuals();
  saveGame();
  updateHUD();
  toast(`${SPECIES[species].label} added to the collection. +${species === 'trout' ? 18 : 22}¢`, 'success');
  setStatus('A clean landing. You can cast again or head back to the car.');
}

function updateFishing(delta) {
  if (fishing.phase === 'charging') {
    fishing.charge = clamp(fishing.charge + delta * 0.72, 0, 1);
  }
  if (fishing.phase === 'waiting' && elapsed >= fishing.biteAt) {
    fishing.phase = 'bite';
    fishing.fishSpecies = fishing.castTarget.fishSpecies;
    fishing.biteDeadline = elapsed + 1.3;
    setStatus(`BITE — click now to set the hook.`);
    toast('BITE! Click the action button or left mouse now.', 'success');
  }
  if (fishing.phase === 'bite' && elapsed > fishing.biteDeadline) {
    failHook();
  }
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
    fishing.reelProgress += delta * (held ? 0.33 : -0.035);
    fishing.reelProgress = clamp(fishing.reelProgress, 0, 1);
    if (fishingVisuals) {
      const start = fishing.castTarget.position;
      tempVector.set(camera.position.x, 0.3, camera.position.z);
      fishingVisuals.bobber.position.lerp(tempVector, clamp(delta * (held ? 1.9 : 0.35), 0, 1));
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
  if (currentZone !== 'forest' || !['net'].includes(activeTool)) return;
  const bug = getAimBug(true) || getNearestRevealedBug();
  if (bug && bug.revealed) {
    catchBug(bug);
    return;
  }
  const critter = getAimCritter();
  if (!critter) {
    toast('No clear net target. Sneak close and line up the animal.', 'warning');
    return;
  }
  if (critter.state === 'flee') {
    toast('The animal already knows you are there.', 'warning');
    return;
  }
  const distance = distanceTo(critter.group.position);
  if (distance > 3.65 || currentNoise > 0.42) {
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
  if (currentZone !== 'forest' || activeTool !== 'magnifier') return;
  const bug = getAimBug(false) || getNearbyBug();
  if (!bug) {
    toast('No moving trace nearby. Follow the little light above the leaves.', 'warning');
    return;
  }
  if (bug.revealed) {
    toast('The bug is visible. Equip the net to make the capture.', 'success');
    return;
  }
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
    setTool('net');
    toast(`${SPECIES[bug.species].label} revealed. Net it before it disappears.`, 'success');
    setStatus('The bug is visible. Equip the net and make a clean swing.');
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
    critter.stateTime += delta;
    const distance = distanceTo(animal.position);
    if (critter.state === 'idle') {
      const threat = distance < 5.2 && currentNoise > 0.34;
      if (threat) {
        scareCritter(critter);
      } else {
        critter.direction += Math.sin(elapsed * 0.28 + critter.home.x) * delta * 0.07;
        const drift = Math.sin(critter.stateTime * 0.65 + critter.home.z) * 0.035;
        animal.position.x += Math.sin(critter.direction) * delta * 0.28;
        animal.position.z += Math.cos(critter.direction) * delta * 0.28;
        if (animal.position.distanceTo(critter.home) > 4.1) critter.direction += Math.PI * 0.76;
        animal.position.y = 0.42 + drift;
      }
    } else if (critter.state === 'flee') {
      critter.fleeTime -= delta;
      animal.position.x += Math.sin(critter.direction) * delta * 3.4;
      animal.position.z += Math.cos(critter.direction) * delta * 3.4;
      animal.position.y = 0.42 + Math.abs(Math.sin(elapsed * 9)) * 0.1;
      if (critter.fleeTime <= 0) {
        critter.state = 'idle';
        critter.home.copy(animal.position);
        critter.stateTime = 0;
      }
    }
    animal.rotation.y = critter.direction + Math.PI;
    const aimed = getAimCritter() === critter;
    if (aimed && distance < 4.5 && currentNoise < 0.42) {
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

function updateZooFish(delta) {
  if (currentZone !== 'zoo') return;
  const fishMeshes = world.children.filter((child) => child.userData?.zooFish);
  fishMeshes.forEach((fish, index) => {
    fish.position.x += Math.sin(elapsed * 0.4 + index) * delta * 0.2;
    fish.rotation.y += delta * (0.45 + index * 0.08);
  });
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

  const bounds = ZONES[currentZone].bounds;
  player.x = clamp(player.x, bounds.minX, bounds.maxX);
  player.z = clamp(player.z, bounds.minZ, bounds.maxZ);
  currentNoise = moving ? (sneaking ? 0.16 : 0.78) : 0.02;
  if (moving && fishing.phase === 'waiting') startReelIn();
  camera.position.set(player.x, player.y + (moving ? Math.sin(elapsed * (sneaking ? 5 : 7)) * 0.025 : 0), player.z);
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
  const nearbyBug = currentZone === 'forest' && activeTool === 'magnifier' ? getNearbyBug() : null;
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
  if (currentZone === 'forest' && activeTool === 'net') targeted = Boolean(getAimCritter() || getAimBug(true) || getNearestRevealedBug());
  if (currentZone === 'forest' && activeTool === 'magnifier') targeted = Boolean(getAimBug(false));
  dom.crosshair.classList.toggle('is-targeted', targeted);
}

function updateHUD() {
  dom.zoneLabel.textContent = ZONES[currentZone].label;
  dom.coinLabel.textContent = `${save.coins}¢`;
  const baitLabel = formatName(selectedBait);
  const lureLabel = formatName(selectedLure);
  dom.equipmentList.innerHTML = `
    <div class="equipment-item"><strong>BAIT <small>${baitLabel}</small></strong><em>${save.supplies[selectedBait] || 0}</em></div>
    <div class="equipment-item"><strong>LURE <small>${lureLabel}</small></strong><em>${save.supplies[selectedLure] || 0}</em></div>
    <div class="equipment-item"><strong>NETS</strong><em>${save.supplies.nets || 0}</em></div>
    <div class="equipment-item"><strong>GLASSES</strong><em>${save.supplies.magnifiers || 0}</em></div>
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
    returning: 'cast',
    reeling: 'reel'
  }[fishing.phase] || 'loadout';
  dom.tipSteps.forEach((step) => step.classList.toggle('is-current', step.dataset.tipStep === currentStep));
  dom.actionHint.textContent = {
    idle: 'Use B / L to match the kit, then aim at a circular water disturbance.',
    charging: 'Hold to load the cast. Release while the crosshair is over the disturbance.',
    waiting: 'The bobber is in the disturbance. Wait for the bite, then set the hook quickly.',
    bite: 'BITE! Click SET HOOK before the bite window closes.',
    returning: 'The line is coming back. Change the bait or lure before trying again.',
    reeling: 'Hold REEL LINE / left click until the fish reaches shore.'
  }[fishing.phase] || '';
}

function updateActionDock() {
  const fishingActive = currentZone === 'forest' && ['charging', 'waiting', 'bite', 'returning', 'reeling'].includes(fishing.phase);
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
  } else if (currentZone === 'forest' && activeTool === 'magnifier') {
    dom.primaryAction.textContent = 'INSPECT TRACE';
  } else if (currentZone === 'forest' && activeTool === 'net') {
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
}

function closeAllModals() {
  [dom.travelModal, dom.shopModal, dom.qteModal, dom.collectionModal].forEach((modal) => modal.classList.add('is-hidden'));
  modalOpen = false;
  qteState = null;
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
  openModal(dom.shopModal);
}

function openCollection() {
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
  if (target?.type === 'collection') {
    openCollection();
    return;
  }
  if (currentZone === 'forest' && activeTool === 'magnifier') startBugObservation();
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
    else if (fishing.phase === 'waiting') startReelIn();
    else if (fishing.phase === 'reeling') fishing.reelHeld = true;
  } else if (currentZone === 'forest' && activeTool === 'net') {
    useNet();
  } else if (currentZone === 'forest' && activeTool === 'magnifier') {
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
  if (fishing.phase === 'waiting') {
    startReelIn();
    return;
  }
  if (!pointerLocked) {
    dom.canvas.requestPointerLock?.();
    return;
  }
  if (currentZone === 'forest' && activeTool === 'rod') startCast();
  if (currentZone === 'forest' && activeTool === 'net') useNet();
  if (currentZone === 'forest' && activeTool === 'magnifier') startBugObservation();
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
  updateHotspots(delta);
  updateZooFish(delta);
  updateQTE(delta);
  updatePrompt();
  updateCrosshair();
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
  if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'w', 'a', 's', 'd'].includes(event.code) || ['w', 'a', 's', 'd'].includes(normalizedKey)) {
    event.preventDefault();
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
