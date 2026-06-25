import Phaser from 'phaser';
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  PLAYER_CFG,
  SCORE_CFG,
  BG_CFG,
  BG_THEME_KEYS,
  LIVES_CFG,
  COMBO_CFG,
  DASH_CFG,
  CHAR_FRAMES
} from '../config/Constants';
import { getSkin } from '../config/Skins';
import { Background } from '../objects/Background';
import { Player } from '../objects/Player';
import { Barrier } from '../objects/Barrier';
import { Ghost } from '../objects/Ghost';
import { ObstacleGenerator } from '../systems/ObstacleGenerator';
import { CollisionSystem } from '../systems/CollisionSystem';
import { ScoreManager } from '../systems/ScoreManager';
import { ComboManager } from '../systems/ComboManager';
import { DifficultyManager } from '../systems/DifficultyManager';
import { InputController } from '../systems/InputController';
import { Profile } from '../systems/ProfileManager';
import { HUD } from '../ui/HUD';
import { EffectsLayer } from '../ui/EffectsLayer';
import { Sound, MUSIC } from '../systems/SoundManager';

/** Ghost path sampling interval (ms). */
const GHOST_DT = 90;

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
  private boostUntilMs = -1;
  private passCount = 0;
  private lives = LIVES_CFG.count;
  private invincibleUntilMs = 0;
  private comboCelebUntilMs = 0;
  private comboCelebFrame: number = CHAR_FRAMES.starHead;
  private comboCelebCheer = false;
  private startingHigh = 0;
  private beatBest = false;
  private maxCombo = 0;

  // Dash power.
  private dashUntilMs = 0;
  private dashCdUntilMs = 0;
  private dashInvincibleUntilMs = 0;
  private dashStartMs = 0;
  private dashFromX = 0;
  private dashToX = 0;
  private dashDir: 1 | -1 = 1;
  private trailColor = 0x46e6ff;

  // Record ghost.
  private ghost!: Ghost;
  private ghostRec: number[] = [];
  private ghostT = 0;

  private startTheme = 0;
  private startScrollY = 0;

  constructor() {
    super('Game');
  }

  init(data?: { theme?: number; scrollY?: number }): void {
    this.startTheme =
      data?.theme ?? Phaser.Math.Between(0, BG_THEME_KEYS.length - 1);
    this.startScrollY = data?.scrollY ?? 0;
  }

  create(): void {
    this.running = true;
    this.lastMoveDir = 0;
    this.dirHoldMs = 0;
    this.boostUntilMs = -1;
    this.passCount = 0;
    this.lives = LIVES_CFG.count;
    this.invincibleUntilMs = 0;
    this.comboCelebUntilMs = 0;
    this.comboCelebCheer = false;
    this.maxCombo = 0;
    this.dashUntilMs = 0;
    this.dashCdUntilMs = 0;
    this.dashInvincibleUntilMs = 0;
    this.ghostRec = [];
    this.ghostT = 0;

    this.bg = new Background(this, this.startTheme, this.startScrollY).setDepth(0);

    // Race the best-run ghost; behind the player.
    this.ghost = new Ghost(this, Profile.loadGhost());

    this.player = new Player(this, GAME_WIDTH / 2, GAME_HEIGHT * PLAYER_CFG.startYRatio);
    this.player.setDepth(10);

    // Apply the selected skin (sprite sheet + recolour + trail colour).
    const skin = getSkin(Profile.selected);
    this.player.applySkin(skin.sheet, skin.tint);
    this.trailColor = skin.trail;

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
    this.controls.onFirstInput = () => Sound.unlock();
    this.controls.onDash = (dir) => this.tryDash(dir);

    this.hud = new HUD(this, this.score.high, () => this.pauseGame());
    this.hud.setLives(this.lives, LIVES_CFG.count);
    this.hud.setDash(true, 1);

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
    this.scene.launch('Pause');
    this.scene.pause();
  }

  /** Double-tap dash: a quick burst sideways with brief i-frames + cooldown. */
  private tryDash(dir: 1 | -1): void {
    if (!this.running) return;
    const now = this.score.elapsedMs;
    if (now < this.dashCdUntilMs) return; // recharging
    this.dashStartMs = now;
    this.dashUntilMs = now + DASH_CFG.durationMs;
    this.dashCdUntilMs = now + DASH_CFG.cooldownMs;
    this.dashInvincibleUntilMs = now + DASH_CFG.invincibleMs;
    this.dashDir = dir;
    this.dashFromX = this.player.x;
    this.dashToX = this.player.x + dir * DASH_CFG.distance;
    Sound.dash();
    this.fx.burst(this.player.x, this.player.y, this.trailColor, 14);
  }

  update(_time: number, delta: number): void {
    if (!this.running) return;
    const dt = Math.min(delta, 1000 / 30);
    const now = this.score.elapsedMs;

    this.score.update(dt);
    const snapshot = DifficultyManager.sample(this.score.elapsedSeconds);

    // Combo speeds the game up (on top of the time ramp); resets with the combo.
    const speed = Math.min(LIVES_CFG.maxComboSpeed, snapshot.speed + this.combo.speedBonus);
    this.bg.update(dt, speed);

    const dir = this.controls.direction;
    if (dir !== this.lastMoveDir) {
      if (dir !== 0) Sound.move();
      this.dirHoldMs = 0;
      this.lastMoveDir = dir;
    } else if (dir !== 0) {
      this.dirHoldMs += dt; // sustained push -> growing effort
    }

    const dashing = now < this.dashUntilMs;
    if (dashing) {
      const t = Phaser.Math.Clamp((now - this.dashStartMs) / DASH_CFG.durationMs, 0, 1);
      const e = 1 - Math.pow(1 - t, 3); // easeOutCubic
      this.player.placeX(Phaser.Math.Linear(this.dashFromX, this.dashToX, e));
      this.player.face(this.dashDir);
    } else {
      this.player.steer(dt, dir);
    }
    this.player.aliveTick(dt);
    this.ghost.update(now);

    // Sample the player path for the next run's ghost.
    this.ghostT += dt;
    while (this.ghostT >= GHOST_DT) {
      this.ghostT -= GHOST_DT;
      if (this.ghostRec.length < 4000) this.ghostRec.push(Math.round(this.player.x));
    }

    // Visual pose priority: dizzy > dash > combo-celebration > boost > steering > hover.
    const boostActive = now < this.boostUntilMs;
    const lifeInvincible = now < this.invincibleUntilMs;
    const immune = lifeInvincible || now < this.dashInvincibleUntilMs;
    if (lifeInvincible) {
      this.player.setPose({ kind: 'dizzy' });
    } else if (dashing) {
      this.player.setPose({ kind: 'boost' });
    } else if (now < this.comboCelebUntilMs) {
      this.player.setPose(
        this.comboCelebCheer ? { kind: 'cheer' } : { kind: 'celebrate', frame: this.comboCelebFrame }
      );
    } else if (boostActive) {
      this.player.setPose({ kind: 'boost' });
    } else if (dir !== 0) {
      this.player.setPose({ kind: this.dirHoldMs > PLAYER_CFG.effortHoldMs ? 'moveHard' : 'move' });
    } else {
      this.player.setPose({ kind: 'hover' });
    }
    this.player.setAlpha(lifeInvincible ? (Math.floor(now / LIVES_CFG.blinkMs) % 2 ? 0.35 : 1) : 1);

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

    // Dash cooldown meter.
    const cdLeft = this.dashCdUntilMs - now;
    this.hud.setDash(cdLeft <= 0, 1 - cdLeft / DASH_CFG.cooldownMs);

    this.hud.update(this.score.current, this.combo.combo, this.combo.multiplier, boostActive);

    // Live record chase — the big "one more try" hook.
    if (!this.beatBest && this.startingHigh > 0 && this.score.current > this.startingHigh) {
      this.beatBest = true;
      this.hud.markRecord();
      this.fx.popup(GAME_WIDTH / 2, GAME_HEIGHT * 0.2, '★ NEW RECORD! ★', '#ffd54a', 42);
      Sound.newBest();
    }
  }

  /** Award score + combo + feedback for a cleared obstacle. */
  private handlePass(b: Barrier, boostMult: number): void {
    const state = this.combo.increment();
    const mult = state.multiplier;

    let points = SCORE_CFG.pointsPerPass * mult * boostMult;
    const px = b.gapX;
    const py = this.player.y;

    if (b.isGolden) {
      points += SCORE_CFG.goldenBonus;
      this.boostUntilMs = this.score.elapsedMs + SCORE_CFG.goldenBoostMs;
      this.fx.goldBurst(px, b.y);
      this.fx.popup(px, py - 40, 'GOLDEN!  x2 BOOST', '#ffd54a', 26);
      Sound.newBest();
    } else {
      Sound.pass();
    }

    // Near-miss reward: threading the gap with little clearance pays extra.
    if (!b.isGolden) {
      const box = this.player.getHitbox();
      const clearance = Math.min(
        box.x - box.halfW - (b.gapX - b.gapWidth / 2),
        b.gapX + b.gapWidth / 2 - (box.x + box.halfW)
      );
      if (clearance >= 0 && clearance <= SCORE_CFG.nearMissMargin) {
        const nm = SCORE_CFG.nearMissBonus * mult;
        points += nm;
        this.fx.popup(px, py - 34, `CLOSE! +${Math.round(nm)}`, '#9be7ff', 24);
        this.fx.burst(px, this.player.y, 0x9be7ff, 6);
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
      Sound.newBest();
      const cx = GAME_WIDTH / 2;
      this.comboCelebUntilMs = this.score.elapsedMs + COMBO_CFG.celebrateMs;
      this.comboCelebCheer = state.frame === null;
      if (state.frame !== null) this.comboCelebFrame = state.frame;

      if (state.fx === 'epic') {
        this.fx.popup(cx, py - 100, `COMBO x${mult}!`, '#ffd54a', 52);
        this.fx.iconPopup(cx, py - 150, CHAR_FRAMES.crown, 1.3);
        this.fx.burst(this.player.x, this.player.y, 0xffd54a, 26);
        this.cameras.main.flash(220, 255, 230, 150);
        this.cameras.main.shake(180, 0.008);
      } else if (state.fx === 'huge') {
        this.fx.popup(cx, py - 95, `COMBO x${mult}!`, '#ffd54a', 46);
        this.fx.iconPopup(cx, py - 148, CHAR_FRAMES.trophy, 1.2);
        this.fx.burst(this.player.x, this.player.y, 0xffd54a, 18);
      } else {
        this.fx.popup(cx, py - 90, `COMBO x${mult}!`, '#ffd54a', 40);
        if (mult >= 10) this.fx.iconPopup(cx, py - 140, CHAR_FRAMES.starHead, 1.0);
      }
    }

    this.passCount += 1;
    if (this.passCount % BG_CFG.changeEveryPasses === 0) this.bg.nextTheme();
  }

  /** Crash: lose a life, reset the combo, grant invincibility — or end the run. */
  private loseLife(): void {
    this.lives -= 1;
    this.combo.reset();
    this.hud.setLives(this.lives, LIVES_CFG.count);

    Sound.hit();
    this.cameras.main.shake(220, 0.012);
    this.fx.burst(this.player.x, this.player.y, 0xff5050, 16);
    this.fx.popup(this.player.x, this.player.y - 60, '-1  ♥', '#ff4060', 34);
    this.fx.iconPopup(this.player.x, this.player.y - 96, CHAR_FRAMES.sadHead, 0.9);

    if (this.lives <= 0) {
      this.gameOver();
      return;
    }
    // Survive: brief invincibility (player blinks + dizzy) then carry on.
    this.invincibleUntilMs = this.score.elapsedMs + LIVES_CFG.invincibleMs;
  }

  private gameOver(): void {
    this.running = false;
    this.controls.setEnabled(false);
    this.player.setPose({ kind: 'dizzy' });
    this.player.setAlpha(1);

    const finalScore = this.score.current;
    const isNewBest = this.score.commit();

    // Coins from this run (by score + a combo bonus), banked to the profile.
    const coins = Math.floor(finalScore / 100) + Math.floor(this.maxCombo / 10);
    if (coins > 0) Profile.addCoins(coins);

    // A new best becomes the ghost to race next time.
    if (isNewBest) Profile.saveGhost({ dt: GHOST_DT, xs: this.ghostRec, score: finalScore });

    this.cameras.main.shake(300, 0.016);
    this.time.delayedCall(420, () => {
      Sound.gameOver();
      this.scene.start('GameOver', {
        score: finalScore,
        best: this.score.high,
        isNewBest,
        coins,
        totalCoins: Profile.coins
      });
    });
  }
}
