import Phaser from 'phaser';
import { COLORS, GAME_WIDTH, GAME_HEIGHT } from '../config/Constants';
import { Button } from '../ui/Button';
import type { GameScene } from './GameScene';

/**
 * Modal pause overlay launched on top of (and pausing) the GameScene.
 * Offers Resume, Restart and Main Menu.
 */
export class PauseScene extends Phaser.Scene {
  constructor() {
    super('Pause');
  }

  create(): void {
    const cx = GAME_WIDTH / 2;

    // Dim the frozen game behind the panel.
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.6).setOrigin(0, 0);

    this.add
      .text(cx, 280, 'PAUSED', {
        fontFamily: 'monospace',
        fontSize: '72px',
        color: COLORS.white,
        fontStyle: 'bold'
      })
      .setOrigin(0.5)
      .setShadow(0, 5, '#00000099', 0, true, true);

    new Button(this, cx, 460, 'RESUME', () => this.resume(), { width: 320, fontSize: 38 });
    new Button(this, cx, 570, 'RESTART', () => this.restart(), {
      width: 320,
      fontSize: 38,
      fill: 0x6a4bd0
    });
    new Button(this, cx, 680, 'MAIN MENU', () => this.toMenu(), {
      width: 320,
      fontSize: 38,
      fill: 0x44345e
    });

    this.input.keyboard?.on('keydown-ESC', () => this.resume());
  }

  private resume(): void {
    const game = this.scene.get('Game') as GameScene;
    this.scene.stop();
    this.scene.resume('Game');
    game.resumePlay();
  }

  private restart(): void {
    this.scene.stop();
    this.scene.stop('Game');
    this.scene.start('Game');
  }

  private toMenu(): void {
    this.scene.stop();
    this.scene.stop('Game');
    this.scene.start('MainMenu');
  }
}
