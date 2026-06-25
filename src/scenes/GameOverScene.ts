import Phaser from 'phaser';
import { CHAR_FRAMES, COLORS, GAME_WIDTH, GAME_HEIGHT } from '../config/Constants';
import { getSkin } from '../config/Skins';
import { Text } from '../config/TextStyles';
import { Background } from '../objects/Background';
import { Button } from '../ui/Button';
import { coinCounter } from '../ui/CoinCounter';
import { Profile } from '../systems/ProfileManager';
import { Sound } from '../systems/SoundManager';

interface GameOverData {
  score: number;
  best: number;
  isNewBest: boolean;
  coins: number;
  totalCoins: number;
}

/** Results screen: score, best, "new best", coins earned, and Retry / Menu. */
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
    const coins = data?.coins ?? 0;
    const totalCoins = data?.totalCoins ?? Profile.coins;

    this.bg = new Background(this).setDepth(0);
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x1a1030, 0.55).setOrigin(0, 0);

    this.add.text(cx, 140, 'GAME OVER', Text.title(40)).setOrigin(0.5);

    const skin = getSkin(Profile.selected);
    const hero = this.add
      .sprite(cx, 280, skin.sheet, isNewBest ? CHAR_FRAMES.crown : CHAR_FRAMES.sadCloud)
      .setScale(1.15);
    if (skin.tint !== null) hero.setTint(skin.tint);
    this.tweens.add({
      targets: hero,
      y: isNewBest ? 266 : 290,
      angle: isNewBest ? 0 : -4,
      duration: isNewBest ? 700 : 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut'
    });

    this.add.text(cx, 440, 'SCORE', Text.body(28, '#ffd9ec')).setOrigin(0.5);
    this.add.text(cx, 492, String(score), Text.score(60)).setOrigin(0.5);
    this.add.text(cx, 560, `BEST  ${best}`, Text.label(28)).setOrigin(0.5);

    if (isNewBest) {
      const badge = this.add.text(cx, 604, '★ NEW BEST! ★', Text.button(22, COLORS.accent)).setOrigin(0.5);
      this.tweens.add({
        targets: badge,
        scale: { from: 1, to: 1.12 },
        duration: 500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.inOut'
      });
      Sound.newBest();
    }

    // Coins earned this run + new total.
    coinCounter(this, cx, isNewBest ? 648 : 620, `+${coins}   TOTAL ${totalCoins}`, { size: 26 });
    if (coins > 0) this.time.delayedCall(250, () => Sound.coin());

    new Button(this, cx, 760, 'RETRY', () => this.scene.start('Game'), {
      width: 320,
      height: 88,
      fontSize: 34
    });
    new Button(this, cx, 858, 'MENU', () => this.scene.start('MainMenu'), {
      width: 320,
      height: 70,
      fontSize: 26,
      fill: 0x44345e
    });
  }

  update(_time: number, delta: number): void {
    this.bg.update(delta, 0.12);
  }
}
