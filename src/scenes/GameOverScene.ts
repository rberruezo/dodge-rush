import Phaser from 'phaser';
import { CHAR_FRAMES, COLORS, GAME_WIDTH, GAME_HEIGHT } from '../config/Constants';
import { getSkin } from '../config/Skins';
import { Text } from '../config/TextStyles';
import { Background } from '../objects/Background';
import { Button } from '../ui/Button';
import { coinCounter } from '../ui/CoinCounter';
import { Profile } from '../systems/ProfileManager';
import { Rewarded } from '../systems/Rewarded';
import { Spin, SPIN_CONSOLATION_COINS } from '../systems/SpinManager';
import { Sound } from '../systems/SoundManager';

interface GameOverData {
  score: number;
  best: number;
  isNewBest: boolean;
  coins: number;
  totalCoins: number;
  missionDone?: boolean;
}

/** Results screen: score, best, coins earned, opt-in spin, Retry / Menu. */
export class GameOverScene extends Phaser.Scene {
  private bg!: Background;
  private spinRow?: Phaser.GameObjects.Container;

  constructor() {
    super('GameOver');
  }

  create(data: GameOverData): void {
    const cx = GAME_WIDTH / 2;
    const score = data?.score ?? 0;
    const best = data?.best ?? 0;
    const isNewBest = data?.isNewBest ?? false;
    const coins = data?.coins ?? 0;
    const isFirstRun = Profile.totalRuns === 1; // run #1 just finished

    this.bg = new Background(this).setDepth(0);
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x1a1030, 0.55).setOrigin(0, 0);

    this.add.text(cx, 110, 'GAME OVER', Text.title(40)).setOrigin(0.5);

    const skin = getSkin(Profile.selected);
    const hero = this.add
      .sprite(cx, 232, skin.sheet, isNewBest ? CHAR_FRAMES.crown : CHAR_FRAMES.sadCloud)
      .setScale(1.1);
    if (skin.tint !== null) hero.setTint(skin.tint);
    this.tweens.add({
      targets: hero,
      y: isNewBest ? 220 : 244,
      angle: isNewBest ? 0 : -4,
      duration: isNewBest ? 700 : 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut'
    });

    this.add.text(cx, 348, 'SCORE', Text.body(26, '#ffd9ec')).setOrigin(0.5);
    this.add.text(cx, 394, String(score), Text.score(56)).setOrigin(0.5);
    this.add.text(cx, 458, `BEST  ${best}`, Text.label(26)).setOrigin(0.5);

    if (isNewBest) {
      const badge = this.add.text(cx, 496, '★ NEW BEST! ★', Text.button(22, COLORS.accent)).setOrigin(0.5);
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

    coinCounter(this, cx, 556, `+${coins}   TOTAL ${Profile.coins}`, { size: 26 });
    if (coins > 0) this.time.delayedCall(250, () => Sound.coin());

    if (data?.missionDone) {
      this.add
        .text(cx, 604, '🎯 Daily mission done — claim it in DAILY!', Text.body(22, '#7bf0a8'))
        .setOrigin(0.5);
    }

    // Spin slot: first run gets a free guaranteed pilot; otherwise opt-in via ad.
    if (isFirstRun) {
      this.renderSpinSlot(cx, 650, true);
    } else if (Spin.canSpin()) {
      this.renderSpinSlot(cx, 650, false);
    }

    new Button(this, cx, 790, 'RETRY', () => this.scene.start('Game'), {
      width: 320,
      height: 82,
      fontSize: 32
    });
    new Button(this, cx, 886, 'MENU', () => this.scene.start('MainMenu'), {
      width: 320,
      height: 60,
      fontSize: 24,
      fill: 0x44345e
    });
  }

  private renderSpinSlot(cx: number, y: number, isFreeFirstRun: boolean): void {
    const container = this.add.container(0, 0);
    this.spinRow = container;

    if (isFreeFirstRun) {
      const btn = new Button(this, cx, y, '🎁  YOUR FIRST PILOT — FREE!', () => this.doSpin(true), {
        width: 440,
        height: 72,
        fontSize: 22,
        fill: 0x2f9e57
      });
      container.add(btn as unknown as Phaser.GameObjects.GameObject);
    } else {
      const btn = new Button(this, cx, y, '🎰  SPIN FOR A PILOT', () => this.doSpin(false), {
        width: 380,
        height: 64,
        fontSize: 24,
        fill: 0x6a2fc0
      });
      const sub = this.add
        .text(cx, y + 42, 'Watch a short video', Text.body(20, '#bfe9ff'))
        .setOrigin(0.5);
      container.add([btn as unknown as Phaser.GameObjects.GameObject, sub]);
    }
  }

  private doSpin(isFreeFirstRun: boolean): void {
    if (!isFreeFirstRun && !Spin.canSpin()) return;

    const cx = GAME_WIDTH / 2;

    const proceed = () => {
      const result = Spin.draw(isFreeFirstRun);
      this.spinRow?.destroy();

      if (result.kind === 'skin') {
        Profile.unlock(result.skin.id);
        const newSkin = result.skin;
        const label = this.add
          .text(cx, 650, `✓ ${newSkin.name} unlocked!`, Text.button(24, '#7bf0a8'))
          .setOrigin(0.5);
        this.tweens.add({ targets: label, scale: { from: 0.7, to: 1 }, duration: 350, ease: 'Back.Out' });
        Sound.coin();
      } else {
        Profile.addCoins(result.amount);
        const label = this.add
          .text(cx, 650, `+${result.amount} coins  (collection complete!)`, Text.body(26, COLORS.gold))
          .setOrigin(0.5);
        this.tweens.add({ targets: label, scale: { from: 0.7, to: 1 }, duration: 350, ease: 'Back.Out' });
        Sound.coin();
      }
    };

    if (isFreeFirstRun) {
      proceed();
    } else {
      this.spinRow?.destroy();
      const loading = this.add.text(cx, 650, 'Loading…', Text.body(24, '#bfe9ff')).setOrigin(0.5);
      this.spinRow = this.add.container(0, 0, [loading]);
      Rewarded.show('spin').then((earned) => {
        loading.destroy();
        if (earned) {
          proceed();
        } else {
          // Ad skipped/failed — restore the button so the player can try again.
          this.spinRow?.destroy();
          this.renderSpinSlot(cx, 650, false);
        }
      });
    }
  }

  update(_time: number, delta: number): void {
    this.bg.update(delta, 0.12);
  }
}
