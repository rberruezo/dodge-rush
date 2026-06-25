import Phaser from 'phaser';
import { COLORS, GAME_WIDTH, GAME_HEIGHT } from '../config/Constants';
import { Text } from '../config/TextStyles';
import { Button } from '../ui/Button';
import { Sound } from '../systems/SoundManager';
import type { GameScene } from './GameScene';

/**
 * Modal pause overlay launched on top of (and pausing) the GameScene.
 * Offers Resume, Restart and Main Menu.
 *
 * Resuming doesn't drop the player straight back into a moving field: it hides
 * the menu and runs a visible 3-2-1-GO countdown over the still-frozen game so
 * they can re-orient before control returns. The countdown runs here because
 * this overlay stays active while the GameScene (and its timers) are paused.
 */
export class PauseScene extends Phaser.Scene {
  private resuming = false;
  private panel!: Phaser.GameObjects.Container;

  constructor() {
    super('Pause');
  }

  create(): void {
    const cx = GAME_WIDTH / 2;
    this.resuming = false;
    this.input.enabled = true;

    // Dim the frozen game behind the panel.
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.6).setOrigin(0, 0);

    // Everything that should disappear during the resume countdown lives in one
    // container so it can be hidden in a single call.
    this.panel = this.add.container(0, 0);
    const title = this.add.text(cx, 250, 'PAUSED', Text.title(48)).setOrigin(0.5);

    const resumeBtn = new Button(this, cx, 430, 'RESUME', () => this.resume(), {
      width: 320,
      fontSize: 30
    });
    const restartBtn = new Button(this, cx, 540, 'RESTART', () => this.restart(), {
      width: 320,
      fontSize: 28,
      fill: 0x6a4bd0
    });
    const menuBtn = new Button(this, cx, 650, 'MENU', () => this.toMenu(), {
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

    this.panel.add([title, resumeBtn, restartBtn, menuBtn, soundBtn]);

    this.input.keyboard?.on('keydown-ESC', () => this.resume());
  }

  private soundLabel(): string {
    return Sound.isMuted ? 'SOUND OFF' : 'SOUND ON';
  }

  /** Begin the un-pause: hide the menu and run the 3-2-1-GO countdown. */
  private resume(): void {
    if (this.resuming) return;
    this.resuming = true;
    this.input.enabled = false; // no more taps until the game is back
    this.panel.setVisible(false);
    this.startCountdown();
  }

  /**
   * Visible 3-2-1-GO over the frozen game. Each number beeps; "GO" plays the
   * un-pause cue and hands control back to the GameScene.
   */
  private startCountdown(): void {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;
    const label = this.add.text(cx, cy, '', Text.title(120, COLORS.gold)).setOrigin(0.5).setDepth(10);

    const show = (value: string): void => {
      label.setText(value);
      label.setScale(0.4);
      label.setAlpha(1);
      this.tweens.add({ targets: label, scale: 1, duration: 260, ease: 'Back.out' });
      this.tweens.add({ targets: label, alpha: 0.18, duration: 820, delay: 140 });
    };

    let n = 3;
    Sound.countdown(n); // "3" immediately
    show(`${n}`);

    this.time.addEvent({
      delay: 1000,
      repeat: 2, // fires at 1s, 2s, 3s -> 2, 1, GO
      callback: () => {
        n -= 1;
        if (n > 0) {
          Sound.countdown(n);
          show(`${n}`);
        } else {
          show('GO!');
          this.tweens.add({ targets: label, scale: 1.7, alpha: 0, duration: 360, ease: 'Quad.out' });
          Sound.unpause();
          this.time.delayedCall(360, () => this.doResume());
        }
      }
    });
  }

  /** Hand control back to the GameScene. */
  private doResume(): void {
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
