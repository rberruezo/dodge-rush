import { STORAGE_KEYS } from '../config/Constants';
import { SKINS } from '../config/Skins';

/** A recorded best-run path: the player's x sampled every `dt` ms. */
export interface GhostData {
  dt: number;
  xs: number[];
  score: number;
}

/**
 * Persistent player profile: coins, owned/selected skins, and the best-run
 * "ghost" path. All localStorage-backed, with safe fallbacks in private mode.
 */
class ProfileManagerImpl {
  private coins_ = 0;
  private owned = new Set<string>(['classic']);
  private selected_ = 'classic';

  constructor() {
    try {
      this.coins_ = parseInt(localStorage.getItem(STORAGE_KEYS.COINS) ?? '0', 10) || 0;
      const owned = JSON.parse(localStorage.getItem(STORAGE_KEYS.OWNED_SKINS) ?? '[]') as string[];
      this.owned = new Set(['classic', ...owned]);
      const sel = localStorage.getItem(STORAGE_KEYS.SELECTED_SKIN);
      if (sel && this.owned.has(sel)) this.selected_ = sel;
    } catch {
      /* defaults */
    }
  }

  get coins(): number {
    return this.coins_;
  }

  get selected(): string {
    return this.selected_;
  }

  isOwned(id: string): boolean {
    return this.owned.has(id);
  }

  addCoins(n: number): void {
    this.coins_ += Math.max(0, Math.round(n));
    this.save(STORAGE_KEYS.COINS, String(this.coins_));
  }

  /** Try to buy a skin; returns true on success. */
  buy(id: string): boolean {
    const skin = SKINS.find((s) => s.id === id);
    if (!skin || this.owned.has(id) || this.coins_ < skin.cost) return false;
    this.coins_ -= skin.cost;
    this.owned.add(id);
    this.save(STORAGE_KEYS.COINS, String(this.coins_));
    this.save(STORAGE_KEYS.OWNED_SKINS, JSON.stringify([...this.owned]));
    return true;
  }

  select(id: string): void {
    if (!this.owned.has(id)) return;
    this.selected_ = id;
    this.save(STORAGE_KEYS.SELECTED_SKIN, id);
  }

  // --- Ghost --------------------------------------------------------------
  loadGhost(): GhostData | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.GHOST);
      return raw ? (JSON.parse(raw) as GhostData) : null;
    } catch {
      return null;
    }
  }

  saveGhost(data: GhostData): void {
    this.save(STORAGE_KEYS.GHOST, JSON.stringify(data));
  }

  private save(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* ignore */
    }
  }
}

export const Profile = new ProfileManagerImpl();
