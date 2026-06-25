import Phaser from 'phaser';
import { ASSET_KEYS, ANIM_KEYS, PLAYER_CFG, CHAR_FRAMES, GAME_WIDTH } from '../config/Constants';

export interface Hitbox {
  x: number;
  y: number;
  halfW: number;
  halfH: number;
}

export type PoseKind = 'hover' | 'move' | 'moveHard' | 'boost' | 'celebrate' | 'cheer' | 'dizzy';

export interface Pose {
  kind: PoseKind;
  frame?: number; // for 'celebrate' (the combo-tier sprite)
}

/** Poses whose art faces RIGHT by default; everything else faces LEFT. */
const FACES_RIGHT: Record<string, boolean> = { hover: true, dizzy: true };

/**
 * The falling character. Holds a fixed vertical line while obstacles scroll past.
 * Feels alive via: a gentle vertical bob, a hover idle when not steering, a
 * lean→strain escalation while a direction is held, brief combo celebrations,
 * and a banking tilt. It keeps facing the last travelled direction at rest, and
 * the collision box (unaffected by the cosmetic bob) is small and forgiving.
 */
export class Player extends Phaser.GameObjects.Sprite {
  private halfW: number;
  private halfH: number;
  private baseY: number;
  private targetTilt = 0;
  private bobT = 0;
  private poseKey = '';
  private faceDir: 1 | -1 = 1; // last horizontal facing (+1 right, -1 left)
  private natFacesRight = true; // natural facing of the current pose

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

  /** Mirror so the current pose faces `faceDir`, accounting for its natural side. */
  private refreshFlip(): void {
    this.setFlipX(this.natFacesRight ? this.faceDir === -1 : this.faceDir === 1);
  }

  /** Horizontal steering + facing + bank tilt. `dir` is -1/0/1. */
  steer(dt: number, dir: -1 | 0 | 1): void {
    if (dir !== 0) {
      this.x += dir * PLAYER_CFG.moveSpeed * dt;
      this.faceDir = dir; // remembered, so rest keeps facing this way
      this.targetTilt = dir * PLAYER_CFG.tiltDegrees;
    } else {
      this.targetTilt = 0;
    }
    const margin = this.displayWidth * 0.28;
    this.x = Phaser.Math.Clamp(this.x, margin, GAME_WIDTH - margin);
    this.angle = Phaser.Math.Linear(this.angle, this.targetTilt, 0.18);
    this.refreshFlip();
  }

  /** Cosmetic "alive" bob — does not move the collision box. */
  aliveTick(dt: number): void {
    this.bobT += dt;
    this.y = this.baseY + Math.sin(this.bobT * PLAYER_CFG.bobSpeed) * PLAYER_CFG.bobAmp;
  }

  /** Apply the desired visual pose (idempotent — safe to call every frame). */
  setPose(pose: Pose): void {
    this.natFacesRight = FACES_RIGHT[pose.kind] ?? false;
    const key = pose.kind === 'celebrate' ? `celebrate:${pose.frame}` : pose.kind;
    if (key !== this.poseKey) {
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
        case 'cheer':
          this.playSafe(ANIM_KEYS.CHEER);
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
    this.refreshFlip();
  }

  /** Set horizontal position, clamped to the play area (used by the dash). */
  placeX(x: number): void {
    const margin = this.displayWidth * 0.28;
    this.x = Phaser.Math.Clamp(x, margin, GAME_WIDTH - margin);
  }

  /** Face a direction without moving (used while dashing). */
  face(dir: 1 | -1): void {
    this.faceDir = dir;
    this.refreshFlip();
  }

  /** Apply a skin recolour (null = original art). */
  applySkin(tint: number | null): void {
    if (tint === null) this.clearTint();
    else this.setTint(tint);
  }

  getHitbox(): Hitbox {
    return { x: this.x, y: this.baseY, halfW: this.halfW, halfH: this.halfH };
  }
}
