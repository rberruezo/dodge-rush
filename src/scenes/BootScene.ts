import Phaser from 'phaser';

/**
 * Minimal boot scene. Configures global rendering hints, then hands off to the
 * preloader. Kept separate from Preload so any future global setup (fonts,
 * plugins, save migration) has a clear home.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#1a1030');
    this.scene.start('Preload');
  }
}
