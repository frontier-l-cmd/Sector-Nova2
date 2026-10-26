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
// Effects (DESIGN.md 15-8): shot, hit, explode / explodeLarge, item,
// levelUp, graze, burst, alarm, bossDefeat, formChange, type (comm
// text), select, crystal, plus the stage gimmicks' thunder / flare.
//
// BGM: a small step sequencer (BGM_SONGS). Each song is note names
// written as text, one token per step (an eighth note): 'C5' plays,
// '-' holds the note before, '.' rests. Lead (square), bass
// (triangle) and drums (k kick, s snare, h hat). Notes are scheduled
// a little ahead on the AudioContext clock from Game.update().
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
  // Player hit: harsh falling square over a noise crunch.
  hit: {
    layers: [
      { wave: 'square', freq: 440, freqEnd: 70, duration: 0.3, volume: 0.18 },
      { noise: true, filter: 1500, filterEnd: 300, duration: 0.2, volume: 0.3 },
    ],
  },
  // Item pickup: quick rising triangle arpeggio.
  item: {
    layers: [
      { wave: 'triangle', freq: 660, duration: 0.05, volume: 0.2 },
      { wave: 'triangle', freq: 880, duration: 0.05, volume: 0.2, delay: 0.05 },
      { wave: 'triangle', freq: 1320, duration: 0.08, volume: 0.2, delay: 0.1 },
    ],
  },
  // Graze: very short high tick, thinned for bullet curtains.
  graze: {
    minInterval: 0.04,
    layers: [
      { wave: 'square', freq: 2400, freqEnd: 1800, duration: 0.025, volume: 0.04 },
    ],
  },
  // NOVA BURST: long noise sweep with a rising tone.
  burst: {
    layers: [
      { noise: true, filter: 400, filterEnd: 6000, duration: 0.6, volume: 0.4 },
      { wave: 'triangle', freq: 110, freqEnd: 880, duration: 0.5, volume: 0.3 },
      { wave: 'square', freq: 220, freqEnd: 1760, duration: 0.4, volume: 0.06 },
    ],
  },
  // WARNING alarm: three falling square sirens (Phase 4-1).
  alarm: {
    layers: [0, 0.55, 1.1].map(delay => (
      { wave: 'square', freq: 880, freqEnd: 440, duration: 0.45, volume: 0.12, delay }
    )),
  },
  // Lightning strike (Phase 4-3): sharp crack over a low rumble.
  thunder: {
    minInterval: 0.08,
    layers: [
      { noise: true, filter: 6000, filterEnd: 500, duration: 0.25, volume: 0.3 },
      { noise: true, filter: 300, filterEnd: 80, duration: 0.6, volume: 0.25, delay: 0.05 },
    ],
  },
  // Solar flare (Phase 5-2): a rushing roar as the flame crosses.
  flare: {
    minInterval: 0.2,
    layers: [
      { noise: true, filter: 1800, filterEnd: 200, duration: 0.7, volume: 0.28 },
    ],
  },
  // Large enemy / boss part destroyed: a deeper, longer blast.
  explodeLarge: {
    minInterval: 0.05,
    layers: [
      { noise: true, filter: 1600, filterEnd: 100, duration: 0.55, volume: 0.42 },
      { wave: 'triangle', freq: 120, freqEnd: 30, duration: 0.45, volume: 0.35 },
    ],
  },
  // Weapon level up: a bright rising run.
  levelUp: {
    layers: [523, 659, 784, 1047].map((freq, i) => (
      { wave: 'square', freq, duration: 0.06, volume: 0.09, delay: i * 0.05 }
    )),
  },
  // Boss destroyed: long rumbling blast with a falling tone.
  bossDefeat: {
    layers: [
      { noise: true, filter: 3000, filterEnd: 60, duration: 1.4, volume: 0.5 },
      { wave: 'triangle', freq: 220, freqEnd: 30, duration: 1.2, volume: 0.35 },
      { wave: 'square', freq: 880, freqEnd: 110, duration: 0.8, volume: 0.06, delay: 0.1 },
    ],
  },
  // Boss form change: a swelling sweep.
  formChange: {
    layers: [
      { wave: 'square', freq: 110, freqEnd: 880, duration: 0.9, volume: 0.07 },
      { noise: true, filter: 300, filterEnd: 3000, duration: 0.9, volume: 0.15 },
    ],
  },
  // LYRA's text typing out: a tiny tick (thinned).
  type: {
    minInterval: 0.05,
    layers: [
      { wave: 'square', freq: 1760, duration: 0.015, volume: 0.025 },
    ],
  },
  // NOVA CRYSTAL: a sparkling chime.
  crystal: {
    layers: [1047, 1319, 1568, 2093, 2637].map((freq, i) => (
      { wave: 'triangle', freq, duration: 0.18, volume: 0.16, delay: i * 0.07 }
    )),
  },
  // Two-step chime for menu cursor moves and decisions.
  select: {
    layers: [
      { wave: 'square', freq: 660, duration: 0.05, volume: 0.08 },
      { wave: 'square', freq: 990, duration: 0.07, volume: 0.08, delay: 0.05 },
    ],
  },
};

// ------------------------------------------------------------
// BGM songs (DESIGN.md 15-8). Stages share a song in pairs.
// ------------------------------------------------------------
const DRUMS_BEAT = 'k . h . s . h . ';
const DRUMS_SOFT = 'h . . . h . . . ';
const BGM_SONGS = {
  title: {
    bpm: 112, loop: true,
    lead: 'A4 . C5 E5 A5 . G5 E5  F5 . E5 D5 C5 . D5 E5  A4 . C5 E5 A5 . B5 C6  B5 . G5 . E5 - - . ',
    bass: 'A2 . A3 . A2 . A3 .  F2 . F3 . F2 . F3 .  A2 . A3 . A2 . A3 .  E2 . E3 . E2 . G#2 . ',
    drums: DRUMS_SOFT.repeat(4),
  },
  stageA: { // S1-S2
    bpm: 140, loop: true,
    lead: 'E5 . B4 E5 G5 . F#5 E5  D5 . A4 D5 F#5 . E5 D5  C5 . G4 C5 E5 . D5 C5  B4 . D#5 . F#5 . B5 .  ' +
          'E5 . B4 E5 G5 . A5 B5  C6 . B5 A5 G5 . F#5 G5  A5 . G5 F#5 E5 . D#5 E5  B4 - - . B4 . . . ',
    bass: ('E2 E3 E2 E3 E2 E3 E2 E3  D2 D3 D2 D3 D2 D3 D2 D3  C2 C3 C2 C3 C2 C3 C2 C3  B1 B2 B1 B2 B1 B2 B1 B2  ').repeat(2),
    drums: DRUMS_BEAT.repeat(8),
  },
  stageB: { // S3-S4
    bpm: 132, loop: true,
    lead: 'D5 . F5 . A5 . G5 F5  E5 . C5 . E5 . G5 .  F5 . D5 . A4 . D5 E5  F5 . E5 . C#5 - - .  ' +
          'D5 . F5 . A5 . C6 A5  Bb5 . A5 G5 F5 . E5 F5  G5 . F5 E5 D5 . C#5 D5  A4 - - . A4 . . . ',
    bass: ('D2 D3 D2 D3 D2 D3 D2 D3  C2 C3 C2 C3 C2 C3 C2 C3  Bb1 Bb2 Bb1 Bb2 Bb1 Bb2 Bb1 Bb2  A1 A2 A1 A2 A1 A2 A1 A2  ').repeat(2),
    drums: DRUMS_BEAT.repeat(8),
  },
  stageC: { // S5-S6
    bpm: 150, loop: true,
    lead: 'C5 Eb5 G5 C6 Bb5 G5 Eb5 G5  Ab5 G5 F5 Eb5 D5 Eb5 F5 G5  C5 Eb5 G5 C6 D6 C6 Bb5 G5  B5 - G5 - D5 - B4 -  ' +
          'Eb5 G5 C6 Eb6 D6 C6 Bb5 G5  Ab5 C6 Ab5 F5 Ab5 F5 C5 F5  G5 Bb5 D6 G5 F5 Eb5 D5 Eb5  C5 - - . C5 . . . ',
    bass: 'C2 C3 C2 C3 C2 C3 C2 C3  Ab1 Ab2 Ab1 Ab2 Ab1 Ab2 Ab1 Ab2  C2 C3 C2 C3 C2 C3 C2 C3  G1 G2 G1 G2 G1 G2 G1 G2  ' +
          'C2 C3 C2 C3 C2 C3 C2 C3  F1 F2 F1 F2 F1 F2 F1 F2  G1 G2 G1 G2 G1 G2 G1 G2  C2 C3 C2 C3 C2 C3 C2 C3 ',
    drums: DRUMS_BEAT.repeat(8),
  },
  boss: {
    bpm: 160, loop: true,
    lead: 'B4 . B4 C5 B4 . A#4 B4  D5 . C#5 . B4 . F#4 .  B4 . B4 C5 B4 . A#4 B4  E5 . D5 . C#5 . A#4 .  ' +
          'G5 F#5 E5 D5 C#5 D5 E5 F#5  G5 . F#5 . E5 . D5 .  F#5 E5 D5 C#5 B4 C#5 D5 E5  F#5 - - . F#4 . . . ',
    bass: 'B1 B2 B1 B2 B1 B2 B1 B2  B1 B2 B1 B2 B1 B2 B1 B2  B1 B2 B1 B2 B1 B2 B1 B2  F#1 F#2 F#1 F#2 F#1 F#2 F#1 F#2  ' +
          'G1 G2 G1 G2 G1 G2 G1 G2  E1 E2 E1 E2 E1 E2 E1 E2  B1 B2 B1 B2 B1 B2 B1 B2  F#1 F#2 F#1 F#2 F#1 F#2 F#1 F#2 ',
    drums: 'k . h k s . h . '.repeat(8),
  },
  finalBoss: {
    bpm: 168, loop: true,
    lead: 'F#4 A4 C#5 F#5 E5 C#5 A4 C#5  D5 F#5 A5 D6 C#6 A5 F#5 A5  B4 D5 F#5 B5 A5 F#5 D5 F#5  C#5 E#5 G#5 C#6 - - . .  ' +
          'F#5 . F#5 G#5 A5 . G#5 F#5  E5 . D5 . C#5 . B4 .  D5 . D5 E5 F#5 . E5 D5  C#5 - - - F#4 . . . ',
    bass: 'F#1 F#2 F#1 F#2 F#1 F#2 F#1 F#2  D1 D2 D1 D2 D1 D2 D1 D2  B0 B1 B0 B1 B0 B1 B0 B1  C#1 C#2 C#1 C#2 C#1 C#2 C#1 C#2  ' +
          'F#1 F#2 F#1 F#2 F#1 F#2 F#1 F#2  E1 E2 E1 E2 E1 E2 E1 E2  D1 D2 D1 D2 D1 D2 D1 D2  C#1 C#2 C#1 C#2 C#1 C#2 C#1 C#2 ',
    drums: 'k h k h s h k h '.repeat(8),
  },
  stageClear: { // jingle
    bpm: 150, loop: false,
    lead: 'C5 E5 G5 C6 . G5 C6 - - - - . ',
    bass: 'C3 . G2 . C3 . F2 . G2 - C3 - ',
    drums: 'k . . . k . s . k - - . ',
  },
  gameOver: { // jingle
    bpm: 90, loop: false,
    lead: 'E5 D5 C5 B4 A4 - G#4 - A4 - - - ',
    bass: 'A2 . . . F2 . E2 . A1 - - - ',
    drums: '',
  },
  ending: {
    bpm: 96, loop: true,
    lead: 'F5 . A5 . C6 . A5 .  Bb5 . A5 . G5 . F5 .  E5 . G5 . C6 . Bb5 .  A5 - - . G5 - - .  ' +
          'F5 . A5 . C6 . D6 .  C6 . A5 . F5 . G5 .  A5 . G5 . E5 . C5 .  F5 - - - - - . . ',
    bass: 'F2 . C3 . F2 . C3 .  Bb1 . F2 . Bb1 . F2 .  C2 . G2 . C2 . G2 .  F2 . C3 . F2 . C3 .  ' +
          'F2 . C3 . F2 . C3 .  Bb1 . F2 . Bb1 . F2 .  C2 . G2 . C2 . G2 .  F2 . C3 . F2 . . . ',
    drums: DRUMS_SOFT.repeat(8),
  },
};

const NOTE_INDEX = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/** 'A4' / 'C#5' / 'Bb3' / 'E#5' -> Hz (null for anything else). */
function noteFrequency(name) {
  const m = /^([A-G])([#b]?)(-?\d)$/.exec(name);
  if (!m) return null;
  const semis = NOTE_INDEX[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
  const midi = (Number(m[3]) + 1) * 12 + semis;
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/** Split a song's voices into token arrays (once). */
function compileSong(song) {
  const split = (text) => (text || '').trim().split(/\s+/).filter(Boolean);
  const voices = { lead: split(song.lead), bass: split(song.bass), drums: split(song.drums) };
  const length = Math.max(voices.lead.length, voices.bass.length, voices.drums.length);
  return { ...song, voices, length, stepTime: 60 / song.bpm / 2 };
}

class AudioManager {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.sfxBus = null;
    this.bgmBus = null;
    this.noiseBuffer = null;
    this.muted = loadSavedBool(SAVE_KEYS.MUTED);
    this.lastPlayed = {};
    this.musicName = null;     // requested BGM (kept until the context exists)
    this.music = null;         // { song, step, nextTime } while playing
    this.songs = {};
    for (const key in BGM_SONGS) this.songs[key] = compileSong(BGM_SONGS[key]);
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

    if (this.musicName) this.startMusic(this.musicName);
  }

  // --- BGM -----------------------------------------------------------

  /** Switch to a BGM_SONGS track (null = silence). Same track: no restart. */
  playMusic(name) {
    if (name === this.musicName && (this.music || !this.ctx)) return;
    this.musicName = name;
    if (this.ctx) this.startMusic(name);
  }

  stopMusic() {
    this.musicName = null;
    this.music = null;
  }

  startMusic(name) {
    const song = this.songs[name];
    this.music = song ? { song, step: 0, nextTime: this.ctx.currentTime + 0.05 } : null;
  }

  /** Called every frame: schedule the steps due in the next moment. */
  updateMusic() {
    const m = this.music;
    if (!this.ctx || !m) return;
    const now = this.ctx.currentTime;
    if (m.nextTime < now - 0.2) m.nextTime = now + 0.02; // tab was hidden: skip ahead
    while (m.nextTime < now + BGM_LOOKAHEAD) {
      this.playStep(m.song, m.step, m.nextTime);
      m.nextTime += m.song.stepTime;
      if (++m.step >= m.song.length) {
        if (!m.song.loop) {
          this.music = null;
          return;
        }
        m.step = 0;
      }
    }
  }

  playStep(song, step, t) {
    const v = song.voices;
    const held = (tokens) => {
      let n = 1;
      while (tokens[step + n] === '-') n++;
      return n * song.stepTime * 0.92;
    };
    const lead = noteFrequency(v.lead[step] || '');
    if (lead) this.playNote('square', lead, t, held(v.lead), BGM_LEAD_VOLUME);
    const bass = noteFrequency(v.bass[step] || '');
    if (bass) this.playNote('triangle', bass, t, held(v.bass), BGM_BASS_VOLUME);
    switch (v.drums[step]) {
      case 'k': this.playDrum({ wave: 'triangle', freq: 150, freqEnd: 40, duration: 0.12, volume: BGM_DRUM_VOLUME * 1.6 }, t); break;
      case 's': this.playDrum({ noise: true, filter: 3000, filterEnd: 800, duration: 0.12, volume: BGM_DRUM_VOLUME }, t); break;
      case 'h': this.playDrum({ noise: true, filter: 9000, duration: 0.03, volume: BGM_DRUM_VOLUME * 0.5 }, t); break;
    }
  }

  /** A sustained note on the BGM bus: short attack, held, quick release. */
  playNote(wave, freq, t, duration, volume) {
    const osc = this.ctx.createOscillator();
    osc.type = wave;
    osc.frequency.setValueAtTime(freq, t);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(volume, t + 0.01);
    gain.gain.setValueAtTime(volume, t + Math.max(0.01, duration - 0.04));
    gain.gain.linearRampToValueAtTime(0.0001, t + duration);
    gain.connect(this.bgmBus);
    osc.connect(gain);
    osc.start(t);
    osc.stop(t + duration + 0.02);
  }

  /** Drums reuse the effect voices, on the BGM bus. */
  playDrum(layer, t) {
    if (layer.noise) this.playNoise(layer, t, this.bgmBus);
    else this.playTone(layer, t, this.bgmBus);
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

  playTone(layer, t, bus) {
    const osc = this.ctx.createOscillator();
    osc.type = layer.wave;
    osc.frequency.setValueAtTime(layer.freq, t);
    if (layer.freqEnd) {
      osc.frequency.exponentialRampToValueAtTime(layer.freqEnd, t + layer.duration);
    }
    const gain = this.envelope(layer, t, bus);
    osc.connect(gain);
    osc.start(t);
    osc.stop(t + layer.duration + 0.02);
  }

  playNoise(layer, t, bus) {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(layer.filter, t);
    if (layer.filterEnd) {
      filter.frequency.exponentialRampToValueAtTime(layer.filterEnd, t + layer.duration);
    }
    const gain = this.envelope(layer, t, bus);
    src.connect(filter);
    filter.connect(gain);
    src.start(t);
    src.stop(t + layer.duration + 0.02);
  }

  /** Gain node with an instant attack and exponential decay into the bus (default: sfx). */
  envelope(layer, t, bus) {
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(layer.volume, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + layer.duration);
    gain.connect(bus || this.sfxBus);
    return gain;
  }
}
