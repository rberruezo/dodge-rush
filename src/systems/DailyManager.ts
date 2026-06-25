import {
  DAILY_CFG,
  DAILY_MISSIONS,
  MissionKind,
  STORAGE_KEYS
} from '../config/Constants';
import { Profile } from './ProfileManager';

/** Per-run stats the mission tracker reads (best-in-run semantics). */
export interface RunStats {
  passes: number;
  combo: number; // longest combo chain reached
  score: number;
  smash: number;
}

interface MissionState {
  day: string; // YYYY-MM-DD this mission belongs to
  index: number; // into DAILY_MISSIONS
  progress: number; // best metric seen today
  claimed: boolean;
}

interface DailyState {
  lastClaimDay: string | null; // YYYY-MM-DD of the last streak claim
  streak: number; // consecutive-day count
  mission: MissionState | null;
}

const EMPTY: DailyState = { lastClaimDay: null, streak: 0, mission: null };

/** Local calendar day key (YYYY-MM-DD), not UTC, so "today" matches the player. */
function todayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Integer day index for a YYYY-MM-DD key (for gap math). */
function dayNumber(key: string): number {
  return Math.floor(Date.parse(`${key}T00:00:00`) / 86_400_000);
}

/** Stable hash of a string -> non-negative int (deterministic mission pick). */
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/**
 * Daily retention hub: a login-streak coin reward and one rotating daily mission.
 * Pure cosmetic-currency rewards (coins only) — no pay-to-win. localStorage-backed
 * with safe fallbacks. The single source of truth for the Daily screen + GameOver.
 */
class DailyManagerImpl {
  private state: DailyState = { ...EMPTY };

  constructor() {
    this.load();
    this.ensureMission();
  }

  // --- Streak reward ------------------------------------------------------

  /** True if today's streak reward hasn't been claimed yet. */
  canClaimReward(): boolean {
    return this.state.lastClaimDay !== todayKey();
  }

  /** The streak day that *will* apply if claimed right now (1-based). */
  get pendingStreak(): number {
    if (!this.canClaimReward()) return this.state.streak;
    return this.nextStreak();
  }

  get currentStreak(): number {
    return this.state.streak;
  }

  /** Coins awarded for a given (1-based) streak day. */
  rewardFor(streak: number): number {
    const t = DAILY_CFG.streakRewards;
    return t[Math.min(Math.max(streak, 1), t.length) - 1];
  }

  /** Claim today's reward. Returns {coins, streak} or null if already claimed. */
  claimReward(): { coins: number; streak: number } | null {
    if (!this.canClaimReward()) return null;
    const streak = this.nextStreak();
    const coins = this.rewardFor(streak);
    this.state.streak = streak;
    this.state.lastClaimDay = todayKey();
    Profile.addCoins(coins);
    this.save();
    return { coins, streak };
  }

  private nextStreak(): number {
    const last = this.state.lastClaimDay;
    if (!last) return 1;
    const gap = dayNumber(todayKey()) - dayNumber(last);
    // Consecutive day continues the streak; a longer gap restarts it.
    const maxGap = Math.max(1, Math.floor(DAILY_CFG.resetAfterHours / 24));
    return gap >= 1 && gap <= maxGap ? this.state.streak + 1 : 1;
  }

  // --- Daily mission ------------------------------------------------------

  /** Rebuild the mission if it's a new day (deterministic pick per date). */
  private ensureMission(): void {
    const today = todayKey();
    if (this.state.mission?.day === today) return;
    const index = hash(today) % DAILY_MISSIONS.length;
    this.state.mission = { day: today, index, progress: 0, claimed: false };
    this.save();
  }

  get mission() {
    this.ensureMission();
    const m = this.state.mission!;
    const def = DAILY_MISSIONS[m.index];
    return {
      kind: def.kind,
      target: def.target,
      reward: def.reward,
      progress: Math.min(m.progress, def.target),
      label: def.label(def.target),
      completed: m.progress >= def.target,
      claimed: m.claimed
    };
  }

  missionClaimable(): boolean {
    const m = this.mission;
    return m.completed && !m.claimed;
  }

  /** Feed a finished run's stats; bumps the mission's best-in-run progress. */
  reportRun(stats: RunStats): void {
    this.ensureMission();
    const m = this.state.mission!;
    const def = DAILY_MISSIONS[m.index];
    const value = this.metric(def.kind, stats);
    if (value > m.progress) {
      m.progress = value;
      this.save();
    }
  }

  /** Claim the mission reward. Returns coins or null if not claimable. */
  claimMission(): number | null {
    if (!this.missionClaimable()) return null;
    const m = this.state.mission!;
    const def = DAILY_MISSIONS[m.index];
    m.claimed = true;
    Profile.addCoins(def.reward);
    this.save();
    return def.reward;
  }

  private metric(kind: MissionKind, s: RunStats): number {
    switch (kind) {
      case 'passes':
        return s.passes;
      case 'combo':
        return s.combo;
      case 'score':
        return s.score;
      case 'smash':
        return s.smash;
      default:
        return 0;
    }
  }

  /** Anything worth a notification badge on the menu's daily button. */
  hasUnclaimed(): boolean {
    return this.canClaimReward() || this.missionClaimable();
  }

  // --- Persistence --------------------------------------------------------

  private load(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.DAILY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<DailyState>;
        this.state = {
          lastClaimDay: typeof parsed.lastClaimDay === 'string' ? parsed.lastClaimDay : null,
          streak: Number.isFinite(parsed.streak) ? Math.max(0, Math.floor(parsed.streak as number)) : 0,
          mission: parsed.mission ?? null
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
      /* ignore (private mode) */
    }
  }
}

export const Daily = new DailyManagerImpl();
