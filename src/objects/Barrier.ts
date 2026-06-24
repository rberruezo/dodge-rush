import Phaser from 'phaser';
import { ASSET_KEYS, GAME_WIDTH, OBSTACLE_CFG, OBSTACLE_FRAMES } from '../config/Constants';
import { ObstacleType, ObstacleTypeDef, OBSTACLE_TYPES } from '../config/ObstacleTypes';

/** Fast lookup of a frame's source size by name. */
const FRAME_SIZE = new Map(OBSTACLE_FRAMES.map((f) => [f.name, { w: f.width, h: f.height }]));

/** One side of a barrier wall: one gap-facing end-cap + a tiled body. */
interface WallSide {
  fill: Phaser.GameObjects.Rectangle; // solid backing (no see-through)
  cap: Phaser.GameObjects.Image; // single end-cap, facing the gap
  center: Phaser.GameObjects.TileSprite; // tiling body filling toward the screen edge
  glow: Phaser.GameObjects.Rectangle; // neon/danger/golden pulse
}

/**
 * A typed, full-width obstacle wall with a central passage gap.
 *
 * Each side of the gap is a single bar: one undistorted end-cap facing the gap,
 * plus a thin solid cross-section of the sprite tiled to fill the rest toward the
 * screen edge (no stretched "zoom", no repeated hole, and short sides degrade to
 * just the cap instead of two squashed caps). Pooled by the ObstacleGenerator.
 */
export class Barrier {
  private left: WallSide;
  private right: WallSide;

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
  private capDisplayW = 0;

  constructor(scene: Phaser.Scene) {
    this.left = Barrier.makeSide(scene);
    this.right = Barrier.makeSide(scene);
  }

  private static makeSide(scene: Phaser.Scene): WallSide {
    const frame = OBSTACLE_FRAMES[0].name;
    const rect = (depth: number, blend = false) => {
      const r = scene.add
        .rectangle(0, -9999, 10, 10, 0xffffff)
        .setOrigin(0.5)
        .setDepth(depth)
        .setVisible(false);
      if (blend) r.setBlendMode(Phaser.BlendModes.ADD);
      return r;
    };
    return {
      fill: rect(4),
      cap: scene.add
        .image(0, -9999, ASSET_KEYS.OBSTACLES, `${frame}_r`)
        .setOrigin(0.5)
        .setDepth(5)
        .setVisible(false),
      center: scene.add
        .tileSprite(0, -9999, 10, 10, ASSET_KEYS.OBSTACLES, `${frame}_c`)
        .setOrigin(0.5)
        .setDepth(5)
        .setVisible(false),
      glow: rect(6, true)
    };
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

    const size = FRAME_SIZE.get(def.frame) ?? { w: 50, h: 30 };
    const tileScale = bandHeight / size.h;
    const capPx = Math.max(8, Math.round(size.w * OBSTACLE_CFG.capFraction));
    this.capDisplayW = capPx * tileScale;

    this.showGlow = def.glowing || def.danger || def.golden;
    const glowColor = def.golden ? 0xffd54a : def.danger ? 0xff3030 : 0x46e6ff;

    // Left wall's cap faces right (toward the gap); right wall's cap faces left.
    this.left.cap.setTexture(ASSET_KEYS.OBSTACLES, `${def.frame}_r`);
    this.right.cap.setTexture(ASSET_KEYS.OBSTACLES, `${def.frame}_l`);
    for (const side of [this.left, this.right]) {
      side.center.setTexture(ASSET_KEYS.OBSTACLES, `${def.frame}_c`);
      side.center.setTileScale(tileScale, tileScale);
      side.fill.setFillStyle(def.fill, 1);
      side.glow.setFillStyle(glowColor, 1);
    }

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
    this.placeSide(this.left, 0, this.gapX - half, true);
    this.placeSide(this.right, this.gapX + half, GAME_WIDTH, false);

    if (this.showGlow) {
      const a = 0.32 + 0.18 * Math.sin(this.t * 0.008);
      this.left.glow.setAlpha(a);
      this.right.glow.setAlpha(a);
    }
  }

  /**
   * Lay out one wall side spanning [x0, x1]. `capAtRight` puts the end-cap at
   * the right edge (used for the left wall, whose cap faces the central gap).
   */
  private placeSide(side: WallSide, x0: number, x1: number, capAtRight: boolean): void {
    const w = x1 - x0;
    const visible = w > 1;
    side.fill.setVisible(visible);
    side.cap.setVisible(visible);
    side.glow.setVisible(visible && this.showGlow);
    if (!visible) {
      side.center.setVisible(false);
      return;
    }

    const cy = this.y;
    const band = this.bandHeight;
    const capW = Math.min(this.capDisplayW, w);
    const centerW = w - capW;

    side.fill.setPosition((x0 + x1) / 2, cy).setDisplaySize(w, band);
    side.glow.setPosition((x0 + x1) / 2, cy).setDisplaySize(w, band);

    if (capAtRight) {
      side.cap.setDisplaySize(capW, band).setPosition(x1 - capW / 2, cy);
      if (centerW > 1) side.center.setSize(centerW, band).setPosition(x0 + centerW / 2, cy);
    } else {
      side.cap.setDisplaySize(capW, band).setPosition(x0 + capW / 2, cy);
      if (centerW > 1) side.center.setSize(centerW, band).setPosition(x1 - centerW / 2, cy);
    }
    side.center.setVisible(centerW > 1);
  }

  recycle(): void {
    this.active = false;
    this.y = -9999;
    for (const side of [this.left, this.right]) {
      [side.fill, side.cap, side.center, side.glow].forEach((o) =>
        o.setVisible(false).setPosition(0, -9999)
      );
    }
  }

  destroy(): void {
    for (const side of [this.left, this.right]) {
      [side.fill, side.cap, side.center, side.glow].forEach((o) => o.destroy());
    }
  }
}
