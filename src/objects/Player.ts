import Phaser from 'phaser';
import { ASSET_KEYS, ANIM_KEYS, PLAYER_CFG, CHAR_FRAMES, GAME_WIDTH } from '../config/Constants';
import { poseFacesRight, shouldFlipX } from './PlayerFacing';

export interface Hitbox {
  x: number;
  y: number;
  halfW: number;
  halfH: number;
}

export type PoseKind = 'hover' | 'move' | 'moveHard' | 'boost' | 'celebrate' | 'cheer' | 'dizzy' | 'impact' | 'death';

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
  private baseScale = 1; // cosmetic squash/stretch baseline (set in constructor; DR-05)
  private poseKey = '';
  private faceDir: 1 | -1 = 1; // last horizontal facing (+1 right, -1 left)
  private faceHoldMs = 0; // how long the current non-facing direction has been held
  private natFacesRight = true; // natural facing of the current pose
  private sheetKey: string = ASSET_KEYS.CHARACTER; // skin sprite sheet

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, ASSET_KEYS.CHARACTER, 0);
    scene.add.existing(this);
    this.baseY = y;

    const scale = PLAYER_CFG.displayWidth / this.width;
    this.baseScale = scale;
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
      // Debounce the cosmetic facing flip: the sprite only mirrors to a new
      // direction once it has been held briefly. Rapid left/right dodge taps
      // therefore keep a steady facing instead of strobing the character.
      if (dir === this.faceDir) {
        this.faceHoldMs = 0;
      } else {
        this.faceHoldMs += dt;
        if (this.faceHoldMs >= PLAYER_CFG.faceFlipDelayMs) {
          this.faceDir = dir; // remembered, so rest keeps facing this way
          this.faceHoldMs = 0;
        }
      }
      this.targetTilt = dir * PLAYER_CFG.tiltDegrees;
    } else {
      this.targetTilt = 0;
      this.faceHoldMs = 0;
    }
    // Stable margin (configured width, not the live one) so the cosmetic squash
    // below never wobbles the clamp boundary.
    const margin = PLAYER_CFG.displayWidth * 0.28;
    this.x = Phaser.Math.Clamp(this.x, margin, GAME_WIDTH - margin);

    // Frame-rate-independent easing so tilt + squash feel identical at any FPS (DR-08).
    const ease = (rate: number): number => 1 - Math.pow(1 - rate, dt / (1000 / 60));

    // Bank tilt toward the travel direction.
    this.angle = Phaser.Math.Linear(this.angle, this.targetTilt, ease(0.18));

    // Subtle squash & stretch: stretch a touch along travel while steering, relax
    // back to base at rest. Cosmetic only — the hitbox is fixed (see getHitbox; DR-05).
    const k = ease(0.2);
    const tgtSX = this.baseScale * (dir !== 0 ? 1.05 : 1);
    const tgtSY = this.baseScale * (dir !== 0 ? 0.97 : 1);
    this.setScale(Phaser.Math.Linear(this.scaleX, tgtSX, k), Phaser.Math.Linear(this.scaleY, tgtSY, k));

    this.refreshFlip();
  }

  /** Cosmetic "alive" bob — does not move the collision box. `intensity` 0..1 deepens
   *  the bob and spins the propeller faster as the fall accelerates (DR-01/02). */
  aliveTick(dt: number, intensity = 0): void {
    this.bobT += dt;
    this.y = this.baseY + Math.sin(this.bobT * PLAYER_CFG.bobSpeed) * PLAYER_CFG.bobAmp * (1 + 0.6 * intensity);
    this.anims.timeScale = 1 + 0.5 * intensity;
  }

  /** Knockout: play the death pose + a tumbling fly-out (sheet-agnostic; DR-17/19/20). */
  playDeath(): void {
    this.setPose({ kind: 'death' });
    this.setAlpha(1);
    this.anims.timeScale = 1; // clear any speed-scaled propeller rate (DR-02)
    this.scene.tweens.killTweensOf(this);
    this.scene.tweens.add({
      targets: this,
      angle: this.angle + 540,
      y: this.y + 150,
      scaleX: this.baseScale * 0.55,
      scaleY: this.baseScale * 0.55,
      alpha: 0.2,
      duration: 600,
      ease: 'Cubic.in'
    });
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
        case 'impact': {
          // Brief startle for a hit / near-miss: base sheet has 'shout' (43);
          // skins (no row 7) fall back to the distinct sad head (DR-12/15).
          this.stop();
          const frames = this.scene.textures.get(this.sheetKey).frameTotal - 1;
          this.setFrame(frames > 43 ? 43 : CHAR_FRAMES.sadHead);
          break;
        }
        case 'death': {
          // Base sheet plays the knockout row; skins (6x7) have no such anim and
          // settle on the distinct sad-head frame so death never mirrors the hit
          // dizzy pose (DR-19). The fly-out tumble (playDeath) sells it regardless.
          const deathKey = `${this.sheetKey}:${ANIM_KEYS.DEATH}`;
          if (this.scene.anims.exists(deathKey)) {
            this.play(deathKey, true);
          } else {
            this.stop();
            this.setFrame(CHAR_FRAMES.sadHead);
          }
          break;
        }
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
