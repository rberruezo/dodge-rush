import { STORAGE_KEYS } from '../config/Constants';

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
      console.warn(`[DodgeRush] Could not load music "${key}":`, e);
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

  // --- Named effects -------------------------------------------------------
  move(): void {
    this.tone(420, 0.06, 'square', 0.18);
  }

  pass(): void {
    this.tone(660, 0.08, 'triangle', 0.3);
    this.tone(990, 0.08, 'triangle', 0.22);
  }

  button(): void {
    this.tone(520, 0.07, 'square', 0.35);
  }

  start(): void {
    this.tone(523, 0.09, 'square', 0.4);
    window.setTimeout(() => this.tone(784, 0.12, 'square', 0.4), 90);
  }

  dash(): void {
    this.tone(900, 0.16, 'sawtooth', 0.32, 260);
    this.tone(1300, 0.1, 'triangle', 0.2);
  }

  coin(): void {
    this.tone(1046, 0.07, 'square', 0.3);
    window.setTimeout(() => this.tone(1568, 0.1, 'square', 0.3), 70);
  }

  hit(): void {
    this.tone(220, 0.45, 'sawtooth', 0.55, 60);
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
}

/** Shared singleton — one audio context for the whole game. */
export const Sound = new SoundManagerImpl();
