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
function createBed({ type = 'lowpass', frequency = 400, Q = 0.7, gain = 0, driftRate = 0.07, driftDepth = 0.4 }) {
  const source = noiseSource(true);
  const filter = context.createBiquadFilter();
  filter.type = type;
  filter.frequency.value = frequency;
  filter.Q.value = Q;
  const level = context.createGain();
  level.gain.value = gain;

  // The drift is an LFO on gain rather than a random walk on the main thread:
  // it costs nothing per frame and never stalls when the tab is throttled.
  const drift = context.createOscillator();
  drift.frequency.value = driftRate;
  const driftAmount = context.createGain();
  driftAmount.gain.value = driftDepth;
  drift.connect(driftAmount).connect(level.gain);

  source.connect(filter).connect(level).connect(ambienceBus);
  source.start();
  drift.start();
  return { level, filter, source, drift };
}

function rampBed(bed, target, seconds = 1.4) {
  if (!bed) return;
  bed.level.gain.cancelScheduledValues(now());
  bed.level.gain.setTargetAtTime(target, now(), Math.max(0.05, seconds / 3));
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

    ambienceBus = context.createGain();
    ambienceBus.gain.value = 0.9;
    ambienceBus.connect(master);

    cueBus = context.createGain();
    cueBus.gain.value = 1;
    cueBus.connect(master);

    beds = {
      wind: createBed({ frequency: 380, Q: 0.6, driftRate: 0.06, driftDepth: 0.5 }),
      water: createBed({ type: 'bandpass', frequency: 760, Q: 0.9, driftRate: 0.11, driftDepth: 0.45 }),
      night: createBed({ type: 'bandpass', frequency: 2600, Q: 5.5, driftRate: 0.9, driftDepth: 0.6 }),
      room: createBed({ frequency: 180, Q: 0.5, driftRate: 0.04, driftDepth: 0.3 })
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

const ZONE_AMBIENCE = {
  store:  { wind: 0.05, room: 0.10, water: 0.00 },
  forest: { wind: 0.16, room: 0.03, water: 0.00 },
  zoo:    { wind: 0.11, room: 0.05, water: 0.00 },
  lake:   { wind: 0.20, room: 0.02, water: 0.00 }
};

function applyAmbience(fade = 1.4) {
  if (!isAudioReady()) return;
  const profile = ZONE_AMBIENCE[ambienceState.zone] || ZONE_AMBIENCE.forest;
  const night = 1 - ambienceState.daylight;
  rampBed(beds.wind, profile.wind * (0.65 + ambienceState.daylight * 0.5), fade);
  rampBed(beds.room, profile.room, fade);
  // Water only exists near water. The caller passes a 0..1 proximity so the
  // lapping comes up as you walk down to a shore rather than switching on.
  rampBed(beds.water, ambienceState.nearWater * 0.16, fade);
  // Crickets are the night bed, and they are the loudest single cue that the
  // clock has moved — worth more than any amount of extra wind.
  rampBed(beds.night, night * night * 0.05, fade);
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
  oscillator.connect(gain).connect(cueBus);
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
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, peak), start + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + attack + decay);
  source.connect(filter).connect(gain).connect(cueBus);
  source.start(start);
  source.stop(start + attack + decay + 0.05);
}

// Each cue is a recipe rather than a file. Keeping them in one table makes the
// palette legible: everything the game can say, in one place.
const CUES = {
  step:        () => noiseBurst({ frequency: 380 + Math.random() * 160, Q: 1.4, peak: 0.06, decay: 0.075 }),
  stepSneak:   () => noiseBurst({ frequency: 260 + Math.random() * 90, Q: 1.6, peak: 0.022, decay: 0.09 }),
  stepDock:    () => { noiseBurst({ frequency: 220, Q: 2.4, peak: 0.07, decay: 0.1 }); tone({ frequency: 150, type: 'sine', peak: 0.05, decay: 0.09 }); },
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
  try {
    cue();
  } catch (error) {
    // A cue that fails must never take a frame down with it.
  }
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

export function stopAudio() {
  window.clearTimeout(scheduler);
  scheduler = null;
}
