import { SCORE_CFG, STORAGE_KEYS } from '../config/Constants';

/**
 * Owns the run score (survival time + pass bonuses) and the persisted high score.
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

  private static load(): number {
    try {
      return parseInt(localStorage.getItem(STORAGE_KEYS.HIGH_SCORE) ?? '0', 10) || 0;
    } catch {
      return 0;
    }
  }

  private static save(value: number): void {
    try {
      localStorage.setItem(STORAGE_KEYS.HIGH_SCORE, String(value));
    } catch {
      /* ignore storage failures (private mode, etc.) */
    }
  }
}
