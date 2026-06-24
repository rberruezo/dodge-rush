import Phaser from 'phaser';
import { ASSET_KEYS, OBSTACLE_FRAMES, GAME_WIDTH } from '../config/Constants';

/**
 * A single horizontal obstacle wall with a gap (the "hole") the player threads.
 *
 * Rendered as two stretched obstacle-pack images flanking the gap. Designed to
 * be pooled and recycled by the ObstacleGenerator — `spawn()` reactivates an
 * instance and `recycle()` parks it off-screen. Collision data (`gapX`,
 * `gapWidth`, `bandHeight`, `y`) is read by the CollisionSystem.
 */
export class Barrier {
  readonly leftWall: Phaser.GameObjects.Image;
  readonly rightWall: Phaser.GameObjects.Image;

  y = -9999;
  gapX = GAME_WIDTH / 2;
  gapWidth = 200;
  bandHeight = 76;

  active = false;
  scored = false;

  constructor(scene: Phaser.Scene) {
    const firstFrame = OBSTACLE_FRAMES[0]?.name;
    this.leftWall = scene.add.image(0, -9999, ASSET_KEYS.OBSTACLES, firstFrame).setOrigin(0.5);
    this.rightWall = scene.add.image(0, -9999, ASSET_KEYS.OBSTACLES, firstFrame).setOrigin(0.5);
    this.leftWall.setVisible(false);
    this.rightWall.setVisible(false);
  }

  /** Activate this barrier at a vertical position with a random hole + skin. */
  spawn(y: number, gapX: number, gapWidth: number, bandHeight: number, frameName: string): void {
    this.y = y;
    this.gapX = gapX;
    this.gapWidth = gapWidth;
    this.bandHeight = bandHeight;
    this.active = true;
    this.scored = false;

    this.leftWall.setTexture(ASSET_KEYS.OBSTACLES, frameName);
    this.rightWall.setTexture(ASSET_KEYS.OBSTACLES, frameName);
    this.leftWall.setVisible(true);
    this.rightWall.setVisible(true);
    this.layout();
  }

  /** Move vertically (called every frame while active). */
  setY(y: number): void {
    this.y = y;
    this.layout();
  }

  /** Position/size the two wall halves around the current gap. */
  private layout(): void {
    const gapLeft = this.gapX - this.gapWidth / 2;
    const gapRight = this.gapX + this.gapWidth / 2;

    const leftW = gapLeft; // from screen edge 0 to gap
    const rightW = GAME_WIDTH - gapRight; // from gap to screen edge

    if (leftW > 1) {
      this.leftWall.setVisible(true);
      this.leftWall.setPosition(gapLeft / 2, this.y);
      this.leftWall.setDisplaySize(leftW, this.bandHeight);
    } else {
      this.leftWall.setVisible(false);
    }

    if (rightW > 1) {
      this.rightWall.setVisible(true);
      this.rightWall.setPosition(gapRight + rightW / 2, this.y);
      this.rightWall.setDisplaySize(rightW, this.bandHeight);
    } else {
      this.rightWall.setVisible(false);
    }
  }

  /** Park off-screen and mark inactive for reuse. */
  recycle(): void {
    this.active = false;
    this.y = -9999;
    this.leftWall.setVisible(false);
    this.rightWall.setVisible(false);
    this.leftWall.setPosition(0, -9999);
    this.rightWall.setPosition(0, -9999);
  }

  destroy(): void {
    this.leftWall.destroy();
    this.rightWall.destroy();
  }
}
