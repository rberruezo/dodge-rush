import Phaser from 'phaser';
import { ASSET_KEYS, GAME_WIDTH } from '../config/Constants';
import { ObstacleType, ObstacleTypeDef, OBSTACLE_TYPES } from '../config/ObstacleTypes';

/**
 * A typed, full-width obstacle wall with a central passage gap.
 *
 * Each wall side is drawn as a solid colour fill (so it never looks see-through)
 * with the obstacle's pixel-art tile repeated on top. Supports the 10 archetypes:
 * gap size/position come from the type, plus optional sine-wave motion and a
 * neon/danger/golden glow pulse. Pooled and recycled by the ObstacleGenerator.
 */
export class Barrier {
  // Visual layers (created once, reused).
  private leftFill: Phaser.GameObjects.Rectangle;
  private rightFill: Phaser.GameObjects.Rectangle;
  private leftTile: Phaser.GameObjects.TileSprite;
  private rightTile: Phaser.GameObjects.TileSprite;
  private leftGlow: Phaser.GameObjects.Rectangle;
  private rightGlow: Phaser.GameObjects.Rectangle;

  // Collision / placement state (read by CollisionSystem & generator).
  y = -9999;
  gapX = GAME_WIDTH / 2;
  gapWidth = 200;
  bandHeight = 88;
  active = false;
  scored = false;

  def: ObstacleTypeDef = OBSTACLE_TYPES[ObstacleType.Straight];

  // Motion / animation.
  private baseGapX = GAME_WIDTH / 2;
  private moveAmp = 0;
  private moveOmega = 0;
  private t = 0;
  private showGlow = false;

  constructor(scene: Phaser.Scene) {
    const mk = (depth: number) =>
      scene.add.rectangle(0, -9999, 10, 10, 0xffffff).setOrigin(0.5).setDepth(depth).setVisible(false);
    const tile = () =>
      scene.add
        .tileSprite(0, -9999, 10, 10, ASSET_KEYS.OBSTACLES, this.def.frame)
        .setOrigin(0.5)
        .setDepth(5)
        .setVisible(false);

    this.leftFill = mk(4);
    this.rightFill = mk(4);
    this.leftTile = tile();
    this.rightTile = tile();
    this.leftGlow = mk(6).setBlendMode(Phaser.BlendModes.ADD);
    this.rightGlow = mk(6).setBlendMode(Phaser.BlendModes.ADD);
  }

  get type(): ObstacleType {
    return this.def.type;
  }

  get isGolden(): boolean {
    return this.def.golden;
  }

  /** Activate this barrier with a type, vertical position, gap and motion. */
  spawn(
    def: ObstacleTypeDef,
    y: number,
    gapX: number,
    gapWidth: number,
    bandHeight: number,
    moveAmp: number,
    moveOmega: number
  ): void {
    this.def = def;
    this.y = y;
    this.baseGapX = gapX;
    this.gapX = gapX;
    this.gapWidth = gapWidth;
    this.bandHeight = bandHeight;
    this.moveAmp = moveAmp;
    this.moveOmega = moveOmega;
    this.t = 0;
    this.active = true;
    this.scored = false;

    for (const tile of [this.leftTile, this.rightTile]) {
      tile.setTexture(ASSET_KEYS.OBSTACLES, def.frame);
      const frame = tile.frame;
      const scale = bandHeight / frame.height;
      tile.setTileScale(scale, scale);
    }
    for (const fill of [this.leftFill, this.rightFill]) fill.setFillStyle(def.fill, 1);

    const glowColor = def.golden ? 0xffd54a : def.danger ? 0xff3030 : 0x46e6ff;
    for (const glow of [this.leftGlow, this.rightGlow]) glow.setFillStyle(glowColor, 1);
    this.showGlow = def.glowing || def.danger || def.golden;
    this.leftGlow.setVisible(this.showGlow);
    this.rightGlow.setVisible(this.showGlow);

    [this.leftFill, this.rightFill, this.leftTile, this.rightTile].forEach((o) => o.setVisible(true));
    this.layout();
  }

  /** Advance motion + glow pulse, then move vertically. */
  advance(dt: number, riseBy: number): void {
    this.t += dt;
    this.y -= riseBy;
    if (this.moveAmp > 0) {
      this.gapX = this.baseGapX + Math.sin(this.t * this.moveOmega) * this.moveAmp;
    }
    this.layout();
  }

  private layout(): void {
    const half = this.gapWidth / 2;
    const gapLeft = this.gapX - half;
    const gapRight = this.gapX + half;
    const leftW = gapLeft;
    const rightW = GAME_WIDTH - gapRight;

    this.place(this.leftFill, this.leftTile, this.leftGlow, gapLeft / 2, leftW);
    this.place(this.rightFill, this.rightTile, this.rightGlow, gapRight + rightW / 2, rightW);

    if (this.showGlow) {
      // Soft neon pulse (alpha ~0.14..0.5).
      const a = 0.32 + 0.18 * Math.sin(this.t * 0.008);
      this.leftGlow.setAlpha(a);
      this.rightGlow.setAlpha(a);
    }
  }

  private place(
    fill: Phaser.GameObjects.Rectangle,
    tile: Phaser.GameObjects.TileSprite,
    glow: Phaser.GameObjects.Rectangle,
    centerX: number,
    width: number
  ): void {
    const visible = width > 1;
    fill.setVisible(visible);
    tile.setVisible(visible);
    glow.setVisible(visible && this.showGlow);
    if (!visible) return;
    // Rectangles: scale a unit shape (setDisplaySize) — reliable resize.
    fill.setPosition(centerX, this.y).setDisplaySize(width, this.bandHeight);
    glow.setPosition(centerX, this.y).setDisplaySize(width, this.bandHeight);
    // TileSprite: resize the tiling viewport (keeps the tile pattern unscaled).
    tile.setPosition(centerX, this.y).setSize(width, this.bandHeight);
  }

  recycle(): void {
    this.active = false;
    this.y = -9999;
    [
      this.leftFill,
      this.rightFill,
      this.leftTile,
      this.rightTile,
      this.leftGlow,
      this.rightGlow
    ].forEach((o) => o.setVisible(false).setPosition(0, -9999));
  }

  destroy(): void {
    [
      this.leftFill,
      this.rightFill,
      this.leftTile,
      this.rightTile,
      this.leftGlow,
      this.rightGlow
    ].forEach((o) => o.destroy());
  }
}
