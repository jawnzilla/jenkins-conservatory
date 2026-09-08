// ---------------------------------------------------------------------------
// Field audio.
//
// Every sound here is synthesised at runtime from oscillators and noise buffers.
// Nothing is loaded, so the whole soundscape costs no download and no decode,
// and it stays in keeping with a world built out of untextured flat-shaded
// solids: the same "made from primitives" idea, applied to sound.
//
// The engine is deliberately quiet about failure. Audio is a garnish on a game
// that has to keep running, so a browser that refuses to hand over an
// AudioContext gets a no-op engine rather than an exception on the hot path.
// ---------------------------------------------------------------------------

const MASTER_CEILING = 0.55;

// White noise pushed through a narrow filter loses most of its energy, so a
// noise burst at `peak: 0.15` came out roughly a tenth as loud as a sine tone at
// the same figure. Every level in this file would otherwise have to encode which
// kind of source it was describing. This makes up the difference once, so `peak`
// and bed `gain` mean the same thing everywhere and the mix can be reasoned
// about from the numbers alone.
const NOISE_MAKEUP = 8;

let context = null;
let master = null;
let ambienceBus = null;
let cueBus = null;
let noiseBuffer = null;
let started = false;
let unavailable = false;
let settings = { muted: false, volume: 0.7 };
let beds = null;
let scheduler = null;
let ambienceState = { zone: null, daylight: 1, nearWater: 0 };

function now() {
  return context ? context.currentTime : 0;
}

// Two seconds of white noise, reused by every wind, water, footstep and rustle
// in the game. Regenerating it per cue would be the single most expensive thing
// the audio does, and no one can hear the repeat under a filter this heavy.
function getNoiseBuffer() {
  if (noiseBuffer) return noiseBuffer;
  const length = context.sampleRate * 2;
  noiseBuffer = context.createBuffer(1, length, context.sampleRate);
  const channel = noiseBuffer.getChannelData(0);
  for (let index = 0; index < length; index += 1) channel[index] = Math.random() * 2 - 1;
  return noiseBuffer;
}

function noiseSource(loop = false) {
  const source = context.createBufferSource();
  source.buffer = getNoiseBuffer();
  source.loop = loop;
  return source;
}

// A looping band of filtered noise with a slow gain drift. This is the whole
// basis of the wind, water and cricket beds; only the filter and the drift rate
// tell them apart.
function createBed({ type = 'lowpass', frequency = 400, Q = 0.7, gain = 0, driftRate = 0.07, driftDepth = 0.35 }) {
  const source = noiseSource(true);
  const filter = context.createBiquadFilter();
  filter.type = type;
  filter.frequency.value = frequency;
  filter.Q.value = Q;
  const level = context.createGain();
  level.gain.value = gain;

  // The drift is an LFO on gain rather than a random walk on the main thread:
  // it costs nothing per frame and never stalls when the tab is throttled.
  //
  // Connecting a signal to an AudioParam ADDS to it rather than scaling it, so
  // the depth has to be held as a fraction of the bed's current level and moved
  // whenever that level moves. Setting it as an absolute figure is what made the
  // wind swing from silence to three times its intended level on a sixteen
  // second cycle — a slow, loud whoosh over everything else.
  const drift = context.createOscillator();
  drift.frequency.value = driftRate;
  const driftAmount = context.createGain();
  driftAmount.gain.value = 0;
  drift.connect(driftAmount).connect(level.gain);

  source.connect(filter).connect(level).connect(ambienceBus);
  source.start();
  drift.start();
  return { level, filter, source, drift, driftAmount, driftDepth };
}

function rampBed(bed, rawTarget, seconds = 1.4) {
  if (!bed) return;
  const target = rawTarget * NOISE_MAKEUP;
  const constant = Math.max(0.05, seconds / 3);
  bed.level.gain.cancelScheduledValues(now());
  bed.level.gain.setTargetAtTime(target, now(), constant);
  // The modulation follows the level so the bed breathes by a proportion of
  // itself and can never swamp what it is modulating.
  bed.driftAmount.gain.cancelScheduledValues(now());
  bed.driftAmount.gain.setTargetAtTime(target * bed.driftDepth, now(), constant);
}

export function isAudioReady() {
  return started && !unavailable;
}

// Called from the first trusted gesture. Browsers will not start an AudioContext
// without one, so everything below is inert until this runs.
export function startAudio() {
  if (started || unavailable) return isAudioReady();
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    unavailable = true;
    return false;
  }
  try {
    context = new AudioContextClass();
    master = context.createGain();
    master.gain.value = settings.muted ? 0 : settings.volume * MASTER_CEILING;
    master.connect(context.destination);

    // Ambience is a floor, not a layer. It sits well under the cues so that a
    // footstep or a rustle reads over it without the bed having to duck.
    ambienceBus = context.createGain();
    ambienceBus.gain.value = 0.6;
    ambienceBus.connect(master);

    cueBus = context.createGain();
    cueBus.gain.value = 1;
    cueBus.connect(master);

    beds = {
      // Wind is rolled off hard. Noise through a gentle 380Hz slope still carries
      // most of its energy in the band that reads as hiss; at 150Hz with a
      // steeper Q it reads as air moving somewhere behind you, which is the job.
      // Drift depth is a fraction of the bed's own level. At 0.4 the wind still
      // varied by 7dB across its cycle, which reads as a swell rather than as
      // air; 0.2 is about 3dB and sits still enough to forget about.
      wind: createBed({ frequency: 150, Q: 1.4, driftRate: 0.05, driftDepth: 0.2 }),
      water: createBed({ type: 'bandpass', frequency: 620, Q: 1.3, driftRate: 0.09, driftDepth: 0.24 }),
      night: createBed({ type: 'bandpass', frequency: 2600, Q: 6.5, driftRate: 0.8, driftDepth: 0.45 }),
      room: createBed({ frequency: 140, Q: 0.7, driftRate: 0.04, driftDepth: 0.25 })
    };
    started = true;
    applyAmbience(0.6);
    return true;
  } catch (error) {
    unavailable = true;
    console.warn('Field audio unavailable; running silent.', error);
    return false;
  }
}

export function resumeAudio() {
  if (!started) {
    startAudio();
    return;
  }
  if (context?.state === 'suspended') context.resume().catch(() => {});
}

export function setAudioSettings(next = {}) {
  settings = { ...settings, ...next };
  settings.volume = Math.min(1, Math.max(0, Number(settings.volume) || 0));
  if (!started) return settings;
  master.gain.setTargetAtTime(settings.muted ? 0 : settings.volume * MASTER_CEILING, now(), 0.05);
  return settings;
}

export function getAudioSettings() {
  return { ...settings };
}

// ---------------------------------------------------------------------------
// Ambience
// ---------------------------------------------------------------------------

// Bed levels, before the ambience bus takes another two thirds off. These are
// meant to be noticed only when they stop.
const ZONE_AMBIENCE = {
  store:  { wind: 0.015, room: 0.045, water: 0.00 },
  forest: { wind: 0.050, room: 0.012, water: 0.00 },
  zoo:    { wind: 0.036, room: 0.020, water: 0.00 },
  lake:   { wind: 0.062, room: 0.008, water: 0.00 }
};

function applyAmbience(fade = 1.4) {
  if (!isAudioReady()) return;
  const profile = ZONE_AMBIENCE[ambienceState.zone] || ZONE_AMBIENCE.forest;
  const night = 1 - ambienceState.daylight;
  rampBed(beds.wind, profile.wind * (0.7 + ambienceState.daylight * 0.4), fade);
  rampBed(beds.room, profile.room, fade);
  // Water only exists near water. The caller passes a 0..1 proximity so the
  // lapping comes up as you walk down to a shore rather than switching on.
  rampBed(beds.water, ambienceState.nearWater * 0.05, fade);
  // Crickets are the night bed, and they are the loudest single cue that the
  // clock has moved — worth more than any amount of extra wind.
  rampBed(beds.night, night * night * 0.022, fade);
}

export function setZoneAmbience(zone) {
  if (ambienceState.zone === zone) return;
  ambienceState.zone = zone;
  applyAmbience(1.8);
  if (isAudioReady()) restartScheduler();
}

// Daylight and shore proximity change continuously, so this is called from the
// frame loop and only does work when a value has actually moved.
export function setAmbienceConditions({ daylight, nearWater }) {
  let changed = false;
  if (typeof daylight === 'number' && Math.abs(daylight - ambienceState.daylight) > 0.02) {
    ambienceState.daylight = daylight;
    changed = true;
  }
  if (typeof nearWater === 'number' && Math.abs(nearWater - ambienceState.nearWater) > 0.05) {
    ambienceState.nearWater = nearWater;
    changed = true;
  }
  if (changed) applyAmbience(2.2);
}

// ---------------------------------------------------------------------------
// Intermittent wildlife
//
// Birds by day, owls and frogs after dark, all on a self-rescheduling timer
// rather than the frame loop, so they keep their own rhythm and cost nothing
// while nothing is due.
// ---------------------------------------------------------------------------

function chirp(baseFrequency, length, sweep) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(baseFrequency, now());
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(60, baseFrequency * sweep), now() + length);
  gain.gain.setValueAtTime(0.0001, now());
  gain.gain.exponentialRampToValueAtTime(0.16, now() + length * 0.2);
  gain.gain.exponentialRampToValueAtTime(0.0001, now() + length);
  oscillator.connect(gain).connect(ambienceBus);
  oscillator.start();
  oscillator.stop(now() + length + 0.05);
}

function birdCall() {
  const notes = 2 + Math.floor(Math.random() * 3);
  const base = 1500 + Math.random() * 1400;
  for (let index = 0; index < notes; index += 1) {
    window.setTimeout(() => {
      if (isAudioReady()) chirp(base * (0.9 + Math.random() * 0.35), 0.07 + Math.random() * 0.05, 1.35);
    }, index * (55 + Math.random() * 60));
  }
}

function owlCall() {
  const base = 320 + Math.random() * 60;
  chirp(base, 0.34, 0.82);
  window.setTimeout(() => { if (isAudioReady()) chirp(base * 0.94, 0.42, 0.78); }, 420);
}

function frogCall() {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = 'sawtooth';
  oscillator.frequency.value = 150 + Math.random() * 50;
  const filter = context.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 620;
  gain.gain.setValueAtTime(0.0001, now());
  gain.gain.exponentialRampToValueAtTime(0.1, now() + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.0001, now() + 0.2);
  oscillator.connect(filter).connect(gain).connect(ambienceBus);
  oscillator.start();
  oscillator.stop(now() + 0.25);
}

function restartScheduler() {
  window.clearTimeout(scheduler);
  const tick = () => {
    if (!isAudioReady()) return;
    const night = 1 - ambienceState.daylight;
    const outdoors = ambienceState.zone !== 'store';
    if (outdoors) {
      if (night > 0.6) {
        if (Math.random() < 0.4) owlCall();
        else if (ambienceState.nearWater > 0.3) frogCall();
      } else if (ambienceState.daylight > 0.45 && Math.random() < 0.75) {
        birdCall();
      }
    }
    scheduler = window.setTimeout(tick, 2600 + Math.random() * 6500);
  };
  scheduler = window.setTimeout(tick, 1200 + Math.random() * 2500);
}

// ---------------------------------------------------------------------------
// One-shot cues
// ---------------------------------------------------------------------------

// Where the next cue's nodes attach. Every recipe below is synchronous, so
// pointing this at a placed chain, running one recipe and pointing it back is
// enough to position a sound without threading a destination through all of them.
let cueTarget = null;

function envelope(target, peak, attack, decay) {
  target.gain.setValueAtTime(0.0001, now());
  target.gain.exponentialRampToValueAtTime(Math.max(0.0001, peak), now() + attack);
  target.gain.exponentialRampToValueAtTime(0.0001, now() + attack + decay);
}

function tone({ frequency, type = 'sine', peak = 0.2, attack = 0.005, decay = 0.2, sweepTo = null, delay = 0 }) {
  const start = now() + delay;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  if (sweepTo) oscillator.frequency.exponentialRampToValueAtTime(Math.max(30, sweepTo), start + attack + decay);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, peak), start + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + attack + decay);
  oscillator.connect(gain).connect(cueTarget || cueBus);
  oscillator.start(start);
  oscillator.stop(start + attack + decay + 0.05);
}

function noiseBurst({ frequency = 1200, Q = 1, type = 'bandpass', peak = 0.2, attack = 0.005, decay = 0.12, sweepTo = null, delay = 0 }) {
  const start = now() + delay;
  const source = noiseSource(false);
  const filter = context.createBiquadFilter();
  filter.type = type;
  filter.frequency.setValueAtTime(frequency, start);
  filter.Q.value = Q;
  if (sweepTo) filter.frequency.exponentialRampToValueAtTime(Math.max(60, sweepTo), start + attack + decay);
  const gain = context.createGain();
  const level = Math.max(0.0001, peak * NOISE_MAKEUP);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(level, start + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + attack + decay);
  source.connect(filter).connect(gain).connect(cueTarget || cueBus);
  source.start(start);
  source.stop(start + attack + decay + 0.05);
}

// Each cue is a recipe rather than a file. Keeping them in one table makes the
// palette legible: everything the game can say, in one place.
const CUES = {
  // A footfall is a soft thud with a little grit on top. Two layers rather than
  // one filtered burst, because a single band reads as a click at this length.
  step:        () => { noiseBurst({ frequency: 300 + Math.random() * 120, Q: 1.1, peak: 0.26, decay: 0.085 }); tone({ frequency: 92 + Math.random() * 18, type: 'sine', peak: 0.16, decay: 0.075 }); },
  stepSneak:   () => { noiseBurst({ frequency: 230 + Math.random() * 70, Q: 1.5, peak: 0.10, decay: 0.1 }); tone({ frequency: 74, type: 'sine', peak: 0.06, decay: 0.09 }); },
  stepDock:    () => { noiseBurst({ frequency: 200, Q: 2.2, peak: 0.24, decay: 0.11 }); tone({ frequency: 140, type: 'sine', peak: 0.18, decay: 0.13 }); },
  jump:        () => noiseBurst({ frequency: 500, Q: 1.1, peak: 0.05, decay: 0.1, sweepTo: 900 }),
  land:        () => { noiseBurst({ frequency: 240, Q: 1.2, peak: 0.09, decay: 0.13 }); tone({ frequency: 110, peak: 0.06, decay: 0.12 }); },

  cast:        () => noiseBurst({ frequency: 500, Q: 0.8, peak: 0.16, attack: 0.05, decay: 0.34, sweepTo: 2600 }),
  bobber:      () => { tone({ frequency: 620, peak: 0.16, attack: 0.004, decay: 0.14, sweepTo: 180 }); noiseBurst({ frequency: 1400, Q: 2, peak: 0.07, decay: 0.16 }); },
  bite:        () => { tone({ frequency: 440, peak: 0.2, decay: 0.1, sweepTo: 180 }); tone({ frequency: 660, peak: 0.14, decay: 0.14, delay: 0.06 }); },
  hookSet:     () => { tone({ frequency: 220, type: 'triangle', peak: 0.22, decay: 0.18, sweepTo: 130 }); noiseBurst({ frequency: 2200, Q: 3, peak: 0.1, decay: 0.1 }); },
  reelClick:   () => noiseBurst({ frequency: 2600, Q: 6, peak: 0.05, decay: 0.035 }),
  lineSnap:    () => { noiseBurst({ frequency: 3200, Q: 2, peak: 0.16, decay: 0.16, sweepTo: 400 }); tone({ frequency: 180, peak: 0.1, decay: 0.2, sweepTo: 70 }); },
  catch:       () => [0, 0.09, 0.18].forEach((delay, index) => tone({ frequency: [523, 659, 880][index], type: 'triangle', peak: 0.17, attack: 0.008, decay: 0.3, delay })),

  net:         () => noiseBurst({ frequency: 1800, Q: 0.7, peak: 0.13, attack: 0.02, decay: 0.22, sweepTo: 600 }),
  pickup:      () => { tone({ frequency: 700, type: 'triangle', peak: 0.15, decay: 0.12 }); tone({ frequency: 1050, type: 'triangle', peak: 0.12, decay: 0.16, delay: 0.07 }); },
  build:       () => { noiseBurst({ frequency: 300, Q: 2.2, peak: 0.16, decay: 0.14 }); tone({ frequency: 190, type: 'triangle', peak: 0.12, decay: 0.2, delay: 0.05 }); },
  gate:        () => noiseBurst({ frequency: 700, Q: 7, peak: 0.09, attack: 0.06, decay: 0.42, sweepTo: 340 }),
  coins:       () => [0, 0.05, 0.11].forEach((delay) => noiseBurst({ frequency: 3200 + Math.random() * 900, Q: 8, peak: 0.09, decay: 0.13, delay })),
  cook:        () => noiseBurst({ frequency: 900, Q: 0.6, peak: 0.09, attack: 0.15, decay: 0.7 }),
  engine:      () => { tone({ frequency: 90, type: 'sawtooth', peak: 0.12, attack: 0.1, decay: 0.7, sweepTo: 130 }); noiseBurst({ frequency: 340, Q: 1.4, peak: 0.07, attack: 0.12, decay: 0.6 }); },

  // --- Wildlife movement ---
  // Placed with playCueAt, so these are heard from wherever the animal is. Kept
  // short and dry: they have to survive being panned and rolled off at distance
  // and still read as one creature rather than a texture.
  rustle:      () => noiseBurst({ frequency: 1500 + Math.random() * 1100, Q: 0.8, peak: 0.28, attack: 0.012, decay: 0.14, sweepTo: 600 }),
  scamper:     () => [0, 0.07, 0.13].forEach((delay) => noiseBurst({ frequency: 900 + Math.random() * 500, Q: 1.6, peak: 0.19, decay: 0.05, delay })),
  hop:         () => { noiseBurst({ frequency: 700, Q: 1.4, peak: 0.2, decay: 0.07 }); tone({ frequency: 120, type: 'sine', peak: 0.09, decay: 0.09 }); },
  wingbeat:    () => [0, 0.11, 0.22].forEach((delay) => noiseBurst({ frequency: 320, Q: 1.1, peak: 0.23, attack: 0.02, decay: 0.09, sweepTo: 150, delay })),
  flutter:     () => [0, 0.06, 0.12, 0.18].forEach((delay) => noiseBurst({ frequency: 520, Q: 2.2, peak: 0.05, attack: 0.01, decay: 0.05, delay })),
  paddle:      () => noiseBurst({ frequency: 480, Q: 1.1, peak: 0.11, attack: 0.02, decay: 0.19, sweepTo: 200 }),
  splash:      () => { noiseBurst({ frequency: 1100, Q: 0.7, peak: 0.2, attack: 0.006, decay: 0.28, sweepTo: 340 }); tone({ frequency: 300, peak: 0.1, decay: 0.16, sweepTo: 120 }); },
  surface:     () => { tone({ frequency: 520, peak: 0.13, decay: 0.11, sweepTo: 170 }); noiseBurst({ frequency: 1300, Q: 1.6, peak: 0.07, decay: 0.13 }); },
  hoof:        () => { noiseBurst({ frequency: 260, Q: 2.6, peak: 0.13, decay: 0.1 }); tone({ frequency: 88, type: 'sine', peak: 0.08, decay: 0.11 }); },

  // --- Wildlife voices ---
  // Sparse by design: a call every few seconds from every animal on screen would
  // be a farmyard. These fire on state changes, not on a timer.
  chitter:     () => [0, 0.055, 0.1].forEach((delay) => tone({ frequency: 2200 + Math.random() * 700, type: 'triangle', peak: 0.17, attack: 0.005, decay: 0.05, delay })),
  quack:       () => { tone({ frequency: 420, type: 'sawtooth', peak: 0.22, attack: 0.01, decay: 0.14, sweepTo: 300 }); tone({ frequency: 380, type: 'sawtooth', peak: 0.17, decay: 0.12, sweepTo: 260, delay: 0.17 }); },
  croak:       () => tone({ frequency: 165, type: 'sawtooth', peak: 0.22, attack: 0.015, decay: 0.19, sweepTo: 120 }),
  hoot:        () => { tone({ frequency: 330, peak: 0.2, attack: 0.03, decay: 0.3, sweepTo: 280 }); tone({ frequency: 310, peak: 0.16, attack: 0.03, decay: 0.34, sweepTo: 265, delay: 0.4 }); },
  bark:        () => { noiseBurst({ frequency: 800, Q: 1.5, peak: 0.2, decay: 0.1, sweepTo: 300 }); tone({ frequency: 210, type: 'sawtooth', peak: 0.16, decay: 0.12, sweepTo: 150 }); },
  spooked:     () => { noiseBurst({ frequency: 2000, Q: 1.1, peak: 0.2, attack: 0.008, decay: 0.2, sweepTo: 700 }); tone({ frequency: 900, type: 'triangle', peak: 0.08, decay: 0.14, sweepTo: 1500 }); },

  ui:          () => tone({ frequency: 880, type: 'triangle', peak: 0.07, decay: 0.05 }),
  success:     () => { tone({ frequency: 660, type: 'triangle', peak: 0.14, decay: 0.14 }); tone({ frequency: 990, type: 'triangle', peak: 0.11, decay: 0.2, delay: 0.08 }); },
  warning:     () => tone({ frequency: 330, type: 'square', peak: 0.09, decay: 0.16 }),
  denied:      () => { tone({ frequency: 200, type: 'square', peak: 0.1, decay: 0.14 }); tone({ frequency: 150, type: 'square', peak: 0.09, decay: 0.2, delay: 0.09 }); },
  journal:     () => noiseBurst({ frequency: 2400, Q: 1.2, peak: 0.07, attack: 0.01, decay: 0.16, sweepTo: 900 }),
  objective:   () => [0, 0.1, 0.2, 0.32].forEach((delay, index) => tone({ frequency: [523, 659, 784, 1047][index], type: 'triangle', peak: 0.15, attack: 0.01, decay: 0.34, delay }))
};

export function playCue(name, { throttleMs = 0 } = {}) {
  if (!isAudioReady() || settings.muted) return;
  const cue = CUES[name];
  if (!cue) return;
  if (throttleMs > 0) {
    const last = playCue.lastPlayed || (playCue.lastPlayed = new Map());
    const at = performance.now();
    if (at - (last.get(name) || -Infinity) < throttleMs) return;
    last.set(name, at);
  }
  cueCounts.set(name, (cueCounts.get(name) || 0) + 1);
  try {
    cue();
  } catch (error) {
    // A cue that fails must never take a frame down with it.
  }
}

// A cue somewhere out in the field rather than in the player's hands. Distance
// sets the level and rolls the top off — far things are dull as well as quiet —
// and the pan is the listener's own left/right, so an animal breaking cover
// tells you which way to turn. This is the whole point of hearing wildlife:
// not decoration, but a second channel for where things are.
// Counts what actually reaches the mix, per cue. Written from inside the module
// so it sees every caller, which a wrapper on an exported reference does not.
const cueCounts = new Map();

export function getCueCounts() {
  return Object.fromEntries(cueCounts);
}

export function resetCueCounts() {
  cueCounts.clear();
}

export function playCueAt(name, { distance = 0, maxDistance = 26, pan = 0, gain = 1, throttleMs = 0 } = {}) {
  if (!isAudioReady() || settings.muted) return;
  if (distance >= maxDistance) return;
  const cue = CUES[name];
  if (!cue) return;
  if (throttleMs > 0) {
    const last = playCueAt.lastPlayed || (playCueAt.lastPlayed = new Map());
    const at = performance.now();
    if (at - (last.get(name) || -Infinity) < throttleMs) return;
    last.set(name, at);
  }
  const falloff = Math.pow(1 - distance / maxDistance, 1.7);
  if (falloff <= 0.02) return;

  const placed = context.createGain();
  placed.gain.value = falloff * gain;
  const shade = context.createBiquadFilter();
  shade.type = 'lowpass';
  shade.frequency.value = 900 + falloff * 11000;
  const panner = context.createStereoPanner ? context.createStereoPanner() : null;
  if (panner) {
    panner.pan.value = Math.max(-1, Math.min(1, pan));
    placed.connect(shade).connect(panner).connect(cueBus);
  } else {
    placed.connect(shade).connect(cueBus);
  }

  cueCounts.set(name, (cueCounts.get(name) || 0) + 1);
  cueTarget = placed;
  try {
    cue();
  } catch (error) {
    // As with playCue: a cue must never take a frame down with it.
  }
  cueTarget = null;
}

// ---------------------------------------------------------------------------
// Footsteps
//
// Driven from the movement update rather than a timer, so the cadence follows
// actual travel: stop moving and the stride stops mid-step, as it should.
// ---------------------------------------------------------------------------

let stride = 0;

export function updateFootsteps({ moving, sneaking, delta, onDock = false }) {
  if (!isAudioReady()) return;
  if (!moving) {
    stride = 0.7;
    return;
  }
  stride += delta * (sneaking ? 1.5 : 2.6);
  if (stride < 1) return;
  stride -= 1;
  playCue(onDock ? 'stepDock' : sneaking ? 'stepSneak' : 'step');
}

// Lets an automated check measure what is actually reaching the speakers. The
// analyser is created on demand and left attached; nothing reads it in play.
let analyser = null;

// Silences the beds without touching the cue path, so a check can measure what a
// cue actually contributes rather than what the wind happened to be doing.
export function setAmbienceEnabled(enabled) {
  if (!isAudioReady()) return;
  ambienceBus.gain.setTargetAtTime(enabled ? 0.6 : 0, now(), 0.03);
}

export function getMixAnalyser() {
  if (!isAudioReady()) return null;
  if (!analyser) {
    analyser = context.createAnalyser();
    analyser.fftSize = 2048;
    master.connect(analyser);
  }
  return analyser;
}

export function measureMixLevel() {
  const node = getMixAnalyser();
  if (!node) return null;
  const samples = new Float32Array(node.fftSize);
  node.getFloatTimeDomainData(samples);
  let sum = 0;
  let peak = 0;
  for (const sample of samples) {
    sum += sample * sample;
    peak = Math.max(peak, Math.abs(sample));
  }
  return { rms: Math.sqrt(sum / samples.length), peak };
}

export function stopAudio() {
  window.clearTimeout(scheduler);
  scheduler = null;
}
