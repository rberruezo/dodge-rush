import Phaser from 'phaser';
import { COLORS } from '../config/Constants';
import { Sound } from '../systems/SoundManager';

export interface ButtonStyle {
  width?: number;
  height?: number;
  fontSize?: number;
  fill?: number;
  textColor?: string;
}

/**
 * A chunky, touch-friendly pixel button: rounded panel + label inside a
 * container, with press feedback, a generous hit area and a click sound.
 */
export class Button extends Phaser.GameObjects.Container {
  private bg: Phaser.GameObjects.Graphics;
  private label: Phaser.GameObjects.Text;
  private btnW: number;
  private btnH: number;
  private fillColor: number;

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
        fontFamily: 'monospace',
        fontSize: `${style.fontSize ?? 34}px`,
        color: style.textColor ?? COLORS.white,
        fontStyle: 'bold'
      })
      .setOrigin(0.5)
      .setShadow(0, 3, '#00000066', 0, true, true);

    this.add([this.bg, this.label]);

    this.setSize(this.btnW, this.btnH);
    this.setInteractive(
      new Phaser.Geom.Rectangle(-this.btnW / 2, -this.btnH / 2, this.btnW, this.btnH),
      Phaser.Geom.Rectangle.Contains
    );

    this.on(Phaser.Input.Events.POINTER_DOWN, () => {
      this.setScale(0.94);
      this.drawBg(Phaser.Display.Color.IntegerToColor(this.fillColor).darken(18).color);
    });
    const release = () => {
      this.setScale(1);
      this.drawBg(this.fillColor);
    };
    this.on(Phaser.Input.Events.POINTER_UP, () => {
      release();
      Sound.button();
      onClick();
    });
    this.on(Phaser.Input.Events.POINTER_OUT, release);
  }

  setLabel(text: string): this {
    this.label.setText(text);
    return this;
  }

  private drawBg(color: number): void {
    const hw = this.btnW / 2;
    const hh = this.btnH / 2;
    this.bg.clear();
    // Drop shadow
    this.bg.fillStyle(0x000000, 0.25);
    this.bg.fillRoundedRect(-hw + 4, -hh + 6, this.btnW, this.btnH, 18);
    // Body
    this.bg.fillStyle(color, 1);
    this.bg.fillRoundedRect(-hw, -hh, this.btnW, this.btnH, 18);
    // Top highlight
    this.bg.fillStyle(0xffffff, 0.18);
    this.bg.fillRoundedRect(-hw + 6, -hh + 6, this.btnW - 12, this.btnH * 0.34, 12);
    // Outline
    this.bg.lineStyle(4, 0xffffff, 0.9);
    this.bg.strokeRoundedRect(-hw, -hh, this.btnW, this.btnH, 18);
  }
}
