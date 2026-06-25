import { STORAGE_KEYS } from '../config/Constants';
import { SKINS } from '../config/Skins';
import { Diagnostics } from './Diagnostics';

/**
 * Persistent player profile: coins and owned/selected skins. All
 * localStorage-backed, with safe fallbacks in private mode.
 */
class ProfileManagerImpl {
  private coins_ = 0;
  private owned = new Set<string>(['classic']);
  private selected_ = 'classic';

  constructor() {
    try {
      // Sanitize the persisted balance: reject NaN, negatives and non-integers
      // (private-mode noise or a tampered localStorage value) -> fall back to 0.
      const storedCoins = parseInt(localStorage.getItem(STORAGE_KEYS.COINS) ?? '0', 10);
      this.coins_ = Number.isFinite(storedCoins) && storedCoins > 0 ? Math.floor(storedCoins) : 0;
      const owned = JSON.parse(localStorage.getItem(STORAGE_KEYS.OWNED_SKINS) ?? '[]') as string[];
      this.owned = new Set(['classic', ...owned]);
      const sel = localStorage.getItem(STORAGE_KEYS.SELECTED_SKIN);
      if (sel && this.owned.has(sel)) this.selected_ = sel;
    } catch (e) {
      Diagnostics.warn('storage', 'profile read failed — using defaults', e);
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

  private save(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      Diagnostics.warn('storage', `profile save failed (${key})`, e);
    }
  }
}

export const Profile = new ProfileManagerImpl();
