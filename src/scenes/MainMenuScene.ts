import Phaser from 'phaser';
import { ASSET_KEYS, ANIM_KEYS, COLORS, GAME_WIDTH, GAME_HEIGHT } from '../config/Constants';
import { Background } from '../objects/Background';
import { Button } from '../ui/Button';
import { ScoreManager } from '../systems/ScoreManager';
import { Sound } from '../systems/SoundManager';

/**
 * Title screen: animated hero, branding, best score, Play button and a mute
 * toggle. The first interaction here also unlocks the audio context.
 */
export class MainMenuScene extends Phaser.Scene {
  private bg!: Background;
  private muteText!: Phaser.GameObjects.Text;

  constructor() {
    super('MainMenu');
  }

  create(): void {
    this.bg = new Background(this).setDepth(0);

    const cx = GAME_WIDTH / 2;
    const score = new ScoreManager();

    // Unlock audio on the very first tap/click anywhere.
    this.input.once(Phaser.Input.Events.POINTER_DOWN, () => Sound.unlock());

    // Title
    this.add
      .text(cx, 150, 'DODGE', {
        fontFamily: 'monospace',
        fontSize: '92px',
        color: COLORS.white,
        fontStyle: 'bold'
      })
      .setOrigin(0.5)
      .setShadow(0, 6, '#00000099', 0, true, true);
    this.add
      .text(cx, 240, 'RUSH', {
        fontFamily: 'monospace',
        fontSize: '92px',
        color: COLORS.accent,
        fontStyle: 'bold'
      })
      .setOrigin(0.5)
      .setShadow(0, 6, '#00000099', 0, true, true);

    // Animated hero, gently bobbing.
    const hero = this.add.sprite(cx, 430, ASSET_KEYS.CHARACTER, 6).setScale(2.4);
    if (this.anims.exists(ANIM_KEYS.FALL)) hero.play(ANIM_KEYS.FALL);
    this.tweens.add({
      targets: hero,
      y: 410,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut'
    });

    // Best score
    this.add
      .text(cx, 560, `BEST  ${score.high}`, {
        fontFamily: 'monospace',
        fontSize: '34px',
        color: COLORS.gold,
        fontStyle: 'bold'
      })
      .setOrigin(0.5);

    // Play
    new Button(this, cx, 680, 'PLAY', () => this.startGame(), {
      width: 320,
      height: 96,
      fontSize: 44
    });

    // Instructions
    this.add
      .text(cx, 800, 'Tap LEFT / RIGHT to steer\nThread the holes — survive!', {
        fontFamily: 'monospace',
        fontSize: '24px',
        color: '#ffd9ec',
        align: 'center',
        lineSpacing: 8
      })
      .setOrigin(0.5);

    // Mute toggle
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
  }

  update(_time: number, delta: number): void {
    this.bg.update(delta, 0.12);
  }

  private muteLabel(): string {
    return Sound.isMuted ? '🔇 SOUND OFF' : '🔊 SOUND ON';
  }

  private startGame(): void {
    Sound.unlock();
    Sound.start();
    this.scene.start('Game');
  }
}
