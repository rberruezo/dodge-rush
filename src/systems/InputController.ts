import Phaser from 'phaser';
import { GAME_WIDTH, POWER_CFG } from '../config/Constants';

/**
 * Translates raw touch / mouse / keyboard input into a single horizontal
 * intent: -1 (left), 0 (none), +1 (right).
 *
 * Touch model: the screen is split down the middle. Holding (or tapping) the
 * left half steers left, the right half steers right. Multiple pointers are
 * tracked so quick left/right alternation feels responsive on mobile.
 */
export class InputController {
  private scene: Phaser.Scene;
  private pointerSides = new Map<number, -1 | 1>();
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyA?: Phaser.Input.Keyboard.Key;
  private keyD?: Phaser.Input.Keyboard.Key;
  private enabled = true;

  /** Fired the first time any input is received (used to unlock audio). */
  onFirstInput?: () => void;
  private firstInputFired = false;

  /** Fired on a double-tap of one side (smash-power trigger). */
  onBreak?: (dir: -1 | 1) => void;
  private lastTapSide: -1 | 1 | 0 = 0;
  private lastTapTime = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    scene.input.on(Phaser.Input.Events.POINTER_DOWN, this.handleDown, this);
    scene.input.on(Phaser.Input.Events.POINTER_UP, this.handleUp, this);
    scene.input.on(Phaser.Input.Events.POINTER_UP_OUTSIDE, this.handleUp, this);

    if (scene.input.keyboard) {
      this.cursors = scene.input.keyboard.createCursorKeys();
      this.keyA = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
      this.keyD = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    }
  }

  setEnabled(value: boolean): void {
    this.enabled = value;
    if (!value) this.pointerSides.clear();
  }

  private fireFirstInput(): void {
    if (!this.firstInputFired) {
      this.firstInputFired = true;
      this.onFirstInput?.();
    }
  }

  private handleDown(pointer: Phaser.Input.Pointer): void {
    this.fireFirstInput();
    if (!this.enabled) return;
    const side: -1 | 1 = pointer.x < GAME_WIDTH / 2 ? -1 : 1;

    // Double-tap the same side -> trigger the smash power.
    const t = pointer.downTime;
    if (side === this.lastTapSide && t - this.lastTapTime <= POWER_CFG.doubleTapMs) {
      this.onBreak?.(side);
      this.lastTapSide = 0; // consume, so a triple-tap isn't two activations
    } else {
      this.lastTapSide = side;
      this.lastTapTime = t;
    }

    this.pointerSides.set(pointer.id, side);
  }

  private handleUp(pointer: Phaser.Input.Pointer): void {
    this.pointerSides.delete(pointer.id);
  }

  /** Resolve the current steering direction for this frame. */
  get direction(): -1 | 0 | 1 {
    if (!this.enabled) return 0;

    let left = false;
    let right = false;
    this.pointerSides.forEach((side) => {
      if (side === -1) left = true;
      else right = true;
    });

    // Keyboard support for desktop testing.
    if (this.cursors?.left.isDown || this.keyA?.isDown) left = true;
    if (this.cursors?.right.isDown || this.keyD?.isDown) right = true;

    if (left === right) return 0; // none, or both cancel out
    return left ? -1 : 1;
  }

  destroy(): void {
    this.scene.input.off(Phaser.Input.Events.POINTER_DOWN, this.handleDown, this);
    this.scene.input.off(Phaser.Input.Events.POINTER_UP, this.handleUp, this);
    this.scene.input.off(Phaser.Input.Events.POINTER_UP_OUTSIDE, this.handleUp, this);
    this.pointerSides.clear();
  }
}
