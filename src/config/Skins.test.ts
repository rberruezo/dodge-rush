import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { SKINS, ACHIEVEMENT_SKINS, SKIN_SHEETS, getSkin } from './Skins';
import { CHARACTER_ANIMS, CHAR_FRAMES, ANIM_KEYS, CHARACTER_FRAME } from './Constants';

// Enumerate the shipped art + the loader source via Vite's glob.
const assetKeys = Object.keys(import.meta.glob('../../public/assets/*.png'));
const hasAsset = (sheet: string) => assetKeys.some((k) => k.endsWith(`/${sheet}.png`));
const preloadSrc = Object.values(
  import.meta.glob('../scenes/PreloadScene.ts', { query: '?raw', import: 'default', eager: true })
)[0] as string;

const COLS = 6;
const ROWS = 7;
const FRAME_COUNT = COLS * ROWS; // documented 6 cols x 7 rows grid (indices 0..41)

/** Read a PNG's pixel dimensions straight from its IHDR header (no decode). */
function pngSize(sheet: string): { w: number; h: number } {
  const buf = readFileSync(fileURLToPath(new URL(`../../public/assets/${sheet}.png`, import.meta.url)));
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
}

describe('Skins — catalogue integrity', () => {
  it('has unique ids', () => {
    const ids = SKINS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has exactly one free skin and it is the default CLASSIC', () => {
    const free = SKINS.filter((s) => s.cost === 0);
    expect(free).toHaveLength(1);
    expect(free[0].id).toBe('classic');
    expect(free[0].sheet).toBe('character');
    expect(free[0].tint).toBeNull();
    expect(getSkin('whatever-unknown').id).toBe('classic'); // fallback == default
  });

  it('is sorted by strictly ascending cost (clean shop progression)', () => {
    for (let i = 1; i < SKINS.length; i++) {
      expect(SKINS[i].cost).toBeGreaterThan(SKINS[i - 1].cost);
    }
  });

  it('uses a valid 24-bit colour for every trail and tint', () => {
    for (const s of SKINS) {
      expect(s.trail).toBeGreaterThanOrEqual(0);
      expect(s.trail).toBeLessThanOrEqual(0xffffff);
      if (s.tint !== null) {
        expect(s.tint).toBeGreaterThanOrEqual(0);
        expect(s.tint).toBeLessThanOrEqual(0xffffff);
      }
    }
  });

  it('no purchasable skin uses a tint — tinted variants are achievement-only', () => {
    for (const s of SKINS) {
      expect(s.tint, `skin "${s.id}" should have tint: null`).toBeNull();
    }
  });

  it('all achievement skins are palette-swaps of the base character sheet', () => {
    for (const s of ACHIEVEMENT_SKINS) {
      expect(s.sheet, `achievement skin "${s.id}" must reuse the character sheet`).toBe('character');
      expect(typeof s.tint).toBe('number');
    }
  });

  it('achievement skin ids are disjoint from purchasable skin ids', () => {
    const shopIds = new Set(SKINS.map((s) => s.id));
    for (const s of ACHIEVEMENT_SKINS) {
      expect(shopIds.has(s.id), `"${s.id}" appears in both SKINS and ACHIEVEMENT_SKINS`).toBe(false);
    }
  });
});

describe('Skins — every skin has its art + animations available', () => {
  it('ships a sprite-sheet PNG on disk for every skin', () => {
    for (const s of SKINS) {
      expect(hasAsset(s.sheet), `missing asset for skin "${s.id}": ${s.sheet}.png`).toBe(true);
    }
  });

  it('PreloadScene loads every distinct skin sheet (guards list drift)', () => {
    // Match the asset path literal (`assets/<sheet>.png`) — robust whether the
    // key is passed as a string literal or via the ASSET_KEYS constant.
    for (const sheet of SKIN_SHEETS) {
      expect(
        preloadSrc.includes(`assets/${sheet}.png`),
        `PreloadScene does not load sheet "${sheet}"`
      ).toBe(true);
    }
  });
});

describe('Animation contract (must hold for every skin sheet)', () => {
  it('defines the five core character animations', () => {
    for (const key of [
      ANIM_KEYS.HOVER,
      ANIM_KEYS.MOVE,
      ANIM_KEYS.MOVE_HARD,
      ANIM_KEYS.BOOST,
      ANIM_KEYS.CHEER
    ]) {
      expect(CHARACTER_ANIMS[key]).toBeDefined();
    }
  });

  it('keeps every animation frame range inside the 6x7 grid and forward-ordered', () => {
    for (const [base, def] of Object.entries(CHARACTER_ANIMS)) {
      expect(def.start, `${base}.start`).toBeGreaterThanOrEqual(0);
      expect(def.end, `${base}.end`).toBeLessThan(FRAME_COUNT);
      expect(def.end, `${base} range`).toBeGreaterThanOrEqual(def.start);
      expect(def.frameRate, `${base}.frameRate`).toBeGreaterThan(0);
    }
  });

  it('keeps every single-frame pose inside the grid', () => {
    for (const [name, idx] of Object.entries(CHAR_FRAMES)) {
      expect(idx, name).toBeGreaterThanOrEqual(0);
      expect(idx, name).toBeLessThan(FRAME_COUNT);
    }
  });
});

// SKN-002: every skin sheet must physically contain all 6x7 = 42 pose frames,
// i.e. be exactly (COLS*frameW) x (ROWS*frameH). A wrong-sized sheet would make
// poses (boost/celebrate/dizzy/trophy/crown...) slice blank or misaligned cells.
describe('Skins — sprite-sheet dimensions (SKN-002)', () => {
  const expectedW = COLS * CHARACTER_FRAME.width;
  const expectedH = ROWS * CHARACTER_FRAME.height;

  for (const sheet of SKIN_SHEETS) {
    it(`${sheet}.png is a ${COLS}x${ROWS} grid (${expectedW}x${expectedH})`, () => {
      const { w, h } = pngSize(sheet);
      expect(w, `${sheet} width`).toBe(expectedW);
      expect(h, `${sheet} height`).toBe(expectedH);
    });
  }
});
