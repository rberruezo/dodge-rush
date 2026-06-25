import { describe, it, expect } from 'vitest';
import { ComboManager } from './ComboManager';
import { COMBO_CFG } from '../config/Constants';

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

  it('climbs through the tier table to the x200 cap', () => {
    const expectAtCount = (n: number, mult: number) => {
      const cm = new ComboManager();
      for (let i = 0; i < n; i++) cm.increment();
      expect(cm.multiplier).toBe(mult);
    };
    expectAtCount(4, 3);
    expectAtCount(7, 5);
    expectAtCount(12, 10);
    expectAtCount(20, 20);
    expectAtCount(50, 35);
    expectAtCount(100, 60);
    expectAtCount(500, 200);
    // Past the top tier it should hold at the cap, never exceed it.
    expectAtCount(900, 200);
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
    for (let i = 0; i < 500; i++) c.increment(); // x200 -> huge raw bonus
    expect(c.speedBonus).toBe(COMBO_CFG.speedBonusMax);
    expect(c.speedBonus).toBeLessThanOrEqual(COMBO_CFG.speedBonusMax);
  });
});
