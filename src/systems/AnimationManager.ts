import Phaser from 'phaser';
import { ASSET_KEYS, CHARACTER_ANIMS } from '../config/Constants';

/**
 * Registers all global animations once, after textures are loaded. Guards against
 * missing frames so a partially-loaded sheet never throws at boot.
 */
export class AnimationManager {
  static create(scene: Phaser.Scene): void {
    const tex = scene.textures.get(ASSET_KEYS.CHARACTER);
    const frameCount = tex.frameTotal - 1; // minus the __BASE frame

    Object.entries(CHARACTER_ANIMS).forEach(([key, def]) => {
      if (scene.anims.exists(key)) return;

      // Clamp to frames that actually exist so a smaller sheet still animates.
      const end = Math.min(def.end, Math.max(def.start, frameCount - 1));
      scene.anims.create({
        key,
        frames: scene.anims.generateFrameNumbers(ASSET_KEYS.CHARACTER, {
          start: def.start,
          end
        }),
        frameRate: def.frameRate,
        repeat: def.repeat
      });
    });
  }
}
