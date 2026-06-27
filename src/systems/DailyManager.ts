import {
  DAILY_CFG,
  DAILY_MISSIONS,
  MissionDef,
  MissionDifficulty,
  MissionKind,
  STORAGE_KEYS
} from '../config/Constants';
import { Profile } from './ProfileManager';
import { FEATURES } from '../config/FeatureFlags';

/** Per-run stats the mission tracker reads. */
export interface RunStats {
  passes: number;
  combo: number; // longest combo chain reached in this run
  score: number;
}

interface MissionState {
  day: string;       // YYYY-MM-DD this set of missions belongs to
  indices: {         // index into DAILY_MISSIONS per difficulty tier
    easy: number;
    medium: number;
    hard: number;
  };
  progress: {        // accumulated metric per tier (best-run for hard, cumulative for easy/medium)
    easy: number;
    medium: number;
    hard: number;
  };
  claimed: {         // whether the reward has been collected
    easy: boolean;
    medium: boolean;
    hard: boolean;
  };
}

interface DailyState {
  lastClaimDay: string | null;
  streak: number;
  missions: MissionState | null;
}

const EMPTY: DailyState = { lastClaimDay: null, streak: 0, missions: null };
const DIFFICULTIES: MissionDifficulty[] = ['easy', 'medium', 'hard'];

function todayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function dayNumber(key: string): number {
  return Math.floor(Date.parse(`${key}T00:00:00`) / 86_400_000);
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/**
 * Pick one mission index per difficulty tier for a given day key.
 * Guarantees no two tiers share the same MissionKind on the same day.
 */
function pickMissions(dayStr: string): { easy: number; medium: number; hard: number } {
  const pool = (diff: MissionDifficulty) =>
    DAILY_MISSIONS.map((m, i) => ({ m, i })).filter(({ m }) => m.difficulty === diff);

  const easyPool   = pool('easy');
  const mediumPool = pool('medium');
  const hardPool   = pool('hard');

  const easyIdx   = hash(dayStr + 'e') % easyPool.length;
  const easyKind  = easyPool[easyIdx].m.kind;

  // Medium must differ in kind from easy.
  const medFiltered = mediumPool.filter(({ m }) => m.kind !== easyKind);
  const medPool2    = medFiltered.length > 0 ? medFiltered : mediumPool;
  const medIdx      = hash(dayStr + 'm') % medPool2.length;
  const medKind     = medPool2[medIdx].m.kind;

  // Hard must differ in kind from both easy and medium.
  const hardFiltered = hardPool.filter(({ m }) => m.kind !== easyKind && m.kind !== medKind);
  const hardPool2    = hardFiltered.length > 0 ? hardFiltered : hardPool;
  const hardIdx      = hash(dayStr + 'h') % hardPool2.length;

  return {
    easy:   easyPool[easyIdx].i,
    medium: medPool2[medIdx].i,
    hard:   hardPool2[hardIdx].i,
  };
}

export interface MissionView {
  difficulty: MissionDifficulty;
  kind: MissionKind;
  target: number;
  reward: number;         // coins; 0 for hard (hard rewards a spin instead)
  hardRewardsSpin: boolean;
  progress: number;       // capped at target
  label: string;
  completed: boolean;
  claimed: boolean;
}

/**
 * Daily retention hub: login-streak coin reward + three rotating daily missions
 * (easy / medium / hard). Hard missions reward a free spin instead of coins.
 * All rewards are cosmetic-currency only — no pay-to-win.
 */
class DailyManagerImpl {
  private state: DailyState = { ...EMPTY };

  constructor() {
    this.load();
    this.ensureMissions();
  }

  // --- Streak reward -------------------------------------------------------

  canClaimReward(): boolean {
    return this.state.lastClaimDay !== todayKey();
  }

  get pendingStreak(): number {
    return this.canClaimReward() ? this.nextStreak() : this.state.streak;
  }

  get currentStreak(): number {
    return this.state.streak;
  }

  rewardFor(streak: number): number {
    const t = DAILY_CFG.streakRewards;
    return t[Math.min(Math.max(streak, 1), t.length) - 1];
  }

  claimReward(): { coins: number; streak: number } | null {
    if (!this.canClaimReward()) return null;
    const streak = this.nextStreak();
    const coins  = this.rewardFor(streak);
    this.state.streak       = streak;
    this.state.lastClaimDay = todayKey();
    Profile.addCoins(coins);
    this.save();
    return { coins, streak };
  }

  private nextStreak(): number {
    const last = this.state.lastClaimDay;
    if (!last) return 1;
    const gap    = dayNumber(todayKey()) - dayNumber(last);
    const maxGap = Math.max(1, Math.floor(DAILY_CFG.resetAfterHours / 24));
    return gap >= 1 && gap <= maxGap ? this.state.streak + 1 : 1;
  }

  // --- Daily missions ------------------------------------------------------

  private ensureMissions(): void {
    const today = todayKey();
    if (this.state.missions?.day === today) return;
    const indices = pickMissions(today);
    this.state.missions = {
      day: today,
      indices,
      progress: { easy: 0, medium: 0, hard: 0 },
      claimed:  { easy: false, medium: false, hard: false },
    };
    this.save();
  }

  private defFor(diff: MissionDifficulty): MissionDef {
    this.ensureMissions();
    return DAILY_MISSIONS[this.state.missions!.indices[diff]];
  }

  missionView(diff: MissionDifficulty): MissionView {
    this.ensureMissions();
    const ms  = this.state.missions!;
    const def = this.defFor(diff);
    const prog = Math.min(ms.progress[diff], def.target);
    return {
      difficulty:       diff,
      kind:             def.kind,
      target:           def.target,
      reward:           def.reward,
      hardRewardsSpin:  diff === 'hard',
      progress:         prog,
      label:            def.label(def.target),
      completed:        ms.progress[diff] >= def.target,
      claimed:          ms.claimed[diff],
    };
  }

  /** All three mission views for the current day. */
  get missions(): MissionView[] {
    return DIFFICULTIES.map((d) => this.missionView(d));
  }

  missionClaimable(diff: MissionDifficulty): boolean {
    const v = this.missionView(diff);
    return v.completed && !v.claimed;
  }

  /**
   * Feed a finished run's stats. Easy and medium accumulate across runs;
   * hard uses best-in-run semantics (only updates if the run's metric exceeds
   * the previous best) so the challenge stays meaningful.
   */
  reportRun(stats: RunStats): void {
    if (!FEATURES.DAILY_ENABLED) return; // disabled in MVP v1.0
    this.ensureMissions();
    const ms = this.state.missions!;
    let dirty = false;

    for (const diff of DIFFICULTIES) {
      const def   = this.defFor(diff);
      const value = this.metric(def.kind, stats);

      if (diff === 'hard') {
        // Best-in-run: only store the highest value seen today.
        if (value > ms.progress[diff]) {
          ms.progress[diff] = value;
          dirty = true;
        }
      } else {
        // Cumulative: add this run's contribution.
        ms.progress[diff] += value;
        dirty = true;
      }
    }

    if (dirty) this.save();
  }

  /**
   * Claim a completed mission.
   * - Easy/medium: returns { coins } and credits them to the profile.
   * - Hard: returns { spin: true } — the caller is responsible for triggering
   *   the rewarded spin UI (the reward is structural, not a coin amount).
   */
  claimMission(diff: MissionDifficulty): { coins: number; spin?: boolean } | null {
    if (!this.missionClaimable(diff)) return null;
    const ms  = this.state.missions!;
    const def = this.defFor(diff);
    ms.claimed[diff] = true;
    this.save();

    if (diff === 'hard') {
      return { coins: 0, spin: true };
    }
    Profile.addCoins(def.reward);
    return { coins: def.reward };
  }

  /** True if any mission or the streak reward has an uncollected reward. */
  hasUnclaimed(): boolean {
    return (
      this.canClaimReward() ||
      DIFFICULTIES.some((d) => this.missionClaimable(d))
    );
  }

  private metric(kind: MissionKind, s: RunStats): number {
    switch (kind) {
      case 'passes': return s.passes;
      case 'combo':  return s.combo;
      case 'score':  return s.score;
      default:       return 0;
    }
  }

  // --- Persistence ---------------------------------------------------------

  private load(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.DAILY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<DailyState>;
        this.state = {
          lastClaimDay: typeof parsed.lastClaimDay === 'string' ? parsed.lastClaimDay : null,
          streak:       Number.isFinite(parsed.streak) ? Math.max(0, Math.floor(parsed.streak as number)) : 0,
          missions:     parsed.missions ?? null,
        };
      }
    } catch {
      this.state = { ...EMPTY };
    }
  }

  private save(): void {
    try {
      localStorage.setItem(STORAGE_KEYS.DAILY, JSON.stringify(this.state));
    } catch {
      /* ignore (private/incognito mode) */
    }
  }
}

export const Daily = new DailyManagerImpl();
