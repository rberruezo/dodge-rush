import Phaser from 'phaser';
import { ASSET_KEYS, ANIM_KEYS, PLAYER_CFG, GAME_WIDTH } from '../config/Constants';

export interface Hitbox {
  x: number;
  y: number;
  halfW: number;
  halfH: number;
}

/**
 * The falling character. Holds a fixed vertical screen position while obstacles
 * scroll past, and steers horizontally based on input. Visuals lean into the
 * direction of travel for game-feel; the collision box is intentionally smaller
 * and forgiving.
 */
export class Player extends Phaser.GameObjects.Sprite {
  private halfW: number;
  private halfH: number;
  private targetTilt = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, ASSET_KEYS.CHARACTER, 6);
    scene.add.existing(this);

    const scale = PLAYER_CFG.displayWidth / this.width;
    this.setScale(scale);
    this.setOrigin(0.5);

    this.halfW = (this.displayWidth * PLAYER_CFG.hitboxScaleX) / 2;
    this.halfH = (this.displayHeight * PLAYER_CFG.hitboxScaleY) / 2;

    this.playSafe(ANIM_KEYS.FALL);
  }

  /** Play an animation only if it was successfully registered. */
  playSafe(key: string): void {
    if (this.scene.anims.exists(key)) {
      this.play(key, true);
    }
  }

  /** Steer + tilt. `dt` is the frame delta in ms, `dir` is -1/0/1. */
  steer(dt: number, dir: -1 | 0 | 1): void {
    if (dir !== 0) {
      this.x += dir * PLAYER_CFG.moveSpeed * dt;
      this.targetTilt = dir * PLAYER_CFG.tiltDegrees;
    } else {
      this.targetTilt = 0;
    }

    const margin = this.displayWidth * 0.42;
    this.x = Phaser.Math.Clamp(this.x, margin, GAME_WIDTH - margin);

    // Ease toward the target lean for smooth, springy motion.
    this.angle = Phaser.Math.Linear(this.angle, this.targetTilt, 0.18);
  }

  getHitbox(): Hitbox {
    return { x: this.x, y: this.y, halfW: this.halfW, halfH: this.halfH };
  }

  /** Switch to the dizzy/hurt pose on death. */
  crash(): void {
    this.targetTilt = 0;
    this.angle = 0;
    this.playSafe(ANIM_KEYS.HURT);
  }
}
