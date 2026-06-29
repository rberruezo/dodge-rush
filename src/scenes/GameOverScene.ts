import Phaser from 'phaser';
import { ANIM_KEYS, CHAR_FRAMES, COLORS, GAME_WIDTH, GAME_HEIGHT } from '../config/Constants';
import { getSkin } from '../config/Skins';
import { Text } from '../config/TextStyles';
import { Background } from '../objects/Background';
import { Button } from '../ui/Button';
import { coinCounter } from '../ui/CoinCounter';
import { AnimationManager } from '../systems/AnimationManager';
import { DifficultyManager } from '../systems/DifficultyManager';
import { Profile } from '../systems/ProfileManager';
import { Rewarded } from '../systems/Rewarded';
import { Spin } from '../systems/SpinManager';
import { Achievements } from '../systems/AchievementManager';
import { Sound } from '../systems/SoundManager';
import { FEATURES } from '../config/FeatureFlags';

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
    this.cameras.main.fadeIn(180, 0, 0, 0); // ease in to match the death fade-out (DR-21)
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
    if (isNewBest) {
      // Lively, fluid celebration: the sheet's arms-up cheer animation paired
      // with a smooth hop and a gentle vertical stretch at the top, so the hero
      // bounces with joy instead of rigidly sliding up and down (the stiff,
      // "weird" festejo the player reported). Falls back to the static crown
      // frame if a partial sheet lacks the cheer animation.
      const cheerKey = AnimationManager.key(skin.sheet, ANIM_KEYS.CHEER);
      if (this.anims.exists(cheerKey)) hero.play(cheerKey);
      this.tweens.add({
        targets: hero,
        y: 214,
        duration: 640,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.inOut'
      });
      // Squash/stretch breath synced to the hop — taller at the peak, relaxed at
      // the bottom — the bit of "juice" that makes the bounce read as alive.
      this.tweens.add({
        targets: hero,
        scaleY: 1.2,
        duration: 640,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.inOut'
      });
    } else {
      this.tweens.add({
        targets: hero,
        y: 244,
        angle: -4,
        duration: 1200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.inOut'
      });
    }

    this.add.text(cx, 348, 'SCORE', Text.body(26, '#ffd9ec')).setOrigin(0.5);
    this.add.text(cx, 394, String(score), Text.score(56)).setOrigin(0.5);
    this.add.text(cx, 458, `BEST  ${best}`, Text.label(26)).setOrigin(0.5);

    if (isNewBest) {
      // Single, clean celebratory pop-in — one gesture, then it rests. The hero's
      // cheer animation carries the ongoing celebration, so the badge no longer
      // pulses on a loop (the run-on, jittery festejo the player reported).
      const badge = this.add
        .text(cx, 496, '★ NEW BEST! ★', Text.button(22, COLORS.accent))
        .setOrigin(0.5)
        .setScale(0);
      this.tweens.add({ targets: badge, scale: 1, duration: 420, ease: 'Back.out' });
      Sound.newBest();
    }

    const isClassic = DifficultyManager.mode.id === 'classic';
    if (FEATURES.MONETIZATION_ENABLED) {
      const coinLabel = isClassic && coins > 0
        ? `+${coins}  ×1.5  TOTAL ${Profile.coins}`
        : `+${coins}   TOTAL ${Profile.coins}`;
      coinCounter(this, cx, 556, coinLabel, { size: 26 });
      if (coins > 0) this.time.delayedCall(250, () => Sound.coin());
    }

    // Achievement unlock(s) earned by this run — drained once, shown as a top toast.
    if (FEATURES.ACHIEVEMENTS_ENABLED) {
      const earned = Achievements.takePending();
      if (earned.length) {
        const names = earned.map((a) => a.name).join(' + ');
        const toast = this.add
          .text(cx, 162, `🏆 ${names} unlocked!`, Text.button(22, COLORS.gold))
          .setOrigin(0.5)
          .setDepth(200)
          .setAlpha(0);
        this.tweens.add({ targets: toast, alpha: 1, duration: 320, hold: 1900, yoyo: true, onComplete: () => toast.destroy() });
        this.time.delayedCall(400, () => Sound.newBest());
      }
    }

    if (FEATURES.DAILY_ENABLED && data?.missionDone) {
      this.add
        .text(cx, 604, '🎯 Daily mission done — claim it in DAILY!', Text.body(22, '#7bf0a8'))
        .setOrigin(0.5);
    }

    // Spin slot: first run gets a free guaranteed pilot; otherwise opt-in via ad.
    if (FEATURES.MONETIZATION_ENABLED) {
      if (isFirstRun) {
        this.renderSpinSlot(cx, 650, true);
      } else if (Spin.canSpin()) {
        this.renderSpinSlot(cx, 650, false);
      }
    }

    // In MVP v1.0 (no monetization/daily), collapse the layout up.
    const retryY = FEATURES.MONETIZATION_ENABLED ? 790 : 620;
    const menuY = FEATURES.MONETIZATION_ENABLED ? 886 : 716;
    new Button(this, cx, retryY, 'RETRY', () => this.scene.start('Game'), {
      width: 320,
      height: 82,
      fontSize: 32
    });
    new Button(this, cx, menuY, 'MENU', () => this.scene.start('MainMenu'), {
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
      const isClassic = DifficultyManager.mode.id === 'classic';
      const subText = isClassic
        ? 'Watch a short video  ·  🏆 Classic pilots available!'
        : 'Watch a short video  ·  Play Classic to unlock more pilots';
      const sub = this.add
        .text(cx, y + 42, subText, Text.body(18, isClassic ? '#ffd54a' : '#bfe9ff'))
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
