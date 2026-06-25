import { STORAGE_KEYS } from '../config/Constants';
import { Diagnostics } from './Diagnostics';

/** Music track keys (files in public/assets). */
export const MUSIC = {
  MENU: 'menu',
  GAME: 'bgmusic'
} as const;

/**
 * A seamlessly-looping music voice.
 *
 * MP3 looping normally has an audible gap (encoder padding) and an obvious
 * restart. Instead we schedule overlapping copies of the buffer: each copy fades
 * out over its last `xf` seconds while the next copy fades in over its first
 * `xf` seconds, so the loop point is a cross-dissolve — you never hear it restart.
 */
class MusicTrack {
  private stopped = false;
  private timer: number | null = null;
  private voices: { src: AudioBufferSourceNode; gain: GainNode }[] = [];
  private xf: number;

  constructor(
    private ctx: AudioContext,
    private bus: GainNode,
    private buffer: AudioBuffer,
    fadeIn: number
  ) {
    this.xf = Math.min(1.2, buffer.duration * 0.08);
    this.scheduleVoice(ctx.currentTime + 0.06, fadeIn);
  }

  private scheduleVoice(when: number, fadeIn: number): void {
    if (this.stopped) return;
    const { ctx, bus, buffer, xf } = this;
    const dur = buffer.duration;

    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const gain = ctx.createGain();
    src.connect(gain);
    gain.connect(bus);

    // Fade in, hold, then fade out over the final `xf` seconds.
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.linearRampToValueAtTime(1, when + Math.max(0.02, fadeIn));
    gain.gain.setValueAtTime(1, Math.max(when + fadeIn, when + dur - xf));
    gain.gain.linearRampToValueAtTime(0.0001, when + dur);

    src.start(when);
    src.stop(when + dur + 0.05);
    const voice = { src, gain };
    this.voices.push(voice);
    src.onended = () => {
      const i = this.voices.indexOf(voice);
      if (i >= 0) this.voices.splice(i, 1);
    };

    // Start the next copy `xf` seconds before this one ends → overlapping cross-dissolve.
    const nextWhen = when + dur - xf;
    const delayMs = Math.max(0, (nextWhen - ctx.currentTime - 0.5) * 1000);
    this.timer = window.setTimeout(() => this.scheduleVoice(nextWhen, xf), delayMs);
  }

  stop(fadeOut: number): void {
    this.stopped = true;
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    const now = this.ctx.currentTime;
    for (const { src, gain } of this.voices) {
      try {
        gain.gain.cancelScheduledValues(now);
        gain.gain.setValueAtTime(Math.max(0.0001, gain.gain.value), now);
        gain.gain.linearRampToValueAtTime(0.0001, now + fadeOut);
        src.stop(now + fadeOut + 0.05);
      } catch {
        /* already stopped */
      }
    }
    this.voices = [];
  }
}

/**
 * Web Audio sound manager: procedural SFX plus streamed, crossfade-looped music.
 * One shared, mobile-unlocked AudioContext. Music sits on its own (quieter) bus
 * so SFX stay punchy; a single mute flag silences everything.
 */
class SoundManagerImpl {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null; // SFX + music master (handles mute)
  private musicBus: GainNode | null = null; // music sub-mix (quieter than SFX)
  private muted = false;

  private buffers = new Map<string, AudioBuffer>();
  private currentTrack: MusicTrack | null = null;
  private currentKey: string | null = null;
  private desiredKey: string | null = null; // requested track, started once ready/unlocked

  constructor() {
    try {
      this.muted = localStorage.getItem(STORAGE_KEYS.MUTED) === '1';
    } catch {
      this.muted = false;
    }
  }

  private ensureCtx(): AudioContext | null {
    if (!this.ctx) {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return null;
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.9;
      this.master.connect(this.ctx.destination);
      this.musicBus = this.ctx.createGain();
      this.musicBus.gain.value = 0.5;
      this.musicBus.connect(this.master);
    }
    return this.ctx;
  }

  /** Call from a pointer/keyboard handler to satisfy mobile autoplay rules. */
  unlock(): void {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      void ctx.resume().then(() => this.startDesired());
    } else {
      this.startDesired();
    }
  }

  /** Fetch + decode a music file. Safe to call before unlock (decodes suspended). */
  async loadMusic(key: string, url: string): Promise<void> {
    const ctx = this.ensureCtx();
    if (!ctx || this.buffers.has(key)) return;
    try {
      const res = await fetch(url);
      const data = await res.arrayBuffer();
      const buffer = await ctx.decodeAudioData(data);
      this.buffers.set(key, buffer);
      this.startDesired(); // in case this track was requested while still loading
    } catch (e) {
      Diagnostics.warn('audio', `Could not load music "${key}"`, e);
    }
  }

  /** Crossfade to a looping track. No-op if it's already the one playing. */
  playMusic(key: string, fadeIn = 0.7): void {
    this.desiredKey = key;
    const ctx = this.ensureCtx();
    if (!ctx) return;
    if (this.currentKey === key && this.currentTrack) return;
    if (ctx.state !== 'running' || !this.buffers.has(key)) return; // deferred to startDesired()
    this.startTrack(key, fadeIn);
  }

  stopMusic(fadeOut = 0.6): void {
    this.desiredKey = null;
    if (this.currentTrack) this.currentTrack.stop(fadeOut);
    this.currentTrack = null;
    this.currentKey = null;
  }

  private startDesired(): void {
    const key = this.desiredKey;
    if (!key || this.currentKey === key) return;
    if (this.ctx?.state === 'running' && this.buffers.has(key)) {
      this.startTrack(key, 0.7);
    }
  }

  private startTrack(key: string, fadeIn: number): void {
    const ctx = this.ctx;
    const buffer = this.buffers.get(key);
    if (!ctx || !this.musicBus || !buffer) return;
    if (this.currentTrack) this.currentTrack.stop(0.6); // crossfade out the old one
    this.currentTrack = new MusicTrack(ctx, this.musicBus, buffer, fadeIn);
    this.currentKey = key;
  }

  get isMuted(): boolean {
    return this.muted;
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.9;
    try {
      localStorage.setItem(STORAGE_KEYS.MUTED, this.muted ? '1' : '0');
    } catch {
      /* ignore storage failures */
    }
    return this.muted;
  }

  /** Core tone generator: a single oscillator with an attack/decay envelope. */
  private tone(
    freq: number,
    duration: number,
    type: OscillatorType = 'square',
    volume = 0.5,
    sweepTo?: number
  ): void {
    if (!this.ctx || !this.master || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (sweepTo !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, sweepTo), now + duration);
    }
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  /**
   * Filtered white-noise burst with a sharp attack and fast decay — the
   * percussive layer the oscillator `tone()` can't make (impacts, crashes).
   * The filter can sweep so a bright hit darkens as it settles.
   */
  private noise(
    duration: number,
    volume = 0.4,
    filterType: BiquadFilterType = 'lowpass',
    filterFreq = 2400,
    sweepTo?: number
  ): void {
    if (!this.ctx || !this.master || this.muted) return;
    const now = this.ctx.currentTime;
    const frames = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, frames, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < frames; i++) data[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.setValueAtTime(filterFreq, now);
    if (sweepTo !== undefined) {
      filter.frequency.exponentialRampToValueAtTime(Math.max(1, sweepTo), now + duration);
    }
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, now); // instant attack = the impact
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    src.start(now);
    src.stop(now + duration + 0.02);
  }

  // --- Named effects -------------------------------------------------------
  move(): void {
    this.tone(420, 0.06, 'square', 0.18);
  }

  pass(): void {
    // Bright upward "swish + ping" — a satisfying confirm for a cleared gap.
    this.tone(700, 0.08, 'triangle', 0.3, 1000); // quick upward swish
    window.setTimeout(() => this.tone(1320, 0.08, 'triangle', 0.2), 45); // sparkle on top
  }

  button(): void {
    this.tone(520, 0.07, 'square', 0.35);
  }

  start(): void {
    this.tone(523, 0.09, 'square', 0.4);
    window.setTimeout(() => this.tone(784, 0.12, 'square', 0.4), 90);
  }

  smash(): void {
    // Metal shatter, 8-bit style: a clangy metallic "ting" (two detuned high
    // squares — their inharmonic beating reads as "metal") cracks first, then a
    // gritty high-passed noise burst (the flying shards) over a short
    // descending sawtooth body (the impact).
    this.tone(1600, 0.06, 'square', 0.24); // metallic clang...
    this.tone(2133, 0.06, 'square', 0.18); // ...detuned partial = metal
    this.noise(0.22, 0.4, 'highpass', 1500, 4500); // gritty shattering debris
    this.tone(640, 0.18, 'sawtooth', 0.3, 150); // descending impact body
  }

  coin(): void {
    this.tone(1046, 0.07, 'square', 0.3);
    window.setTimeout(() => this.tone(1568, 0.1, 'square', 0.3), 70);
  }

  hit(): void {
    // Cartoon CRASH in layers: a bright noise burst that darkens fast (the
    // impact + debris) over a short descending body and a sub thump. Punchy
    // but playful — reads as "bonk", not a harsh/scary smash.
    this.noise(0.22, 0.5, 'lowpass', 3400, 500); // impact that settles
    this.tone(180, 0.28, 'sawtooth', 0.4, 50); // descending body
    this.tone(90, 0.3, 'square', 0.25, 38); // low sub thump
  }

  gameOver(): void {
    this.tone(330, 0.18, 'square', 0.4, 220);
    window.setTimeout(() => this.tone(196, 0.4, 'square', 0.4, 110), 160);
  }

  newBest(): void {
    [523, 659, 784, 1047].forEach((f, i) =>
      window.setTimeout(() => this.tone(f, 0.14, 'triangle', 0.4), i * 110)
    );
  }

  /** Squeak-past-the-edge whoosh — rewards threading a gap with little clearance. */
  nearMiss(): void {
    this.noise(0.16, 0.3, 'bandpass', 2600, 900); // airy swish that drops in pitch
  }

  /**
   * Combo tier-up. Pitch climbs with the streak so deeper combos sound higher
   * and more exciting; `level` is the current multiplier (2, 3, 5, 10, 20…).
   */
  combo(level: number): void {
    const step = Math.min(Math.max(level, 1), 16);
    const base = 480 + step * 55; // rises with the streak
    this.tone(base, 0.08, 'triangle', 0.32);
    window.setTimeout(() => this.tone(base * 1.5, 0.09, 'triangle', 0.26), 55);
  }

  /** Countdown tick. The final beep (n <= 1) is higher/longer = "go". */
  countdown(n: number): void {
    const last = n <= 1;
    this.tone(last ? 880 : 560, last ? 0.16 : 0.09, 'square', 0.32);
  }

  /** Skin-unlock fanfare: a bright ascending arpeggio capped with a sparkle. */
  skinUnlock(): void {
    [523, 659, 880].forEach((f, i) =>
      window.setTimeout(() => this.tone(f, 0.12, 'triangle', 0.34), i * 80)
    );
    window.setTimeout(() => {
      this.tone(1318, 0.18, 'triangle', 0.28);
      this.tone(1760, 0.18, 'triangle', 0.18);
    }, 260);
  }

  /** Subtle low heartbeat pulse — rising tension as the game nears top speed. */
  danger(): void {
    this.tone(70, 0.12, 'sine', 0.3, 55);
  }

  /** Game pauses — a soft descending "freeze". */
  pause(): void {
    this.tone(520, 0.12, 'square', 0.3, 200);
  }

  /** Game un-freezes (after the resume countdown) — a quick rising "go". */
  unpause(): void {
    this.tone(330, 0.08, 'square', 0.32, 460);
    window.setTimeout(() => this.tone(660, 0.12, 'square', 0.32), 70);
  }

  /**
   * Spending currency — a soft descending counterpart to `coin` (which is for
   * earning). Not wired yet: today the only coin sink is buying skins, which
   * already plays `unlock`. Here for when a non-skin coin sink is added.
   */
  coinSpend(): void {
    this.tone(1568, 0.07, 'square', 0.28);
    window.setTimeout(() => this.tone(1046, 0.1, 'square', 0.28), 70);
  }
}

/** Shared singleton — one audio context for the whole game. */
export const Sound = new SoundManagerImpl();
