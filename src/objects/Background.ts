import Phaser from 'phaser';
import { ASSET_KEYS, GAME_WIDTH, GAME_HEIGHT, SCROLL_CFG } from '../config/Constants';

/**
 * Infinite vertically-scrolling sky. A TileSprite covers the screen and we
 * advance its texture offset to simulate continuous falling, scrolling slower
 * than the obstacles (parallax) for a sense of depth.
 */
export class Background {
  private tile: Phaser.GameObjects.TileSprite;

  constructor(scene: Phaser.Scene) {
    this.tile = scene.add
      .tileSprite(0, 0, GAME_WIDTH, GAME_HEIGHT, ASSET_KEYS.BACKGROUND)
      .setOrigin(0, 0);

    // Cover the screen regardless of the source image's aspect ratio.
    const src = scene.textures.get(ASSET_KEYS.BACKGROUND).getSourceImage();
    const scale = Math.max(GAME_WIDTH / src.width, GAME_HEIGHT / src.height);
    this.tile.setTileScale(scale, scale);
  }

  /** Scroll the sky. `speed` is the current world fall speed (px/ms). */
  update(dt: number, speed: number): void {
    // Increasing tilePositionY makes content appear to rise = falling sensation.
    this.tile.tilePositionY += (speed * dt * SCROLL_CFG.bgParallax) / this.tile.tileScaleY;
  }

  setDepth(depth: number): this {
    this.tile.setDepth(depth);
    return this;
  }
}
