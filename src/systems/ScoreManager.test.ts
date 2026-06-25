import { describe, it, expect } from 'vitest';
import { ScoreManager } from './ScoreManager';
import { SCORE_CFG, STORAGE_KEYS } from '../config/Constants';

describe('ScoreManager', () => {
  it('scores survival time at pointsPerSecond', () => {
    const s = new ScoreManager();
    s.update(2000); // 2 seconds
    expect(s.current).toBe(2 * SCORE_CFG.pointsPerSecond);
    expect(s.elapsedSeconds).toBe(2);
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
});
