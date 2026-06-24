import Phaser from 'phaser';
import { BG_THEME_KEYS, BG_CFG, GAME_WIDTH, GAME_HEIGHT, SCROLL_CFG } from '../config/Constants';

/**
 * Infinite, theme-shifting sky.
 *
 * Descent: a TileSprite scrolls a mirror-doubled texture (see
 * scripts/build-backgrounds.py) so the fall loops forever with no visible seam.
 *
 * Scene change: two stacked layers cross-dissolve. To switch theme we load the
 * next texture onto the hidden layer and fade between them while both keep
 * scrolling in lock-step — so the world appears to transition (sunset → night),
 * not snap to a different picture.
 */
export class Background {
  private scene: Phaser.Scene;
  private front: Phaser.GameObjects.TileSprite; // currently visible
  private back: Phaser.GameObjects.TileSprite; // fades in during a change
  private scrollY = 0;
  private themeIndex: number;

  private fading = false;
  private fadeT = 0;

  constructor(scene: Phaser.Scene, themeIndex = 0) {
    this.scene = scene;
    this.themeIndex = themeIndex;

    const mk = (key: string) =>
      scene.add.tileSprite(0, 0, GAME_WIDTH, GAME_HEIGHT, key).setOrigin(0, 0);

    this.back = mk(BG_THEME_KEYS[themeIndex]).setVisible(false);
    this.front = mk(BG_THEME_KEYS[themeIndex]);
  }

  /** Scroll the sky and advance any in-flight theme cross-dissolve. */
  update(dt: number, speed: number): void {
    // Increasing tilePositionY scrolls content upward → reads as descending.
    this.scrollY = (this.scrollY + speed * dt * SCROLL_CFG.bgParallax) % BG_CFG.loopHeight;
    this.front.tilePositionY = this.scrollY;
    this.back.tilePositionY = this.scrollY;

    if (this.fading) {
      this.fadeT += dt;
      const k = Phaser.Math.Clamp(this.fadeT / BG_CFG.crossfadeMs, 0, 1);
      // `back` sits on top and fades in; `front` stays opaque underneath so the
      // total never dips (no mid-fade darkening).
      this.back.setAlpha(k);
      if (k >= 1) this.finishFade();
    }
  }

  /** Begin a smooth dissolve to the next theme in the day-cycle. */
  nextTheme(): void {
    this.changeTheme((this.themeIndex + 1) % BG_THEME_KEYS.length);
  }

  changeTheme(index: number): void {
    if (index === this.themeIndex && !this.fading) return;
    // If a fade is already running, settle it first to avoid layer confusion.
    if (this.fading) this.finishFade();

    this.themeIndex = index;
    this.back.setTexture(BG_THEME_KEYS[index]);
    this.back.tilePositionY = this.scrollY;
    this.back.setAlpha(0).setVisible(true);
    this.scene.children.bringToTop(this.back); // fade in over the opaque front
    this.fading = true;
    this.fadeT = 0;
  }

  private finishFade(): void {
    this.fading = false;
    this.back.setAlpha(1);
    // Promote `back` (now fully visible & on top) to be the new front.
    const promoted = this.back;
    this.back = this.front;
    this.front = promoted;
    this.back.setVisible(false).setAlpha(0);
  }

  setDepth(depth: number): this {
    this.back.setDepth(depth);
    this.front.setDepth(depth);
    return this;
  }

  destroy(): void {
    this.front.destroy();
    this.back.destroy();
  }
}
