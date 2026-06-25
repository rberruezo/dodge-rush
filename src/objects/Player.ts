import Phaser from 'phaser';
import { ASSET_KEYS, ANIM_KEYS, PLAYER_CFG, GAME_WIDTH } from '../config/Constants';

export interface Hitbox {
  x: number;
  y: number;
  halfW: number;
  halfH: number;
}

/** What the player should look like this frame (set by GameScene). */
export interface Pose {
  dizzy: boolean; // crashed (invincibility) → dizzy frame
  boosting: boolean; // golden score boost → sparkle flight
  comboFrame: number | null; // combo-tier sprite, or null for the normal fly loop
}

/**
 * The falling character. Holds a fixed vertical screen position while obstacles
 * scroll past, steers horizontally, faces its travel direction, and swaps among
 * several visual poses (fly / boost / combo-tier / dizzy). The collision box is
 * intentionally smaller and forgiving.
 */
export class Player extends Phaser.GameObjects.Sprite {
  private halfW: number;
  private halfH: number;
  private targetTilt = 0;
  private currentPose = '';

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
    if (this.scene.anims.exists(key)) this.play(key, true);
  }

  /** Steer, face the travel direction, and bank. `dir` is -1/0/1. */
  steer(dt: number, dir: -1 | 0 | 1): void {
    if (dir !== 0) {
      this.x += dir * PLAYER_CFG.moveSpeed * dt;
      // Art faces LEFT by default -> mirror when heading right.
      this.setFlipX(dir === 1);
      this.targetTilt = dir * PLAYER_CFG.tiltDegrees;
    } else {
      this.targetTilt = 0;
    }
    const margin = this.displayWidth * 0.3;
    this.x = Phaser.Math.Clamp(this.x, margin, GAME_WIDTH - margin);
    this.angle = Phaser.Math.Linear(this.angle, this.targetTilt, 0.18);
  }

  /** Apply the desired visual pose (priority: dizzy > boost > combo > fly). */
  setPose(pose: Pose): void {
    let key: string;
    if (pose.dizzy) key = 'dizzy';
    else if (pose.boosting) key = 'boost';
    else if (pose.comboFrame !== null) key = `combo:${pose.comboFrame}`;
    else key = 'fly';

    if (key === this.currentPose) return;
    this.currentPose = key;

    if (pose.dizzy) {
      this.stop();
      this.setFrame(24);
    } else if (pose.boosting) {
      this.playSafe(ANIM_KEYS.BOOST);
    } else if (pose.comboFrame !== null) {
      this.stop();
      this.setFrame(pose.comboFrame);
    } else {
      this.playSafe(ANIM_KEYS.FALL);
    }
  }

  getHitbox(): Hitbox {
    return { x: this.x, y: this.y, halfW: this.halfW, halfH: this.halfH };
  }
}
