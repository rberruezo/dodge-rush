import Phaser from 'phaser';
import {
  ASSET_KEYS,
  ANIM_KEYS,
  COLORS,
  GAME_WIDTH,
  GAME_HEIGHT,
  PLAYER_CFG,
  BG_THEME_KEYS
} from '../config/Constants';
import { Background } from '../objects/Background';
import { Button } from '../ui/Button';
import { ScoreManager } from '../systems/ScoreManager';
import { Sound, MUSIC } from '../systems/SoundManager';

/**
 * Title screen: a calmly-hovering hero, branding, best score, Play button and a
 * mute toggle. Pressing Play launches a quick "boost up to the start line"
 * transition that hands the same background (theme + scroll) to the GameScene,
 * so the descent appears to begin seamlessly.
 */
export class MainMenuScene extends Phaser.Scene {
  private bg!: Background;
  private hero!: Phaser.GameObjects.Sprite;
  private muteText!: Phaser.GameObjects.Text;
  private uiGroup: Phaser.GameObjects.GameObject[] = [];
  private launching = false;

  constructor() {
    super('MainMenu');
  }

  create(): void {
    this.launching = false;
    this.uiGroup = [];

    // Random theme each visit (handed to the game for continuity + variety).
    const theme = Phaser.Math.Between(0, BG_THEME_KEYS.length - 1);
    this.bg = new Background(this, theme).setDepth(0);

    const cx = GAME_WIDTH / 2;
    const score = new ScoreManager();

    Sound.playMusic(MUSIC.MENU);
    this.input.once(Phaser.Input.Events.POINTER_DOWN, () => Sound.unlock());

    const t1 = this.add
      .text(cx, 150, 'DODGE', {
        fontFamily: 'monospace',
        fontSize: '92px',
        color: COLORS.white,
        fontStyle: 'bold'
      })
      .setOrigin(0.5)
      .setShadow(0, 6, '#00000099', 0, true, true);
    const t2 = this.add
      .text(cx, 240, 'RUSH', {
        fontFamily: 'monospace',
        fontSize: '92px',
        color: COLORS.accent,
        fontStyle: 'bold'
      })
      .setOrigin(0.5)
      .setShadow(0, 6, '#00000099', 0, true, true);

    // Calm hovering hero (HOVER = gentle front-facing idle).
    this.hero = this.add.sprite(cx, 430, ASSET_KEYS.CHARACTER, 0).setScale(1.0).setDepth(10);
    if (this.anims.exists(ANIM_KEYS.HOVER)) this.hero.play(ANIM_KEYS.HOVER);
    this.tweens.add({
      targets: this.hero,
      y: 414,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut'
    });

    const best = this.add
      .text(cx, 560, `BEST  ${score.high}`, {
        fontFamily: 'monospace',
        fontSize: '34px',
        color: COLORS.gold,
        fontStyle: 'bold'
      })
      .setOrigin(0.5);

    const playBtn = new Button(this, cx, 680, 'PLAY', () => this.launch(theme), {
      width: 320,
      height: 96,
      fontSize: 44
    });

    const tip = this.add
      .text(cx, 800, 'Tap LEFT / RIGHT to steer\nThread the holes — survive!', {
        fontFamily: 'monospace',
        fontSize: '24px',
        color: '#ffd9ec',
        align: 'center',
        lineSpacing: 8
      })
      .setOrigin(0.5);

    this.muteText = this.add
      .text(GAME_WIDTH - 24, GAME_HEIGHT - 24, this.muteLabel(), {
        fontFamily: 'monospace',
        fontSize: '26px',
        color: COLORS.white
      })
      .setOrigin(1, 1)
      .setInteractive({ useHandCursor: true });
    this.muteText.on(Phaser.Input.Events.POINTER_DOWN, () => {
      Sound.unlock();
      Sound.toggleMute();
      this.muteText.setText(this.muteLabel());
    });

    this.uiGroup = [t1, t2, best, playBtn, tip, this.muteText];
  }

  update(_time: number, delta: number): void {
    // Drift faster during the launch so the world appears to start rushing past.
    this.bg.update(delta, this.launching ? 0.5 : 0.12);
  }

  private muteLabel(): string {
    return Sound.isMuted ? '🔇 SOUND OFF' : '🔊 SOUND ON';
  }

  /** Quick, attractive hand-off: fade UI, boost the hero up to the start line. */
  private launch(theme: number): void {
    if (this.launching) return;
    this.launching = true;
    Sound.unlock();
    Sound.start();

    // Fade the menu UI out of the way.
    this.tweens.add({ targets: this.uiGroup, alpha: 0, duration: 200, ease: 'Quad.in' });

    // A jet trail streaking off the hero as it launches.
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
    if (this.anims.exists(ANIM_KEYS.BOOST)) this.hero.play(ANIM_KEYS.BOOST);

    const startY = GAME_HEIGHT * PLAYER_CFG.startYRatio;
    // A little dip, then accelerate up to the start line (a launch arc).
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
            this.scene.start('Game', { theme, scrollY: this.bg.scroll });
          }
        });
      }
    });
  }
}
