import Phaser from 'phaser';
import { BG_TILE_KEYS, BG_CFG, GAME_WIDTH, GAME_HEIGHT, SCROLL_CFG } from '../config/Constants';

/**
 * Endless descent rendered as a vertical stack of interchangeable night tiles.
 *
 * Each tile is one screen tall and its art is edge-matched so any tile can
 * follow any other (see scripts/build-backgrounds.py). We keep just enough tile
 * sprites to cover the viewport plus one spare entering from below. As the world
 * scrolls up (which reads as falling), each sprite is mapped to a "virtual" tile
 * index derived from how far we've fallen; the texture for that index is picked
 * by a cheap deterministic hash, so the order is effectively random, never snaps,
 * and loops forever with no fixed seam.
 */
export class Background {
  private tiles: Phaser.GameObjects.Image[] = [];
  private scrollY = 0;
  private readonly tileH = BG_CFG.tileHeight;

  constructor(scene: Phaser.Scene, startScrollY = 0) {
    this.scrollY = startScrollY;

    // Cover the screen + 1 spare so a fresh tile is always ready below the fold.
    const count = Math.ceil(GAME_HEIGHT / this.tileH) + 1;
    for (let i = 0; i < count; i++) {
      this.tiles.push(
        scene.add.image(0, 0, BG_TILE_KEYS[0]).setOrigin(0, 0).setDisplaySize(GAME_WIDTH, this.tileH)
      );
    }
    this.layout();
  }

  /** Distance fallen — passed between scenes so the scroll never jumps. */
  get scroll(): number {
    return this.scrollY;
  }

  /** Advance the fall and re-place the tiles. */
  update(dt: number, speed: number): void {
    this.scrollY += speed * dt * SCROLL_CFG.bgParallax;
    this.layout();
  }

  /** Map each sprite to its current virtual tile slot + texture. */
  private layout(): void {
    const v0 = Math.floor(this.scrollY / this.tileH); // topmost visible virtual tile
    const off = this.scrollY - v0 * this.tileH; // how far it has scrolled off-top
    for (let j = 0; j < this.tiles.length; j++) {
      const img = this.tiles[j];
      img.y = j * this.tileH - off;
      const key = this.keyForTile(v0 + j);
      if (img.texture.key !== key) {
        img.setTexture(key).setDisplaySize(GAME_WIDTH, this.tileH);
      }
    }
  }

  /**
   * Deterministic texture for a virtual tile index: a multiplicative hash spreads
   * the indices across the tile set, nudged so a tile never repeats the one
   * directly above it (keeps the descent visibly varied).
   */
  private keyForTile(v: number): string {
    const n = BG_TILE_KEYS.length;
    const hash = (k: number) => ((k * 2654435761) >>> 0) % n;
    let idx = hash(v);
    if (idx === hash(v - 1)) idx = (idx + 1) % n;
    return BG_TILE_KEYS[idx];
  }

  setDepth(depth: number): this {
    this.tiles.forEach((t) => t.setDepth(depth));
    return this;
  }

  destroy(): void {
    this.tiles.forEach((t) => t.destroy());
    this.tiles = [];
  }
}
