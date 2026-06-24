import Phaser from 'phaser';
import { ASSET_KEYS, ANIM_KEYS, COLORS, GAME_WIDTH, GAME_HEIGHT } from '../config/Constants';
import { Background } from '../objects/Background';
import { Button } from '../ui/Button';
import { Sound } from '../systems/SoundManager';

interface GameOverData {
  score: number;
  best: number;
  isNewBest: boolean;
}

/**
 * Results screen: final score, best score, a "NEW BEST!" celebration, and
 * Retry / Main Menu actions.
 */
export class GameOverScene extends Phaser.Scene {
  private bg!: Background;

  constructor() {
    super('GameOver');
  }

  create(data: GameOverData): void {
    const cx = GAME_WIDTH / 2;
    const score = data?.score ?? 0;
    const best = data?.best ?? 0;
    const isNewBest = data?.isNewBest ?? false;

    this.bg = new Background(this).setDepth(0);
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x1a1030, 0.55).setOrigin(0, 0);

    this.add
      .text(cx, 180, 'GAME OVER', {
        fontFamily: 'monospace',
        fontSize: '64px',
        color: COLORS.white,
        fontStyle: 'bold'
      })
      .setOrigin(0.5)
      .setShadow(0, 5, '#00000099', 0, true, true);

    // Reaction sprite: cheering on a new best, otherwise dizzy.
    const hero = this.add.sprite(cx, 350, ASSET_KEYS.CHARACTER, isNewBest ? 24 : 18).setScale(2.6);
    const anim = isNewBest ? ANIM_KEYS.CHEER : ANIM_KEYS.HURT;
    if (this.anims.exists(anim)) hero.play(anim);

    // Score panel
    this.add
      .text(cx, 500, 'SCORE', {
        fontFamily: 'monospace',
        fontSize: '28px',
        color: '#ffd9ec'
      })
      .setOrigin(0.5);
    this.add
      .text(cx, 552, String(score), {
        fontFamily: 'monospace',
        fontSize: '76px',
        color: COLORS.white,
        fontStyle: 'bold'
      })
      .setOrigin(0.5);
    this.add
      .text(cx, 628, `BEST  ${best}`, {
        fontFamily: 'monospace',
        fontSize: '32px',
        color: COLORS.gold,
        fontStyle: 'bold'
      })
      .setOrigin(0.5);

    if (isNewBest) {
      const badge = this.add
        .text(cx, 680, '★ NEW BEST! ★', {
          fontFamily: 'monospace',
          fontSize: '34px',
          color: COLORS.accent,
          fontStyle: 'bold'
        })
        .setOrigin(0.5);
      this.tweens.add({
        targets: badge,
        scale: { from: 1, to: 1.15 },
        duration: 500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.inOut'
      });
      Sound.newBest();
    }

    new Button(this, cx, 790, 'RETRY', () => this.scene.start('Game'), {
      width: 320,
      height: 92,
      fontSize: 42
    });
    new Button(this, cx, 890, 'MAIN MENU', () => this.scene.start('MainMenu'), {
      width: 320,
      height: 72,
      fontSize: 30,
      fill: 0x44345e
    });
  }

  update(_time: number, delta: number): void {
    this.bg.update(delta, 0.12);
  }
}
