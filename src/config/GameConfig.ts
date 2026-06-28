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
import { AchievementsScene } from '../scenes/AchievementsScene';

/**
 * Root Phaser configuration. Portrait, pixel-art, FIT-scaled so one logical
 * resolution maps onto any phone while preserving aspect ratio.
 */
export const createGameConfig = (parent: string): Phaser.Types.Core.GameConfig => ({
  type: Phaser.AUTO,
  parent,
  backgroundColor: COLORS.bgTop,
  // Kept transparent so the #game CSS sky gradient fills the FIT letterbox bars
  // on web. The play area's device-proof floor is NOT that CSS: the Android
  // WebView composites the hardware GL canvas opaque, so canvas-backed CSS never
  // shows on device (BG-005). Instead, Background.applyBaseClear paints each
  // zone's opaque `base` colour as the camera clear — an in-GL quad the GL
  // pipeline always draws — so the sky stays correct on device even if a sky
  // texture fails to upload.
  transparent: true,
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
    AchievementsScene
  ]
});
