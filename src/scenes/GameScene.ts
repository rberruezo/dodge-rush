import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, PLAYER_CFG, SCROLL_CFG } from '../config/Constants';
import { Background } from '../objects/Background';
import { Player } from '../objects/Player';
import { ObstacleGenerator } from '../systems/ObstacleGenerator';
import { CollisionSystem } from '../systems/CollisionSystem';
import { ScoreManager } from '../systems/ScoreManager';
import { InputController } from '../systems/InputController';
import { HUD } from '../ui/HUD';
import { Sound } from '../systems/SoundManager';

/**
 * The playable scene. Wires together the background, player, obstacle stream,
 * input, scoring and HUD, and drives the fixed-position-faller game loop:
 * steer the player, scroll the world, ramp difficulty, detect collisions.
 *
 * Note: the input helper is stored as `controls` (not `input`) to avoid
 * shadowing Phaser's built-in Scene.input plugin.
 */
export class GameScene extends Phaser.Scene {
  private bg!: Background;
  private player!: Player;
  private obstacles!: ObstacleGenerator;
  private score!: ScoreManager;
  private controls!: InputController;
  private hud!: HUD;

  private speed: number = SCROLL_CFG.startSpeed;
  private running = false;
  private lastMoveDir: -1 | 0 | 1 = 0;

  constructor() {
    super('Game');
  }

  create(): void {
    this.speed = SCROLL_CFG.startSpeed;
    this.running = true;
    this.lastMoveDir = 0;

    this.bg = new Background(this).setDepth(0);

    this.player = new Player(this, GAME_WIDTH / 2, GAME_HEIGHT * PLAYER_CFG.startYRatio);
    this.player.setDepth(10);

    this.obstacles = new ObstacleGenerator(this);
    this.obstacles.reset();

    this.score = new ScoreManager();
    this.score.reset();

    this.controls = new InputController(this);
    this.controls.onFirstInput = () => Sound.unlock();

    this.hud = new HUD(this, this.score.high, () => this.pauseGame());

    // Keyboard pause for desktop testing (ESC / P).
    this.input.keyboard?.on('keydown-ESC', () => this.pauseGame());
    this.input.keyboard?.on('keydown-P', () => this.pauseGame());

    // Clean up listeners if the scene shuts down.
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.controls.destroy());
  }

  /** Resumed from the pause overlay. */
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

    // Clamp delta so a tab-switch hiccup can't teleport obstacles through the player.
    const dt = Math.min(delta, 1000 / 30);

    // Difficulty ramp: faster the longer you survive.
    this.score.update(dt);
    this.speed = Math.min(
      SCROLL_CFG.maxSpeed,
      SCROLL_CFG.startSpeed + SCROLL_CFG.accelPerSec * this.score.elapsedSeconds
    );

    // World scroll + steering.
    this.bg.update(dt, this.speed);

    const dir = this.controls.direction;
    if (dir !== 0 && dir !== this.lastMoveDir) Sound.move();
    this.lastMoveDir = dir;
    this.player.steer(dt, dir);

    // Obstacles advance and award passes.
    this.obstacles.update(dt, this.speed, this.player.y, this.score);

    // Collision -> game over.
    const hit = CollisionSystem.check(this.player, this.obstacles.barriers);
    if (hit) {
      this.gameOver();
      return;
    }

    this.hud.update(this.score.current);
  }

  private gameOver(): void {
    this.running = false;
    this.controls.setEnabled(false);
    this.player.crash();
    Sound.hit();

    const finalScore = this.score.current;
    const isNewBest = this.score.commit();

    // Brief dramatic pause + shake before the results screen.
    this.cameras.main.shake(220, 0.012);
    this.time.delayedCall(360, () => {
      Sound.gameOver();
      this.scene.start('GameOver', { score: finalScore, best: this.score.high, isNewBest });
    });
  }
}
