import Phaser from 'phaser';
import { Barrier } from '../objects/Barrier';
import { ScoreManager } from './ScoreManager';
import { Sound } from './SoundManager';
import { OBSTACLE_CFG, OBSTACLE_FRAMES, GAME_WIDTH, GAME_HEIGHT } from '../config/Constants';

/**
 * Infinite obstacle stream.
 *
 * Maintains a fixed pool of Barrier instances and recycles them as they scroll
 * off the top, so a never-ending run allocates nothing after startup. Keeps the
 * vertical spacing constant, tightens the hole as difficulty rises, and awards
 * the survival/pass bonus when the player clears a barrier.
 */
export class ObstacleGenerator {
  private pool: Barrier[] = [];
  private active: Barrier[] = [];
  private gapWidth: number = OBSTACLE_CFG.gapWidthStart;

  constructor(scene: Phaser.Scene) {
    for (let i = 0; i < OBSTACLE_CFG.poolSize; i++) {
      this.pool.push(new Barrier(scene));
    }
  }

  /** Currently on-screen barriers (read by the collision system). */
  get barriers(): Barrier[] {
    return this.active;
  }

  /** Reset for a fresh run: recycle everything, seed the first barrier. */
  reset(): void {
    [...this.active].forEach((b) => this.release(b));
    this.gapWidth = OBSTACLE_CFG.gapWidthStart;
    // Seed one barrier just below the screen; the update loop fills the rest.
    this.spawnAt(GAME_HEIGHT + OBSTACLE_CFG.bandHeight);
  }

  /**
   * Advance the stream.
   * @param dt     frame delta (ms)
   * @param speed  current fall speed (px/ms)
   * @param playerY player's fixed vertical line (for pass detection)
   * @param score  score manager to credit passes
   */
  update(dt: number, speed: number, playerY: number, score: ScoreManager): void {
    const move = speed * dt;

    // Tighten the hole over time, never below the minimum.
    this.gapWidth = Math.max(
      OBSTACLE_CFG.gapWidthMin,
      this.gapWidth - OBSTACLE_CFG.gapShrinkPerSec * (dt / 1000)
    );

    // Move active barriers upward; recycle and score as appropriate.
    for (let i = this.active.length - 1; i >= 0; i--) {
      const b = this.active[i];
      b.setY(b.y - move);

      if (!b.scored && b.y < playerY) {
        b.scored = true;
        score.addPass();
        Sound.pass();
      }

      if (b.y < -OBSTACLE_CFG.bandHeight) {
        this.release(b);
      }
    }

    // Spawn new barriers below the lowest one, keeping spacing constant.
    let maxY = this.lowestY();
    while (maxY <= GAME_HEIGHT - OBSTACLE_CFG.spacing) {
      const nextY = maxY + OBSTACLE_CFG.spacing;
      this.spawnAt(nextY);
      maxY = nextY;
    }
  }

  private lowestY(): number {
    let maxY = -Infinity;
    for (const b of this.active) maxY = Math.max(maxY, b.y);
    return maxY === -Infinity ? GAME_HEIGHT : maxY;
  }

  private spawnAt(y: number): void {
    const b = this.pool.pop();
    if (!b) return; // pool exhausted (shouldn't happen with constant spacing)

    const half = this.gapWidth / 2;
    const minX = OBSTACLE_CFG.edgePadding + half;
    const maxX = GAME_WIDTH - OBSTACLE_CFG.edgePadding - half;
    const gapX = Phaser.Math.Between(minX, maxX);
    const frame = OBSTACLE_FRAMES[Phaser.Math.Between(0, OBSTACLE_FRAMES.length - 1)].name;

    b.spawn(y, gapX, this.gapWidth, OBSTACLE_CFG.bandHeight, frame);
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
