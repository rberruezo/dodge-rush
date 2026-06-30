import Phaser from 'phaser';
import { ASSET_KEYS, FORK_CFG, GAME_WIDTH, GAP_MARKER_CFG, OBSTACLE_WALL_FRAMES } from '../config/Constants';
import { ObstacleType, ObstacleTypeDef, OBSTACLE_TYPES } from '../config/ObstacleTypes';
import { isFeatureEnabled } from '../config/FeatureFlags';

/** Fast lookup of wall/pillar native sizes by obstacle type name. */
const WALL_FRAME_SIZE = new Map(
  OBSTACLE_WALL_FRAMES.map((f) => [f.name, { wallW: f.wallW, wallH: f.wallH, pillarW: f.pillarW, pillarH: f.pillarH }])
);

/** One side of a barrier wall: a single long panel shown via Image + setCrop. */
interface WallSide {
  panel: Phaser.GameObjects.Image; // full wall panel, cropped at runtime to wall width
  glow: Phaser.GameObjects.Rectangle; // neon/danger/golden pulse (ADD blend)
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

  // [OBS-007] A/B gate for ADD-blend glow (gap-marker halos + obstacle pulse).
  // Read once at construction: A/B is exercised by flipping the flag + rebuild.
  private readonly glowEnabled = isFeatureEnabled('OBSTACLE_GLOW_ENABLED');

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
    const frame = OBSTACLE_WALL_FRAMES[0].name;
    return {
      panel: scene.add
        .image(0, -9999, ASSET_KEYS.OBSTACLES, `${frame}_wall`)
        .setOrigin(0, 0.5)
        .setDepth(5)
        .setVisible(false),
      glow: scene.add
        .rectangle(0, -9999, 10, 10, 0xffffff)
        .setOrigin(0.5)
        .setDepth(6)
        .setVisible(false)
        .setBlendMode(Phaser.BlendModes.ADD)
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

    const size = WALL_FRAME_SIZE.get(def.frame);
    void size; // dimensions used per-frame in placeSide via WALL_FRAME_SIZE

    // [OBS-007] obstacle pulse (Wall.glow) only when the type uses it AND the flag is on.
    this.showGlow = (def.glowing || def.danger || def.golden) && this.glowEnabled;
    const glowColor = def.golden ? 0xffd54a : def.danger ? 0xff3030 : def.glowing ? 0x9933ff : 0x46e6ff;

    for (const side of [this.left, this.right, this.pillar]) {
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

  /** Lay out the central pillar spanning [x0, x1] (caps on both sides from pillar sprite). */
  private placePillar(x0: number, x1: number): void {
    const w = x1 - x0;
    const visible = w > 1;
    this.pillar.panel.setVisible(visible);
    this.pillar.glow.setVisible(visible && this.showGlow);
    if (!visible) return;
    const cx = (x0 + x1) / 2;
    const band = this.bandHeight;
    // Stretch pillar sprite to fill pillar width; slight x-scale on a narrow
    // element is imperceptible, and both caps of the pillar face the gaps.
    this.pillar.panel
      .setTexture(ASSET_KEYS.OBSTACLES, `${this.def.frame}_pillar`)
      .setDisplaySize(w, band)
      .setCrop() // clear any previous crop so full texture is shown
      .setOrigin(0.5, 0.5)
      .setPosition(cx, this.y);
    this.pillar.glow.setPosition(cx, this.y).setDisplaySize(w, band);
  }

  /** Hide the central pillar (single-gap barriers). */
  private hidePillar(): void {
    this.pillar.panel.setVisible(false);
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
    // [OBS-007] gate both core and glow behind the flag — no posts when glow is off.
    m.core.setVisible(onScreen && this.glowEnabled);
    m.glow.setVisible(onScreen && this.glowEnabled);
    if (!onScreen) return;
    const band = this.bandHeight * GAP_MARKER_CFG.heightScale;
    const pulse = 1 + 0.18 * Math.sin(this.t * GAP_MARKER_CFG.pulseSpeed);
    m.glow.setPosition(x, this.y).setDisplaySize(GAP_MARKER_CFG.glowWidth, band).setAlpha(GAP_MARKER_CFG.glowAlpha * pulse);
    m.core.setPosition(x, this.y).setDisplaySize(GAP_MARKER_CFG.width, band).setAlpha(GAP_MARKER_CFG.coreAlpha);
  }

  /**
   * Lay out one wall side spanning [x0, x1].
   * `capAtRight` = true  → left wall: show rightmost `w` px of the panel (right cap faces gap).
   * `capAtRight` = false → right wall: show leftmost `w` px of the panel (left cap faces gap).
   */
  private placeSide(side: WallSide, x0: number, x1: number, capAtRight: boolean): void {
    const w = x1 - x0;
    const visible = w > 1;
    side.panel.setVisible(visible);
    side.glow.setVisible(visible && this.showGlow);
    if (!visible) return;

    const band = this.bandHeight;
    const fs = WALL_FRAME_SIZE.get(this.def.frame);
    const nativeW = fs?.wallW ?? 664;
    const nativeH = fs?.wallH ?? 120;
    const scaleY = band / nativeH;

    if (capAtRight) {
      // Left wall: anchor right edge at x1, crop the rightmost `w` world-px of the texture.
      const texCropW = Math.min(nativeW, w / scaleY);
      const texCropX = nativeW - texCropW;
      side.panel
        .setTexture(ASSET_KEYS.OBSTACLES, `${this.def.frame}_wall`)
        .setScale(scaleY)
        .setCrop(texCropX, 0, texCropW, nativeH)
        .setOrigin(1, 0.5)
        .setPosition(x1, this.y);
    } else {
      // Right wall: anchor left edge at x0, crop the leftmost `w` world-px of the texture.
      const texCropW = Math.min(nativeW, w / scaleY);
      side.panel
        .setTexture(ASSET_KEYS.OBSTACLES, `${this.def.frame}_wall`)
        .setScale(scaleY)
        .setCrop(0, 0, texCropW, nativeH)
        .setOrigin(0, 0.5)
        .setPosition(x0, this.y);
    }
    side.glow.setPosition((x0 + x1) / 2, this.y).setDisplaySize(w, band);
  }

  recycle(): void {
    this.active = false;
    this.isFork = false;
    this.y = -9999;
    for (const side of [this.left, this.right, this.pillar]) {
      side.panel.setVisible(false).setPosition(0, -9999);
      side.glow.setVisible(false).setPosition(0, -9999);
    }
    for (const m of [this.gapL, this.gapR, this.gap2L, this.gap2R]) {
      if (m) [m.core, m.glow].forEach((o) => o.setVisible(false).setPosition(0, -9999));
    }
  }

  destroy(): void {
    for (const side of [this.left, this.right, this.pillar]) {
      side.panel.destroy();
      side.glow.destroy();
    }
    for (const m of [this.gapL, this.gapR, this.gap2L, this.gap2R]) {
      if (m) [m.core, m.glow].forEach((o) => o.destroy());
    }
  }
}
