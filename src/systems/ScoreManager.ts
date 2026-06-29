import { SCORE_CFG, STORAGE_KEYS, ZONE_MILESTONES } from '../config/Constants';
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
  private milestoneIdx = 0; // next un-crossed ZONE_MILESTONES entry (GME-GD-006)

  constructor() {
    this.highScore = ScoreManager.load();
  }

  reset(): void {
    this.elapsedMs_ = 0;
    this.bonus = 0;
    this.milestoneIdx = 0;
  }

  /**
   * Zone milestone (GME-GD-006): returns the name of the next milestone the
   * moment the score crosses its threshold, then null until the following one.
   * Call once per frame; each milestone fires exactly once per run.
   */
  pollMilestone(): string | null {
    if (this.milestoneIdx >= ZONE_MILESTONES.length) return null;
    const m = ZONE_MILESTONES[this.milestoneIdx];
    if (this.current >= m.at) {
      this.milestoneIdx++;
      return m.name;
    }
    return null;
  }

  /** Advance the survival clock. `dt` is the frame delta in milliseconds. */
  update(dt: number): void {
    this.elapsedMs_ += dt;
  }

  /** Award arbitrary bonus points (combo-multiplied passes, golden rewards…). */
  addBonus(points: number): void {
    this.bonus += Math.round(points);
  }

  /**
   * Risk↔reward bonus (GME-017): a narrower gap pays more. Scales linearly from
   * 0 at `riskGapWide` up to the full `riskGapBonus` at/below `riskGapNarrow`,
   * then multiplied by the active combo multiplier. Pure + clamped to ≥ 0, so it
   * only ever rewards — wide gaps simply pay nothing and Relax is never punished.
   */
  static narrowGapBonus(gapWidth: number, multiplier = 1): number {
    const { riskGapBonus, riskGapWide, riskGapNarrow } = SCORE_CFG;
    const span = riskGapWide - riskGapNarrow;
    if (span <= 0) return 0;
    const t = (riskGapWide - gapWidth) / span;
    const tightness = t < 0 ? 0 : t > 1 ? 1 : t;
    return riskGapBonus * tightness * multiplier;
  }

  /**
   * Fork bonus (GME-017): extra points for taking the HARD gap of a fork instead
   * of the safe one. A floor of 60% is always paid for committing, scaling up to
   * 100% as the two gaps sit `forkSeparationRef` px apart (the farther the gamble,
   * the bigger the reward), then × the combo multiplier. Pure + clamped to ≥ 0.
   */
  static forkBonus(separation: number, multiplier = 1): number {
    const { forkChoiceBonus, forkSeparationRef } = SCORE_CFG;
    const s = forkSeparationRef <= 0 ? 1 : separation / forkSeparationRef;
    const reach = s < 0 ? 0 : s > 1 ? 1 : s;
    return forkChoiceBonus * (0.6 + 0.4 * reach) * multiplier;
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

  /** Read + sanitise a stored high score by key (NaN/negative -> 0). */
  private static readKey(key: string): number {
    try {
      const v = parseInt(localStorage.getItem(key) ?? '0', 10);
      return Number.isFinite(v) && v > 0 ? v : 0;
    } catch (e) {
      Diagnostics.warn('storage', 'high-score read failed', e);
      return 0;
    }
  }

  private static load(): number {
    return ScoreManager.readKey(ScoreManager.highScoreKey());
  }

  /** Best score across ALL modes — used by cross-mode achievements (GME-GD-007). */
  static bestOverall(): number {
    return Math.max(
      ScoreManager.readKey(STORAGE_KEYS.HIGH_SCORE),
      ScoreManager.readKey(STORAGE_KEYS.HIGH_SCORE_RELAX)
    );
  }

  private static save(value: number): void {
    try {
      localStorage.setItem(ScoreManager.highScoreKey(), String(value));
    } catch (e) {
      Diagnostics.warn('storage', 'high-score save failed', e); // private mode, quota, etc.
    }
  }
}
