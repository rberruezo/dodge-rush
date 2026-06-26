import Phaser from 'phaser';
import {
  ASSET_KEYS,
  ANIM_KEYS,
  COLORS,
  GAME_WIDTH,
  GAME_HEIGHT,
  PLAYER_CFG,
  DifficultyModeId
} from '../config/Constants';
import { getSkin } from '../config/Skins';
import { Text } from '../config/TextStyles';
import { Background } from '../objects/Background';
import { Button } from '../ui/Button';
import { coinCounter } from '../ui/CoinCounter';
import { ScoreManager } from '../systems/ScoreManager';
import { Profile } from '../systems/ProfileManager';
import { DifficultyManager } from '../systems/DifficultyManager';
import { Daily } from '../systems/DailyManager';
import { Sound, MUSIC } from '../systems/SoundManager';

/**
 * Title screen: hovering hero (wearing the equipped skin), best score & coins,
 * Play / Shop / How-to-score, mute, and a quick "boost to the start line"
 * launch transition that hands the same background to the GameScene.
 */
export class MainMenuScene extends Phaser.Scene {
  /** Auto-open the Daily hub at most once per page load (not every menu visit). */
  private static dailyAutoShown = false;

  private bg!: Background;
  private hero!: Phaser.GameObjects.Sprite;
  private heroSheet = 'character';
  private muteText!: Phaser.GameObjects.Text;
  private diffText!: Phaser.GameObjects.Text;
  private uiGroup: Phaser.GameObjects.GameObject[] = [];
  private launching = false;

  constructor() {
    super('MainMenu');
  }

  create(): void {
    this.launching = false;
    this.uiGroup = [];

    this.bg = new Background(this).setDepth(0);

    const cx = GAME_WIDTH / 2;
    const high = new ScoreManager().high;

    Sound.playMusic(MUSIC.MENU);
    this.input.once(Phaser.Input.Events.POINTER_DOWN, () => Sound.unlock());

    const t1 = this.add.text(cx, 125, 'DODGE', Text.title(54)).setOrigin(0.5);
    const t2 = this.add.text(cx, 205, 'RUSH', Text.title(54, COLORS.accent)).setOrigin(0.5);

    // Hovering hero wearing the equipped skin (its own sheet + optional tint).
    const skin = getSkin(Profile.selected);
    this.heroSheet = skin.sheet;
    this.hero = this.add.sprite(cx, 340, skin.sheet, 0).setScale(1.0).setDepth(10);
    if (skin.tint !== null) this.hero.setTint(skin.tint);
    const hoverKey = `${skin.sheet}:${ANIM_KEYS.HOVER}`;
    if (this.anims.exists(hoverKey)) this.hero.play(hoverKey);
    this.tweens.add({
      targets: this.hero,
      y: 324,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut'
    });

    const best = this.add.text(cx, 452, `BEST ${high}`, Text.label(26)).setOrigin(0.5);
    const coins = coinCounter(this, cx, 492, `${Profile.coins}`, { size: 26 });

    const playBtn = new Button(this, cx, 588, 'PLAY', () => this.launch(), {
      width: 320,
      height: 92,
      fontSize: 36
    });
    const shopBtn = new Button(this, 160, 690, 'SHOP', () => this.scene.start('Shop'), {
      width: 200,
      height: 72,
      fontSize: 24,
      fill: 0x6a4bd0
    });
    const howBtn = new Button(this, 380, 690, 'HOW?', () => this.scene.start('Info'), {
      width: 200,
      height: 72,
      fontSize: 24,
      fill: 0x44345e
    });

    const tip = this.add
      .text(cx, 790, 'Tap LEFT / RIGHT to steer\nDouble-tap to SMASH an obstacle', Text.body(26, '#ffd9ec'))
      .setOrigin(0.5)
      .setAlign('center');
    tip.setLineSpacing(6);

    this.muteText = this.add
      .text(GAME_WIDTH - 22, GAME_HEIGHT - 22, this.muteLabel(), Text.body(26))
      .setOrigin(1, 1)
      .setInteractive({ useHandCursor: true });
    this.muteText.on(Phaser.Input.Events.POINTER_UP, () => {
      Sound.unlock();
      Sound.toggleMute();
      this.muteText.setText(this.muteLabel());
    });

    // Difficulty toggle (bottom-left, mirroring the mute toggle). Tap to cycle
    // RELAX <-> CLASSIC; the choice persists and gates the whole curve + lives.
    this.diffText = this.add
      .text(22, GAME_HEIGHT - 22, this.diffLabel(), Text.body(26, '#bfe9ff'))
      .setOrigin(0, 1)
      .setInteractive({ useHandCursor: true });
    this.diffText.on(Phaser.Input.Events.POINTER_UP, () => {
      Sound.button();
      const order: DifficultyModeId[] = ['classic', 'relax'];
      const next = order[(order.indexOf(DifficultyManager.mode.id) + 1) % order.length];
      DifficultyManager.setMode(next);
      this.diffText.setText(this.diffLabel());
    });

    const daily = this.createDailyButton();

    this.uiGroup = [t1, t2, best, coins, playBtn, shopBtn, howBtn, tip, this.muteText, this.diffText, daily];

    // First time at the menu this session, surface the Daily hub if there's
    // something to claim — the core "come back tomorrow" retention hook.
    if (!MainMenuScene.dailyAutoShown && Daily.hasUnclaimed()) {
      MainMenuScene.dailyAutoShown = true;
      this.time.delayedCall(420, () => {
        if (!this.launching) this.scene.start('Daily');
      });
    }
  }

  /** Top-left gift button (with a pulsing badge when something's claimable). */
  private createDailyButton(): Phaser.GameObjects.Container {
    const c = this.add.container(60, 64).setDepth(50);
    const bg = this.add.circle(0, 0, 34, COLORS.panel, 0.9).setStrokeStyle(3, COLORS.panelStroke);
    const icon = this.add.text(0, 2, '🎁', Text.body(40)).setOrigin(0.5);
    c.add([bg, icon]);

    if (Daily.hasUnclaimed()) {
      const badge = this.add.circle(22, -22, 9, 0xff3b3b).setStrokeStyle(2, 0xffffff);
      c.add(badge);
      this.tweens.add({ targets: badge, scale: { from: 1, to: 1.35 }, duration: 560, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    }

    const hit = this.add
      .rectangle(0, 0, 84, 84, 0xffffff, 0)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    hit.on(Phaser.Input.Events.POINTER_UP, () => {
      Sound.button();
      this.scene.start('Daily');
    });
    c.add(hit);
    return c;
  }

  private diffLabel(): string {
    const m = DifficultyManager.mode;
    const icon = m.id === 'relax' ? '🌿' : '🔥';
    return `${icon} ${m.label}`;
  }

  update(_time: number, delta: number): void {
    this.bg.update(delta, this.launching ? 0.5 : 0.12);
  }

  private muteLabel(): string {
    return Sound.isMuted ? '🔇 OFF' : '🔊 ON';
  }

  /** Quick hand-off: fade UI, boost the hero up to the start line, then play. */
  private launch(): void {
    if (this.launching) return;
    this.launching = true;
    Sound.unlock();
    Sound.start();

    this.tweens.add({ targets: this.uiGroup, alpha: 0, duration: 200, ease: 'Quad.in' });

    const trail = this.add
      .particles(0, 0, ASSET_KEYS.PARTICLE, {
        follow: this.hero,
        speedY: { min: 120, max: 240 },
        speedX: { min: -40, max: 40 },
        scale: { start: 0.5, end: 0 },
        lifespan: 380,
        tint: [0xffd54a, 0xff7bb0, 0x9be7ff],
        quantity: 3,
        frequency: 16,
        blendMode: 'ADD'
      })
      .setDepth(9);

    this.tweens.killTweensOf(this.hero);
    const boostKey = `${this.heroSheet}:${ANIM_KEYS.BOOST}`;
    if (this.anims.exists(boostKey)) this.hero.play(boostKey);

    const startY = GAME_HEIGHT * PLAYER_CFG.startYRatio;
    this.tweens.add({
      targets: this.hero,
      y: this.hero.y + 26,
      duration: 130,
      ease: 'Quad.out',
      onComplete: () => {
        this.tweens.add({
          targets: this.hero,
          y: startY,
          duration: 380,
          ease: 'Back.in',
          onComplete: () => {
            trail.stop();
            this.scene.start('Game', { scrollY: this.bg.scroll });
          }
        });
      }
    });
  }
}
