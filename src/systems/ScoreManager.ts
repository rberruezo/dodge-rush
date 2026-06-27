import { SCORE_CFG, STORAGE_KEYS } from '../config/Constants';
import { DifficultyManager } from './DifficultyManager';
import { Diagnostics } from './Diagnostics';

/**
 * Owns the run score (survival time + pass bonuses) and the persisted high score.
 * The high score is kept PER difficulty mode (GME-012 / DEC-007 option B): CLASSIC
 * and RELAX have independent records, so a relaxed run never tops a classic best.
 * Pure data/logic — no rendering — so it is trivial to unit test or reuse.
 */
export class ScoreManager {
  private elapsedMs_ = 0;
  private bonus = 0;
  private highScore = 0;

  constructor() {
    this.highScore = ScoreManager.load();
  }

  reset(): void {
    this.elapsedMs_ = 0;
    this.bonus = 0;
  }

  /** Advance the survival clock. `dt` is the frame delta in milliseconds. */
  update(dt: number): void {
    this.elapsedMs_ += dt;
  }

  /** Award arbitrary bonus points (combo-multiplied passes, golden rewards…). */
  addBonus(points: number): void {
    this.bonus += Math.round(points);
  }

  get elapsedMs(): number {
    return this.elapsedMs_;
  }

  get current(): number {
    const timeScore = Math.floor((this.elapsedMs_ / 1000) * SCORE_CFG.pointsPerSecond);
    return timeScore + this.bonus;
  }

  get elapsedSeconds(): number {
    return this.elapsedMs_ / 1000;
  }

  get high(): number {
    return this.highScore;
  }

  /** Persist if the finished run beat the record. Returns true on a new best. */
  commit(): boolean {
    const score = this.current;
    if (score > this.highScore) {
      this.highScore = score;
      ScoreManager.save(score);
      return true;
    }
    return false;
  }

  /** localStorage key for the active mode's record (CLASSIC keeps the legacy key). */
  private static highScoreKey(): string {
    return DifficultyManager.mode.id === 'relax'
      ? STORAGE_KEYS.HIGH_SCORE_RELAX
      : STORAGE_KEYS.HIGH_SCORE;
  }

  private static load(): number {
    try {
      // Reject NaN / negative high scores (tampered or corrupt storage).
      const v = parseInt(localStorage.getItem(ScoreManager.highScoreKey()) ?? '0', 10);
      return Number.isFinite(v) && v > 0 ? v : 0;
    } catch (e) {
      Diagnostics.warn('storage', 'high-score read failed', e);
      return 0;
    }
  }

  private static save(value: number): void {
    try {
      localStorage.setItem(ScoreManager.highScoreKey(), String(value));
    } catch (e) {
      Diagnostics.warn('storage', 'high-score save failed', e); // private mode, quota, etc.
    }
  }
}
