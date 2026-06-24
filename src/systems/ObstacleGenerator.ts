import Phaser from 'phaser';
import { Barrier } from '../objects/Barrier';
import { DifficultySnapshot, DifficultyManager } from './DifficultyManager';
import { ObstacleType, ObstacleTypeDef, OBSTACLE_TYPES } from '../config/ObstacleTypes';
import { OBSTACLE_CFG, PLAYER_CFG, GAME_WIDTH, GAME_HEIGHT } from '../config/Constants';

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
  private lastGapX = GAME_WIDTH / 2;

  constructor(scene: Phaser.Scene) {
    for (let i = 0; i < OBSTACLE_CFG.poolSize; i++) this.pool.push(new Barrier(scene));
  }

  get barriers(): Barrier[] {
    return this.active;
  }

  reset(snapshot: DifficultySnapshot): void {
    [...this.active].forEach((b) => this.release(b));
    this.lastGapX = GAME_WIDTH / 2;
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

    const def = this.pickType(snapshot.weights);
    const gapWidth = Phaser.Math.Clamp(
      snapshot.baseGap * def.gapFactor,
      OBSTACLE_CFG.gapMin * 0.66,
      GAME_WIDTH - OBSTACLE_CFG.edgePadding * 2
    );
    const band = OBSTACLE_CFG.bandHeight * def.bandFactor;

    const half = gapWidth / 2;
    const minX = OBSTACLE_CFG.edgePadding + half;
    const maxX = GAME_WIDTH - OBSTACLE_CFG.edgePadding - half;

    // Random gap centre (clamped below so it stays reachable from the previous one).
    const desired = Phaser.Math.Between(minX, maxX);

    // Reachability clamp: limit how far the gap can shift from the previous one.
    const spacing = DifficultyManager.effectiveSpacing(snapshot.speed, snapshot.spacing);
    const travelTime = spacing / snapshot.speed; // ms for the next barrier to arrive
    const maxShift = PLAYER_CFG.moveSpeed * travelTime * OBSTACLE_CFG.reachFactor;
    let center = Phaser.Math.Clamp(
      desired,
      this.lastGapX - maxShift,
      this.lastGapX + maxShift
    );
    center = Phaser.Math.Clamp(center, minX, maxX);

    // Motion for the moving type (kept inside bounds & gentle enough to be fair).
    let amp = 0;
    let omega = 0;
    if (def.moving) {
      amp = Math.min(80, center - minX, maxX - center);
      omega = (2 * Math.PI) / 2400; // ~2.4s period
    }

    b.spawn(def, y, center, gapWidth, band, amp, omega);
    this.active.push(b);
    this.lastGapX = center;
  }

  private pickType(weights: Map<ObstacleType, number>): ObstacleTypeDef {
    let total = 0;
    weights.forEach((w) => (total += w));
    let r = Math.random() * total;
    for (const [type, w] of weights) {
      r -= w;
      if (r <= 0) return OBSTACLE_TYPES[type];
    }
    return OBSTACLE_TYPES[ObstacleType.Straight];
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
