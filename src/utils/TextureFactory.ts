import Phaser from 'phaser';
import {
  ASSET_KEYS,
  BG_ZONES,
  BG_LAYERS,
  OBSTACLE_FRAMES,
  OBSTACLE_ANIM_FRAMES,
  OBSTACLE_CFG,
  COIN_CFG,
  GAME_WIDTH,
  GAME_HEIGHT
} from '../config/Constants';
import { CHARACTER_FRAME } from '../config/CharacterSprite';
import { SKIN_SHEETS, SHEET_FALLBACK } from '../config/Skins';

// Re-exported for back-compat: the master sheet→colour map now lives in Skins.ts
// (single source of truth for the character sprite mapping).
export { SHEET_FALLBACK };

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
    // Sky City: per-zone skyboxes (gradients) + looping parallax tiles.
    for (const zone of BG_ZONES) {
      if (need(zone.sky)) {
        reset(zone.sky);
        TextureFactory.makeSkyFallback(scene, zone.sky, zone.struct, zone.cloudTint);
      }
    }
    for (const layer of BG_LAYERS) {
      if (need(layer.key)) {
        reset(layer.key);
        TextureFactory.makeLayerFallback(scene, layer.key, layer.tile, !!layer.additive);
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

  /** Full-screen skybox stand-in: a dark-to-bright vertical gradient + stars. */
  private static makeSkyFallback(
    scene: Phaser.Scene,
    key: string,
    topColor: number,
    botColor: number
  ): void {
    const w = GAME_WIDTH;
    const h = GAME_HEIGHT;
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    const top = Phaser.Display.Color.ValueToColor(topColor);
    const bot = Phaser.Display.Color.ValueToColor(botColor);
    const steps = 96;
    for (let i = 0; i < steps; i++) {
      const y = (h / steps) * i;
      const t = i / (steps - 1); // 0 at top, 1 at bottom
      const col = Phaser.Display.Color.Interpolate.ColorWithColor(top, bot, 1, t);
      g.fillStyle(Phaser.Display.Color.GetColor(col.r, col.g, col.b), 1);
      g.fillRect(0, Math.floor(y), w, Math.ceil(h / steps) + 1);
    }
    g.fillStyle(0xffffff, 0.5); // stars
    for (let i = 0; i < 80; i++) g.fillRect((i * 97) % w, (i * 211) % h, 2, 2);
    g.generateTexture(key, w, h);
    g.destroy();
  }

  /**
   * Looping parallax tile stand-in (transparent). Content is kept clear of the
   * top/bottom edges so the hand-stacked tiles still seam cleanly. Light layers
   * draw a couple of bright dots (ADD-blended at runtime); other layers draw a
   * few soft silhouettes spaced down the tile.
   */
  private static makeLayerFallback(
    scene: Phaser.Scene,
    key: string,
    tile: number,
    additive: boolean
  ): void {
    const w = GAME_WIDTH;
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    const blobs = Math.max(1, Math.round(tile / 600));
    for (let i = 0; i < blobs; i++) {
      const cx = ((i * 211) % (w - 160)) + 80;
      const cy = (tile / (blobs + 1)) * (i + 1); // evenly spaced, away from edges
      if (additive) {
        g.fillStyle(i % 2 ? 0x46e8ff : 0xff5cc0, 0.9);
        g.fillRect(cx - 22, cy, 44, 3);
      } else {
        g.fillStyle(0xffffff, 0.32);
        g.fillEllipse(cx, cy, 150, 46);
      }
    }
    g.generateTexture(key, w, Math.round(tile));
    g.destroy();
  }

  /** Radial edge-darkening vignette (procedural; never loaded from disk). */
  static ensureVignette(scene: Phaser.Scene): void {
    const key = 'bg_vignette';
    if (scene.textures.exists(key)) return;
    const w = GAME_WIDTH;
    const h = GAME_HEIGHT;
    const tex = scene.textures.createCanvas(key, w, h);
    if (!tex) return;
    const ctx = tex.getContext();
    const grad = ctx.createRadialGradient(w / 2, h / 2, h * 0.28, w / 2, h / 2, h * 0.62);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,1)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    tex.refresh();
  }

  /** Colored tiles-with-holes mirroring the real obstacle atlas frame names. */
  private static makeObstaclePack(scene: Phaser.Scene): void {
    const palette = [
      0x0ca8d8, 0x30cca8, 0x903c78, 0xf02430, 0xe40c24, 0x84849c, 0x24d8fc, 0xfca800
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

    const slice = (name: string, x: number, y: number, w: number, h: number) => {
      if (!tex.has(name)) tex.add(name, 0, x, y, w, h);
      const capW = Math.max(8, Math.round(w * OBSTACLE_CFG.capFraction));
      const stripW = Math.min(4, w);
      const stripX = Math.max(x, x + capW - stripW);
      if (!tex.has(`${name}_l`)) tex.add(`${name}_l`, 0, x, y, capW, h);
      if (!tex.has(`${name}_r`)) tex.add(`${name}_r`, 0, x + w - capW, y, capW, h);
      if (!tex.has(`${name}_c`)) tex.add(`${name}_c`, 0, stripX, y, stripW, h);
    };

    OBSTACLE_FRAMES.forEach((f) => slice(f.name, f.x, f.y, f.width, f.height));
    OBSTACLE_ANIM_FRAMES.forEach((f) => slice(f.name, f.x, f.y, f.width, f.height));
  }
}
