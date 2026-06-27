import type Phaser from 'phaser';
import { Barrier } from '../objects/Barrier';
import { DifficultySnapshot, DifficultyManager } from './DifficultyManager';
import { GapPlanner } from './GapPlanner';
import { OBSTACLE_CFG, GAME_HEIGHT } from '../config/Constants';

/**
 * Infinite, fair, procedural obstacle stream.
 *
 * - Pools/recycles Barrier instances (no allocation after warm-up).
 * - Picks types by difficulty-weighted random.
 * - Sizes/positions the gap per type, then clamps each gap so it is always
 *   reachable from the previous one within the inter-barrier travel time
 *   (guaranteeing the design's "no unavoidable deaths" rule).
 * - Returns the barriers cleared this frame so the scene can score/combo/FX.
 */
export class ObstacleGenerator {
  private pool: Barrier[] = [];
  private active: Barrier[] = [];
  private planner = new GapPlanner();

  constructor(scene: Phaser.Scene) {
    for (let i = 0; i < OBSTACLE_CFG.poolSize; i++) this.pool.push(new Barrier(scene));
  }

  get barriers(): Barrier[] {
    return this.active;
  }

  reset(snapshot: DifficultySnapshot): void {
    [...this.active].forEach((b) => this.release(b));
    this.planner.reset();
    this.spawnAt(GAME_HEIGHT + OBSTACLE_CFG.bandHeight, snapshot);
  }

  /**
   * Advance the stream. Returns barriers whose centre rose past `playerY` this
   * frame (i.e. cleared) so the caller can award score / combo / effects.
   */
  update(dt: number, snapshot: DifficultySnapshot, playerY: number): Barrier[] {
    const spacing = DifficultyManager.effectiveSpacing(snapshot.speed, snapshot.spacing);
    const rise = snapshot.speed * dt;
    const passed: Barrier[] = [];

    for (let i = this.active.length - 1; i >= 0; i--) {
      const b = this.active[i];
      b.advance(dt, rise);

      if (!b.scored && b.y < playerY) {
        b.scored = true;
        passed.push(b);
      }
      if (b.y < -b.bandHeight) this.release(b);
    }

    // Keep the screen+below populated at the (difficulty-driven) spacing.
    let maxY = this.lowestY();
    while (maxY <= GAME_HEIGHT - spacing) {
      const nextY = maxY + spacing;
      this.spawnAt(nextY, snapshot);
      maxY = nextY;
    }

    return passed;
  }

  private lowestY(): number {
    let maxY = -Infinity;
    for (const b of this.active) maxY = Math.max(maxY, b.y);
    return maxY === -Infinity ? GAME_HEIGHT : maxY;
  }

  private spawnAt(y: number, snapshot: DifficultySnapshot): void {
    const b = this.pool.pop();
    if (!b) return;

    const { def, center, gapWidth, band, amp, omega } = this.planner.plan(snapshot);
    b.spawn(def, y, center, gapWidth, band, amp, omega);
    this.active.push(b);
  }

  private release(b: Barrier): void {
    b.recycle();
    const idx = this.active.indexOf(b);
    if (idx !== -1) this.active.splice(idx, 1);
    this.pool.push(b);
  }

  destroy(): void {
    [...this.active, ...this.pool].forEach((b) => b.destroy());
    this.active = [];
    this.pool = [];
  }
}
