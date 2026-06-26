import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { STORAGE_KEYS } from '../config/Constants';

/* ------------------------------------------------------------------ *
 * Minimal fake Web Audio + HTMLAudioElement so the manager's logic can
 * run under Node. We only model what SoundManager actually touches.
 * ------------------------------------------------------------------ */
let oscCount = 0;
let bufSrcCount = 0;
let resumeCount = 0;
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
}
class FakeAudio {
  src = '';
  loop = false;
  preload = '';
  volume = 1;
  currentTime = 0;
  paused = true;
  error: { code: number } | null = null;
  playCount = 0;
  constructor() {
    audioInstances.push(this);
  }
  addEventListener() {}
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
  oscCount = bufSrcCount = resumeCount = 0;
  audioInstances = [];
  vi.stubGlobal('window', {
    AudioContext: FakeAudioContext,
    setTimeout: (fn: () => void) => {
      fn(); // run scheduled tones synchronously so we can count them
      return 0;
    }
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
      Sound.smash();
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
    Sound.smash();
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

describe('SoundManager — music control', () => {
  it('prepares one looping element per track and de-dupes', async () => {
    const Sound = await freshSound();
    Sound.loadMusic('menu', 'assets/menu.mp3');
    Sound.loadMusic('menu', 'assets/menu.mp3'); // dupe -> ignored
    expect(audioInstances).toHaveLength(1);
    expect(audioInstances[0].loop).toBe(true);
    expect(audioInstances[0].preload).toBe('auto');
  });

  it('plays at the music volume after unlock, and mute drops it to 0', async () => {
    const Sound = await freshSound();
    Sound.loadMusic('menu', 'assets/menu.mp3');
    Sound.unlock();
    Sound.playMusic('menu');
    const el = audioInstances[0];
    expect(el.playCount).toBeGreaterThanOrEqual(1);
    expect(el.volume).toBeCloseTo(0.45);
    expect(el.paused).toBe(false);

    Sound.toggleMute();
    expect(el.volume).toBe(0);
  });

  it('stopMusic pauses and rewinds the current track', async () => {
    const Sound = await freshSound();
    Sound.loadMusic('menu', 'assets/menu.mp3');
    Sound.unlock();
    Sound.playMusic('menu');
    await Promise.resolve(); // let play().then commit currentKey
    await Promise.resolve();
    Sound.stopMusic();
    expect(audioInstances[0].paused).toBe(true);
    expect(audioInstances[0].currentTime).toBe(0);
  });
});
