import Phaser from 'phaser';
import { ASSET_KEYS, FORK_CFG, GAME_WIDTH, GAP_MARKER_CFG, OBSTACLE_CFG, OBSTACLE_FRAMES } from '../config/Constants';
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

/** A high-contrast post marking one inner edge of the safe gap (legibility). */
interface GapMarker {
  glow: Phaser.GameObjects.Rectangle; // soft wide halo (ADD blend)
  core: Phaser.GameObjects.Rectangle; // bright thin line
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
  private pillar: WallSide; // central divider, shown only on fork obstacles (GME-017)
  private gapL?: GapMarker;
  private gapR?: GapMarker;
  private gap2L?: GapMarker; // posts for the fork's hard gap (telegraphed amber)
  private gap2R?: GapMarker;

  // Collision / placement state (read by CollisionSystem & generator).
  y = -9999;
  gapX = GAME_WIDTH / 2;
  gapWidth = 200;
  bandHeight = 88;
  active = false;
  scored = false;

  // Risk↔reward fork (GME-017): when true, gap2* is a second, harder gap.
  isFork = false;
  gap2X = GAME_WIDTH / 2;
  gap2Width = 120;

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
    this.pillar = Barrier.makeSide(scene);
    if (GAP_MARKER_CFG.enabled) {
      this.gapL = Barrier.makeMarker(scene);
      this.gapR = Barrier.makeMarker(scene);
      this.gap2L = Barrier.makeMarker(scene);
      this.gap2R = Barrier.makeMarker(scene);
    }
  }

  private static makeMarker(scene: Phaser.Scene): GapMarker {
    const mk = (w: number, color: number, depth: number, blend: boolean) => {
      const r = scene.add
        .rectangle(0, -9999, w, 10, color)
        .setOrigin(0.5)
        .setDepth(depth)
        .setVisible(false);
      if (blend) r.setBlendMode(Phaser.BlendModes.ADD);
      return r;
    };
    return {
      glow: mk(GAP_MARKER_CFG.glowWidth, GAP_MARKER_CFG.glowColor, 7, true),
      core: mk(GAP_MARKER_CFG.width, GAP_MARKER_CFG.coreColor, 8, false)
    };
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

  /** Gap(s) the player can pass through: one, or two for a fork (GME-017). */
  safeGaps(): { x: number; width: number; hard: boolean }[] {
    if (!this.isFork) return [{ x: this.gapX, width: this.gapWidth, hard: false }];
    return [
      { x: this.gapX, width: this.gapWidth, hard: false },
      { x: this.gap2X, width: this.gap2Width, hard: true }
    ];
  }

  /** Activate this barrier with a type, vertical position, gap and motion. */
  spawn(
    def: ObstacleTypeDef,
    y: number,
    gapX: number,
    gapWidth: number,
    bandHeight: number,
    moveAmp: number,
    moveOmega: number,
    fork?: { center: number; width: number }
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
    this.isFork = !!fork;
    if (fork) {
      this.gap2X = fork.center;
      this.gap2Width = fork.width;
    }

    const size = FRAME_SIZE.get(def.frame) ?? { w: 50, h: 30 };
    const tileScale = bandHeight / size.h;
    const capPx = Math.max(8, Math.round(size.w * OBSTACLE_CFG.capFraction));
    this.capDisplayW = capPx * tileScale;

    this.showGlow = def.glowing || def.danger || def.golden;
    const glowColor = def.golden ? 0xffd54a : def.danger ? 0xff3030 : def.glowing ? 0x9933ff : 0x46e6ff;

    // Left wall's cap faces right (toward the gap); right wall's cap faces left.
    this.left.cap.setTexture(ASSET_KEYS.OBSTACLES, `${def.frame}_r`);
    this.right.cap.setTexture(ASSET_KEYS.OBSTACLES, `${def.frame}_l`);
    for (const side of [this.left, this.right, this.pillar]) {
      side.center.setTexture(ASSET_KEYS.OBSTACLES, `${def.frame}_c`);
      side.center.setTileScale(tileScale, tileScale);
      side.fill.setFillStyle(def.fill, 1);
      side.glow.setFillStyle(glowColor, 1);
    }

    // Telegraph the fork: tint the hard gap's posts amber so the reward reads
    // before the player commits (the easy gap keeps the default mint posts).
    if (this.isFork && this.gap2L && this.gap2R) {
      for (const m of [this.gap2L, this.gap2R]) {
        m.core.setFillStyle(FORK_CFG.telegraphColor, 1);
        m.glow.setFillStyle(FORK_CFG.telegraphColor, 1);
      }
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
    if (this.def.animFrames > 1) {
      const frameIdx = Math.floor(this.t / this.def.animMs) % this.def.animFrames;
      const frameName = frameIdx === 0 ? this.def.frame : `${this.def.frame}_f${frameIdx}`;
      this.left.cap.setTexture(ASSET_KEYS.OBSTACLES, `${frameName}_r`);
      this.right.cap.setTexture(ASSET_KEYS.OBSTACLES, `${frameName}_l`);
      this.left.center.setTexture(ASSET_KEYS.OBSTACLES, `${frameName}_c`);
      this.right.center.setTexture(ASSET_KEYS.OBSTACLES, `${frameName}_c`);
      this.pillar.center.setTexture(ASSET_KEYS.OBSTACLES, `${frameName}_c`);
    }
    this.layout();
  }

  private layout(): void {
    if (this.isFork) {
      this.layoutFork();
      return;
    }

    const half = this.gapWidth / 2;
    this.placeSide(this.left, 0, this.gapX - half, true);
    this.placeSide(this.right, this.gapX + half, GAME_WIDTH, false);
    this.hidePillar();

    if (this.showGlow) {
      const a = 0.32 + 0.18 * Math.sin(this.t * 0.008);
      this.left.glow.setAlpha(a);
      this.right.glow.setAlpha(a);
    }

    this.placeMarker(this.gapL, this.gapX - half);
    this.placeMarker(this.gapR, this.gapX + half);
    this.hideMarker(this.gap2L);
    this.hideMarker(this.gap2R);
  }

  /**
   * Fork layout (GME-017): left wall | gap | central pillar | gap | right wall.
   * The two gaps are drawn in screen order; the easy gap keeps its mint posts
   * and the hard gap shows the amber telegraph posts set in spawn().
   */
  private layoutFork(): void {
    const easyL = this.gapX - this.gapWidth / 2;
    const easyR = this.gapX + this.gapWidth / 2;
    const hardL = this.gap2X - this.gap2Width / 2;
    const hardR = this.gap2X + this.gap2Width / 2;
    // Inner faces of the pillar = the right edge of the left gap and the left
    // edge of the right gap, whichever gap sits on which side of the screen.
    const innerL = Math.min(easyR, hardR);
    const innerR = Math.max(easyL, hardL);
    const leftEdge = Math.min(easyL, hardL);
    const rightEdge = Math.max(easyR, hardR);

    this.placeSide(this.left, 0, leftEdge, true);
    this.placePillar(innerL, innerR);
    this.placeSide(this.right, rightEdge, GAME_WIDTH, false);

    if (this.showGlow) {
      const a = 0.32 + 0.18 * Math.sin(this.t * 0.008);
      this.left.glow.setAlpha(a);
      this.right.glow.setAlpha(a);
      this.pillar.glow.setAlpha(a);
    }

    this.placeMarker(this.gapL, easyL);
    this.placeMarker(this.gapR, easyR);
    this.placeMarker(this.gap2L, hardL);
    this.placeMarker(this.gap2R, hardR);
  }

  /** Lay out the central pillar spanning [x0, x1] (no end-caps — flat faces). */
  private placePillar(x0: number, x1: number): void {
    const w = x1 - x0;
    const visible = w > 1;
    this.pillar.fill.setVisible(visible);
    this.pillar.center.setVisible(visible);
    this.pillar.glow.setVisible(visible && this.showGlow);
    this.pillar.cap.setVisible(false);
    if (!visible) return;
    const cx = (x0 + x1) / 2;
    const band = this.bandHeight;
    this.pillar.fill.setPosition(cx, this.y).setDisplaySize(w, band);
    this.pillar.glow.setPosition(cx, this.y).setDisplaySize(w, band);
    this.pillar.center.setSize(w, band).setPosition(cx, this.y);
  }

  /** Hide the central pillar (single-gap barriers). */
  private hidePillar(): void {
    this.pillar.fill.setVisible(false);
    this.pillar.cap.setVisible(false);
    this.pillar.center.setVisible(false);
    this.pillar.glow.setVisible(false);
  }

  /** Hide a gap-edge post outright (used for the unused hard-gap posts). */
  private hideMarker(m?: GapMarker): void {
    if (!m) return;
    m.core.setVisible(false);
    m.glow.setVisible(false);
  }

  /** Place a gap-edge post at inner edge `x`, on-screen only, with a soft pulse. */
  private placeMarker(m: GapMarker | undefined, x: number): void {
    if (!m) return;
    const onScreen = x > 1 && x < GAME_WIDTH - 1;
    m.core.setVisible(onScreen);
    m.glow.setVisible(onScreen);
    if (!onScreen) return;
    const band = this.bandHeight * GAP_MARKER_CFG.heightScale;
    const pulse = 1 + 0.18 * Math.sin(this.t * GAP_MARKER_CFG.pulseSpeed);
    m.glow.setPosition(x, this.y).setDisplaySize(GAP_MARKER_CFG.glowWidth, band).setAlpha(GAP_MARKER_CFG.glowAlpha * pulse);
    m.core.setPosition(x, this.y).setDisplaySize(GAP_MARKER_CFG.width, band).setAlpha(GAP_MARKER_CFG.coreAlpha);
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
    this.isFork = false;
    this.y = -9999;
    for (const side of [this.left, this.right, this.pillar]) {
      [side.fill, side.cap, side.center, side.glow].forEach((o) =>
        o.setVisible(false).setPosition(0, -9999)
      );
    }
    for (const m of [this.gapL, this.gapR, this.gap2L, this.gap2R]) {
      if (m) [m.core, m.glow].forEach((o) => o.setVisible(false).setPosition(0, -9999));
    }
  }

  destroy(): void {
    for (const side of [this.left, this.right, this.pillar]) {
      [side.fill, side.cap, side.center, side.glow].forEach((o) => o.destroy());
    }
    for (const m of [this.gapL, this.gapR, this.gap2L, this.gap2R]) {
      if (m) [m.core, m.glow].forEach((o) => o.destroy());
    }
  }
}
