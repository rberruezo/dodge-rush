import { describe, it, expect } from 'vitest';
import { ComboManager } from './ComboManager';
import { COMBO_CFG, COMBO_TIERS, COMBO_STATIC_MAX } from '../config/Constants';

describe('ComboManager', () => {
  it('starts at combo 0 with multiplier x1', () => {
    const c = new ComboManager();
    expect(c.combo).toBe(0);
    expect(c.multiplier).toBe(1);
    expect(c.speedBonus).toBe(0);
  });

  it('stays at x1 for the first pass and jumps to x2 on the second', () => {
    const c = new ComboManager();
    const first = c.increment();
    expect(first.count).toBe(1);
    expect(first.multiplier).toBe(1);
    expect(first.tierUp).toBe(false);

    const second = c.increment();
    expect(second.count).toBe(2);
    expect(second.multiplier).toBe(2);
    expect(second.tierUp).toBe(true);
  });

  it('multiplier matches every entry in COMBO_TIERS exactly at its threshold', () => {
    // Derives expectations from the live tier table so the test never drifts
    // when the balance designer updates COMBO_TIERS.
    for (const tier of COMBO_TIERS) {
      const cm = new ComboManager();
      for (let i = 0; i < tier.at; i++) cm.increment();
      expect(cm.multiplier, `at combo ${tier.at}`).toBe(tier.mult);
    }
  });

  it('multiplier is monotonically non-decreasing across the whole static table', () => {
    const cm = new ComboManager();
    let prev = 1;
    for (let i = 0; i < COMBO_STATIC_MAX; i++) {
      cm.increment();
      expect(cm.multiplier).toBeGreaterThanOrEqual(prev);
      prev = cm.multiplier;
    }
  });

  it('reset() returns to combo 0 / x1', () => {
    const c = new ComboManager();
    for (let i = 0; i < 30; i++) c.increment();
    expect(c.multiplier).toBeGreaterThan(1);
    c.reset();
    expect(c.combo).toBe(0);
    expect(c.multiplier).toBe(1);
    expect(c.speedBonus).toBe(0);
  });

  it('caps the combo speed bonus at speedBonusMax', () => {
    const c = new ComboManager();
    // Drive to a high tier (well past the lowest tier that would hit the cap).
    for (let i = 0; i < 500; i++) c.increment();
    expect(c.speedBonus).toBe(COMBO_CFG.speedBonusMax);
    expect(c.speedBonus).toBeLessThanOrEqual(COMBO_CFG.speedBonusMax);
  });
});
