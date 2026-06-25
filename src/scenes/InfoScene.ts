import Phaser from 'phaser';
import { COLORS, GAME_WIDTH, GAME_HEIGHT } from '../config/Constants';
import { Text } from '../config/TextStyles';
import { Background } from '../objects/Background';
import { Button } from '../ui/Button';

/** "How to score" reference screen, reachable from the main menu. */
export class InfoScene extends Phaser.Scene {
  private bg!: Background;

  constructor() {
    super('Info');
  }

  create(): void {
    const cx = GAME_WIDTH / 2;
    this.bg = new Background(this, 1).setDepth(0);
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x140b28, 0.78).setOrigin(0, 0);

    this.add.text(cx, 96, 'HOW TO SCORE', Text.title(30)).setOrigin(0.5);

    const lines: Array<[string, string]> = [
      ['SURVIVE', 'Points tick up the longer you fly.'],
      ['PASS A GATE', 'Each obstacle cleared = points x combo.'],
      ['COMBO', 'Chain passes without crashing:'],
      ['', 'x2 x3 x5 x10 x20 ... up to x200!'],
      ['', 'Higher combo = more points AND faster.'],
      ['CLOSE PASS', 'Thread near the edge for a bonus.'],
      ['GOLDEN GATE', 'Big bonus + x2 score boost (5s).'],
      ['SMASH', 'Double-tap to break the next obstacle.'],
      ['LOSE A LIFE', 'Your combo & speed reset. 3 lives.'],
      ['COINS', 'Earn coins by score -> unlock skins.']
    ];

    let y = 190;
    for (const [head, body] of lines) {
      if (head) {
        this.add.text(56, y, head, Text.body(30, COLORS.gold)).setOrigin(0, 0.5);
        this.add.text(56, y + 30, body, Text.body(26, '#dfe0ff')).setOrigin(0, 0.5);
        y += 72;
      } else {
        this.add.text(84, y, body, Text.body(27, COLORS.accent)).setOrigin(0, 0.5);
        y += 40;
      }
    }

    new Button(this, cx, 892, 'BACK', () => this.scene.start('MainMenu'), {
      width: 260,
      height: 70,
      fontSize: 26,
      fill: 0x44345e
    });
  }

  update(_time: number, delta: number): void {
    this.bg.update(delta, 0.1);
  }
}
