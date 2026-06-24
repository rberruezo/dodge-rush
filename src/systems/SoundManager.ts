import { STORAGE_KEYS } from '../config/Constants';

/**
 * Lightweight Web Audio sound-effect synthesizer.
 *
 * Generates all SFX procedurally so the game ships with zero audio asset files
 * and stays tiny. A single shared AudioContext is unlocked on the first user
 * gesture (required by mobile browsers). Honours a persisted mute preference.
 */
class SoundManagerImpl {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private muted = false;

  constructor() {
    try {
      this.muted = localStorage.getItem(STORAGE_KEYS.MUTED) === '1';
    } catch {
      this.muted = false;
    }
  }

  /** Call from a pointer/keyboard handler to satisfy mobile autoplay rules. */
  unlock(): void {
    if (!this.ctx) {
      const Ctx =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.9;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
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
