import { STORAGE_KEYS } from '../config/Constants';
import { ACHIEVEMENT_SKINS, AchievementSkinDef, SKINS } from '../config/Skins';
import { Profile } from './ProfileManager';
import { Daily } from './DailyManager';
import { ScoreManager } from './ScoreManager';
import { Diagnostics } from './Diagnostics';

/**
 * Achievements (GME-GD-007). Five milestones, each unlocking one palette-swap
 * skin (see ACHIEVEMENT_SKINS). Conditions are evaluated against data that
 * already lives in ProfileManager / DailyManager / ScoreManager — this manager
 * only checks, persists which are earned, grants the reward skin, and queues a
 * one-shot unlock notification for the UI to drain.
 */
const CONDITIONS: Record<string, () => boolean> = {
  reach_1000m: () => ScoreManager.bestOverall() >= 1000,
  runs_50: () => Profile.totalRuns >= 50,
  streak_7: () => Daily.currentStreak >= 7,
  reach_phase5: () => ScoreManager.bestOverall() >= 500,
  collect_all_common: () =>
    SKINS.filter((s) => s.tier === 'common').every((s) => Profile.isOwned(s.id))
};

export interface AchievementView {
  def: AchievementSkinDef;
  unlocked: boolean;
}

class AchievementManagerImpl {
  /** Earned achievement ids (the `achievementId`, not the skin id). */
  private unlocked = new Set<string>();
  /** Newly-unlocked rewards awaiting a notification (drained by the UI). */
  private pending: AchievementSkinDef[] = [];

  constructor() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS) ?? '[]') as string[];
      if (Array.isArray(raw)) this.unlocked = new Set(raw);
    } catch (e) {
      Diagnostics.warn('storage', 'achievements read failed — using defaults', e);
    }
  }

  isUnlocked(achievementId: string): boolean {
    return this.unlocked.has(achievementId);
  }

  /**
   * Re-check every condition. Any newly-met achievement is persisted, its reward
   * skin granted, and it's queued for notification. Returns the freshly-earned
   * achievements (also retrievable via takePending()).
   */
  evaluate(): AchievementSkinDef[] {
    const fresh: AchievementSkinDef[] = [];
    for (const a of ACHIEVEMENT_SKINS) {
      if (this.unlocked.has(a.achievementId)) continue;
      const cond = CONDITIONS[a.achievementId];
      if (cond && cond()) {
        this.unlocked.add(a.achievementId);
        Profile.unlock(a.id); // grant the reward skin
        fresh.push(a);
      }
    }
    if (fresh.length) {
      this.pending.push(...fresh);
      this.save();
    }
    return fresh;
  }

  /** Drain queued unlock notifications (shown once by whichever scene picks them up). */
  takePending(): AchievementSkinDef[] {
    const p = this.pending;
    this.pending = [];
    return p;
  }

  /** Every achievement with its unlocked state — for the achievements screen. */
  all(): AchievementView[] {
    return ACHIEVEMENT_SKINS.map((def) => ({ def, unlocked: this.unlocked.has(def.achievementId) }));
  }

  private save(): void {
    try {
      localStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify([...this.unlocked]));
    } catch (e) {
      Diagnostics.warn('storage', 'achievements save failed', e);
    }
  }
}

export const Achievements = new AchievementManagerImpl();
