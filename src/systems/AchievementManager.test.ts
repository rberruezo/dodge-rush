import { describe, it, expect, beforeEach, vi } from 'vitest';
import { STORAGE_KEYS } from '../config/Constants';

/**
 * The managers are localStorage-backed singletons built at import time, so we
 * seed storage first, then re-import a fresh module graph to exercise a known
 * starting state (same pattern as SoundManager.test).
 */
async function fresh() {
  vi.resetModules();
  const a = await import('./AchievementManager');
  const p = await import('./ProfileManager');
  return { Achievements: a.Achievements, Profile: p.Profile };
}

beforeEach(() => localStorage.clear());

describe('AchievementManager', () => {
  it('unlocks nothing with a clean profile', async () => {
    const { Achievements } = await fresh();
    expect(Achievements.evaluate()).toEqual([]);
    expect(Achievements.all().every((a) => !a.unlocked)).toBe(true);
  });

  it('unlocks runs_50 → SHADOW after 50 runs and grants the reward skin', async () => {
    localStorage.setItem(STORAGE_KEYS.TOTAL_RUNS, '50');
    const { Achievements, Profile } = await fresh();

    const earned = Achievements.evaluate();
    expect(earned.map((a) => a.id)).toContain('shadow');
    expect(Achievements.isUnlocked('runs_50')).toBe(true);
    expect(Profile.isOwned('shadow')).toBe(true);
  });

  it('a high score ≥ 1000 unlocks both reach_phase5 (500m) and reach_1000m', async () => {
    localStorage.setItem(STORAGE_KEYS.HIGH_SCORE, '1200');
    const { Achievements } = await fresh();
    Achievements.evaluate();
    expect(Achievements.isUnlocked('reach_phase5')).toBe(true);
    expect(Achievements.isUnlocked('reach_1000m')).toBe(true);
  });

  it('owning all Common skins unlocks collect_all_common → LIME', async () => {
    localStorage.setItem(STORAGE_KEYS.OWNED_SKINS, JSON.stringify(['cat']));
    const { Achievements, Profile } = await fresh();
    Achievements.evaluate();
    expect(Achievements.isUnlocked('collect_all_common')).toBe(true);
    expect(Profile.isOwned('lime')).toBe(true);
  });

  it('is idempotent and persists earned achievements', async () => {
    localStorage.setItem(STORAGE_KEYS.TOTAL_RUNS, '50');
    const { Achievements } = await fresh();
    Achievements.evaluate();
    expect(Achievements.evaluate()).toEqual([]); // already earned -> nothing new
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS) ?? '[]') as string[];
    expect(stored).toContain('runs_50');
  });

  it('takePending drains the queued unlock notifications exactly once', async () => {
    localStorage.setItem(STORAGE_KEYS.TOTAL_RUNS, '50');
    const { Achievements } = await fresh();
    Achievements.evaluate();
    expect(Achievements.takePending().length).toBeGreaterThan(0);
    expect(Achievements.takePending()).toEqual([]); // already drained
  });

  it('persists across a reload (a fresh manager sees prior unlocks)', async () => {
    localStorage.setItem(STORAGE_KEYS.TOTAL_RUNS, '50');
    const first = await fresh();
    first.Achievements.evaluate();

    const second = await fresh(); // simulates an app restart
    expect(second.Achievements.isUnlocked('runs_50')).toBe(true);
    expect(second.Achievements.evaluate()).toEqual([]); // no double-unlock
  });
});
