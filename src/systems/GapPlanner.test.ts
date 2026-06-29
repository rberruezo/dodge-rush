import { describe, it, expect } from 'vitest';
import { GapPlanner } from './GapPlanner';
import { DifficultyManager } from './DifficultyManager';
import { OBSTACLE_CFG, FORK_CFG, PLAYER_CFG, GAME_WIDTH } from '../config/Constants';

/** Deterministic PRNG so each test run produces an identical obstacle stream. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const PLAYER_WIDTH = PLAYER_CFG.displayWidth * PLAYER_CFG.hitboxScaleX;

describe('GapPlanner — fairness contract (GP-04)', () => {
  it('produces gaps that are on-screen, player-sized and always reachable', () => {
    const planner = new GapPlanner(mulberry32(1337));

    // Walk a full difficulty ramp (0 -> 300s covers all 8 steps), planning a
    // barrier roughly every spacing-worth of travel.
    for (let t = 0; t <= 300; t += 0.5) {
      const snap = DifficultyManager.sample(t);
      const prevCenter = planner.lastCenter;
      const g = planner.plan(snap);

      const half = g.gapWidth / 2;

      // 1. The player physically fits through every gap.
      expect(g.gapWidth).toBeGreaterThanOrEqual(PLAYER_WIDTH);

      // 2. The whole gap (incl. oscillation) stays inside the playfield padding.
      const leftMost = g.center - g.amp - half;
      const rightMost = g.center + g.amp + half;
      expect(leftMost).toBeGreaterThanOrEqual(OBSTACLE_CFG.edgePadding - 1e-6);
      expect(rightMost).toBeLessThanOrEqual(GAME_WIDTH - OBSTACLE_CFG.edgePadding + 1e-6);

      // 3. The gap never shifts further than the player can travel in time.
      const spacing = DifficultyManager.effectiveSpacing(snap.speed, snap.spacing);
      const travelTime = spacing / snap.speed;
      const maxShift = PLAYER_CFG.moveSpeed * travelTime * OBSTACLE_CFG.reachFactor;
      expect(Math.abs(g.center - prevCenter)).toBeLessThanOrEqual(maxShift + 1e-6);
    }
  });

  it('is deterministic: same seed -> identical centre sequence', () => {
    const run = (seed: number) => {
      const p = new GapPlanner(mulberry32(seed));
      const out: number[] = [];
      for (let t = 0; t <= 60; t += 1) out.push(p.plan(DifficultyManager.sample(t)).center);
      return out;
    };
    expect(run(42)).toEqual(run(42));
    expect(run(42)).not.toEqual(run(99));
  });

  it('reset() recentres the stream to mid-screen', () => {
    const p = new GapPlanner(mulberry32(7));
    for (let t = 0; t <= 30; t += 1) p.plan(DifficultyManager.sample(t));
    p.reset();
    expect(p.lastCenter).toBe(GAME_WIDTH / 2);
  });

  it('only ever picks valid, weighted obstacle types', () => {
    const p = new GapPlanner(mulberry32(2024));
    for (let t = 0; t <= 240; t += 2) {
      const def = p.plan(DifficultyManager.sample(t)).def;
      expect(def).toBeDefined();
      expect(def.gapFactor).toBeGreaterThan(0);
    }
  });
});

describe('GapPlanner — risk↔reward fork (GME-017)', () => {
  it('carves a second, harder gap that stays fair and separated', () => {
    const planner = new GapPlanner(mulberry32(99));
    let forks = 0;

    for (let t = 0; t <= 300; t += 0.5) {
      const g = planner.plan(DifficultyManager.sample(t));
      if (!g.fork) continue;
      forks++;

      const easyL = g.center - g.gapWidth / 2;
      const easyR = g.center + g.gapWidth / 2;
      const hardL = g.fork.center - g.fork.width / 2;
      const hardR = g.fork.center + g.fork.width / 2;

      // The hard gap is passable but tighter than the easy one.
      expect(g.fork.width).toBeGreaterThanOrEqual(PLAYER_WIDTH);
      expect(g.fork.width).toBeLessThan(g.gapWidth);

      // Both gaps sit fully inside the playfield padding.
      expect(Math.min(easyL, hardL)).toBeGreaterThanOrEqual(OBSTACLE_CFG.edgePadding - 1e-6);
      expect(Math.max(easyR, hardR)).toBeLessThanOrEqual(GAME_WIDTH - OBSTACLE_CFG.edgePadding + 1e-6);

      // The two gaps never overlap and keep a min-width solid pillar between them.
      const pillar = hardL > easyR ? hardL - easyR : easyL - hardR;
      expect(pillar).toBeGreaterThanOrEqual(FORK_CFG.minPillar - 1e-6);

      // Forks are static so the choice reads clearly.
      expect(g.amp).toBe(0);
    }

    // The chosen seed/ramp must actually exercise the fork path.
    expect(forks).toBeGreaterThan(0);
  });

  it('only forks when the easy gap is wide enough to host one', () => {
    const p = new GapPlanner(mulberry32(2025));
    for (let t = 0; t <= 200; t += 0.5) {
      const g = p.plan(DifficultyManager.sample(t));
      if (g.fork) expect(g.gapWidth).toBeGreaterThanOrEqual(FORK_CFG.minEasyGap);
    }
  });
});
