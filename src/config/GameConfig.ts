import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, TARGET_FPS, COLORS } from './Constants';
import { BootScene } from '../scenes/BootScene';
import { PreloadScene } from '../scenes/PreloadScene';
import { MainMenuScene } from '../scenes/MainMenuScene';
import { GameScene } from '../scenes/GameScene';
import { PauseScene } from '../scenes/PauseScene';
import { GameOverScene } from '../scenes/GameOverScene';
import { ShopScene } from '../scenes/ShopScene';
import { InfoScene } from '../scenes/InfoScene';
import { DailyScene } from '../scenes/DailyScene';
import { ContinueScene } from '../scenes/ContinueScene';

/**
 * Root Phaser configuration. Portrait, pixel-art, FIT-scaled so one logical
 * resolution maps onto any phone while preserving aspect ratio.
 */
export const createGameConfig = (parent: string): Phaser.Types.Core.GameConfig => ({
  type: Phaser.AUTO,
  parent,
  backgroundColor: COLORS.bgTop,
  pixelArt: true,
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_WIDTH,
    height: GAME_HEIGHT
  },
  // Two simultaneous touch points so the player can hold one side and tap the other.
  input: {
    activePointers: 3,
    touch: { capture: true }
  },
  fps: {
    target: TARGET_FPS,
    forceSetTimeOut: false
  },
  render: {
    antialias: false,
    powerPreference: 'high-performance'
  },
  physics: undefined, // movement & collision are handled manually for determinism
  scene: [
    BootScene,
    PreloadScene,
    MainMenuScene,
    GameScene,
    PauseScene,
    GameOverScene,
    ShopScene,
    InfoScene,
    DailyScene,
    ContinueScene
  ]
});
