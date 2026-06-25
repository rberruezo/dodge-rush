import Phaser from 'phaser';
import { ASSET_KEYS, PLAYER_CFG, GAME_WIDTH, GAME_HEIGHT } from '../config/Constants';
import { GhostData } from '../systems/ProfileManager';

/**
 * A translucent replay of the best run's horizontal path — race your own ghost.
 * Reads the recorded x samples and interpolates to the current elapsed time.
 */
export class Ghost {
  private sprite: Phaser.GameObjects.Sprite;
  private data: GhostData | null;

  constructor(scene: Phaser.Scene, data: GhostData | null) {
    this.data = data && data.xs.length > 1 ? data : null;
    const y = GAME_HEIGHT * PLAYER_CFG.startYRatio;
    this.sprite = scene.add
      .sprite(GAME_WIDTH / 2, y, ASSET_KEYS.CHARACTER, 6)
      .setScale(PLAYER_CFG.displayWidth / 120)
      .setOrigin(0.5)
      .setAlpha(0.32)
      .setTint(0x9bc4ff)
      .setDepth(8)
      .setVisible(!!this.data);
  }

  /** Position the ghost for the current run time. */
  update(elapsedMs: number): void {
    if (!this.data) return;
    const { dt, xs } = this.data;
    const i = Math.floor(elapsedMs / dt);
    if (i >= xs.length - 1) {
      this.sprite.setVisible(false); // your run has outlived the record
      return;
    }
    const f = (elapsedMs % dt) / dt;
    this.sprite.x = Phaser.Math.Linear(xs[i], xs[i + 1], f);
    this.sprite.setVisible(true);
  }

  destroy(): void {
    this.sprite.destroy();
  }
}
