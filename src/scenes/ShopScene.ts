import Phaser from 'phaser';
import { ASSET_KEYS, COLORS, GAME_WIDTH, GAME_HEIGHT } from '../config/Constants';
import { SKINS, SkinDef } from '../config/Skins';
import { Text } from '../config/TextStyles';
import { Background } from '../objects/Background';
import { Button } from '../ui/Button';
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

    this.add.text(cx, 80, 'SKINS', Text.title(38)).setOrigin(0.5);
    this.add.text(cx, 138, `🪙 ${Profile.coins}`, Text.label(30, COLORS.gold)).setOrigin(0.5);

    const cols = [150, 390];
    const rows = [248, 436, 624];
    SKINS.forEach((skin, i) => {
      this.makeCard(skin, cols[i % 2], rows[Math.floor(i / 2)]);
    });

    new Button(this, cx, 900, 'BACK', () => this.scene.start('MainMenu'), {
      width: 260,
      height: 70,
      fontSize: 26,
      fill: 0x44345e
    });
  }

  private makeCard(skin: SkinDef, x: number, y: number): void {
    const owned = Profile.isOwned(skin.id);
    const selected = Profile.selected === skin.id;
    const stroke = selected ? 0xffd54a : owned ? 0xff7bb0 : 0x6a6a8a;

    const card = this.add.rectangle(x, y, 196, 176, COLORS.panel, 0.92).setStrokeStyle(4, stroke);

    const preview = this.add.sprite(x, y - 34, ASSET_KEYS.CHARACTER, 6).setScale(0.62);
    if (skin.tint !== null) preview.setTint(skin.tint);

    this.add.text(x, y + 40, skin.name, Text.body(28, COLORS.white)).setOrigin(0.5);

    let status: string;
    let color: string;
    if (selected) {
      status = '✓ EQUIPPED';
      color = COLORS.gold;
    } else if (owned) {
      status = 'TAP TO EQUIP';
      color = '#bfe9ff';
    } else {
      status = `🪙 ${skin.cost}`;
      color = Profile.coins >= skin.cost ? COLORS.white : '#9a6a7a';
    }
    this.add.text(x, y + 70, status, Text.body(24, color)).setOrigin(0.5);

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
      Sound.coin();
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
