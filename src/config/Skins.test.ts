import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { SKINS, ACHIEVEMENT_SKINS, SKIN_SHEETS, CHARACTER_SHEETS, getSkin } from './Skins';
import { CHARACTER_ANIMS, CHAR_FRAMES, ANIM_KEYS, CHARACTER_FRAME } from './CharacterSprite';

// Enumerate the shipped art + the loader source via Vite's glob.
const assetKeys = Object.keys(import.meta.glob('../../public/assets/*.png'));
const hasAsset = (sheet: string) => assetKeys.some((k) => k.endsWith(`/${sheet}.png`));
const preloadSrc = Object.values(
  import.meta.glob('../scenes/PreloadScene.ts', { query: '?raw', import: 'default', eager: true })
)[0] as string;

const COLS = 6;
const ROWS_SKIN = 7; // skins ship the 6x7 grid (indices 0..41 — no death row)
const ROWS_BASE = 8; // the base 'character' sheet adds row 7 (death) -> 6x8 (0..47)
const FRAME_COUNT_SKIN = COLS * ROWS_SKIN; // 42 — the shared grid every sheet provides
const FRAME_COUNT_BASE = COLS * ROWS_BASE; // 48 — base sheet including the death row

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
    // Loads are now derived from CHARACTER_SHEETS in a single loop, so verify the
    // catalogue covers every animated sheet and the loader reads from that list.
    for (const sheet of SKIN_SHEETS) {
      expect(
        CHARACTER_SHEETS.includes(sheet),
        `CHARACTER_SHEETS is missing animated sheet "${sheet}"`
      ).toBe(true);
    }
    expect(preloadSrc).toContain('CHARACTER_SHEETS.forEach');
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

  it('keeps every animation frame range inside its grid and forward-ordered', () => {
    for (const [base, def] of Object.entries(CHARACTER_ANIMS)) {
      // An anim is either a contiguous start/end range or an explicit frame list.
      const list = def.frames ? [...def.frames] : null;
      const lo = list ? Math.min(...list) : (def.start as number);
      const hi = list ? Math.max(...list) : (def.end as number);
      expect(lo, `${base} lo`).toBeGreaterThanOrEqual(0);
      expect(hi, `${base} range`).toBeGreaterThanOrEqual(lo);
      expect(def.frameRate, `${base}.frameRate`).toBeGreaterThan(0);
      // The death row is base-only (6x8); the five shared anims must fit the
      // 6x7 grid that every skin sheet provides.
      const limit = base === ANIM_KEYS.DEATH ? FRAME_COUNT_BASE : FRAME_COUNT_SKIN;
      expect(hi, `${base}.end`).toBeLessThan(limit);
    }
  });

  it('keeps every single-frame pose inside the grid', () => {
    for (const [name, idx] of Object.entries(CHAR_FRAMES)) {
      expect(idx, name).toBeGreaterThanOrEqual(0);
      expect(idx, name).toBeLessThan(FRAME_COUNT_SKIN);
    }
  });
});

// SKN-002: every sheet must physically contain all its pose frames, i.e. be
// exactly (COLS*frameW) x (rows*frameH). The base 'character' sheet is 6x8
// (adds the death row); skins stay 6x7. A wrong-sized sheet would slice blank
// or misaligned cells (boost/celebrate/dizzy/trophy/crown...).
describe('Skins — sprite-sheet dimensions (SKN-002)', () => {
  const expectedW = COLS * CHARACTER_FRAME.width;

  for (const sheet of SKIN_SHEETS) {
    const rows = sheet === 'character' ? ROWS_BASE : ROWS_SKIN;
    const expectedH = rows * CHARACTER_FRAME.height;
    it(`${sheet}.png is a ${COLS}x${rows} grid (${expectedW}x${expectedH})`, () => {
      const { w, h } = pngSize(sheet);
      expect(w, `${sheet} width`).toBe(expectedW);
      expect(h, `${sheet} height`).toBe(expectedH);
    });
  }
});
