import Phaser from 'phaser';
import { ASSET_KEYS } from '../config/Constants';

/**
 * Lightweight visual-feedback layer: floating score popups and particle bursts
 * (pass sparks + golden sparkles). Reuses two pooled emitters so effects are
 * cheap enough for 60 FPS on mobile.
 */
export class EffectsLayer {
  private scene: Phaser.Scene;
  private sparks: Phaser.GameObjects.Particles.ParticleEmitter;
  private gold: Phaser.GameObjects.Particles.ParticleEmitter;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    this.sparks = scene.add
      .particles(0, 0, ASSET_KEYS.PARTICLE, {
        speed: { min: 80, max: 220 },
        angle: { min: 0, max: 360 },
        scale: { start: 0.55, end: 0 },
        lifespan: 480,
        gravityY: 260,
        quantity: 1,
        emitting: false,
        blendMode: 'ADD'
      })
      .setDepth(20);

    this.gold = scene.add
      .particles(0, 0, ASSET_KEYS.PARTICLE, {
        speed: { min: 40, max: 160 },
        angle: { min: 0, max: 360 },
        scale: { start: 0.7, end: 0 },
        lifespan: 700,
        gravityY: 80,
        tint: 0xffd54a,
        quantity: 1,
        emitting: false,
        blendMode: 'ADD'
      })
      .setDepth(20);
  }

  /** Burst of coloured sparks (e.g. when an obstacle is cleared). */
  burst(x: number, y: number, color: number, count = 8): void {
    this.sparks.setParticleTint(color);
    this.sparks.explode(count, x, y);
  }

  /** Golden sparkle burst for rare obstacles. */
  goldBurst(x: number, y: number, count = 18): void {
    this.gold.explode(count, x, y);
  }

  /** A character-sheet frame (head / trophy) that pops, holds, then fades out. */
  iconPopup(x: number, y: number, frameIndex: number, scale = 2.4): void {
    const icon = this.scene.add
      .sprite(x, y, ASSET_KEYS.CHARACTER, frameIndex)
      .setDepth(22)
      .setScale(0);
    this.scene.tweens.add({
      targets: icon,
      scale,
      duration: 220,
      ease: 'Back.out',
      yoyo: false
    });
    this.scene.tweens.add({
      targets: icon,
      y: y - 50,
      alpha: { from: 1, to: 0 },
      delay: 600,
      duration: 500,
      ease: 'Cubic.in',
      onComplete: () => icon.destroy()
    });
  }

  /** Floating "+points" / combo text that rises and fades. */
  popup(x: number, y: number, text: string, color: string, size = 30): void {
    const label = this.scene.add
      .text(x, y, text, {
        fontFamily: 'monospace',
        fontSize: `${size}px`,
        color,
        fontStyle: 'bold'
      })
      .setOrigin(0.5)
      .setDepth(21)
      .setShadow(0, 3, '#00000088', 0, true, true);

    this.scene.tweens.add({
      targets: label,
      y: y - 70,
      alpha: { from: 1, to: 0 },
      scale: { from: 1.1, to: 0.9 },
      duration: 720,
      ease: 'Cubic.out',
      onComplete: () => label.destroy()
    });
  }

  destroy(): void {
    this.sparks.destroy();
    this.gold.destroy();
  }
}
