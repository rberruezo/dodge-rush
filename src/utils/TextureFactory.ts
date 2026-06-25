import Phaser from 'phaser';
import {
  ASSET_KEYS,
  BG_THEME_KEYS,
  BG_CFG,
  CHARACTER_FRAME,
  OBSTACLE_FRAMES,
  OBSTACLE_CFG,
  COIN_CFG,
  GAME_WIDTH
} from '../config/Constants';
import { SKIN_SHEETS } from '../config/Skins';

/** Fallback body colour per character sheet key. */
const SHEET_FALLBACK: Record<string, number> = {
  character: 0xff4f9a,
  character_cat: 0xffa24a,
  character_unicorn: 0x9fe6d2
};

/** Fallback gradient palette per background theme (top sky → bottom horizon). */
const THEME_FALLBACK: Record<string, [number, number]> = {
  bg_sunset: [0x2a1a4a, 0xff9e5c],
  bg_twilight: [0x3a2a5a, 0xff9ecf],
  bg_night: [0x0a1030, 0x4f7bff]
};

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

    for (const sheet of SKIN_SHEETS) {
      if (need(sheet)) {
        reset(sheet);
        TextureFactory.makeCharacterSheet(scene, sheet, SHEET_FALLBACK[sheet] ?? 0xff4f9a);
      }
    }
    for (const key of BG_THEME_KEYS) {
      if (need(key)) {
        reset(key);
        const [top, bot] = THEME_FALLBACK[key] ?? [0x2a1a4a, 0xff9ecf];
        TextureFactory.makeBackgroundTheme(scene, key, top, bot);
      }
    }
    if (need(ASSET_KEYS.OBSTACLES)) {
      reset(ASSET_KEYS.OBSTACLES);
      TextureFactory.makeObstaclePack(scene);
    }
  }

  /** A 6x7 grid of simple animated blobs so character animations still work. */
  private static makeCharacterSheet(scene: Phaser.Scene, key: string, color: number): void {
    const cols = 6;
    const rows = 7;
    const fw = CHARACTER_FRAME.width;
    const fh = CHARACTER_FRAME.height;
    const g = scene.make.graphics({ x: 0, y: 0 }, false);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const ox = c * fw;
        const oy = r * fh;
        const bob = (c % 3) * 6; // subtle per-frame motion
        g.fillStyle(color, 1);
        g.fillRoundedRect(ox + fw * 0.2, oy + fh * 0.22 + bob, fw * 0.6, fh * 0.55, 24);
        g.fillStyle(0xffe0b8, 1); // face
        g.fillCircle(ox + fw * 0.5, oy + fh * 0.4 + bob, fw * 0.18);
        g.fillStyle(0x2b1a3d, 1); // eyes
        g.fillCircle(ox + fw * 0.43, oy + fh * 0.38 + bob, 6);
        g.fillCircle(ox + fw * 0.57, oy + fh * 0.38 + bob, 6);
      }
    }
    g.generateTexture(key, cols * fw, rows * fh);
    g.destroy();

    const tex = scene.textures.get(key);
    let i = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        tex.add(i, 0, c * fw, r * fh, fw, fh);
        i++;
      }
    }
  }

  /**
   * A mirror-symmetric vertical gradient (sky at top & bottom, horizon glow in
   * the middle) so it loops seamlessly like the real doubled backgrounds.
   */
  private static makeBackgroundTheme(
    scene: Phaser.Scene,
    key: string,
    topColor: number,
    botColor: number
  ): void {
    const w = GAME_WIDTH;
    const h = BG_CFG.loopHeight;
    const mid = h / 2;
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    const top = Phaser.Display.Color.ValueToColor(topColor);
    const bot = Phaser.Display.Color.ValueToColor(botColor);
    const steps = 96;
    for (let i = 0; i < steps; i++) {
      const y = (h / steps) * i;
      const t = 1 - Math.abs(y - mid) / mid; // 0 at edges, 1 at the middle horizon
      const col = Phaser.Display.Color.Interpolate.ColorWithColor(top, bot, 1, t);
      g.fillStyle(Phaser.Display.Color.GetColor(col.r, col.g, col.b), 1);
      g.fillRect(0, Math.floor(y), w, Math.ceil(h / steps) + 1);
    }
    g.fillStyle(0xffffff, 0.5); // twinkles
    for (let i = 0; i < 80; i++) {
      g.fillRect((i * 97) % w, (i * 211) % h, 2, 2);
    }
    g.generateTexture(key, w, h);
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

  /** Fallback spinning-coin strip (gold ellipse narrowing to an edge and back). */
  static ensureCoin(scene: Phaser.Scene): void {
    if (scene.textures.exists(ASSET_KEYS.COIN) && scene.textures.get(ASSET_KEYS.COIN).key === ASSET_KEYS.COIN) {
      return;
    }
    if (scene.textures.exists(ASSET_KEYS.COIN)) scene.textures.remove(ASSET_KEYS.COIN);
    const n = COIN_CFG.frames;
    const c = COIN_CFG.frame;
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    for (let i = 0; i < n; i++) {
      const w = Math.max(2, Math.abs(Math.cos((i / n) * Math.PI)) * (c * 0.42));
      const cx = i * c + c / 2;
      const cy = c / 2;
      g.fillStyle(0x6a4a00, 1); // outline
      g.fillEllipse(cx, cy, w * 2 + 6, c * 0.78 + 6);
      g.fillStyle(0xffc01e, 1); // body
      g.fillEllipse(cx, cy, w * 2, c * 0.78);
    }
    g.generateTexture(ASSET_KEYS.COIN, n * c, c);
    g.destroy();
    const tex = scene.textures.get(ASSET_KEYS.COIN);
    for (let i = 0; i < n; i++) tex.add(i, 0, i * c, 0, c, c);
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

  /**
   * Register named sub-frames on the obstacle texture (real or fallback),
   * including the 3-slice pieces used to build bars: `<name>_l` / `<name>_r`
   * (fixed end-caps) and `<name>_c` (a solid cross-section column that tiles to
   * fill the bar's length without distortion or a repeated hole).
   */
  static registerObstacleFrames(scene: Phaser.Scene): void {
    const tex = scene.textures.get(ASSET_KEYS.OBSTACLES);
    OBSTACLE_FRAMES.forEach((f) => {
      if (!tex.has(f.name)) tex.add(f.name, 0, f.x, f.y, f.width, f.height);

      const capW = Math.max(8, Math.round(f.width * OBSTACLE_CFG.capFraction));
      const stripW = Math.min(4, f.width);
      const stripX = Math.max(f.x, f.x + capW - stripW); // solid column just inside the left cap

      if (!tex.has(`${f.name}_l`)) tex.add(`${f.name}_l`, 0, f.x, f.y, capW, f.height);
      if (!tex.has(`${f.name}_r`)) tex.add(`${f.name}_r`, 0, f.x + f.width - capW, f.y, capW, f.height);
      if (!tex.has(`${f.name}_c`)) tex.add(`${f.name}_c`, 0, stripX, f.y, stripW, f.height);
    });
  }
}
