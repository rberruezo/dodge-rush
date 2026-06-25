import { describe, it, expect } from 'vitest';
import { CollisionSystem } from './CollisionSystem';
import type { Player } from '../objects/Player';
import type { Barrier } from '../objects/Barrier';

// Lightweight duck-typed doubles — CollisionSystem only reads the shapes below,
// so we avoid constructing real Phaser game objects.
const makePlayer = (x: number, y: number, halfW = 18, halfH = 22): Player =>
  ({ getHitbox: () => ({ x, y, halfW, halfH }) }) as unknown as Player;

const makeBarrier = (over: Partial<Barrier>): Barrier =>
  ({
    active: true,
    y: 100,
    bandHeight: 88,
    gapX: 270,
    gapWidth: 200,
    ...over
  }) as unknown as Barrier;

describe('CollisionSystem.check', () => {
  it('returns null when the player is vertically clear of every barrier', () => {
    const player = makePlayer(270, 500); // far below the barrier band
    const barrier = makeBarrier({ y: 100 });
    expect(CollisionSystem.check(player, [barrier])).toBeNull();
  });

  it('returns null when the player is fully inside the gap during overlap', () => {
    const player = makePlayer(270, 100); // centered in the gap, same y as band
    const barrier = makeBarrier({ y: 100, gapX: 270, gapWidth: 200 });
    expect(CollisionSystem.check(player, [barrier])).toBeNull();
  });

  it('collides when any part of the player overhangs the gap edge', () => {
    // gap spans [170, 370]; player right edge at 388 pokes into the wall.
    const player = makePlayer(370, 100, 18, 22);
    const barrier = makeBarrier({ y: 100, gapX: 270, gapWidth: 200 });
    expect(CollisionSystem.check(player, [barrier])).toBe(barrier);
  });

  it('ignores inactive (pooled/recycled) barriers', () => {
    const player = makePlayer(0, 100); // would collide if it were active
    const barrier = makeBarrier({ y: 100, active: false });
    expect(CollisionSystem.check(player, [barrier])).toBeNull();
  });

  it('does not collide when only touching at the band edge (no real overlap)', () => {
    // player bottom exactly at band top -> treated as clear (strict inequality).
    const barrier = makeBarrier({ y: 100, bandHeight: 88 }); // band top = 56
    const player = makePlayer(0, 56 - 22, 18, 22); // bottom edge == 56
    expect(CollisionSystem.check(player, [barrier])).toBeNull();
  });

  it('reports the first colliding barrier when several are active', () => {
    const player = makePlayer(0, 100, 18, 22); // outside both gaps
    const a = makeBarrier({ y: 100, gapX: 270 });
    const b = makeBarrier({ y: 105, gapX: 270 });
    expect(CollisionSystem.check(player, [a, b])).toBe(a);
  });

  it('FAIRNESS: a gap narrower than the player is an unavoidable collision', () => {
    // Documents the contract the ObstacleGenerator must honor: gapWidth must
    // always exceed the player width, or no horizontal position is survivable.
    const halfW = 18;
    const narrowGap = makeBarrier({ y: 100, gapX: 270, gapWidth: halfW }); // < player width
    for (let x = 0; x <= 540; x += 5) {
      const player = makePlayer(x, 100, halfW, 22);
      if (CollisionSystem.check(player, [narrowGap]) === null) {
        throw new Error(`Unexpected safe position at x=${x} for a sub-player-width gap`);
      }
    }
    expect(true).toBe(true);
  });
});
