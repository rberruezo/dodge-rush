import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DifficultyManager } from './DifficultyManager';
import {
  DIFFICULTY_MODES,
  DEFAULT_DIFFICULTY,
  STORAGE_KEYS,
  SCROLL_CFG
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
