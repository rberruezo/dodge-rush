import Phaser from 'phaser';
import { COLORS, GAME_WIDTH, GAME_HEIGHT } from '../config/Constants';
import { Text } from '../config/TextStyles';
import { Button } from '../ui/Button';
import { Sound } from '../systems/SoundManager';
import { Rewarded } from '../systems/Rewarded';
import type { GameScene } from './GameScene';

interface ContinueData {
  score: number;
}

const COUNTDOWN_SECONDS = 6;

/**
 * One-time "Continue?" overlay shown when the player runs out of lives.
 *
 * Opt-in only: the player can watch a (currently simulated) rewarded ad to keep
 * the same run going, or decline. A countdown auto-declines so it's never a
 * blocker. This is the player-friendly revive hook for Phase 4 monetization.
 */
export class ContinueScene extends Phaser.Scene {
  private resolved = false;
  private secondsLeft = COUNTDOWN_SECONDS;
  private countText!: Phaser.GameObjects.Text;
  private ring!: Phaser.GameObjects.Arc;
  private timer?: Phaser.Time.TimerEvent;

  constructor() {
    super('Continue');
  }

  create(_data: ContinueData): void {
    this.resolved = false;
    this.secondsLeft = COUNTDOWN_SECONDS;
    const cx = GAME_WIDTH / 2;

    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x0a0518, 0.78).setOrigin(0, 0);

    this.add.text(cx, 250, 'OUT OF LIVES', Text.body(34, '#ff9ecf')).setOrigin(0.5);
    this.add.text(cx, 312, 'CONTINUE?', Text.title(44, COLORS.white)).setOrigin(0.5);

    // Countdown ring + number.
    this.ring = this.add.circle(cx, 430, 52).setStrokeStyle(6, COLORS.panelStroke);
    this.countText = this.add.text(cx, 430, `${this.secondsLeft}`, Text.title(46, COLORS.gold)).setOrigin(0.5);

    new Button(this, cx, 588, '▶  CONTINUE', () => this.accept(), {
      width: 360,
      height: 96,
      fontSize: 30,
      fill: 0x2f9e57
    });
    this.add
      .text(cx, 654, Rewarded.simulated ? 'Watch a short ad (demo)' : 'Watch a short ad', Text.body(24, '#bfe9ff'))
      .setOrigin(0.5);

    new Button(this, cx, 760, 'NO THANKS', () => this.decline(), {
      width: 300,
      height: 70,
      fontSize: 24,
      fill: 0x44345e
    });

    this.timer = this.time.addEvent({
      delay: 1000,
      repeat: COUNTDOWN_SECONDS - 1,
      callback: () => this.tick()
    });
  }

  private tick(): void {
    if (this.resolved) return;
    this.secondsLeft -= 1;
    this.countText.setText(`${Math.max(0, this.secondsLeft)}`);
    if (this.secondsLeft <= 0) this.decline();
  }

  private accept(): void {
    if (this.resolved) return;
    this.resolved = true;
    this.timer?.remove();
    Sound.button();

    this.countText.setText('…');
    this.ring.setStrokeStyle(6, 0xffd54a);

    Rewarded.show('continue').then((earned) => {
      const game = this.scene.get('Game') as GameScene;
      this.scene.resume('Game');
      if (earned) game.continueRun();
      else game.finishGameOver();
      this.scene.stop();
    });
  }

  private decline(): void {
    if (this.resolved) return;
    this.resolved = true;
    this.timer?.remove();
    const game = this.scene.get('Game') as GameScene;
    this.scene.resume('Game');
    game.finishGameOver();
    this.scene.stop();
  }
}
