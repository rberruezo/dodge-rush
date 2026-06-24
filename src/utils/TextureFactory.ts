import Phaser from 'phaser';
import {
  ASSET_KEYS,
  CHARACTER_FRAME,
  OBSTACLE_FRAMES,
  GAME_WIDTH,
  GAME_HEIGHT
} from '../config/Constants';

/**
 * Procedurally generates stand-in textures when the real art assets are missing
 * or fail to load. This keeps the game fully playable out-of-the-box and means a
 * broken asset path degrades gracefully instead of crashing the boot sequence.
 */
export class TextureFactory {
  /**
   * True when a texture key is unusable: not registered, or registered but
   * pointing at Phaser's __MISSING placeholder (which is what a failed load
   * leaves behind — `textures.exists()` alone returns true for it).
   */
  private static isUnusable(scene: Phaser.Scene, key: string): boolean {
    if (!scene.textures.exists(key)) return true;
    return scene.textures.get(key).key !== key;
  }

  /**
   * Build any textures that did not load, matching the expected frame layouts.
   * `failed` is the set of keys whose load errored (tracked by the preloader).
   */
  static ensureFallbacks(scene: Phaser.Scene, failed?: Set<string>): void {
    const need = (key: string) => failed?.has(key) || TextureFactory.isUnusable(scene, key);
    const reset = (key: string) => {
      if (scene.textures.exists(key)) scene.textures.remove(key);
    };

    if (need(ASSET_KEYS.CHARACTER)) {
      reset(ASSET_KEYS.CHARACTER);
      TextureFactory.makeCharacterSheet(scene);
    }
    if (need(ASSET_KEYS.BACKGROUND)) {
      reset(ASSET_KEYS.BACKGROUND);
      TextureFactory.makeBackground(scene);
    }
    if (need(ASSET_KEYS.OBSTACLES)) {
      reset(ASSET_KEYS.OBSTACLES);
      TextureFactory.makeObstaclePack(scene);
    }
  }

  /** A 6x5 grid of simple animated blobs so character animations still work. */
  private static makeCharacterSheet(scene: Phaser.Scene): void {
    const cols = 6;
    const rows = 5;
    const fw = CHARACTER_FRAME.width;
    const fh = CHARACTER_FRAME.height;
    const g = scene.make.graphics({ x: 0, y: 0 }, false);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const ox = c * fw;
        const oy = r * fh;
        const bob = (c % 3) * 6; // subtle per-frame motion
        g.fillStyle(0xff4f9a, 1);
        g.fillRoundedRect(ox + fw * 0.2, oy + fh * 0.22 + bob, fw * 0.6, fh * 0.55, 24);
        g.fillStyle(0xffe0b8, 1); // face
        g.fillCircle(ox + fw * 0.5, oy + fh * 0.4 + bob, fw * 0.18);
        g.fillStyle(0x2b1a3d, 1); // eyes
        g.fillCircle(ox + fw * 0.43, oy + fh * 0.38 + bob, 6);
        g.fillCircle(ox + fw * 0.57, oy + fh * 0.38 + bob, 6);
      }
    }
    g.generateTexture(ASSET_KEYS.CHARACTER, cols * fw, rows * fh);
    g.destroy();

    // Register the sheet's frame grid so it behaves like a loaded spritesheet.
    // (generateTexture already created the implicit __BASE frame.)
    const tex = scene.textures.get(ASSET_KEYS.CHARACTER);
    let i = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        tex.add(i, 0, c * fw, r * fh, fw, fh);
        i++;
      }
    }
  }

  /** A soft vertical gradient that reads as a dreamy sky for the scrolling bg. */
  private static makeBackground(scene: Phaser.Scene): void {
    const w = GAME_WIDTH;
    const h = GAME_HEIGHT;
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    const steps = 48;
    const top = Phaser.Display.Color.ValueToColor(0x2a1a4a);
    const bot = Phaser.Display.Color.ValueToColor(0xff9ecf);
    for (let i = 0; i < steps; i++) {
      const t = i / (steps - 1);
      const col = Phaser.Display.Color.Interpolate.ColorWithColor(top, bot, 1, t);
      g.fillStyle(Phaser.Display.Color.GetColor(col.r, col.g, col.b), 1);
      g.fillRect(0, Math.floor((h / steps) * i), w, Math.ceil(h / steps) + 1);
    }
    // A few twinkles for texture.
    g.fillStyle(0xffffff, 0.6);
    for (let i = 0; i < 40; i++) {
      const x = (i * 97) % w;
      const y = (i * 211) % h;
      g.fillRect(x, y, 2, 2);
    }
    g.generateTexture(ASSET_KEYS.BACKGROUND, w, h);
    g.destroy();
  }

  /** Colored tiles-with-holes mirroring the real obstacle atlas frame names. */
  private static makeObstaclePack(scene: Phaser.Scene): void {
    const palette = [
      0x0ca8d8, 0x30cca8, 0x903c78, 0xe47800, 0x54e4e4, 0xf02430, 0xe40c24, 0x84849c,
      0x24d8fc, 0xfca800
    ];
    const w = Math.max(...OBSTACLE_FRAMES.map((f) => f.x + f.width));
    const h = Math.max(...OBSTACLE_FRAMES.map((f) => f.y + f.height));
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    OBSTACLE_FRAMES.forEach((f, idx) => {
      g.fillStyle(palette[idx % palette.length], 1);
      g.fillRect(f.x, f.y, f.width, f.height);
      g.fillStyle(0x111118, 1); // the "hole" detail
      g.fillRect(f.x + f.width * 0.34, f.y + f.height * 0.3, f.width * 0.32, f.height * 0.4);
    });
    g.generateTexture(ASSET_KEYS.OBSTACLES, w, h);
    g.destroy();
  }

  /** A small soft dot used by the particle emitters. */
  static ensureParticleTexture(scene: Phaser.Scene): void {
    if (scene.textures.exists(ASSET_KEYS.PARTICLE)) return;
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(5, 5, 5);
    g.fillStyle(0xffffff, 0.4);
    g.fillCircle(5, 5, 8);
    g.generateTexture(ASSET_KEYS.PARTICLE, 16, 16);
    g.destroy();
  }

  /** Register named sub-frames on the obstacle texture (real or fallback). */
  static registerObstacleFrames(scene: Phaser.Scene): void {
    const tex = scene.textures.get(ASSET_KEYS.OBSTACLES);
    OBSTACLE_FRAMES.forEach((f) => {
      if (!tex.has(f.name)) {
        tex.add(f.name, 0, f.x, f.y, f.width, f.height);
      }
    });
  }
}
