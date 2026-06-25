import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/Constants';
import { Text } from '../config/TextStyles';
import { Button } from '../ui/Button';
import { Sound } from '../systems/SoundManager';
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

    this.add.text(cx, 250, 'PAUSED', Text.title(48)).setOrigin(0.5);

    new Button(this, cx, 430, 'RESUME', () => this.resume(), { width: 320, fontSize: 30 });
    new Button(this, cx, 540, 'RESTART', () => this.restart(), {
      width: 320,
      fontSize: 28,
      fill: 0x6a4bd0
    });
    new Button(this, cx, 650, 'MENU', () => this.toMenu(), {
      width: 320,
      fontSize: 28,
      fill: 0x44345e
    });

    // Sound on/off toggle.
    const soundBtn: Button = new Button(
      this,
      cx,
      770,
      this.soundLabel(),
      () => {
        Sound.unlock();
        Sound.toggleMute();
        soundBtn.setLabel(this.soundLabel());
      },
      { width: 320, height: 72, fontSize: 22, fill: 0x2f2348 }
    );

    this.input.keyboard?.on('keydown-ESC', () => this.resume());
  }

  private soundLabel(): string {
    return Sound.isMuted ? 'SOUND OFF' : 'SOUND ON';
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
