/**
 * Vitest global setup.
 *
 * The game persists player data in localStorage. Tests run under Node (no DOM),
 * so we install a minimal in-memory localStorage so storage-backed systems
 * (ScoreManager, ProfileManager) can be exercised deterministically.
 */
import { beforeEach, vi } from 'vitest';
import { Diagnostics } from '../src/systems/Diagnostics';

// Keep diagnostics quiet during tests (the systems under test deliberately
// trigger storage/asset failures).
Diagnostics.setConsoleMirror(false);

class MemoryStorage {
  private store = new Map<string, string>();
  get length(): number {
    return this.store.size;
  }
  clear(): void {
    this.store.clear();
  }
  getItem(key: string): string | null {
    return this.store.has(key) ? (this.store.get(key) as string) : null;
  }
  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
  key(i: number): string | null {
    return [...this.store.keys()][i] ?? null;
  }
}

vi.stubGlobal('localStorage', new MemoryStorage());

// Each test starts from a clean storage slate.
beforeEach(() => {
  localStorage.clear();
});
