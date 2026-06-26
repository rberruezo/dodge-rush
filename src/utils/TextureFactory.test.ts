import { describe, it, expect, vi, beforeEach } from 'vitest';

// Stub Phaser so TextureFactory loads under Node. It only uses Phaser.Display.Color
// (for the sky gradient) at runtime; Phaser.Scene is a type-only reference.
vi.mock('phaser', () => ({
  default: {
    Display: {
      Color: {
        ValueToColor: (v: number) => ({ r: (v >> 16) & 255, g: (v >> 8) & 255, b: v & 255 }),
        GetColor: (r: number, g: number, b: number) => (r << 16) | (g << 8) | b,
        Interpolate: {
          ColorWithColor: (
            a: { r: number; g: number; b: number },
            b: { r: number; g: number; b: number },
            _n: number,
            t: number
          ) => ({
            r: Math.round(a.r + (b.r - a.r) * t),
            g: Math.round(a.g + (b.g - a.g) * t),
            b: Math.round(a.b + (b.b - a.b) * t)
          })
        }
      }
    }
  }
}));

import { TextureFactory, SHEET_FALLBACK } from './TextureFactory';
import { SKIN_SHEETS } from '../config/Skins';
import { BG_ZONES, BG_LAYERS, ASSET_KEYS } from '../config/Constants';

interface FakeTex {
  key: string;
  add: () => void;
}

function makeScene() {
  const reg = new Map<string, FakeTex>();
  const generated: string[] = [];
  const graphics = {
    fillStyle: () => graphics,
    fillRect: () => graphics,
    fillRoundedRect: () => graphics,
    fillCircle: () => graphics,
    fillEllipse: () => graphics,
    generateTexture(key: string) {
      reg.set(key, { key, add: () => {} });
      generated.push(key);
      return graphics;
    },
    destroy: () => {}
  };
  return {
    reg,
    generated,
    register: (key: string) => reg.set(key, { key, add: () => {} }), // a "valid" loaded texture
    textures: {
      exists: (k: string) => reg.has(k),
      get: (k: string) => reg.get(k) ?? { key: '__MISSING', add: () => {} },
      remove: (k: string) => reg.delete(k)
    },
    make: { graphics: () => graphics }
  };
}

const ALL_LOADED_KEYS = [
  ...SKIN_SHEETS,
  ...BG_ZONES.map((z) => z.sky),
  ...BG_LAYERS.map((l) => l.key),
  ASSET_KEYS.OBSTACLES
];

describe('TextureFactory — graceful procedural fallback (QA-004)', () => {
  let scene: ReturnType<typeof makeScene>;
  beforeEach(() => {
    scene = makeScene();
  });

  it('generates a stand-in for EVERY loadable asset when nothing is present', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    TextureFactory.ensureFallbacks(scene as any);
    for (const key of ALL_LOADED_KEYS) {
      expect(scene.textures.exists(key), `no fallback generated for "${key}"`).toBe(true);
    }
    // Every skin sheet (all 12) is covered — none left without art.
    for (const sheet of SKIN_SHEETS) expect(scene.reg.has(sheet)).toBe(true);
  });

  it('only regenerates the keys reported as failed (leaves loaded assets alone)', () => {
    ALL_LOADED_KEYS.forEach((k) => scene.register(k)); // pretend everything loaded fine
    const failed = new Set([SKIN_SHEETS[0], ASSET_KEYS.OBSTACLES]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    TextureFactory.ensureFallbacks(scene as any, failed);
    expect(new Set(scene.generated)).toEqual(failed);
  });

  it('treats a Phaser __MISSING placeholder as needing a fallback', () => {
    // A failed load leaves the key registered but pointing at __MISSING.
    scene.reg.set('character', { key: '__MISSING', add: () => {} });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    TextureFactory.ensureFallbacks(scene as any);
    expect(scene.generated).toContain('character');
    expect(scene.textures.get('character').key).toBe('character'); // now valid
  });

  it('defines an explicit identity fallback colour for every skin sheet', () => {
    for (const sheet of SKIN_SHEETS) {
      expect(SHEET_FALLBACK[sheet], `no fallback colour for sheet "${sheet}"`).toBeDefined();
      expect(SHEET_FALLBACK[sheet]).toBeGreaterThanOrEqual(0);
      expect(SHEET_FALLBACK[sheet]).toBeLessThanOrEqual(0xffffff);
    }
  });

  it('builds the procedural coin and particle textures on demand', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    TextureFactory.ensureCoin(scene as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    TextureFactory.ensureParticleTexture(scene as any);
    expect(scene.textures.exists(ASSET_KEYS.COIN)).toBe(true);
    expect(scene.textures.exists(ASSET_KEYS.PARTICLE)).toBe(true);
  });
});
