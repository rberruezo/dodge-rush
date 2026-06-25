import Phaser from 'phaser';
import { ASSET_KEYS, ANIM_KEYS, PLAYER_CFG, CHAR_FRAMES, GAME_WIDTH } from '../config/Constants';

export interface Hitbox {
  x: number;
  y: number;
  halfW: number;
  halfH: number;
}

export type PoseKind = 'hover' | 'move' | 'moveHard' | 'boost' | 'celebrate' | 'dizzy';

export interface Pose {
  kind: PoseKind;
  frame?: number; // for 'celebrate' (the combo-tier sprite)
}

/**
 * The falling character. Holds a fixed vertical line while obstacles scroll past.
 * Feels alive via: a gentle vertical bob, a hover idle when not steering, a
 * lean→strain escalation while a direction is held, a brief combo celebration
 * flash, and a banking tilt. The collision box is small and forgiving and is
 * unaffected by the cosmetic bob.
 */
export class Player extends Phaser.GameObjects.Sprite {
  private halfW: number;
  private halfH: number;
  private baseY: number;
  private targetTilt = 0;
  private bobT = 0;
  private poseKey = '';

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, ASSET_KEYS.CHARACTER, 0);
    scene.add.existing(this);
    this.baseY = y;

    const scale = PLAYER_CFG.displayWidth / this.width;
    this.setScale(scale);
    this.setOrigin(0.5);

    this.halfW = (this.displayWidth * PLAYER_CFG.hitboxScaleX) / 2;
    this.halfH = (this.displayHeight * PLAYER_CFG.hitboxScaleY) / 2;

    this.setPose({ kind: 'hover' });
  }

  private playSafe(key: string): void {
    if (this.scene.anims.exists(key)) this.play(key, true);
  }

  /** Horizontal steering + facing + bank tilt. `dir` is -1/0/1. */
  steer(dt: number, dir: -1 | 0 | 1): void {
    if (dir !== 0) {
      this.x += dir * PLAYER_CFG.moveSpeed * dt;
      this.setFlipX(dir === 1); // art faces LEFT by default
      this.targetTilt = dir * PLAYER_CFG.tiltDegrees;
    } else {
      this.targetTilt = 0;
    }
    const margin = this.displayWidth * 0.28;
    this.x = Phaser.Math.Clamp(this.x, margin, GAME_WIDTH - margin);
    this.angle = Phaser.Math.Linear(this.angle, this.targetTilt, 0.18);
  }

  /** Cosmetic "alive" bob — does not move the collision box. */
  aliveTick(dt: number): void {
    this.bobT += dt;
    this.y = this.baseY + Math.sin(this.bobT * PLAYER_CFG.bobSpeed) * PLAYER_CFG.bobAmp;
  }

  /** Apply the desired visual pose (idempotent — safe to call every frame). */
  setPose(pose: Pose): void {
    const key = pose.kind === 'celebrate' ? `celebrate:${pose.frame}` : pose.kind;
    if (key === this.poseKey) return;
    this.poseKey = key;

    switch (pose.kind) {
      case 'dizzy':
        this.stop();
        this.setFrame(CHAR_FRAMES.dizzy);
        break;
      case 'celebrate':
        this.stop();
        this.setFrame(pose.frame ?? CHAR_FRAMES.starHead);
        break;
      case 'boost':
        this.playSafe(ANIM_KEYS.BOOST);
        break;
      case 'moveHard':
        this.playSafe(ANIM_KEYS.MOVE_HARD);
        break;
      case 'move':
        this.playSafe(ANIM_KEYS.MOVE);
        break;
      default:
        this.playSafe(ANIM_KEYS.HOVER);
    }
  }

  getHitbox(): Hitbox {
    return { x: this.x, y: this.baseY, halfW: this.halfW, halfH: this.halfH };
  }
}
