import Phaser from 'phaser';
import { ASSET_KEYS, ANIM_KEYS, PLAYER_CFG, CHAR_FRAMES, GAME_WIDTH } from '../config/Constants';
import { poseFacesRight, shouldFlipX } from './PlayerFacing';

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
  private sheetKey: string = ASSET_KEYS.CHARACTER; // skin sprite sheet

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

  /** Play a base animation for the current skin sheet (`<sheet>:<base>`). */
  private playSafe(base: string): void {
    const key = `${this.sheetKey}:${base}`;
    if (this.scene.anims.exists(key)) this.play(key, true);
  }

  /** Mirror so the current pose faces `faceDir`, accounting for its natural side. */
  private refreshFlip(): void {
    this.setFlipX(shouldFlipX(this.natFacesRight, this.faceDir));
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
    this.natFacesRight = poseFacesRight(pose.kind);
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

  /** Equip a skin: switch sprite sheet, recolour tint, and re-arm the pose. */
  applySkin(sheet: string, tint: number | null): void {
    this.sheetKey = sheet;
    if (this.scene.textures.exists(sheet)) this.setTexture(sheet, 0);
    if (tint === null) this.clearTint();
    else this.setTint(tint);
    this.poseKey = ''; // force setPose to replay the anim on the new sheet
  }

  getHitbox(): Hitbox {
    return { x: this.x, y: this.baseY, halfW: this.halfW, halfH: this.halfH };
  }
}
