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
    this.waitForFonts(() => this.scene.start('Preload'));
  }

  /** Ensure the pixel fonts are ready before any text is rendered (else fall back). */
  private waitForFonts(done: () => void): void {
    let started = false;
    const go = () => {
      if (started) return;
      started = true;
      done();
    };
    const fontApi = (document as unknown as { fonts?: FontFaceSet }).fonts;
    if (fontApi?.load) {
      Promise.all([fontApi.load("16px 'Press Start 2P'"), fontApi.load("16px 'VT323'")])
        .then(() => fontApi.ready)
        .then(go)
        .catch(go);
      this.time.delayedCall(1500, go); // safety net if the CDN is slow/offline
    } else {
      go();
    }
  }
}
