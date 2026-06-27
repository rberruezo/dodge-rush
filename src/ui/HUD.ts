import Phaser from 'phaser';
import { COLORS, GAME_WIDTH, GAME_HEIGHT } from '../config/Constants';
import { Text } from '../config/TextStyles';
import { FEATURES } from '../config/FeatureFlags';

/**
 * In-game HUD: score (top-centre), live best, combo, lives (top-left) and a
 * pause button (top-right). Above all gameplay layers.
 */
export class HUD {
  private scene: Phaser.Scene;
  private scoreText: Phaser.GameObjects.Text;
  private bestText: Phaser.GameObjects.Text;
  private comboText: Phaser.GameObjects.Text;
  private livesText: Phaser.GameObjects.Text;
  private pauseBtn: Phaser.GameObjects.Container;
  private bestScore: number;
  private recordSet = false;

  constructor(scene: Phaser.Scene, best: number, onPause: () => void) {
    this.scene = scene;
    this.bestScore = best;

    this.scoreText = scene.add
      .text(GAME_WIDTH / 2, 60, '0', Text.score(48))
      .setOrigin(0.5)
      .setDepth(100);

    this.bestText = scene.add
      .text(GAME_WIDTH / 2, 104, `BEST ${best}`, Text.label(24))
      .setOrigin(0.5)
      .setDepth(100);

    this.comboText = scene.add
      .text(GAME_WIDTH / 2, 142, '', Text.button(20, COLORS.accent))
      .setOrigin(0.5)
      .setShadow(0, 3, '#00000099', 0, true, true)
      .setDepth(100);

    this.livesText = scene.add
      .text(22, 44, '', Text.label(30, COLORS.accent))
      .setOrigin(0, 0.5)
      .setDepth(100);

    this.pauseBtn = this.createPauseButton(onPause);
  }

  /**
   * Zone milestone banner (GME-GD-006): a brief, non-intrusive title that pops in,
   * holds, and floats out over ~1.5s. Self-destroys; safe to call repeatedly.
   */
  showZoneBanner(name: string): void {
    if (!FEATURES.COMBO_LABELS_ENABLED) return; // disabled in MVP v1.0
    const banner = this.scene.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.3, name, Text.title(34, COLORS.gold))
      .setOrigin(0.5)
      .setDepth(101)
      .setAlpha(0)
      .setScale(0.8);
    this.scene.tweens.add({ targets: banner, alpha: 1, scale: 1, duration: 220, ease: 'Back.out' });
    this.scene.tweens.add({
      targets: banner,
      alpha: 0,
      y: GAME_HEIGHT * 0.3 - 36,
      delay: 1100,
      duration: 400,
      ease: 'Cubic.in',
      onComplete: () => banner.destroy()
    });
  }

  /** Render remaining lives as filled/empty hearts. */
  setLives(lives: number, max: number): void {
    // One-hit modes (max <= 1, e.g. CLASSIC) show no hearts — there's nothing to track.
    if (max <= 1) {
      this.livesText.setText('');
      return;
    }
    let s = '';
    for (let i = 0; i < max; i++) s += i < lives ? '♥' : '♡';
    this.livesText.setText(s);
  }

  private createPauseButton(onPause: () => void): Phaser.GameObjects.Container {
    const size = 64;
    const c = this.scene.add.container(GAME_WIDTH - 48, 52).setDepth(100);

    const g = this.scene.add.graphics();
    g.fillStyle(COLORS.panel, 0.85);
    g.fillRoundedRect(-size / 2, -size / 2, size, size, 14);
    g.lineStyle(3, COLORS.panelStroke, 1);
    g.strokeRoundedRect(-size / 2, -size / 2, size, size, 14);
    g.fillStyle(0xffffff, 1);
    g.fillRect(-12, -16, 8, 32);
    g.fillRect(4, -16, 8, 32);
    c.add(g);

    const hit = this.scene.add
      .rectangle(0, 0, size + 36, size + 36, 0xffffff, 0)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    hit.on(Phaser.Input.Events.POINTER_UP, onPause);
    c.add(hit);
    return c;
  }

  /** Called once the run overtakes the stored best — celebrate the live record. */
  markRecord(): void {
    if (this.recordSet) return;
    this.recordSet = true;
    this.scene.tweens.add({
      targets: this.bestText,
      scale: { from: 1, to: 1.4 },
      duration: 260,
      yoyo: true,
      ease: 'Quad.out'
    });
  }

  update(score: number, combo: number, multiplier: number, boost: boolean): void {
    this.scoreText.setText(String(score));
    const live = Math.max(this.bestScore, score);
    this.bestText.setText(`${this.recordSet ? '★BEST' : 'BEST'} ${live}`);

    if (multiplier > 1) {
      this.comboText.setText(`COMBO ${combo}  x${multiplier}`);
      this.comboText.setColor(boost ? COLORS.gold : COLORS.accent);
      this.comboText.setVisible(true);
    } else if (boost) {
      this.comboText.setText('SCORE BOOST!');
      this.comboText.setColor(COLORS.gold);
      this.comboText.setVisible(true);
    } else {
      this.comboText.setVisible(false);
    }
  }

  setVisible(v: boolean): void {
    [this.scoreText, this.bestText, this.comboText, this.livesText, this.pauseBtn].forEach(
      (o) => o.setVisible(v)
    );
  }

  destroy(): void {
    [this.scoreText, this.bestText, this.comboText, this.livesText, this.pauseBtn].forEach(
      (o) => o.destroy()
    );
  }
}
