import Phaser from 'phaser';
import {
  ASSET_KEYS,
  CHARACTER_FRAME,
  GAME_WIDTH,
  GAME_HEIGHT,
  COLORS
} from '../config/Constants';
import { AnimationManager } from '../systems/AnimationManager';
import { TextureFactory } from '../utils/TextureFactory';

/**
 * Loads all art with a progress bar, then builds frames + animations.
 *
 * Robustness: any asset that fails to load is replaced by a procedurally
 * generated fallback (see TextureFactory) so the game always reaches the menu.
 */
export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('Preload');
  }

  preload(): void {
    this.buildLoadingBar();

    // Real assets live in /public/assets. Missing files trigger 'loaderror',
    // which we swallow — fallbacks are generated in create().
    this.load.spritesheet(ASSET_KEYS.CHARACTER, 'assets/character.png', {
      frameWidth: CHARACTER_FRAME.width,
      frameHeight: CHARACTER_FRAME.height
    });
    this.load.image(ASSET_KEYS.BACKGROUND, 'assets/background.png');
    this.load.image(ASSET_KEYS.OBSTACLES, 'assets/obstacles.png');

    this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, (file: Phaser.Loader.File) => {
      console.warn(`[DodgeRush] Missing asset "${file.key}" — using generated fallback.`);
    });
  }

  create(): void {
    // Fill in anything that did not load, then slice obstacle sub-frames.
    TextureFactory.ensureFallbacks(this);
    TextureFactory.registerObstacleFrames(this);

    // Build character animations from whichever sheet we ended up with.
    AnimationManager.create(this);

    this.scene.start('MainMenu');
  }

  private buildLoadingBar(): void {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    this.add
      .text(cx, cy - 80, 'DODGE RUSH', {
        fontFamily: 'monospace',
        fontSize: '48px',
        color: COLORS.white,
        fontStyle: 'bold'
      })
      .setOrigin(0.5);

    const barW = 320;
    const barH = 28;
    const border = this.add.graphics();
    border.lineStyle(4, COLORS.panelStroke, 1);
    border.strokeRoundedRect(cx - barW / 2, cy - barH / 2, barW, barH, 8);

    const fill = this.add.graphics();

    this.load.on(Phaser.Loader.Events.PROGRESS, (p: number) => {
      fill.clear();
      fill.fillStyle(0xff4f9a, 1);
      fill.fillRoundedRect(cx - barW / 2 + 4, cy - barH / 2 + 4, (barW - 8) * p, barH - 8, 6);
    });
  }
}
