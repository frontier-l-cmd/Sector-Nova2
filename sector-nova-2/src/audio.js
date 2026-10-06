// ============================================================
// SECTOR NOVA 2 - Audio (Web Audio API, no sound files)
// ------------------------------------------------------------
// Every sound is generated from square / triangle waves and noise.
//
//  - The AudioContext is created on the first key or pointer input
//    (browser autoplay policy). Until then play() is silently ignored.
//  - Routing: sfx bus + bgm bus -> master -> speakers.
//  - M toggles mute; the setting is saved.
//
// Phase 1 skeleton: three test effects (shot / explode / select).
// The full effect list and the BGM step sequencer come later.
// ============================================================

// Each effect is a list of layers played together. A layer is either
// a tone ({ wave, freq, freqEnd? }) or filtered noise ({ noise, filter,
// filterEnd? }), with duration (s), volume, and optional delay (s).
const SFX_DEFS = {
  // Short, quiet blip; thinned so rapid fire does not drown the mix.
  shot: {
    minInterval: AUDIO_SHOT_MIN_INTERVAL,
    layers: [
      { wave: 'square', freq: 1320, freqEnd: 660, duration: 0.04, volume: 0.05 },
    ],
  },
  // Noise burst with a falling thump for destroyed enemies. Kills in
  // the same instant (a piercing laser) share one sound.
  explode: {
    minInterval: 0.03,
    layers: [
      { noise: true, filter: 2400, filterEnd: 200, duration: 0.28, volume: 0.35 },
      { wave: 'triangle', freq: 180, freqEnd: 40, duration: 0.22, volume: 0.3 },
    ],
  },
  // Two-step chime for menu cursor moves and decisions.
  select: {
    layers: [
      { wave: 'square', freq: 660, duration: 0.05, volume: 0.08 },
      { wave: 'square', freq: 990, duration: 0.07, volume: 0.08, delay: 0.05 },
    ],
  },
};

class AudioManager {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.sfxBus = null;
    this.bgmBus = null;
    this.noiseBuffer = null;
    this.muted = loadSavedBool(SAVE_KEYS.MUTED);
    this.lastPlayed = {};
    this.supported = !!(window.AudioContext || window.webkitAudioContext);

    // Create (or resume) the context from inside a user gesture.
    const unlock = () => this.unlock();
    window.addEventListener('keydown', unlock);
    window.addEventListener('pointerdown', unlock);
  }

  get ready() {
    return !!this.ctx;
  }

  unlock() {
    if (!this.supported) return;
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new Ctx();
    } catch (e) {
      this.supported = false;
      return;
    }

    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : AUDIO_MASTER_VOLUME;
    this.master.connect(this.ctx.destination);

    this.sfxBus = this.ctx.createGain();
    this.sfxBus.gain.value = AUDIO_SFX_VOLUME;
    this.sfxBus.connect(this.master);

    this.bgmBus = this.ctx.createGain();
    this.bgmBus.gain.value = AUDIO_BGM_VOLUME;
    this.bgmBus.connect(this.master);

    // One second of white noise, reused by every noise layer.
    const length = this.ctx.sampleRate;
    this.noiseBuffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
    const data = this.noiseBuffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  }

  setMuted(muted) {
    this.muted = !!muted;
    saveBool(SAVE_KEYS.MUTED, this.muted);
    if (this.master) {
      this.master.gain.setValueAtTime(this.muted ? 0 : AUDIO_MASTER_VOLUME, this.ctx.currentTime);
    }
  }

  toggleMute() {
    this.setMuted(!this.muted);
  }

  /**
   * Play a sound effect from SFX_DEFS by name.
   */
  play(name) {
    if (!this.ctx || this.muted) return;
    const def = SFX_DEFS[name];
    if (!def) return;

    const now = this.ctx.currentTime;
    if (def.minInterval && now - (this.lastPlayed[name] ?? -Infinity) < def.minInterval) return;
    this.lastPlayed[name] = now;

    for (const layer of def.layers) {
      const t = now + (layer.delay || 0);
      if (layer.noise) this.playNoise(layer, t);
      else this.playTone(layer, t);
    }
  }

  playTone(layer, t) {
    const osc = this.ctx.createOscillator();
    osc.type = layer.wave;
    osc.frequency.setValueAtTime(layer.freq, t);
    if (layer.freqEnd) {
      osc.frequency.exponentialRampToValueAtTime(layer.freqEnd, t + layer.duration);
    }
    const gain = this.envelope(layer, t);
    osc.connect(gain);
    osc.start(t);
    osc.stop(t + layer.duration + 0.02);
  }

  playNoise(layer, t) {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(layer.filter, t);
    if (layer.filterEnd) {
      filter.frequency.exponentialRampToValueAtTime(layer.filterEnd, t + layer.duration);
    }
    const gain = this.envelope(layer, t);
    src.connect(filter);
    filter.connect(gain);
    src.start(t);
    src.stop(t + layer.duration + 0.02);
  }

  /** Gain node with an instant attack and exponential decay into the sfx bus. */
  envelope(layer, t) {
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(layer.volume, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + layer.duration);
    gain.connect(this.sfxBus);
    return gain;
  }
}
