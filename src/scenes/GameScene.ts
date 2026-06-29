import Phaser from 'phaser';
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  PLAYER_CFG,
  SCORE_CFG,
  LIVES_CFG,
  COMBO_CFG,
  SCROLL_CFG
} from '../config/Constants';
import { CHAR_FRAMES } from '../config/CharacterSprite';
import { getSkin } from '../config/Skins';
import { Background } from '../objects/Background';
import { Player } from '../objects/Player';
import { Barrier } from '../objects/Barrier';
import { ObstacleGenerator } from '../systems/ObstacleGenerator';
import { CollisionSystem } from '../systems/CollisionSystem';
import { ScoreManager } from '../systems/ScoreManager';
import { ComboManager } from '../systems/ComboManager';
import { DifficultyManager } from '../systems/DifficultyManager';
import { InputController } from '../systems/InputController';
import { Profile } from '../systems/ProfileManager';
import { Daily } from '../systems/DailyManager';
import { Achievements } from '../systems/AchievementManager';
import { HUD } from '../ui/HUD';
import { EffectsLayer } from '../ui/EffectsLayer';
import { Sound, MUSIC } from '../systems/SoundManager';
import { FEATURES } from '../config/FeatureFlags';

/**
 * The playable scene. Orchestrates difficulty, the obstacle stream, the combo
 * (which scales both score AND speed), a 3-lives system with post-hit
 * invincibility, and all per-frame visual feedback.
 */
export class GameScene extends Phaser.Scene {
  private bg!: Background;
  private player!: Player;
  private obstacles!: ObstacleGenerator;
  private score!: ScoreManager;
  private combo!: ComboManager;
  private controls!: InputController;
  private hud!: HUD;
  private fx!: EffectsLayer;

  private running = false;
  private lastMoveDir: -1 | 0 | 1 = 0;
  private dirHoldMs = 0;
  private moveHardActive = false; // tracks moveHard entry to ease in the strain trails (DR-10)
  private boostUntilMs = -1;
  private passCount = 0;
  private lives: number = LIVES_CFG.count;
  private livesMax: number = LIVES_CFG.count;
  private invincibleUntilMs = 0;
  private comboCelebUntilMs = 0;
  private comboCelebFrame: number | null = null;
  private startingHigh = 0;
  private beatBest = false;
  private maxCombo = 0;

  // Next allowed time for the rising-tension "danger" pulse (throttled).
  private dangerNextMs = 0;

  // Next allowed time for a wind-rush streak (throttled; DR-01).
  private windNextMs = 0;

  // Brief startle window: an impact pose for hits and near-misses (DR-12/15).
  private hitAtMs = -1;
  private scareUntilMs = 0;

  // GME-GD-005: one-shot "first wow" — amplified feedback for the player's very
  // first near-miss on run #1, to make the close-call the emotional hook.
  private firstWowShown = false;

  private startScrollY = 0;

  constructor() {
    super('Game');
  }

  init(data?: { scrollY?: number }): void {
    this.startScrollY = data?.scrollY ?? 0;
  }

  create(): void {
    this.running = true;
    this.lastMoveDir = 0;
    this.dirHoldMs = 0;
    this.boostUntilMs = -1;
    this.passCount = 0;
    this.livesMax = DifficultyManager.mode.lives;
    this.lives = this.livesMax;
    this.invincibleUntilMs = 0;
    this.comboCelebUntilMs = 0;
    this.comboCelebFrame = null;
    this.maxCombo = 0;
    this.dangerNextMs = 0;
    this.firstWowShown = false;

    this.bg = new Background(this, this.startScrollY).setDepth(0);
    this.cameras.main.fadeIn(180, 0, 0, 0); // soft enter on start/retry, no pop-in (DR-26)

    this.player = new Player(this, GAME_WIDTH / 2, GAME_HEIGHT * PLAYER_CFG.startYRatio);
    this.player.setDepth(10);

    // Apply the selected skin (sprite sheet + recolour).
    const skin = getSkin(Profile.selected);
    this.player.applySkin(skin.sheet, skin.tint);
    this.player.spawnIn(); // drop-in arrival so the run starts with a beat (DR-25)

    this.score = new ScoreManager();
    this.score.reset();
    this.startingHigh = this.score.high;
    this.beatBest = false;
    this.combo = new ComboManager();

    this.obstacles = new ObstacleGenerator(this);
    this.obstacles.reset(DifficultyManager.sample(0));

    this.fx = new EffectsLayer(this);
    this.fx.setCharacterSheet(getSkin(Profile.selected).sheet); // popups use equipped skin
    this.controls = new InputController(this);

    // First-run onboarding: show a tap-hint overlay only on run #0.
    if (Profile.totalRuns === 0) {
      const hint = this.add
        .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.72, '◀  TAP       TAP  ▶', {
          fontFamily: 'monospace',
          fontSize: '28px',
          color: '#ffffff'
        })
        .setOrigin(0.5)
        .setAlpha(0.85)
        .setDepth(50);
      this.tweens.add({ targets: hint, alpha: { from: 0.85, to: 0.35 }, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      this.controls.onFirstInput = () => {
        Sound.unlock();
        this.tweens.add({ targets: hint, alpha: 0, duration: 300, onComplete: () => hint.destroy() });
      };
    } else {
      this.controls.onFirstInput = () => Sound.unlock();
    }

    this.hud = new HUD(this, this.score.high, () => this.pauseGame());
    this.hud.setLives(this.lives, this.livesMax);

    Sound.playMusic(MUSIC.GAME);

    this.input.keyboard?.on('keydown-ESC', () => this.pauseGame());
    this.input.keyboard?.on('keydown-P', () => this.pauseGame());

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.controls.destroy();
      this.obstacles.destroy();
      this.fx.destroy();
    });
  }

  resumePlay(): void {
    this.running = true;
    this.controls.setEnabled(true);
  }

  private pauseGame(): void {
    if (!this.running) return;
    this.running = false;
    this.controls.setEnabled(false);
    Sound.pause();
    this.scene.launch('Pause');
    this.scene.pause();
  }

  update(_time: number, delta: number): void {
    if (!this.running) return;
    const dt = Math.min(delta, 1000 / 30);
    const now = this.score.elapsedMs;

    this.score.update(dt);
    const zone = this.score.pollMilestone(); // GME-GD-006: zone-name banner on threshold crossings
    if (zone) this.hud.showZoneBanner(zone);
    const snapshot = DifficultyManager.sample(this.score.elapsedSeconds);

    // Speed scales with time only (DifficultyManager ramp). Combo no longer
    // affects speed — it only multiplies score. This keeps difficulty predictable
    // for kids/casual players (GME-GD-004).
    const mode = DifficultyManager.mode;
    const maxSpeed = LIVES_CFG.maxComboSpeed * mode.speedScale;
    const speed = Math.min(maxSpeed, snapshot.speed);
    this.bg.update(dt, speed);

    // Rising-tension cue: a subtle low pulse once the game nears top speed.
    if (speed >= maxSpeed * 0.82) {
      if (now >= this.dangerNextMs) {
        Sound.danger();
        this.dangerNextMs = now + 700;
      }
    } else {
      this.dangerNextMs = 0; // left the zone -> pulse immediately on re-entry
    }

    const dir = this.controls.direction;
    if (dir !== this.lastMoveDir) {
      if (dir !== 0) Sound.move();
      this.dirHoldMs = 0;
      this.lastMoveDir = dir;
    } else if (dir !== 0) {
      this.dirHoldMs += dt; // sustained push -> growing effort
    }

    this.player.steer(dt, dir);
    // Faster fall -> livelier idle (deeper bob + quicker propeller) and, near top
    // speed, faint upward wind streaks so the body sells "falling" (DR-01/02).
    const fallIntensity = Phaser.Math.Clamp((speed - SCROLL_CFG.startSpeed) / (maxSpeed - SCROLL_CFG.startSpeed), 0, 1);
    this.player.aliveTick(dt, fallIntensity);
    if (fallIntensity > 0.6 && now >= this.windNextMs) {
      this.fx.burst(this.player.x + Phaser.Math.Between(-24, 24), this.player.y + 46, 0xbfe9ff, 2);
      this.windNextMs = now + 130;
    }

    // Visual pose priority: dizzy > boost > steering > combo-celebration > hover.
    // Steering deliberately beats the combo cheer: while the player is actively
    // dodging, the character keeps flying instead of flickering into the
    // front-facing cheer every time a combo tier fires (the "goes crazy" look at
    // high speed). The cheer only plays when coasting, and the combo popup/SFX
    // still celebrate the tier regardless.
    const boostActive = now < this.boostUntilMs;
    const lifeInvincible = now < this.invincibleUntilMs;
    const immune = lifeInvincible;
    if (now < this.scareUntilMs) {
      this.player.setPose({ kind: 'impact' }); // near-miss startle
    } else if (lifeInvincible && now < this.hitAtMs + 180) {
      this.player.setPose({ kind: 'impact' }); // brief recoil right after a hit (DR-12)
    } else if (boostActive) {
      this.player.setPose({ kind: 'boost' });
    } else if (dir !== 0) {
      const hard = this.dirHoldMs > PLAYER_CFG.effortHoldMs;
      if (hard && !this.moveHardActive) this.fx.burst(this.player.x, this.player.y + 40, 0xbfe9ff, 4); // ease in the strain trails (DR-10)
      this.moveHardActive = hard;
      this.player.setPose({ kind: hard ? 'moveHard' : 'move' });
    } else if (now < this.comboCelebUntilMs) {
      // x2-x20 combos flash their numbered gesture (row 5) on the character;
      // milestone combos (no frame) fall back to the animated arms-up cheer.
      this.player.setPose(
        this.comboCelebFrame !== null
          ? { kind: 'celebrate', frame: this.comboCelebFrame }
          : { kind: 'cheer' }
      );
    } else {
      this.player.setPose({ kind: 'hover' });
    }
    this.player.setAlpha(lifeInvincible ? (Math.floor(now / LIVES_CFG.blinkMs) % 2 ? 0.55 : 1) : 1);

    const passed = this.obstacles.update(dt, { ...snapshot, speed }, this.player.y);
    if (passed.length) {
      const boostMult = boostActive ? SCORE_CFG.goldenBoostMult : 1;
      for (const b of passed) this.handlePass(b, boostMult);
      this.maxCombo = Math.max(this.maxCombo, this.combo.combo);
    }

    if (!immune) {
      const hit = CollisionSystem.check(this.player, this.obstacles.barriers);
      if (hit) this.loseLife();
    }

    this.hud.update(this.score.current, this.combo.combo, this.combo.multiplier, boostActive);

    // Live record chase — the big "one more try" hook.
    if (!this.beatBest && this.startingHigh > 0 && this.score.current > this.startingHigh) {
      this.beatBest = true;
      this.hud.markRecord();
      this.fx.popup(GAME_WIDTH / 2, GAME_HEIGHT * 0.2, '★ NEW RECORD! ★', '#ffd54a', 42);
      Sound.newBest();
    }
  }

  /**
   * Which gap of a barrier the player threaded. A fork has two (easy + hard); a
   * normal wall has one. Picks the gap the player's centre is inside, else the
   * nearest — so the reward matches the line the player actually committed to.
   */
  private chosenGap(b: Barrier): { x: number; width: number; hard: boolean } {
    const gaps = b.safeGaps();
    if (gaps.length === 1) return gaps[0];
    const px = this.player.x;
    let best = gaps[0];
    let bestDist = Infinity;
    for (const g of gaps) {
      const inside = px >= g.x - g.width / 2 && px <= g.x + g.width / 2;
      const dist = inside ? -1 : Math.abs(px - g.x);
      if (dist < bestDist) {
        bestDist = dist;
        best = g;
      }
    }
    return best;
  }

  /** Award score + combo + feedback for a cleared obstacle. */
  private handlePass(b: Barrier, boostMult: number): void {
    const state = this.combo.increment();
    const mult = state.multiplier;

    let points = SCORE_CFG.pointsPerPass * mult * boostMult;
    const py = this.player.y;
    const chosen = this.chosenGap(b); // the gap (of 1 or 2) the player took
    const px = chosen.x;

    if (b.isGolden) {
      points += SCORE_CFG.goldenBonus;
      this.boostUntilMs = this.score.elapsedMs + SCORE_CFG.goldenBoostMs;
      this.fx.goldBurst(px, b.y);
      this.fx.popup(px, py - 40, 'GOLDEN!  x2 BOOST', '#ffd54a', 26);
      Sound.newBest();
    } else {
      Sound.pass();
    }

    // Risk↔reward (GME-017): the riskier line pays more SCORE (speed stays
    // decoupled per GME-GD-004). Additive axes — taking a fork's HARD gap, a
    // narrow gap, and/or a near-miss graze — never a penalty, so Relax stays
    // accessible. Every bonus is measured against the CHOSEN gap.
    if (!b.isGolden) {
      const box = this.player.getHitbox();
      const gapLeft = chosen.x - chosen.width / 2;
      const gapRight = chosen.x + chosen.width / 2;
      const clearance = Math.min(box.x - box.halfW - gapLeft, gapRight - (box.x + box.halfW));
      const nearMiss = clearance >= 0 && clearance <= SCORE_CFG.nearMissMargin;
      const gapBonus = ScoreManager.narrowGapBonus(chosen.width, mult); // tighter gap = more
      const forkReward = chosen.hard
        ? ScoreManager.forkBonus(Math.abs(b.gapX - b.gap2X), mult) // gambled on the hard gap
        : 0;
      const riskBonus = gapBonus + forkReward + (nearMiss ? SCORE_CFG.nearMissBonus * mult : 0);
      points += riskBonus;

      if (nearMiss) {
        Sound.nearMiss();
        this.scareUntilMs = this.score.elapsedMs + 160; // brief pilot startle (DR-15)
      } else if (chosen.hard) {
        Sound.nearMiss(); // the gamble earns the same satisfying sting
      }

      // Feedback priority: the fork gamble headlines, else a graze, else a clean tight gap.
      if (chosen.hard) {
        this.fx.popup(px, py - 40, `¡ARRIESGADO! +${Math.round(riskBonus)}`, '#ffb020', 28);
        this.fx.burst(px, this.player.y, 0xffb020, 12);
        this.cameras.main.shake(160, 0.006);
      } else if (nearMiss) {
        if (Profile.totalRuns === 0 && !this.firstWowShown) {
          // GME-GD-005: amplify the first-ever near-miss on the player's first run.
          this.firstWowShown = true;
          this.fx.popup(this.player.x, py - 70, '¡CASI!', '#ffe14a', 48);
          this.fx.burst(this.player.x, this.player.y, 0xbfe9ff, 16); // wind streaks
          this.cameras.main.flash(200, 200, 240, 255); // wind whoosh flash
          this.cameras.main.shake(340, 0.015); // bigger than a normal pass
        } else {
          this.fx.popup(px, py - 34, `CLOSE! +${Math.round(riskBonus)}`, '#9be7ff', 24);
          this.fx.burst(px, this.player.y, 0x9be7ff, 6);
        }
      } else if (gapBonus >= SCORE_CFG.riskFeedbackMin) {
        // Tight gap cleared cleanly (no graze): a brief, quieter reward beat.
        this.fx.popup(px, py - 34, `TIGHT! +${Math.round(gapBonus)}`, '#9be7ff', 22);
        this.fx.burst(px, this.player.y, 0x9be7ff, 4);
      }
    }

    this.score.addBonus(points);
    this.fx.burst(px, b.y, b.def.fill, b.isGolden ? 14 : 7);

    const label = mult > 1 ? `+${Math.round(points)}  x${mult}` : `+${Math.round(points)}`;
    this.fx.popup(px, py, label, mult > 1 ? '#ffd54a' : '#ffffff', mult > 1 ? 32 : 26);

    // Celebrate reaching a new combo tier: briefly flash a celebration, then the
    // pose logic naturally returns the player to flying. Bigger milestones (50,
    // 100, 200…) cheer with escalating FX.
    if (state.tierUp) {
      Sound.combo(mult);
      const cx = GAME_WIDTH / 2;
      // Glow on the body so a tier still reads while steering hides the cheer (DR-30).
      this.fx.burst(this.player.x, this.player.y, 0xffe14a, 8);
      this.comboCelebUntilMs = this.score.elapsedMs + COMBO_CFG.celebrateMs;
      // x2-x20 tiers carry a numbered combo frame -> show it on the character
      // (pose 'celebrate'); milestone tiers (huge/epic) have none -> cheer anim.
      this.comboCelebFrame = state.frame;

      // For sprite-frame tiers (x2–x20) show the score mult; for all higher tiers
      // show the raw combo count so the player sees the round milestone number.
      const comboLabel = `COMBO x${state.frame !== null ? mult : state.count}!`;

      if (state.fx === 'epic') {
        this.fx.popup(cx, py - 100, comboLabel, '#ffd54a', 52);
        this.fx.iconPopup(cx, py - 150, CHAR_FRAMES.crown, 1.3);
        this.fx.burst(this.player.x, this.player.y, 0xffd54a, 26);
        this.cameras.main.flash(220, 255, 230, 150);
        this.cameras.main.shake(180, 0.008);
      } else if (state.fx === 'huge') {
        this.fx.popup(cx, py - 95, comboLabel, '#ffd54a', 46);
        this.fx.iconPopup(cx, py - 148, CHAR_FRAMES.trophy, 1.2);
        this.fx.burst(this.player.x, this.player.y, 0xffd54a, 18);
      } else {
        this.fx.popup(cx, py - 90, comboLabel, '#ffd54a', 40);
        if (mult >= 10) this.fx.iconPopup(cx, py - 140, CHAR_FRAMES.starHead, 1.0);
      }
    }

    this.passCount += 1;
  }

  /** Crash: lose a life, reset the combo, grant invincibility — or end the run. */
  private loseLife(): void {
    this.lives -= 1;
    this.combo.reset();
    this.hud.setLives(this.lives, this.livesMax);

    Sound.hit();
    this.cameras.main.shake(220, 0.012);
    this.fx.burst(this.player.x, this.player.y, 0xff5050, 16);

    if (this.lives <= 0) {
      this.finishGameOver(); // out of lives -> straight to results
      return;
    }
    // DR-23: only show the life-lost feedback when a life actually remains. On the
    // fatal hit we skip the "-1 ♥" popup and go straight to the death beat.
    this.fx.popup(this.player.x, this.player.y - 60, '-1  ♥', '#ff4060', 34);
    this.fx.iconPopup(this.player.x, this.player.y - 96, CHAR_FRAMES.sadHead, 0.9);
    // Survive: a short impact recoil, then brief invincibility (blink + dizzy).
    this.hitAtMs = this.score.elapsedMs; // DR-12: drives the impact pose window
    this.invincibleUntilMs = this.score.elapsedMs + LIVES_CFG.invincibleMs;
  }

  /** Finalize the run: commit score, bank coins, feed daily, go to results. */
  finishGameOver(): void {
    this.running = false;
    this.controls.setEnabled(false);
    // Knockout beat: play the 6-frame death + tumble fly-out and a white impact flash,
    // then let results appear after ~600ms so the animation reads (DR-17/20/22).
    this.player.playDeath();
    this.fx.burst(this.player.x, this.player.y, 0xffffff, 22);

    const finalScore = this.score.current;
    const isNewBest = this.score.commit();

    // Classic mode earns 1.5× coins as a skill reward (Relax keeps the base rate).
    const coinMult = DifficultyManager.mode.id === 'classic' ? 1.5 : 1;
    const coins = Math.floor((Math.floor(finalScore / 100) + Math.floor(this.maxCombo / 10)) * coinMult);
    if (coins > 0) Profile.addCoins(coins);

    Profile.recordRun();

    // Unlock any achievements newly met by this run (high score / run count / etc.)
    // and grant their reward skins. GameOverScene drains the notification queue.
    Achievements.evaluate();

    // Feed the daily mission (best-in-run progress) and flag a fresh completion.
    Daily.reportRun({ passes: this.passCount, combo: this.maxCombo, score: finalScore });
    const missionDone = FEATURES.DAILY_ENABLED && Daily.hasUnclaimed();

    this.cameras.main.shake(300, 0.016);
    // Ease into results: fade the death beat out instead of a hard scene cut (DR-21).
    this.time.delayedCall(400, () => this.cameras.main.fadeOut(200, 0, 0, 0));
    this.time.delayedCall(600, () => {
      Sound.gameOver();
      this.scene.start('GameOver', {
        score: finalScore,
        best: this.score.high,
        isNewBest,
        coins,
        totalCoins: Profile.coins,
        missionDone
      });
    });
  }
}
