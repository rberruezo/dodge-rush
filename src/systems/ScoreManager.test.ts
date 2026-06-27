import { describe, it, expect, beforeEach } from 'vitest';
import { ScoreManager } from './ScoreManager';
import { DifficultyManager } from './DifficultyManager';
import { SCORE_CFG, STORAGE_KEYS, ZONE_MILESTONES } from '../config/Constants';

describe('ScoreManager', () => {
  // The high score is per mode (GME-012); pin CLASSIC so these tests exercise the
  // legacy HIGH_SCORE key deterministically regardless of DEFAULT_DIFFICULTY.
  beforeEach(() => {
    localStorage.clear();
    DifficultyManager.setMode('classic');
  });

  it('scores survival time at pointsPerSecond', () => {
    const s = new ScoreManager();
    s.update(2000); // 2 seconds
    expect(s.current).toBe(2 * SCORE_CFG.pointsPerSecond);
    expect(s.elapsedSeconds).toBe(2);
  });

  it('fires each zone milestone once, in order, when the score crosses it (GME-GD-006)', () => {
    const s = new ScoreManager();
    expect(s.pollMilestone()).toBeNull(); // nothing crossed yet

    const seen: string[] = [];
    let acc = 0;
    for (const m of ZONE_MILESTONES) {
      s.addBonus(m.at - acc); // bring the score up to exactly this threshold
      acc = m.at;
      const got = s.pollMilestone();
      if (got) seen.push(got);
    }
    expect(seen).toEqual(ZONE_MILESTONES.map((m) => m.name));
    expect(s.pollMilestone()).toBeNull(); // all consumed — no repeats

    s.reset();
    expect(s.pollMilestone()).toBeNull(); // reset re-arms milestones for the next run
  });

  it('adds rounded bonus points on top of time score', () => {
    const s = new ScoreManager();
    s.update(1000);
    s.addBonus(15.6);
    expect(s.current).toBe(SCORE_CFG.pointsPerSecond + 16);
  });

  it('reset() clears the run but keeps the high score', () => {
    const s = new ScoreManager();
    s.update(5000);
    s.commit();
    s.reset();
    expect(s.current).toBe(0);
    expect(s.high).toBe(5 * SCORE_CFG.pointsPerSecond);
  });

  it('commit() persists and reports only a genuine new best', () => {
    const s = new ScoreManager();
    s.update(3000);
    expect(s.commit()).toBe(true); // first run is always a best
    expect(localStorage.getItem(STORAGE_KEYS.HIGH_SCORE)).toBe('30');

    s.reset();
    s.update(1000); // worse run
    expect(s.commit()).toBe(false);
    expect(s.high).toBe(30);
  });

  it('loads a persisted high score on construction', () => {
    localStorage.setItem(STORAGE_KEYS.HIGH_SCORE, '420');
    const s = new ScoreManager();
    expect(s.high).toBe(420);
  });

  it('falls back to 0 high score when storage holds garbage', () => {
    localStorage.setItem(STORAGE_KEYS.HIGH_SCORE, 'not-a-number');
    const s = new ScoreManager();
    expect(s.high).toBe(0);
  });

  it('clamps a tampered negative high score to 0', () => {
    localStorage.setItem(STORAGE_KEYS.HIGH_SCORE, '-500');
    const s = new ScoreManager();
    expect(s.high).toBe(0);
  });

  it('keeps separate high scores per difficulty mode (GME-012)', () => {
    localStorage.clear();

    // CLASSIC best writes the legacy key.
    DifficultyManager.setMode('classic');
    const classic = new ScoreManager();
    classic.update(3000);
    expect(classic.commit()).toBe(true);
    expect(localStorage.getItem(STORAGE_KEYS.HIGH_SCORE)).toBe('30');

    // RELAX has an independent record under its own key.
    DifficultyManager.setMode('relax');
    const relax = new ScoreManager();
    expect(relax.high).toBe(0); // not affected by the classic run
    relax.update(1000);
    expect(relax.commit()).toBe(true);
    expect(localStorage.getItem(STORAGE_KEYS.HIGH_SCORE_RELAX)).toBe('10');
    expect(localStorage.getItem(STORAGE_KEYS.HIGH_SCORE)).toBe('30'); // classic untouched

    DifficultyManager.setMode('classic'); // restore default for any later tests
  });
});
