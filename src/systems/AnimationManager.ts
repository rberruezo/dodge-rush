import Phaser from 'phaser';
import { CHARACTER_ANIMS, ASSET_KEYS, COIN_CFG } from '../config/Constants';
import { SKIN_SHEETS } from '../config/Skins';

/**
 * Registers character animations for every skin sheet, once textures are loaded.
 * Each sheet gets its own copy keyed `<sheet>:<anim>` so the player (or menu
 * hero) can play the matching animation for whichever skin is equipped.
 * Guards against missing frames so a partial/fallback sheet never throws.
 */
export class AnimationManager {
  /** Animation key for a given sheet + base animation. */
  static key(sheet: string, base: string): string {
    return `${sheet}:${base}`;
  }

  static create(scene: Phaser.Scene): void {
    for (const sheet of SKIN_SHEETS) {
      if (!scene.textures.exists(sheet)) continue;
      const frameCount = scene.textures.get(sheet).frameTotal - 1;

      Object.entries(CHARACTER_ANIMS).forEach(([base, def]) => {
        const key = AnimationManager.key(sheet, base);
        if (scene.anims.exists(key)) return;
        const end = Math.min(def.end, Math.max(def.start, frameCount - 1));
        scene.anims.create({
          key,
          frames: scene.anims.generateFrameNumbers(sheet, { start: def.start, end }),
          frameRate: def.frameRate,
          repeat: def.repeat
        });
      });
    }

    // Slowly-spinning coin used by the HUD / menu / shop.
    if (scene.textures.exists(ASSET_KEYS.COIN) && !scene.anims.exists(COIN_CFG.animKey)) {
      const end = scene.textures.get(ASSET_KEYS.COIN).frameTotal - 2; // minus __BASE
      scene.anims.create({
        key: COIN_CFG.animKey,
        frames: scene.anims.generateFrameNumbers(ASSET_KEYS.COIN, { start: 0, end: Math.max(0, end) }),
        frameRate: COIN_CFG.frameRate,
        repeat: -1
      });
    }
  }
}
