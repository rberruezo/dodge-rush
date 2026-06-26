import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DifficultyManager } from './DifficultyManager';
import {
  DIFFICULTY_MODES,
  DEFAULT_DIFFICULTY,
  STORAGE_KEYS,
  SCROLL_CFG,
  OBSTACLE_CFG
} from '../config/Constants';

describe('DifficultyManager — difficulty modes', () => {
  beforeEach(() => {
    localStorage.clear();
    DifficultyManager.setMode('classic');
    localStorage.clear(); // drop the persistence side-effect of setMode
  });
  afterEach(() => DifficultyManager.setMode(DEFAULT_DIFFICULTY));

  it('defaults to CLASSIC', () => {
    expect(DifficultyManager.mode.id).toBe('classic');
    expect(DifficultyManager.mode.lives).toBe(DIFFICULTY_MODES.classic.lives);
  });

  it('setMode() switches the active mode and persists it', () => {
    DifficultyManager.setMode('relax');
    expect(DifficultyManager.mode.id).toBe('relax');
    expect(DifficultyManager.mode.lives).toBe(5);
    expect(localStorage.getItem(STORAGE_KEYS.DIFFICULTY)).toBe('relax');
  });

  it('setMode() with an unknown id falls back to the default', () => {
    DifficultyManager.setMode('nope' as never);
    expect(DifficultyManager.mode.id).toBe(DEFAULT_DIFFICULTY);
  });

  it('RELAX is gentler than CLASSIC at the same elapsed time', () => {
    DifficultyManager.setMode('classic');
    const classic = DifficultyManager.sample(60);
    DifficultyManager.setMode('relax');
    const relax = DifficultyManager.sample(60);

    expect(relax.speed).toBeLessThan(classic.speed); // slower fall
    expect(relax.baseGap).toBeGreaterThan(classic.baseGap); // wider gaps
    expect(relax.spacing).toBeGreaterThan(classic.spacing); // more breathing room
  });

  it('caps the difficulty level at the mode maxStep', () => {
    DifficultyManager.setMode('relax');
    expect(DifficultyManager.sample(100_000).level).toBeLessThanOrEqual(
      DIFFICULTY_MODES.relax.maxStep
    );
  });

  it('never lets fall speed exceed the mode-scaled maximum', () => {
    DifficultyManager.setMode('classic');
    const max = SCROLL_CFG.maxSpeed * DIFFICULTY_MODES.classic.speedScale;
    expect(DifficultyManager.sample(100_000).speed).toBeLessThanOrEqual(max + 1e-9);
  });
});

// GME-001: the objective balance contract between the two modes (the subjective
// "is it fun" still needs playtest — checklist GME-001 manual). We sample the
// full ramp and assert the invariants that make the curve fair and ordered.
describe('Difficulty balance (GME-001)', () => {
  const TIMELINE: number[] = [];
  for (let t = 0; t <= 300; t += 5) TIMELINE.push(t);

  const sampleAll = (mode: 'classic' | 'relax') => {
    DifficultyManager.setMode(mode);
    return TIMELINE.map((t) => ({ t, ...DifficultyManager.sample(t) }));
  };

  afterEach(() => DifficultyManager.setMode(DEFAULT_DIFFICULTY));

  it('RELAX is no harder than CLASSIC at every point in the ramp', () => {
    const classic = sampleAll('classic');
    const relax = sampleAll('relax');
    for (let i = 0; i < TIMELINE.length; i++) {
      const tag = `t=${TIMELINE[i]}s`;
      expect(relax[i].speed, `${tag} speed`).toBeLessThanOrEqual(classic[i].speed + 1e-9);
      expect(relax[i].baseGap, `${tag} gap`).toBeGreaterThanOrEqual(classic[i].baseGap - 1e-9);
      expect(relax[i].spacing, `${tag} spacing`).toBeGreaterThanOrEqual(classic[i].spacing - 1e-9);
    }
    expect(DIFFICULTY_MODES.relax.lives).toBeGreaterThanOrEqual(DIFFICULTY_MODES.classic.lives);
  });

  it('ramps monotonically (speed up, gap/spacing down) without spikes, in both modes', () => {
    for (const mode of ['classic', 'relax'] as const) {
      const s = sampleAll(mode);
      for (let i = 1; i < s.length; i++) {
        expect(s[i].speed, `${mode} speed mono`).toBeGreaterThanOrEqual(s[i - 1].speed - 1e-9);
        expect(s[i].baseGap, `${mode} gap mono`).toBeLessThanOrEqual(s[i - 1].baseGap + 1e-9);
        expect(s[i].spacing, `${mode} spacing mono`).toBeLessThanOrEqual(s[i - 1].spacing + 1e-9);
      }
    }
  });

  it('keeps the fairness reaction window above the floor at every point (both modes)', () => {
    for (const mode of ['classic', 'relax'] as const) {
      DifficultyManager.setMode(mode);
      for (const t of TIMELINE) {
        const { speed, spacing } = DifficultyManager.sample(t);
        const eff = DifficultyManager.effectiveSpacing(speed, spacing);
        const reactionMs = eff / speed; // ms the player has before the next barrier
        expect(reactionMs, `${mode} t=${t}s reaction`).toBeGreaterThanOrEqual(
          OBSTACLE_CFG.reactionMinMs - 1e-6
        );
      }
    }
  });

  it('plateaus at each mode cap (no runaway difficulty)', () => {
    for (const mode of ['classic', 'relax'] as const) {
      DifficultyManager.setMode(mode);
      const late = DifficultyManager.sample(100_000);
      const later = DifficultyManager.sample(1_000_000);
      expect(late.speed, `${mode} speed plateau`).toBeCloseTo(later.speed, 6);
      expect(late.level, `${mode} level cap`).toBe(DIFFICULTY_MODES[mode].maxStep);
    }
  });
});
