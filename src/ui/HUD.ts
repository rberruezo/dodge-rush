import Phaser from 'phaser';
import { COLORS, GAME_WIDTH } from '../config/Constants';

/**
 * In-game heads-up display: live score (top-centre), best score, and a tappable
 * pause button (top-right). Kept above all gameplay layers via a high depth.
 */
export class HUD {
  private scene: Phaser.Scene;
  private scoreText: Phaser.GameObjects.Text;
  private bestText: Phaser.GameObjects.Text;
  private pauseBtn: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene, best: number, onPause: () => void) {
    this.scene = scene;

    this.scoreText = scene.add
      .text(GAME_WIDTH / 2, 54, '0', {
        fontFamily: 'monospace',
        fontSize: '64px',
        color: COLORS.white,
        fontStyle: 'bold'
      })
      .setOrigin(0.5)
      .setShadow(0, 4, '#00000088', 0, true, true)
      .setDepth(100);

    this.bestText = scene.add
      .text(GAME_WIDTH / 2, 104, `BEST ${best}`, {
        fontFamily: 'monospace',
        fontSize: '24px',
        color: COLORS.gold,
        fontStyle: 'bold'
      })
      .setOrigin(0.5)
      .setShadow(0, 2, '#00000088', 0, true, true)
      .setDepth(100);

    this.pauseBtn = this.createPauseButton(onPause);
  }

  private createPauseButton(onPause: () => void): Phaser.GameObjects.Container {
    const size = 64;
    const x = GAME_WIDTH - 48;
    const y = 52;
    const c = this.scene.add.container(x, y).setDepth(100);

    const g = this.scene.add.graphics();
    g.fillStyle(COLORS.panel, 0.85);
    g.fillRoundedRect(-size / 2, -size / 2, size, size, 14);
    g.lineStyle(3, COLORS.panelStroke, 1);
    g.strokeRoundedRect(-size / 2, -size / 2, size, size, 14);
    g.fillStyle(0xffffff, 1);
    g.fillRect(-12, -16, 8, 32);
    g.fillRect(4, -16, 8, 32);
    c.add(g);

    c.setSize(size + 16, size + 16);
    c.setInteractive(
      new Phaser.Geom.Rectangle(-(size + 16) / 2, -(size + 16) / 2, size + 16, size + 16),
      Phaser.Geom.Rectangle.Contains
    );
    c.on(Phaser.Input.Events.POINTER_DOWN, onPause);
    return c;
  }

  update(score: number): void {
    this.scoreText.setText(String(score));
  }

  setVisible(v: boolean): void {
    this.scoreText.setVisible(v);
    this.bestText.setVisible(v);
    this.pauseBtn.setVisible(v);
  }

  destroy(): void {
    this.scoreText.destroy();
    this.bestText.destroy();
    this.pauseBtn.destroy();
  }
}
