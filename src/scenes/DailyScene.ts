import Phaser from 'phaser';
import { COLORS, DAILY_CFG, GAME_WIDTH, GAME_HEIGHT, BG_CFG } from '../config/Constants';
import { Text } from '../config/TextStyles';
import { Background } from '../objects/Background';
import { Button } from '../ui/Button';
import { coinCounter } from '../ui/CoinCounter';
import { Daily } from '../systems/DailyManager';
import { Profile } from '../systems/ProfileManager';
import { Sound } from '../systems/SoundManager';

/**
 * Daily hub modal: a login-streak coin reward plus today's rotating mission.
 * Both pay out cosmetic coins only. Re-renders itself after each claim so the
 * buttons reflect the new state without leaving the screen.
 */
export class DailyScene extends Phaser.Scene {
  private bg!: Background;
  private layer: Phaser.GameObjects.GameObject[] = [];

  constructor() {
    super('Daily');
  }

  create(): void {
    this.bg = new Background(this, BG_CFG.zoneLength * 2).setDepth(0); // sunset zone
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x140b28, 0.82).setOrigin(0, 0);
    this.render();
  }

  update(_t: number, delta: number): void {
    this.bg.update(delta, 0.1);
  }

  /** Tear down and redraw the dynamic content (after a claim). */
  private render(): void {
    this.layer.forEach((o) => o.destroy());
    this.layer = [];
    const cx = GAME_WIDTH / 2;

    this.add.text(cx, 60, 'DAILY', Text.title(36)).setOrigin(0.5);
    this.layer.push(coinCounter(this, cx, 108, `${Profile.coins}`, { size: 26 }));

    this.renderStreak(cx, 150);
    this.renderMission(cx, 520);

    new Button(this, cx, 892, 'BACK', () => this.scene.start('MainMenu'), {
      width: 240,
      height: 64,
      fontSize: 24,
      fill: 0x44345e
    });
  }

  // --- Streak -------------------------------------------------------------

  private renderStreak(cx: number, top: number): void {
    this.layer.push(this.add.text(cx, top, 'LOGIN STREAK', Text.label(28, COLORS.gold)).setOrigin(0.5));

    const canClaim = Daily.canClaimReward();
    const pending = Daily.pendingStreak;
    const earned = canClaim ? pending - 1 : Daily.currentStreak;
    const n = DAILY_CFG.streakRewards.length;
    const startX = 56;
    const step = (GAME_WIDTH - startX * 2) / (n - 1);
    const chipY = top + 78;

    for (let i = 0; i < n; i++) {
      const day = i + 1;
      const x = startX + i * step;
      const isEarned = day <= earned;
      const isToday = canClaim && day === pending;
      const fill = isEarned ? 0x2f9e57 : isToday ? 0xff4f9a : 0x2b2147;
      const stroke = isToday ? 0xffd54a : isEarned ? 0x7bf0a8 : 0x564a78;

      const chip = this.add.rectangle(x, chipY, 58, 70, fill, 0.95).setStrokeStyle(3, stroke);
      const dLabel = this.add.text(x, chipY - 20, `D${day}`, Text.body(22, COLORS.white)).setOrigin(0.5);
      const rLabel = this.add.text(x, chipY + 14, `${Daily.rewardFor(day)}`, Text.body(22, '#ffe79a')).setOrigin(0.5);
      this.layer.push(chip, dLabel, rLabel);

      if (isToday) {
        this.tweens.add({ targets: chip, scale: { from: 1, to: 1.08 }, duration: 520, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      }
    }

    if (canClaim) {
      const reward = Daily.rewardFor(pending);
      const btn = new Button(this, cx, chipY + 110, `CLAIM  +${reward}`, () => {
        const res = Daily.claimReward();
        if (res) {
          Sound.coin();
          this.render();
        }
      }, { width: 320, height: 80, fontSize: 28, fill: 0x2f9e57 });
      this.layer.push(btn);
    } else {
      const msg = this.add
        .text(cx, chipY + 96, 'Claimed today ✓\nCome back tomorrow!', Text.body(26, '#bfe9ff'))
        .setOrigin(0.5)
        .setAlign('center');
      msg.setLineSpacing(4);
      this.layer.push(msg);
    }
  }

  // --- Mission ------------------------------------------------------------

  private renderMission(cx: number, top: number): void {
    this.layer.push(this.add.text(cx, top, "TODAY'S MISSIONS", Text.label(28, COLORS.gold)).setOrigin(0.5));

    const missions = Daily.missions;
    const cardH    = 120;
    const cardGap  = 12;

    missions.forEach((m, i) => {
      const cardY = top + 44 + i * (cardH + cardGap);
      this.renderMissionCard(cx, cardY, cardH, m);
    });
  }

  private renderMissionCard(
    cx: number,
    cardY: number,
    cardH: number,
    m: ReturnType<typeof Daily.missionView>
  ): void {
    const cardW    = GAME_WIDTH - 48;
    const barW     = cardW - 24;
    const diffColor: Record<string, number> = { easy: 0x2f9e57, medium: 0xff9a00, hard: 0xff4f9a };
    const fillColor = diffColor[m.difficulty] ?? 0xff4f9a;

    // Card background.
    const card = this.add
      .rectangle(cx, cardY, cardW, cardH, 0x1a0f38, 0.9)
      .setStrokeStyle(2, m.claimed ? 0x3a3060 : fillColor);
    this.layer.push(card);

    // Difficulty badge.
    const badge = this.add.text(
      cx - cardW / 2 + 10, cardY - cardH / 2 + 8,
      m.difficulty.toUpperCase(),
      Text.body(18, m.claimed ? '#564a78' : `#${fillColor.toString(16).padStart(6, '0')}`)
    ).setOrigin(0, 0);
    this.layer.push(badge);

    // Reward label (right side of badge row).
    const rewardStr = m.hardRewardsSpin ? '🎰 FREE SPIN' : `+${m.reward} 🪙`;
    const rewardTxt = this.add.text(
      cx + cardW / 2 - 10, cardY - cardH / 2 + 8,
      rewardStr,
      Text.body(18, m.claimed ? '#564a78' : COLORS.gold)
    ).setOrigin(1, 0);
    this.layer.push(rewardTxt);

    // Mission label.
    const labelTxt = this.add
      .text(cx, cardY - 14, m.label, Text.body(22, m.claimed ? '#564a78' : COLORS.white))
      .setOrigin(0.5)
      .setAlign('center');
    labelTxt.setWordWrapWidth(cardW - 20);
    this.layer.push(labelTxt);

    // Progress bar.
    const barY  = cardY + cardH / 2 - 20;
    const frac  = Phaser.Math.Clamp(m.progress / m.target, 0, 1);
    const barBg = this.add
      .rectangle(cx, barY, barW, 18, 0x000000, 0.5)
      .setStrokeStyle(1, 0x564a78);
    const barFill = this.add
      .rectangle(cx - barW / 2 + 2, barY, (barW - 4) * frac, 14, m.completed ? 0x2f9e57 : fillColor)
      .setOrigin(0, 0.5);
    const barTxt = this.add
      .text(cx, barY, `${m.progress} / ${m.target}`, Text.body(18, COLORS.white))
      .setOrigin(0.5);
    this.layer.push(barBg, barFill, barTxt);

    // Claim / done state.
    if (m.claimed) {
      const done = this.add
        .text(cx + cardW / 2 - 12, cardY, '✓', Text.body(28, '#7bf0a8'))
        .setOrigin(1, 0.5);
      this.layer.push(done);
    } else if (m.completed) {
      const claimLabel = m.hardRewardsSpin ? 'CLAIM SPIN' : `CLAIM  +${m.reward}`;
      const btn = new Button(this, cx, cardY, claimLabel, () => {
        const r = Daily.claimMission(m.difficulty);
        if (r !== null) {
          Sound.newBest();
          this.render();
        }
      }, { width: 200, height: 44, fontSize: 20, fill: 0x2f9e57 });
      this.layer.push(btn);
    }
  }
}
