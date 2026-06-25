import Phaser from 'phaser';
import { COLORS, GAME_WIDTH, GAME_HEIGHT } from '../config/Constants';
import { SKINS, SkinDef } from '../config/Skins';
import { Text } from '../config/TextStyles';
import { Background } from '../objects/Background';
import { Button } from '../ui/Button';
import { coinCounter } from '../ui/CoinCounter';
import { Profile } from '../systems/ProfileManager';
import { Sound } from '../systems/SoundManager';

/** Skin shop: spend coins to unlock palette-swaps, tap to equip. */
export class ShopScene extends Phaser.Scene {
  private bg!: Background;

  constructor() {
    super('Shop');
  }

  create(): void {
    const cx = GAME_WIDTH / 2;
    this.bg = new Background(this, 2).setDepth(0);
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x140b28, 0.78).setOrigin(0, 0);

    this.add.text(cx, 56, 'SKINS', Text.title(34)).setOrigin(0.5);
    coinCounter(this, cx, 104, `${Profile.coins}`, { size: 28 });

    // Adaptive 3-column grid that always fits every skin between the header and
    // the BACK button — rows + card size are derived from the skin count, so new
    // skins never spill off-screen. The last (possibly partial) row is centred.
    const cols = 3;
    const n = SKINS.length;
    const rows = Math.ceil(n / cols);
    const bandTop = 148;
    const bandBottom = 858;
    const pitchY = (bandBottom - bandTop) / rows;
    const colPitch = GAME_WIDTH / cols;
    const cardH = Math.min(152, pitchY - 16);
    const cardW = Math.min(168, colPitch - 14);
    const previewScale = 0.42 * (cardH / 150);

    SKINS.forEach((skin, i) => {
      const row = Math.floor(i / cols);
      const col = i % cols;
      const inRow = Math.min(cols, n - row * cols); // items on this (maybe partial) row
      const startX = cx - ((inRow - 1) * colPitch) / 2; // centre the row
      const x = startX + col * colPitch;
      const y = bandTop + pitchY * (row + 0.5);
      this.makeCard(skin, x, y, cardW, cardH, previewScale);
    });

    new Button(this, cx, 906, 'BACK', () => this.scene.start('MainMenu'), {
      width: 260,
      height: 64,
      fontSize: 26,
      fill: 0x44345e
    });
  }

  private makeCard(
    skin: SkinDef,
    x: number,
    y: number,
    w: number,
    h: number,
    previewScale: number
  ): void {
    const owned = Profile.isOwned(skin.id);
    const selected = Profile.selected === skin.id;
    const stroke = selected ? 0xffd54a : owned ? 0xff7bb0 : 0x6a6a8a;

    const card = this.add.rectangle(x, y, w, h, COLORS.panel, 0.92).setStrokeStyle(3, stroke);

    const preview = this.add.sprite(x, y - h * 0.18, skin.sheet, 6).setScale(previewScale);
    if (skin.tint !== null) preview.setTint(skin.tint);

    this.add.text(x, y + h * 0.14, skin.name, Text.body(20, COLORS.white)).setOrigin(0.5);

    if (selected) {
      this.add.text(x, y + h * 0.34, '✓ EQUIPPED', Text.body(18, COLORS.gold)).setOrigin(0.5);
    } else if (owned) {
      this.add.text(x, y + h * 0.34, 'TAP TO EQUIP', Text.body(18, '#bfe9ff')).setOrigin(0.5);
    } else {
      const afford = Profile.coins >= skin.cost;
      coinCounter(this, x, y + h * 0.34, `${skin.cost}`, {
        size: 18,
        animate: false,
        color: afford ? COLORS.white : '#9a6a7a'
      });
    }

    card.setInteractive({ useHandCursor: true });
    card.on(Phaser.Input.Events.POINTER_UP, () => this.onCard(skin));
  }

  private onCard(skin: SkinDef): void {
    if (Profile.isOwned(skin.id)) {
      if (Profile.selected !== skin.id) {
        Profile.select(skin.id);
        Sound.button();
        this.scene.restart();
      }
    } else if (Profile.buy(skin.id)) {
      Profile.select(skin.id);
      Sound.skinUnlock();
      this.scene.restart();
    } else {
      Sound.hit(); // can't afford
      this.cameras.main.shake(140, 0.006);
    }
  }

  update(_time: number, delta: number): void {
    this.bg.update(delta, 0.1);
  }
}
