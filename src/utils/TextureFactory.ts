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
  /** Build any textures that did not load, matching the expected frame layouts. */
  static ensureFallbacks(scene: Phaser.Scene): void {
    if (!scene.textures.exists(ASSET_KEYS.CHARACTER)) {
      TextureFactory.makeCharacterSheet(scene);
    }
    if (!scene.textures.exists(ASSET_KEYS.BACKGROUND)) {
      TextureFactory.makeBackground(scene);
    }
    if (!scene.textures.exists(ASSET_KEYS.OBSTACLES)) {
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

  /** Colored blocks-with-holes mirroring the real obstacle pack frame names. */
  private static makeObstaclePack(scene: Phaser.Scene): void {
    const palette = [
      0x4aa3ff, 0x4ad36a, 0xb15cff, 0xffa24a, 0x7fe0ff, 0xff4a4a, 0xff4a4a, 0x9aa0b0,
      0x4ad0ff, 0xffd54a
    ];
    const w = 1024;
    const h = 1024;
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    OBSTACLE_FRAMES.forEach((f, idx) => {
      g.fillStyle(palette[idx % palette.length], 1);
      g.fillRoundedRect(f.x, f.y, f.width, f.height, 10);
      g.fillStyle(0x000000, 1); // the "hole" detail
      g.fillRect(f.x + f.width * 0.4, f.y + f.height * 0.3, f.width * 0.2, f.height * 0.4);
    });
    g.generateTexture(ASSET_KEYS.OBSTACLES, w, h);
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
