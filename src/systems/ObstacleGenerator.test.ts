import { describe, it, expect, vi } from 'vitest';

// Stub the Phaser-backed Barrier so the generator can be built under Node.
vi.mock('../objects/Barrier', () => ({
  Barrier: class {
    recycle(): void {}
    destroy(): void {}
  }
}));

import { ObstacleGenerator } from './ObstacleGenerator';

interface MockBarrier {
  y: number;
  scored: boolean;
  recycle: () => void;
}
const mb = (y: number, scored = false): MockBarrier => ({ y, scored, recycle: () => {} });

// Build a generator, then inject a known active set (bypassing the spawner).
function genWith(active: MockBarrier[]): ObstacleGenerator {
  const gen = new ObstacleGenerator({} as never);
  (gen as unknown as { active: MockBarrier[] }).active = active;
  (gen as unknown as { pool: MockBarrier[] }).pool = [];
  return gen;
}

describe('ObstacleGenerator.breakNext (smash power)', () => {
  it('breaks the nearest un-passed barrier (smallest y)', () => {
    const near = mb(200);
    const far = mb(500);
    const gen = genWith([far, near]);

    const broken = gen.breakNext() as unknown as MockBarrier;
    expect(broken).toBe(near);
    expect(broken.scored).toBe(true); // marked so it can't double-count as a pass
    expect(gen.barriers).not.toContain(near as never);
    expect(gen.barriers).toContain(far as never);
  });

  it('skips already-passed barriers', () => {
    const passed = mb(100, true);
    const next = mb(300);
    const gen = genWith([passed, next]);
    expect(gen.breakNext()).toBe(next as never);
  });

  it('returns null when there is nothing left to break', () => {
    expect(genWith([]).breakNext()).toBeNull();
    expect(genWith([mb(100, true)]).breakNext()).toBeNull(); // only passed barriers
  });

  it('recycles the broken barrier back into the pool', () => {
    const b = mb(150);
    const gen = genWith([b]);
    gen.breakNext();
    expect((gen as unknown as { pool: MockBarrier[] }).pool).toContain(b);
  });
});
