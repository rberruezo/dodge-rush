import Phaser from 'phaser';
import { COLORS, GAME_WIDTH, GAME_HEIGHT } from '../config/Constants';
import { Text } from '../config/TextStyles';
import { Background } from '../objects/Background';
import { Button } from '../ui/Button';
import { Achievements, AchievementView } from '../systems/AchievementManager';

/** Trophy room: the 5 milestone achievements and the palette-swap skin each grants. */
export class AchievementsScene extends Phaser.Scene {
  private bg!: Background;

  constructor() {
    super('Achievements');
  }

  create(): void {
    const cx = GAME_WIDTH / 2;
    this.bg = new Background(this).setDepth(0);
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x140b28, 0.8).setOrigin(0, 0);

    this.add.text(cx, 64, 'ACHIEVEMENTS', Text.title(32)).setOrigin(0.5);

    const list = Achievements.all();
    const unlockedCount = list.filter((a) => a.unlocked).length;
    this.add
      .text(cx, 108, `${unlockedCount} / ${list.length} unlocked`, Text.label(22))
      .setOrigin(0.5);

    const bandTop = 150;
    const bandBottom = 838;
    const pitch = (bandBottom - bandTop) / list.length;
    list.forEach((a, i) => this.makeRow(a, cx, bandTop + pitch * (i + 0.5)));

    new Button(this, cx, 900, 'BACK', () => this.scene.start('MainMenu'), {
      width: 260,
      height: 64,
      fontSize: 26,
      fill: 0x44345e
    });
  }

  private makeRow(a: AchievementView, cx: number, y: number): void {
    const w = 496;
    const h = 116;
    const stroke = a.unlocked ? 0xffd54a : 0x6a6a8a;
    this.add.rectangle(cx, y, w, h, COLORS.panel, 0.92).setStrokeStyle(3, stroke);

    // Reward skin preview (palette-swap of the base hero). Dimmed while locked.
    const preview = this.add.sprite(cx - w / 2 + 64, y, a.def.sheet, 0).setScale(0.46);
    preview.setTint(a.unlocked ? a.def.tint : 0x3a3a52);
    preview.setAlpha(a.unlocked ? 1 : 0.6);

    const textX = cx - w / 2 + 122;
    this.add
      .text(textX, y - 26, a.def.name, Text.body(24, a.unlocked ? COLORS.gold : '#8a8aa6'))
      .setOrigin(0, 0.5);
    this.add
      .text(textX, y + 14, a.def.achievementLabel, Text.body(18, a.unlocked ? '#dfe0ff' : '#7a7a92'))
      .setOrigin(0, 0.5)
      .setWordWrapWidth(w - 180);

    // Status badge, far right.
    this.add
      .text(cx + w / 2 - 30, y, a.unlocked ? '✓' : '🔒', Text.body(30, a.unlocked ? COLORS.gold : '#8a8aa6'))
      .setOrigin(0.5);
  }

  update(_time: number, delta: number): void {
    this.bg.update(delta, 0.1);
  }
}
