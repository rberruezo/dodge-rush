import Phaser from 'phaser';
import {
  ASSET_KEYS,
  BG_TILE_KEYS,
  CHARACTER_FRAME,
  COIN_CFG,
  GAME_WIDTH,
  GAME_HEIGHT,
  COLORS
} from '../config/Constants';
import { Diagnostics } from '../systems/Diagnostics';
import { AnimationManager } from '../systems/AnimationManager';
import { TextureFactory } from '../utils/TextureFactory';
import { Sound, MUSIC } from '../systems/SoundManager';

/**
 * Loads all art with a progress bar, then builds frames + animations.
 *
 * Robustness: any asset that fails to load is replaced by a procedurally
 * generated fallback (see TextureFactory) so the game always reaches the menu.
 */
export class PreloadScene extends Phaser.Scene {
  private failed = new Set<string>();

  constructor() {
    super('Preload');
  }

  preload(): void {
    this.failed.clear();

    this.buildLoadingBar();

    // Real assets live in /public/assets. Missing files trigger 'loaderror',
    // which we swallow — fallbacks are generated in create().
    this.load.spritesheet(ASSET_KEYS.CHARACTER, 'assets/character.png', {
      frameWidth: CHARACTER_FRAME.width,
      frameHeight: CHARACTER_FRAME.height
    });
    // Alternate skin sheets (same 6x7 / 120px layout as the main character).
    this.load.spritesheet('character_cat', 'assets/character_cat.png', {
      frameWidth: CHARACTER_FRAME.width,
      frameHeight: CHARACTER_FRAME.height
    });
    this.load.spritesheet('character_unicorn', 'assets/character_unicorn.png', {
      frameWidth: CHARACTER_FRAME.width,
      frameHeight: CHARACTER_FRAME.height
    });
    this.load.spritesheet('character_phoenix', 'assets/character_phoenix.png', {
      frameWidth: CHARACTER_FRAME.width,
      frameHeight: CHARACTER_FRAME.height
    });
    this.load.spritesheet('character_dragon', 'assets/character_dragon.png', {
      frameWidth: CHARACTER_FRAME.width,
      frameHeight: CHARACTER_FRAME.height
    });
    this.load.spritesheet('character_witch', 'assets/character_witch.png', {
      frameWidth: CHARACTER_FRAME.width,
      frameHeight: CHARACTER_FRAME.height
    });
    this.load.spritesheet('character_wizard', 'assets/character_wizard.png', {
      frameWidth: CHARACTER_FRAME.width,
      frameHeight: CHARACTER_FRAME.height
    });
    this.load.spritesheet('character_evil', 'assets/character_evil.png', {
      frameWidth: CHARACTER_FRAME.width,
      frameHeight: CHARACTER_FRAME.height
    });
    // Tier-1 palette variants derived from the painted originals (build-variants.py).
    this.load.spritesheet('character_king', 'assets/character_king.png', {
      frameWidth: CHARACTER_FRAME.width,
      frameHeight: CHARACTER_FRAME.height
    });
    this.load.spritesheet('character_frost', 'assets/character_frost.png', {
      frameWidth: CHARACTER_FRAME.width,
      frameHeight: CHARACTER_FRAME.height
    });
    this.load.spritesheet('character_ghost', 'assets/character_ghost.png', {
      frameWidth: CHARACTER_FRAME.width,
      frameHeight: CHARACTER_FRAME.height
    });
    this.load.spritesheet('character_hound', 'assets/character_hound.png', {
      frameWidth: CHARACTER_FRAME.width,
      frameHeight: CHARACTER_FRAME.height
    });
    BG_TILE_KEYS.forEach((key, i) => this.load.image(key, `assets/bg_night_${i}.png`));
    this.load.image(ASSET_KEYS.OBSTACLES, 'assets/obstacles.png');
    this.load.spritesheet(ASSET_KEYS.COIN, 'assets/coin.png', {
      frameWidth: COIN_CFG.frame,
      frameHeight: COIN_CFG.frame
    });

    this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, (file: Phaser.Loader.File) => {
      this.failed.add(file.key);
      Diagnostics.warn('asset', `Missing asset "${file.key}" — using generated fallback.`);
    });
  }

  create(): void {
    // Fill in anything that did not load (or loaded broken), then slice frames.
    TextureFactory.ensureFallbacks(this, this.failed);
    TextureFactory.registerObstacleFrames(this);
    TextureFactory.ensureParticleTexture(this);
    TextureFactory.ensureCoin(this);

    // Build character animations from whichever sheet we ended up with.
    AnimationManager.create(this);

    // Stream + decode music in the background (Web Audio, for seamless looping).
    // Fire-and-forget: playback waits until decoded AND the audio is unlocked.
    void Sound.loadMusic(MUSIC.MENU, 'assets/menu.mp3');
    void Sound.loadMusic(MUSIC.GAME, 'assets/bgmusic.mp3');

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
