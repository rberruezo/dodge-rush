import Phaser from 'phaser';
import { COLORS, GAME_WIDTH } from '../config/Constants';
import { Text } from '../config/TextStyles';

/**
 * In-game HUD: score (top-centre), live best, combo, lives, a dash-cooldown
 * meter (top-left) and a pause button (top-right). Above all gameplay layers.
 */
export class HUD {
  private scene: Phaser.Scene;
  private scoreText: Phaser.GameObjects.Text;
  private bestText: Phaser.GameObjects.Text;
  private comboText: Phaser.GameObjects.Text;
  private livesText: Phaser.GameObjects.Text;
  private dashIcon: Phaser.GameObjects.Text;
  private dashFill: Phaser.GameObjects.Rectangle;
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

    // Dash cooldown meter (top-left, under the lives).
    this.dashIcon = scene.add.text(24, 92, '⚡', Text.body(26, COLORS.gold)).setOrigin(0, 0.5).setDepth(100);
    scene.add.rectangle(52, 92, 66, 9, 0x000000, 0.5).setOrigin(0, 0.5).setDepth(100);
    this.dashFill = scene.add
      .rectangle(52, 92, 66, 9, 0xffd54a, 1)
      .setOrigin(0, 0.5)
      .setDepth(100);

    this.pauseBtn = this.createPauseButton(onPause);
  }

  /** Render remaining lives as filled/empty hearts. */
  setLives(lives: number, max: number): void {
    let s = '';
    for (let i = 0; i < max; i++) s += i < lives ? '♥' : '♡';
    this.livesText.setText(s);
  }

  /** Update the dash meter: full + bright gold when ready, filling while charging. */
  setDash(ready: boolean, charge: number): void {
    this.dashFill.scaleX = ready ? 1 : Phaser.Math.Clamp(charge, 0, 1);
    this.dashFill.setFillStyle(ready ? 0xffd54a : 0xff4f9a, 1);
    this.dashIcon.setColor(ready ? COLORS.gold : '#7a7a92');
    this.dashIcon.setAlpha(ready ? 1 : 0.7);
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
    [this.scoreText, this.bestText, this.comboText, this.livesText, this.dashIcon, this.dashFill, this.pauseBtn].forEach(
      (o) => o.setVisible(v)
    );
  }

  destroy(): void {
    [this.scoreText, this.bestText, this.comboText, this.livesText, this.dashIcon, this.dashFill, this.pauseBtn].forEach(
      (o) => o.destroy()
    );
  }
}
