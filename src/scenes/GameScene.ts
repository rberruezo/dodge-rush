import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, PLAYER_CFG, SCORE_CFG, BG_CFG, BG_THEME_KEYS } from '../config/Constants';
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
 * The playable scene. Orchestrates the difficulty curve, obstacle stream,
 * combo/scoring, and all per-frame visual feedback.
 *
 * Note: the input helper is stored as `controls` (not `input`) to avoid
 * shadowing Phaser's built-in Scene.input plugin.
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
  private boostUntilMs = -1;
  private passCount = 0;

  constructor() {
    super('Game');
  }

  create(): void {
    this.running = true;
    this.lastMoveDir = 0;
    this.boostUntilMs = -1;
    this.passCount = 0;

    // Start each run on a random point in the day-cycle for variety.
    this.bg = new Background(this, Phaser.Math.Between(0, BG_THEME_KEYS.length - 1)).setDepth(0);

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

    // Cross-dissolve from the menu loop into the gameplay track.
    Sound.playMusic(MUSIC.GAME);

    this.hud = new HUD(this, this.score.high, () => this.pauseGame());

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

    // Clamp delta so a tab-switch stall can't tunnel obstacles through the player.
    const dt = Math.min(delta, 1000 / 30);

    this.score.update(dt);
    const snapshot = DifficultyManager.sample(this.score.elapsedSeconds);

    this.bg.update(dt, snapshot.speed);

    const dir = this.controls.direction;
    if (dir !== 0 && dir !== this.lastMoveDir) Sound.move();
    this.lastMoveDir = dir;
    this.player.steer(dt, dir);

    const passed = this.obstacles.update(dt, snapshot, this.player.y);
    if (passed.length) {
      const boostActive = this.score.elapsedMs < this.boostUntilMs;
      const boostMult = boostActive ? SCORE_CFG.goldenBoostMult : 1;
      for (const b of passed) this.handlePass(b, boostMult);
    }

    const hit = CollisionSystem.check(this.player, this.obstacles.barriers);
    if (hit) {
      this.gameOver();
      return;
    }

    this.hud.update(
      this.score.current,
      this.combo.combo,
      this.combo.multiplier,
      this.score.elapsedMs < this.boostUntilMs
    );
  }

  /** Award score + combo + feedback for a cleared obstacle. */
  private handlePass(b: Barrier, boostMult: number): void {
    this.combo.increment();
    const mult = this.combo.multiplier;

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

    // Drift the world through the day-cycle every so many cleared obstacles.
    this.passCount += 1;
    if (this.passCount % BG_CFG.changeEveryPasses === 0) this.bg.nextTheme();
  }

  private gameOver(): void {
    this.running = false;
    this.controls.setEnabled(false);
    this.player.crash();
    Sound.hit();

    const finalScore = this.score.current;
    const isNewBest = this.score.commit();

    this.cameras.main.shake(240, 0.014);
    this.fx.burst(this.player.x, this.player.y, 0xff5050, 18);
    this.time.delayedCall(380, () => {
      Sound.gameOver();
      this.scene.start('GameOver', { score: finalScore, best: this.score.high, isNewBest });
    });
  }
}
