import Phaser from 'phaser';
import { COLORS } from '../config/Constants';
import { FONT_HEAD } from '../config/TextStyles';
import { Sound } from '../systems/SoundManager';

export interface ButtonStyle {
  width?: number;
  height?: number;
  fontSize?: number;
  fill?: number;
  textColor?: string;
}

/**
 * A chunky, touch-friendly pixel button.
 *
 * Input uses a dedicated, transparent interactive Rectangle (reliably centred,
 * origin 0.5) that is a little larger than the artwork for easy tapping. The
 * press feedback scales only the visuals — never the hit target — so the
 * tappable area stays put and full-size while pressed.
 */
export class Button extends Phaser.GameObjects.Container {
  private bg: Phaser.GameObjects.Graphics;
  private label: Phaser.GameObjects.Text;
  private hit: Phaser.GameObjects.Rectangle;
  private btnW: number;
  private btnH: number;
  private fillColor: number;
  private pressed = false;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    text: string,
    onClick: () => void,
    style: ButtonStyle = {}
  ) {
    super(scene, x, y);
    scene.add.existing(this);

    this.btnW = style.width ?? 300;
    this.btnH = style.height ?? 88;
    this.fillColor = style.fill ?? 0xff4f9a;

    this.bg = scene.add.graphics();
    this.drawBg(this.fillColor);

    this.label = scene.add
      .text(0, 0, text, {
        fontFamily: FONT_HEAD,
        fontSize: `${style.fontSize ?? 28}px`,
        color: style.textColor ?? COLORS.white
      })
      .setOrigin(0.5)
      .setShadow(0, 3, '#00000088', 0, true, true);

    // Transparent, generously-sized hit target (centred via origin 0.5).
    this.hit = scene.add
      .rectangle(0, 0, this.btnW + 28, this.btnH + 28, 0xffffff, 0)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    this.add([this.bg, this.label, this.hit]);

    this.hit.on(Phaser.Input.Events.POINTER_DOWN, () => {
      this.pressed = true;
      this.setPressed(true);
    });
    this.hit.on(Phaser.Input.Events.POINTER_UP, () => {
      if (!this.pressed) return;
      this.pressed = false;
      this.setPressed(false);
      Sound.button();
      onClick();
    });
    const cancel = () => {
      this.pressed = false;
      this.setPressed(false);
    };
    this.hit.on(Phaser.Input.Events.POINTER_OUT, cancel);
    this.hit.on(Phaser.Input.Events.POINTER_UP_OUTSIDE, cancel);
  }

  setLabel(text: string): this {
    this.label.setText(text);
    return this;
  }

  /** Visual-only press feedback (hit target is never scaled). */
  private setPressed(down: boolean): void {
    const s = down ? 0.94 : 1;
    this.bg.setScale(s);
    this.label.setScale(s);
    this.drawBg(down ? Phaser.Display.Color.IntegerToColor(this.fillColor).darken(18).color : this.fillColor);
  }

  private drawBg(color: number): void {
    const hw = this.btnW / 2;
    const hh = this.btnH / 2;
    this.bg.clear();
    this.bg.fillStyle(0x000000, 0.25);
    this.bg.fillRoundedRect(-hw + 4, -hh + 6, this.btnW, this.btnH, 18);
    this.bg.fillStyle(color, 1);
    this.bg.fillRoundedRect(-hw, -hh, this.btnW, this.btnH, 18);
    this.bg.fillStyle(0xffffff, 0.18);
    this.bg.fillRoundedRect(-hw + 6, -hh + 6, this.btnW - 12, this.btnH * 0.34, 12);
    this.bg.lineStyle(4, 0xffffff, 0.9);
    this.bg.strokeRoundedRect(-hw, -hh, this.btnW, this.btnH, 18);
  }
}
