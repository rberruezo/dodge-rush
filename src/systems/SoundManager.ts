import { STORAGE_KEYS } from '../config/Constants';
import { Diagnostics } from './Diagnostics';

/** Music track keys (files in public/assets). */
export const MUSIC = {
  MENU: 'menu',
  GAME: 'bgmusic'
} as const;

/**
 * Sound manager: procedural Web Audio SFX + looping background music.
 *
 * SFX are synthesized on a shared, mobile-unlocked AudioContext. MUSIC, however,
 * plays through HTML5 `<audio>` elements — NOT Web Audio. Reason: the Android
 * System WebView cannot decode MP3 via `AudioContext.decodeAudioData` (it throws
 * an EncodingError), so bundled music silently failed in the packaged app while
 * the synthesized SFX kept working. `<audio>` uses the platform media decoder
 * (MP3 works) and loads `file://` media, so it works both in the browser and the
 * APK. A single mute flag silences SFX (master gain) and music (element volume).
 *
 * MUSIC loops *gaplessly* via a short crossfade between two `<audio>` elements
 * per track (HTML5 `loop` re-plays the MP3 encoder-delay silence -> an audible
 * gap). The source assets are prefered as OGG Vorbis (no encoder delay), with an
 * MP3 fallback for engines that can't decode OGG.
 */
interface MusicTrack {
  els: HTMLAudioElement[]; // two voices, ping-ponged for the loop crossfade
  active: number; // index (0|1) of the currently-foreground voice
}

class SoundManagerImpl {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null; // SFX master (handles SFX mute)
  private muted = false;

  // Music: two <audio> voices per track, crossfaded for a gapless loop.
  private tracks = new Map<string, MusicTrack>();
  private currentKey: string | null = null;
  private desiredKey: string | null = null; // requested track, started once loaded + unlocked
  private oggSupported: boolean | null = null; // memoized format probe
  private rampTimer: number | null = null; // active crossfade volume ramp
  private restTimer: number | null = null; // menu "rest in silence" timeout
  private restEnded: { el: HTMLAudioElement; fn: () => void } | null = null; // menu end-listener
  private wasPlayingOnSuspend = false; // app-background: was music actually playing?

  private static readonly MUSIC_VOLUME = 0.45;
  // Longer overlap + equal-power curve = a gentler, less mechanical loop seam (BUG-009).
  private static readonly CROSSFADE_SEC = 1.8; // overlap window at the loop seam
  private static readonly RAMP_MS = 50; // crossfade volume-step interval
  private static readonly MENU_REST_MS = 5000; // menu: silence between plays (no loop)

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
    }
    return this.ctx;
  }

  /** Call from a pointer/keyboard handler to satisfy mobile autoplay rules. */
  unlock(): void {
    const ctx = this.ensureCtx(); // SFX context
    if (ctx && ctx.state === 'suspended') void ctx.resume();
    this.startDesired(); // begin/resume music now that we have a user gesture
  }

  /** Volume music elements should play at right now (0 while muted). */
  private musicVol(): number {
    return this.muted ? 0 : SoundManagerImpl.MUSIC_VOLUME;
  }

  /**
   * Prefer OGG Vorbis (gapless — no MP3 encoder-delay) when the engine can
   * decode it, otherwise fall back to the given MP3 url. Memoized.
   */
  private pickSrc(url: string): string {
    if (this.oggSupported === null) {
      try {
        this.oggSupported = new Audio().canPlayType('audio/ogg; codecs="vorbis"') !== '';
      } catch {
        this.oggSupported = false;
      }
    }
    return this.oggSupported ? url.replace(/\.mp3$/i, '.ogg') : url;
  }

  /**
   * Prepare a track's two looping voices via HTML5 `<audio>`. Safe to call
   * before the first gesture: elements preload and playback starts on
   * unlock/playMusic.
   */
  loadMusic(key: string, url: string): void {
    if (this.tracks.has(key)) return;
    try {
      const src = this.pickSrc(url);
      const make = (): HTMLAudioElement => {
        const el = new Audio();
        el.src = src;
        el.loop = false; // looped manually via crossfade, not the element's loop
        el.preload = 'auto';
        el.volume = 0;
        el.addEventListener(
          'error',
          () => Diagnostics.warn('audio', `Music element error "${key}"`, el.error?.code),
          { once: true }
        );
        return el;
      };
      this.tracks.set(key, { els: [make(), make()], active: 0 });
      this.startDesired(); // start now if this is the track we're waiting for (and unlocked)
    } catch (e) {
      Diagnostics.warn('audio', `Could not prepare music "${key}"`, e);
    }
  }

  /** Switch to a looping track. No-op if it's already the current one. */
  playMusic(key: string, _fadeIn = 0.7): void {
    this.desiredKey = key;
    if (this.currentKey === key) return;
    this.startDesired();
  }

  stopMusic(_fadeOut = 0.6): void {
    this.desiredKey = null;
    this.clearRamp();
    this.clearMenuRest();
    if (this.currentKey) {
      const track = this.tracks.get(this.currentKey);
      track?.els.forEach((el) => {
        el.pause();
        el.currentTime = 0;
      });
    }
    this.currentKey = null;
  }

  /** Start the desired track if it's loaded; retried on load + on unlock. */
  private startDesired(): void {
    const key = this.desiredKey;
    if (!key) return;
    const track = this.tracks.get(key);
    if (!track) return; // not loaded yet — loadMusic() will retry
    const el = track.els[track.active];
    // Already the current track and either playing or in its menu rest? Leave it.
    if (this.currentKey === key && (!el.paused || this.restTimer !== null)) return;

    // (Re)starting some track now — drop any pending menu rest, and pause the
    // other tracks (single music voice at a time).
    this.clearMenuRest();
    this.tracks.forEach((other, k) => {
      if (k !== key) other.els.forEach((e) => !e.paused && e.pause());
    });

    el.currentTime = 0;
    el.volume = this.musicVol();
    const p: Promise<void> | undefined = el.play();
    const onPlaying = (): void => {
      this.currentKey = key;
      // Menu rests in silence between plays (BUG-009); other tracks loop via crossfade.
      if (key === MUSIC.MENU) this.armRestLoop(key);
      else this.armLoop(key); // schedule the seamless crossfade near the end
    };
    if (p && typeof p.then === 'function') {
      // currentKey is only committed once playback actually starts, so an
      // autoplay-blocked attempt before the first gesture is retried on unlock.
      p.then(onPlaying).catch(() => {
        /* autoplay-blocked before a gesture — retried from unlock() */
      });
    } else {
      onPlaying();
    }
  }

  /**
   * Watch the foreground voice and, CROSSFADE_SEC before it ends, crossfade into
   * the track's other voice — a gapless loop that masks the seam (and any
   * residual encoder-delay silence of an MP3 fallback).
   */
  private armLoop(key: string): void {
    const track = this.tracks.get(key);
    if (!track) return;
    const el = track.els[track.active];
    const onTime = (): void => {
      if (this.currentKey !== key) {
        el.removeEventListener('timeupdate', onTime);
        return;
      }
      const dur = el.duration;
      if (!dur || !isFinite(dur)) return;
      if (dur - el.currentTime <= SoundManagerImpl.CROSSFADE_SEC) {
        el.removeEventListener('timeupdate', onTime);
        this.crossfadeLoop(key);
      }
    };
    el.addEventListener('timeupdate', onTime);
  }

  /** Perform one loop crossfade: fade the foreground voice out, the other in. */
  private crossfadeLoop(key: string): void {
    const track = this.tracks.get(key);
    if (!track) return;
    const from = track.els[track.active];
    const to = track.els[track.active ^ 1];
    const target = this.musicVol();

    to.currentTime = 0;
    to.volume = 0;
    const pp = to.play();
    if (pp && typeof pp.then === 'function') pp.catch(() => {});
    track.active ^= 1; // `to` is now the foreground voice

    const steps = Math.max(
      1,
      Math.round((SoundManagerImpl.CROSSFADE_SEC * 1000) / SoundManagerImpl.RAMP_MS)
    );
    let i = 0;
    this.clearRamp();
    this.rampTimer = window.setInterval(() => {
      i += 1;
      const r = Math.min(1, i / steps);
      if (!this.muted) {
        // Equal-power curve (sin/cos): keeps perceived loudness constant across
        // the fade. A linear ramp dips at the midpoint and that audible dip is
        // the mechanical "seam" the player hears (BUG-009).
        to.volume = target * Math.sin((r * Math.PI) / 2);
        from.volume = target * Math.cos((r * Math.PI) / 2);
      }
      if (r >= 1) {
        this.clearRamp();
        from.pause();
        from.currentTime = 0;
        this.armLoop(key); // re-arm on the new foreground voice
      }
    }, SoundManagerImpl.RAMP_MS);
  }

  private clearRamp(): void {
    if (this.rampTimer !== null) {
      window.clearInterval(this.rampTimer);
      this.rampTimer = null;
    }
  }

  /**
   * Menu loop, BUG-009 variant: instead of crossfading back to the top, let the
   * track play out, rest in silence for MENU_REST_MS, then restart from the
   * beginning. The pause removes the repetitive "loop" perception of the short
   * menu track. Used for MUSIC.MENU only (one voice; never crossfaded).
   */
  private armRestLoop(key: string): void {
    const track = this.tracks.get(key);
    if (!track) return;
    const el = track.els[track.active];
    this.clearMenuRest(); // never stack handlers/timers
    const onEnded = (): void => {
      if (this.currentKey !== key || this.desiredKey !== key) return;
      this.restTimer = window.setTimeout(() => {
        this.restTimer = null;
        if (this.currentKey !== key || this.desiredKey !== key) return;
        el.currentTime = 0;
        el.volume = this.musicVol();
        const p: Promise<void> | undefined = el.play();
        if (p && typeof p.then === 'function') p.catch(() => {});
        this.armRestLoop(key); // arm the next rest cycle
      }, SoundManagerImpl.MENU_REST_MS);
    };
    this.restEnded = { el, fn: onEnded };
    el.addEventListener('ended', onEnded);
  }

  /** Cancel any pending menu rest timer and its end-listener. */
  private clearMenuRest(): void {
    if (this.restTimer !== null) {
      window.clearTimeout(this.restTimer);
      this.restTimer = null;
    }
    if (this.restEnded) {
      this.restEnded.el.removeEventListener('ended', this.restEnded.fn);
      this.restEnded = null;
    }
  }

  /**
   * App moved to the background (or became inactive): pause music and suspend
   * the SFX context so nothing keeps playing behind a backgrounded app. Records
   * whether music was actually sounding so resume() can restore the prior state
   * rather than force-starting playback.
   */
  suspend(): void {
    if (this.ctx && this.ctx.state === 'running') {
      try {
        void this.ctx.suspend();
      } catch {
        /* some engines reject suspend on an already-interrupted context */
      }
    }
    // Stop any in-flight loop crossfade / menu rest so timers can't fire while
    // backgrounded and resume re-arms cleanly.
    this.clearRamp();
    this.clearMenuRest();
    const track = this.currentKey ? this.tracks.get(this.currentKey) : undefined;
    const el = track ? track.els[track.active] : undefined;
    this.wasPlayingOnSuspend = !!el && !el.paused;
    track?.els.forEach((e) => {
      if (!e.paused) e.pause();
    });
  }

  /**
   * App returned to the foreground: resume the SFX context, and resume music
   * only if it was playing when we suspended (and we're not muted) — otherwise
   * leave it paused, matching the prior state.
   */
  resume(): void {
    if (this.ctx && this.ctx.state === 'suspended') {
      try {
        void this.ctx.resume();
      } catch {
        /* ignore — playback resumes on the next user gesture if needed */
      }
    }
    if (!this.wasPlayingOnSuspend) return;
    this.wasPlayingOnSuspend = false;
    const key = this.currentKey;
    if (!key || this.muted) return;
    const track = this.tracks.get(key);
    const el = track ? track.els[track.active] : undefined;
    if (!el) return;
    el.volume = this.musicVol();
    const p: Promise<void> | undefined = el.play();
    if (p && typeof p.then === 'function') p.catch(() => {});
    // Re-arm the loop watcher we cleared on suspend.
    if (key === MUSIC.MENU) this.armRestLoop(key);
    else this.armLoop(key);
  }

  get isMuted(): boolean {
    return this.muted;
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.9;
    const v = this.musicVol();
    this.tracks.forEach((t) => t.els.forEach((el) => !el.paused && (el.volume = v)));
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
