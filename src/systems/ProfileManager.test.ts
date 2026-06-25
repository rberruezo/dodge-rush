import { describe, it, expect, beforeEach, vi } from 'vitest';
import { STORAGE_KEYS } from '../config/Constants';

// `Profile` is a module singleton constructed on import (it reads localStorage
// once). To test how it loads different stored values we reset the module
// registry and re-import a fresh instance per case.
async function freshProfile() {
  vi.resetModules();
  // resetModules yields a fresh Diagnostics singleton (mirror defaults on);
  // silence it before ProfileManager's module-load constructor may warn.
  const diag = await import('./Diagnostics');
  diag.Diagnostics.setConsoleMirror(false);
  const mod = await import('./ProfileManager');
  return mod.Profile;
}

describe('ProfileManager — persisted balance sanitization', () => {
  beforeEach(() => localStorage.clear());

  it('loads a valid stored coin balance', async () => {
    localStorage.setItem(STORAGE_KEYS.COINS, '350');
    const p = await freshProfile();
    expect(p.coins).toBe(350);
  });

  it('clamps a tampered NEGATIVE balance to 0', async () => {
    localStorage.setItem(STORAGE_KEYS.COINS, '-999999');
    const p = await freshProfile();
    expect(p.coins).toBe(0);
  });

  it('rejects a non-numeric balance, falling back to 0', async () => {
    localStorage.setItem(STORAGE_KEYS.COINS, 'free-money');
    const p = await freshProfile();
    expect(p.coins).toBe(0);
  });

  it('survives corrupt JSON in owned-skins / selected-skin', async () => {
    localStorage.setItem(STORAGE_KEYS.OWNED_SKINS, '{bad json');
    localStorage.setItem(STORAGE_KEYS.SELECTED_SKIN, 'does-not-exist');
    const p = await freshProfile();
    expect(p.isOwned('classic')).toBe(true); // default always owned
    expect(p.selected).toBe('classic'); // unknown selection ignored
  });

  it('never spends below zero and only sells owned skins', async () => {
    localStorage.setItem(STORAGE_KEYS.COINS, '100');
    const p = await freshProfile();
    expect(p.buy('aqua')).toBe(false); // aqua costs 120 > 100
    expect(p.coins).toBe(100); // balance untouched on a failed buy
  });
});
