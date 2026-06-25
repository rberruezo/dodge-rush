import Phaser from 'phaser';
import { CHAR_FRAMES, COLORS, GAME_WIDTH, GAME_HEIGHT } from '../config/Constants';
import { getSkin } from '../config/Skins';
import { Text } from '../config/TextStyles';
import { Background } from '../objects/Background';
import { Button } from '../ui/Button';
import { coinCounter } from '../ui/CoinCounter';
import { Profile } from '../systems/ProfileManager';
import { Rewarded } from '../systems/Rewarded';
import { Sound } from '../systems/SoundManager';

interface GameOverData {
  score: number;
  best: number;
  isNewBest: boolean;
  coins: number;
  totalCoins: number;
  missionDone?: boolean;
}

/** Results screen: score, best, coins earned, opt-in double-coins, Retry / Menu. */
export class GameOverScene extends Phaser.Scene {
  private bg!: Background;
  private coinsEarned = 0;
  private coinsDoubled = false;
  private coinRow?: Phaser.GameObjects.Container;
  private doubleBtn?: Button;

  constructor() {
    super('GameOver');
  }

  create(data: GameOverData): void {
    const cx = GAME_WIDTH / 2;
    const score = data?.score ?? 0;
    const best = data?.best ?? 0;
    const isNewBest = data?.isNewBest ?? false;
    this.coinsEarned = data?.coins ?? 0;
    this.coinsDoubled = false;

    this.bg = new Background(this).setDepth(0);
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x1a1030, 0.55).setOrigin(0, 0);

    this.add.text(cx, 120, 'GAME OVER', Text.title(40)).setOrigin(0.5);

    const skin = getSkin(Profile.selected);
    const hero = this.add
      .sprite(cx, 248, skin.sheet, isNewBest ? CHAR_FRAMES.crown : CHAR_FRAMES.sadCloud)
      .setScale(1.1);
    if (skin.tint !== null) hero.setTint(skin.tint);
    this.tweens.add({
      targets: hero,
      y: isNewBest ? 236 : 258,
      angle: isNewBest ? 0 : -4,
      duration: isNewBest ? 700 : 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut'
    });

    this.add.text(cx, 366, 'SCORE', Text.body(26, '#ffd9ec')).setOrigin(0.5);
    this.add.text(cx, 414, String(score), Text.score(56)).setOrigin(0.5);
    this.add.text(cx, 478, `BEST  ${best}`, Text.label(26)).setOrigin(0.5);

    if (isNewBest) {
      const badge = this.add.text(cx, 516, '★ NEW BEST! ★', Text.button(22, COLORS.accent)).setOrigin(0.5);
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

    // Coins earned this run + new total (rebuilt if the player doubles them).
    this.renderCoinRow(cx, 566);
    if (this.coinsEarned > 0) this.time.delayedCall(250, () => Sound.coin());

    // Opt-in double-coins via rewarded ad (only when there's something to double).
    if (this.coinsEarned > 0) {
      this.doubleBtn = new Button(this, cx, 632, '▶ DOUBLE COINS', () => this.doubleCoins(), {
        width: 408,
        height: 64,
        fontSize: 24,
        fill: 0xffa726,
        textColor: '#3a2400'
      });
    }

    if (data?.missionDone) {
      this.add
        .text(cx, 706, '🎯 Daily mission done — claim it in DAILY!', Text.body(24, '#7bf0a8'))
        .setOrigin(0.5);
    }

    new Button(this, cx, 788, 'RETRY', () => this.scene.start('Game'), {
      width: 320,
      height: 82,
      fontSize: 32
    });
    new Button(this, cx, 882, 'MENU', () => this.scene.start('MainMenu'), {
      width: 320,
      height: 60,
      fontSize: 24,
      fill: 0x44345e
    });
  }

  private renderCoinRow(cx: number, y: number): void {
    this.coinRow?.destroy();
    const earned = this.coinsDoubled ? this.coinsEarned * 2 : this.coinsEarned;
    const suffix = this.coinsDoubled ? '  (x2!)' : '';
    this.coinRow = coinCounter(this, cx, y, `+${earned}   TOTAL ${Profile.coins}${suffix}`, { size: 26 });
  }

  private doubleCoins(): void {
    if (this.coinsDoubled || this.coinsEarned <= 0) return;
    this.doubleBtn?.setLabel('LOADING…');
    Rewarded.show('double_coins').then((earned) => {
      if (!earned) {
        this.doubleBtn?.setLabel('▶ DOUBLE COINS');
        return;
      }
      this.coinsDoubled = true;
      Profile.addCoins(this.coinsEarned); // grant the second helping
      Sound.coin();
      this.renderCoinRow(GAME_WIDTH / 2, 566);
      this.doubleBtn?.setLabel('✓ DOUBLED');
    });
  }

  update(_time: number, delta: number): void {
    this.bg.update(delta, 0.12);
  }
}
