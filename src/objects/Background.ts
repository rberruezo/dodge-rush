import Phaser from 'phaser';
import {
  BG_ZONES,
  BG_LAYERS,
  BG_CFG,
  BgLayer,
  GAME_WIDTH,
  GAME_HEIGHT
} from '../config/Constants';

/**
 * "Sky City" infinite background (see docs/background-skycity.md).
 *
 * Composition, back to front:
 *   1. Sky — two full-screen skyboxes that cross-dissolve as zones cycle. The sky
 *      itself never scrolls; only the zone (day -> dusk -> ... -> aurora) changes.
 *   2. Parallax layers — far clouds, a rare cruiser, occasional airships. Each is
 *      a single loopable tile drawn as a stack of plain Images that we reposition
 *      every frame (no Phaser TileSprite, so non-power-of-two tiles loop cleanly).
 *   3. Grade — a translucent per-zone colour wash over the silhouettes for depth.
 *   4. Neon lights — the vehicles' ADD-blended light layers (never tinted).
 *   5. Near clouds — bright foreground, tinted to the zone.
 *   6. Vignette — optional edge darkening.
 *
 * Each layer scrolls at its own parallax speed, so the world reads as an endless
 * aerial descent. `scrollY` is the raw fall distance; it also drives the zone
 * cycle and is handed between scenes so the descent never jumps.
 */

interface Layer {
  cfg: BgLayer;
  sprites: Phaser.GameObjects.Image[];
}

const mod = (x: number, n: number): number => ((x % n) + n) % n;

const lerpColor = (a: number, b: number, t: number): number => {
  const ca = Phaser.Display.Color.IntegerToColor(a);
  const cb = Phaser.Display.Color.IntegerToColor(b);
  const c = Phaser.Display.Color.Interpolate.ColorWithColor(ca, cb, 100, Math.round(t * 100));
  return Phaser.Display.Color.GetColor(c.r, c.g, c.b);
};

export class Background {
  private scene: Phaser.Scene;
  private scrollY = 0;

  private skies: Phaser.GameObjects.Image[] = []; // one per zone, alpha-crossfaded (no setTexture swap)
  private layers: Layer[] = [];
  private grade!: Phaser.GameObjects.Image;
  private vignette?: Phaser.GameObjects.Image;

  private zoneI = -1; // last applied zone index (forces a refresh on first frame)
  private structTint = -1; // cached tints so we only re-apply on change
  private cloudTint = -1;
  private baseColor = -1; // cached CSS sky-floor colour (device-proof, GL-independent)

  constructor(scene: Phaser.Scene, startScrollY = 0) {
    this.scene = scene;
    this.scrollY = startScrollY;

    const mkFull = (key: string) =>
      scene.add.image(0, 0, key).setOrigin(0, 0).setDisplaySize(GAME_WIDTH, GAME_HEIGHT);

    // 1. One full-screen sky per zone, each with its texture fixed at creation
    // and alpha-crossfaded in syncZone(). We deliberately avoid swapping a
    // single image's texture with setTexture(): that swap left the sky blank on
    // some Android WebView GL drivers (BG-005), while images whose texture is
    // set once (like the cloud layers) always render. Visibility = alpha only.
    this.skies = BG_ZONES.map((z) => mkFull(z.sky).setAlpha(0));

    // 2/4/5. Parallax + light + near-cloud layers, plus the grade wash injected
    // at the configured point. Build in draw order; depth offsets lock that order.
    for (const cfg of BG_LAYERS) {
      if (cfg.key === BG_CFG.gradeBeforeKey) this.buildGrade();
      this.buildLayer(cfg);
    }
    if (!this.grade) this.buildGrade(); // safety: ensure grade exists if misconfigured

    // 6. Optional vignette on top.
    if (BG_CFG.vignetteAlpha > 0 && scene.textures.exists('bg_vignette')) {
      this.vignette = mkFull('bg_vignette').setAlpha(BG_CFG.vignetteAlpha);
    }

    this.syncZone(true);
    this.layout();
  }

  /** Raw fall distance — handed between scenes so the descent never jumps. */
  get scroll(): number {
    return this.scrollY;
  }

  /** Advance the fall, re-place looping layers, and update the zone cycle. */
  update(dt: number, speed: number): void {
    this.scrollY += speed * dt;
    this.layout();
    this.syncZone(false);
  }

  // ---- construction helpers -------------------------------------------------

  /**
   * Atmospheric wash. Rendered as a tinted full-screen Image (not a Phaser
   * `Rectangle` Shape): the Shapes pipeline mis-applied the wash's alpha on some
   * Android WebView GL drivers, leaving it near-opaque and hiding the sky +
   * distant layers below it (BG-005). Routing it through the same textured-quad
   * pipeline as every other layer — a white pixel tinted to the grade colour —
   * renders identically across web and device.
   */
  private buildGrade(): void {
    const key = 'bg_grade_px';
    if (!this.scene.textures.exists(key)) {
      const g = this.scene.make.graphics({ x: 0, y: 0 }, false);
      g.fillStyle(0xffffff, 1).fillRect(0, 0, 8, 8);
      g.generateTexture(key, 8, 8);
      g.destroy();
    }
    this.grade = this.scene.add
      .image(0, 0, key)
      .setOrigin(0, 0)
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT);
  }

  private buildLayer(cfg: BgLayer): void {
    const count = Math.ceil(GAME_HEIGHT / cfg.tile) + 2; // +1 above, +1 spare below
    const sprites: Phaser.GameObjects.Image[] = [];
    for (let i = 0; i < count; i++) {
      const img = this.scene.add
        .image(0, 0, cfg.key)
        .setOrigin(0, 0)
        .setDisplaySize(GAME_WIDTH, cfg.tile);
      if (cfg.additive) img.setBlendMode(Phaser.BlendModes.ADD);
      sprites.push(img);
    }
    this.layers.push({ cfg, sprites });
  }

  // ---- per-frame ------------------------------------------------------------

  /** Reposition every looping layer for the current scroll offset. */
  private layout(): void {
    for (const layer of this.layers) {
      const tile = layer.cfg.tile;
      const o = mod(this.scrollY * layer.cfg.parallax, tile);
      const sprites = layer.sprites;
      for (let j = 0; j < sprites.length; j++) {
        sprites[j].y = -o + (j - 1) * tile; // first tile sits one step above the top
      }
    }
  }

  /** Drive the day-cycle: swap sky textures on zone change, blend tints + grade. */
  private syncZone(force: boolean): void {
    const n = BG_ZONES.length;
    const zf = this.scrollY / BG_CFG.zoneLength;
    const ci = Math.floor(zf);
    const frac = zf - ci;

    const cur = BG_ZONES[mod(ci, n)];
    const nxt = BG_ZONES[mod(ci + 1, n)];

    // Crossfade only across the tail `crossfadeFrac` of each zone.
    const cf = BG_CFG.crossfadeFrac;
    const t = frac <= 1 - cf ? 0 : (frac - (1 - cf)) / cf;

    // Cross-fade by alpha between the current zone's sky and the next one; every
    // other zone sky stays hidden. No texture swapping (see constructor).
    if (force || ci !== this.zoneI) this.zoneI = ci;
    const curI = mod(ci, n);
    const nxtI = mod(ci + 1, n);
    for (let k = 0; k < this.skies.length; k++) this.skies[k].setAlpha(0);
    this.skies[curI].setAlpha(1);
    if (nxtI !== curI) this.skies[nxtI].setAlpha(t);

    // Interpolated tints (cheap; re-applied to sprites only when they change).
    const struct = lerpColor(cur.struct, nxt.struct, t);
    const cloud = lerpColor(cur.cloudTint, nxt.cloudTint, t);
    if (struct !== this.structTint || cloud !== this.cloudTint) {
      this.structTint = struct;
      this.cloudTint = cloud;
      for (const layer of this.layers) {
        const tint = layer.cfg.tint;
        if (tint === 'none') continue;
        const color = tint === 'cloud' ? cloud : struct;
        for (const s of layer.sprites) s.setTint(color);
      }
    }

    // Grade wash: interpolate colour + opacity (tint + alpha on the Image).
    const gradeColor = lerpColor(cur.grade, nxt.grade, t);
    const gradeA = Phaser.Math.Linear(cur.gradeA, nxt.gradeA, t);
    this.grade.setTint(gradeColor).setAlpha(gradeA);

    // Device-proof base: paint the zone's sky colour as a CSS background on the
    // #game element behind the transparent WebGL canvas. The browser compositor
    // — not the GL driver — draws it, so where the textured sky quad failed to
    // render on some Android WebView GL drivers (BG-005/BUG-008) the player still
    // sees a smooth, correct day/night colour instead of an empty void. The PNG
    // sky draws on top of it on healthy devices/web.
    const base = lerpColor(cur.base, nxt.base, t);
    if (base !== this.baseColor) {
      this.baseColor = base;
      const parent = this.scene.game.canvas?.parentElement;
      if (parent) parent.style.backgroundColor = '#' + base.toString(16).padStart(6, '0');
    }
  }

  // ---- lifecycle ------------------------------------------------------------

  /**
   * Place the whole background at `depth`. Every piece shares this depth; their
   * back-to-front order is the order they were created in (Phaser's stable sort
   * preserves it), which already follows the documented draw order. Sharing one
   * depth also keeps anything a scene adds afterwards (e.g. a dimming overlay) on
   * top of the background.
   */
  setDepth(depth: number): this {
    for (const sky of this.skies) sky.setDepth(depth);
    this.grade.setDepth(depth);
    for (const layer of this.layers) layer.sprites.forEach((s) => s.setDepth(depth));
    this.vignette?.setDepth(depth);
    return this;
  }

  destroy(): void {
    for (const sky of this.skies) sky.destroy();
    this.grade.destroy();
    this.vignette?.destroy();
    for (const layer of this.layers) layer.sprites.forEach((s) => s.destroy());
    this.layers = [];
  }
}
