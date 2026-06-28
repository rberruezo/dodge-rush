import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { STORAGE_KEYS } from '../config/Constants';

/* ------------------------------------------------------------------ *
 * Minimal fake Web Audio + HTMLAudioElement so the manager's logic can
 * run under Node. We only model what SoundManager actually touches.
 * ------------------------------------------------------------------ */
let oscCount = 0;
let bufSrcCount = 0;
let resumeCount = 0;
let suspendCount = 0;
let audioInstances: FakeAudio[] = [];

class FakeParam {
  value = 0;
  setValueAtTime() {
    return this;
  }
  exponentialRampToValueAtTime() {
    return this;
  }
}
class FakeOsc {
  type = 'square';
  frequency = new FakeParam();
  connect() {}
  start() {}
  stop() {}
}
class FakeGain {
  gain = new FakeParam();
  connect() {}
}
class FakeFilter {
  type = 'lowpass';
  frequency = new FakeParam();
  connect() {}
}
class FakeBufferSource {
  buffer: unknown = null;
  connect() {}
  start() {}
  stop() {}
}
class FakeAudioContext {
  state = 'suspended';
  currentTime = 0;
  sampleRate = 44100;
  destination = {};
  createGain() {
    return new FakeGain();
  }
  createOscillator() {
    oscCount++;
    return new FakeOsc();
  }
  createBiquadFilter() {
    return new FakeFilter();
  }
  createBufferSource() {
    bufSrcCount++;
    return new FakeBufferSource();
  }
  createBuffer(_ch: number, frames: number) {
    return { getChannelData: () => new Float32Array(frames) };
  }
  resume() {
    resumeCount++;
    this.state = 'running';
    return Promise.resolve();
  }
  suspend() {
    suspendCount++;
    this.state = 'suspended';
    return Promise.resolve();
  }
}
let oggSupported = true; // toggled per test to exercise format selection

class FakeAudio {
  src = '';
  loop = false;
  preload = '';
  volume = 1;
  currentTime = 0;
  duration = 30;
  paused = true;
  error: { code: number } | null = null;
  playCount = 0;
  private handlers = new Map<string, Set<() => void>>();
  constructor() {
    audioInstances.push(this);
  }
  canPlayType(type: string): string {
    if (type.includes('ogg')) return oggSupported ? 'probably' : '';
    return 'maybe';
  }
  addEventListener(type: string, fn: () => void) {
    (this.handlers.get(type) ?? this.handlers.set(type, new Set()).get(type)!).add(fn);
  }
  removeEventListener(type: string, fn: () => void) {
    this.handlers.get(type)?.delete(fn);
  }
  emit(type: string) {
    this.handlers.get(type)?.forEach((fn) => fn());
  }
  play() {
    this.playCount++;
    this.paused = false;
    return Promise.resolve();
  }
  pause() {
    this.paused = true;
  }
}

async function freshSound() {
  vi.resetModules();
  const diag = await import('./Diagnostics');
  diag.Diagnostics.setConsoleMirror(false);
  const mod = await import('./SoundManager');
  return mod.Sound;
}

beforeEach(() => {
  oscCount = bufSrcCount = resumeCount = suspendCount = 0;
  audioInstances = [];
  oggSupported = true;
  vi.stubGlobal('window', {
    AudioContext: FakeAudioContext,
    setTimeout: (fn: () => void) => {
      fn(); // run scheduled tones synchronously so we can count them
      return 0;
    },
    setInterval: (fn: () => void, ms?: number) => globalThis.setInterval(fn, ms),
    clearInterval: (id: number) => globalThis.clearInterval(id)
  });
  vi.stubGlobal('AudioContext', FakeAudioContext);
  vi.stubGlobal('Audio', FakeAudio);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('SoundManager — mute model', () => {
  it('defaults to un-muted with clean storage', async () => {
    const Sound = await freshSound();
    expect(Sound.isMuted).toBe(false);
  });

  it('loads a persisted muted flag on construction', async () => {
    localStorage.setItem(STORAGE_KEYS.MUTED, '1');
    const Sound = await freshSound();
    expect(Sound.isMuted).toBe(true);
  });

  it('toggleMute flips, returns the new state and persists it', async () => {
    const Sound = await freshSound();
    expect(Sound.toggleMute()).toBe(true);
    expect(Sound.isMuted).toBe(true);
    expect(localStorage.getItem(STORAGE_KEYS.MUTED)).toBe('1');
    expect(Sound.toggleMute()).toBe(false);
    expect(localStorage.getItem(STORAGE_KEYS.MUTED)).toBe('0');
  });
});

describe('SoundManager — SFX synthesis', () => {
  it('unlock() creates and resumes a suspended audio context', async () => {
    const Sound = await freshSound();
    Sound.unlock();
    expect(resumeCount).toBeGreaterThanOrEqual(1);
  });

  it('named SFX synthesize tones without throwing once unlocked', async () => {
    const Sound = await freshSound();
    Sound.unlock();
    oscCount = bufSrcCount = 0;

    expect(() => Sound.move()).not.toThrow();
    expect(oscCount).toBeGreaterThanOrEqual(1);

    oscCount = 0;
    Sound.pass(); // two layered tones (swish + sparkle)
    expect(oscCount).toBeGreaterThanOrEqual(2);

    bufSrcCount = 0;
    Sound.hit(); // percussive layer uses a noise buffer source
    expect(bufSrcCount).toBeGreaterThanOrEqual(1);

    // Exercise the rest of the SFX surface for crashes.
    expect(() => {
      Sound.coin();
      Sound.combo(10);
      Sound.nearMiss();
      Sound.gameOver();
      Sound.newBest();
      Sound.countdown(1);
      Sound.skinUnlock();
      Sound.danger();
      Sound.pause();
      Sound.unpause();
      Sound.button();
      Sound.start();
    }).not.toThrow();
  });

  it('emits no audio while muted', async () => {
    const Sound = await freshSound();
    Sound.unlock();
    Sound.toggleMute(); // -> muted
    oscCount = bufSrcCount = 0;
    Sound.move();
    Sound.pass();
    Sound.hit();
    expect(oscCount).toBe(0);
    expect(bufSrcCount).toBe(0);
  });

  it('SFX before unlock are safe no-ops (no audio context yet)', async () => {
    const Sound = await freshSound();
    expect(() => {
      Sound.move();
      Sound.pass();
      Sound.hit();
    }).not.toThrow();
    expect(oscCount).toBe(0);
  });
});

// The track's real voices (the format probe `new Audio()` has no src set).
const voices = () => audioInstances.filter((e) => e.src !== '');

describe('SoundManager — music control', () => {
  it('prepares two crossfade voices per track (loop disabled) and de-dupes', async () => {
    const Sound = await freshSound();
    Sound.loadMusic('menu', 'assets/menu.mp3');
    Sound.loadMusic('menu', 'assets/menu.mp3'); // dupe -> ignored
    const v = voices();
    expect(v).toHaveLength(2); // A/B voices
    expect(v.every((e) => e.loop === false)).toBe(true); // manual crossfade, not loop
    expect(v.every((e) => e.preload === 'auto')).toBe(true);
  });

  it('prefers the OGG source when supported, falls back to MP3 otherwise', async () => {
    const Sound = await freshSound();
    Sound.loadMusic('menu', 'assets/menu.mp3');
    expect(voices()[0].src).toBe('assets/menu.ogg');

    oggSupported = false;
    audioInstances = []; // ignore the OGG run's voices
    const Sound2 = await freshSound();
    Sound2.loadMusic('game', 'assets/bgmusic.mp3');
    expect(voices()[0].src).toBe('assets/bgmusic.mp3');
  });

  it('plays at the music volume after unlock, and mute drops it to 0', async () => {
    const Sound = await freshSound();
    Sound.loadMusic('menu', 'assets/menu.mp3');
    Sound.unlock();
    Sound.playMusic('menu');
    const el = voices()[0]; // foreground voice
    expect(el.playCount).toBeGreaterThanOrEqual(1);
    expect(el.volume).toBeCloseTo(0.45);
    expect(el.paused).toBe(false);

    Sound.toggleMute();
    expect(el.volume).toBe(0);
  });

  it('crossfades into the second voice near the end (gapless loop)', async () => {
    vi.useFakeTimers();
    try {
      const Sound = await freshSound();
      Sound.loadMusic('game', 'assets/bgmusic.mp3'); // game loops via crossfade (menu rests — BUG-009)
      Sound.unlock();
      Sound.playMusic('game');
      await Promise.resolve(); // commit currentKey + arm the loop monitor
      await Promise.resolve();

      const [a, b] = voices();
      expect(a.paused).toBe(false);
      expect(b.paused).toBe(true);

      // Near the end -> the timeupdate handler should trigger the crossfade.
      a.currentTime = a.duration - 0.5; // within CROSSFADE_SEC (1.8)
      a.emit('timeupdate');
      expect(b.playCount).toBeGreaterThanOrEqual(1); // second voice started
      expect(b.currentTime).toBe(0); // from the top

      // Run the ramp to completion (1.8s crossfade): incoming full, outgoing paused.
      vi.advanceTimersByTime(2000);
      expect(b.volume).toBeCloseTo(0.45);
      expect(a.paused).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it('menu track rests in silence then restarts, never crossfades (BUG-009)', async () => {
    const Sound = await freshSound();
    Sound.loadMusic('menu', 'assets/menu.mp3');
    Sound.unlock();
    Sound.playMusic('menu');
    await Promise.resolve(); // commit currentKey + arm the rest loop
    await Promise.resolve();

    const [a, b] = voices();
    expect(a.paused).toBe(false);
    const playsBefore = a.playCount;

    // Menu must NOT crossfade: a timeupdate near the end does nothing to voice B.
    a.currentTime = a.duration - 0.5;
    a.emit('timeupdate');
    expect(b.playCount).toBe(0); // second voice is never used for the menu
    expect(b.paused).toBe(true);

    // On end, after the silent rest, the SAME voice restarts from the top. (The
    // test's setTimeout mock runs synchronously, so the 5s rest elapses instantly
    // here — we assert the restart behaviour, not the wall-clock delay.)
    a.emit('ended');
    expect(a.playCount).toBe(playsBefore + 1); // replayed from the top
    expect(a.currentTime).toBe(0);
  });

  it('stopMusic pauses and rewinds the current track', async () => {
    const Sound = await freshSound();
    Sound.loadMusic('menu', 'assets/menu.mp3');
    Sound.unlock();
    Sound.playMusic('menu');
    await Promise.resolve(); // let play().then commit currentKey
    await Promise.resolve();
    Sound.stopMusic();
    const v = voices();
    expect(v[0].paused).toBe(true);
    expect(v[0].currentTime).toBe(0);
  });
});

describe('SoundManager — app background suspend/resume', () => {
  it('suspend() pauses playing music and suspends the SFX context', async () => {
    const Sound = await freshSound();
    Sound.loadMusic('game', 'assets/bgmusic.mp3');
    Sound.unlock(); // creates + resumes the SFX context
    Sound.playMusic('game');
    await Promise.resolve();
    await Promise.resolve();
    const el = voices()[0];
    expect(el.paused).toBe(false);

    Sound.suspend();
    expect(el.paused).toBe(true); // music paused
    expect(suspendCount).toBeGreaterThanOrEqual(1); // SFX context suspended
  });

  it('resume() restarts music that was playing before suspend', async () => {
    const Sound = await freshSound();
    Sound.loadMusic('game', 'assets/bgmusic.mp3');
    Sound.unlock();
    Sound.playMusic('game');
    await Promise.resolve();
    await Promise.resolve();
    const el = voices()[0];

    Sound.suspend();
    expect(el.paused).toBe(true);
    const playsBefore = el.playCount;

    Sound.resume();
    expect(el.paused).toBe(false); // resumed
    expect(el.playCount).toBe(playsBefore + 1);
    expect(el.volume).toBeCloseTo(0.45);
  });

  it('resume() does NOT start music that was not playing before suspend', async () => {
    const Sound = await freshSound();
    Sound.loadMusic('game', 'assets/bgmusic.mp3');
    Sound.unlock();
    // never call playMusic -> nothing is sounding
    Sound.suspend();
    Sound.resume();
    const v = voices();
    expect(v.every((e) => e.paused)).toBe(true); // stays silent
  });

  it('resume() keeps music paused while muted', async () => {
    const Sound = await freshSound();
    Sound.loadMusic('game', 'assets/bgmusic.mp3');
    Sound.unlock();
    Sound.playMusic('game');
    await Promise.resolve();
    await Promise.resolve();
    const el = voices()[0];

    Sound.suspend();
    Sound.toggleMute(); // muted while backgrounded
    Sound.resume();
    expect(el.paused).toBe(true); // not forced back on
  });
});

