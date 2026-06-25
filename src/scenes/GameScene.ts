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
  CHAR_FRAMES
} from '../config/Constants';
import { Background } from '../objects/Background';
import { Player } from '../objects/Player';
import { Barrier } from '../objects/Barrier';
import { ObstacleGenerator } from '../systems/ObstacleGenerator';
import { CollisionSystem } from '../systems/CollisionSystem';
import { ScoreManager } from '../systems/ScoreManager';
import { ComboManager } from '../systems/ComboManager';
import { DifficultyManager } from '../systems/DifficultyManager';
import { InputController } from '../systems/InputController';
import { HUD } from '../ui/HUD';
import { EffectsLayer } from '../ui/EffectsLayer';
import { Sound, MUSIC } from '../systems/SoundManager';

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

    this.bg = new Background(this, this.startTheme, this.startScrollY).setDepth(0);

    this.player = new Player(this, GAME_WIDTH / 2, GAME_HEIGHT * PLAYER_CFG.startYRatio);
    this.player.setDepth(10);

    this.score = new ScoreManager();
    this.score.reset();
    this.combo = new ComboManager();

    this.obstacles = new ObstacleGenerator(this);
    this.obstacles.reset(DifficultyManager.sample(0));

    this.fx = new EffectsLayer(this);
    this.controls = new InputController(this);
    this.controls.onFirstInput = () => Sound.unlock();

    this.hud = new HUD(this, this.score.high, () => this.pauseGame());
    this.hud.setLives(this.lives, LIVES_CFG.count);

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
    this.player.steer(dt, dir);
    this.player.aliveTick(dt);

    // Visual pose priority: dizzy > combo-celebration > boost > steering > hover.
    const boostActive = now < this.boostUntilMs;
    const invincible = now < this.invincibleUntilMs;
    if (invincible) {
      this.player.setPose({ kind: 'dizzy' });
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
    this.player.setAlpha(invincible ? (Math.floor(now / LIVES_CFG.blinkMs) % 2 ? 0.35 : 1) : 1);

    const passed = this.obstacles.update(dt, { ...snapshot, speed }, this.player.y);
    if (passed.length) {
      const boostMult = boostActive ? SCORE_CFG.goldenBoostMult : 1;
      for (const b of passed) this.handlePass(b, boostMult);
    }

    if (!invincible) {
      const hit = CollisionSystem.check(this.player, this.obstacles.barriers);
      if (hit) this.loseLife();
    }

    this.hud.update(this.score.current, this.combo.combo, this.combo.multiplier, boostActive);
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
        this.fx.iconPopup(cx, py - 168, CHAR_FRAMES.crown, 3.2);
        this.fx.burst(this.player.x, this.player.y, 0xffd54a, 26);
        this.cameras.main.flash(220, 255, 230, 150);
        this.cameras.main.shake(180, 0.008);
      } else if (state.fx === 'huge') {
        this.fx.popup(cx, py - 95, `COMBO x${mult}!`, '#ffd54a', 46);
        this.fx.iconPopup(cx, py - 162, CHAR_FRAMES.trophy, 3);
        this.fx.burst(this.player.x, this.player.y, 0xffd54a, 18);
      } else {
        this.fx.popup(cx, py - 90, `COMBO x${mult}!`, '#ffd54a', 40);
        if (mult >= 10) this.fx.iconPopup(cx, py - 150, CHAR_FRAMES.starHead, 2.6);
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
    this.fx.popup(this.player.x, this.player.y - 50, '-1  ♥', '#ff4060', 34);
    this.fx.iconPopup(this.player.x, this.player.y - 10, CHAR_FRAMES.sadHead, 2.4);

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

    this.cameras.main.shake(300, 0.016);
    this.time.delayedCall(420, () => {
      Sound.gameOver();
      this.scene.start('GameOver', { score: finalScore, best: this.score.high, isNewBest });
    });
  }
}
