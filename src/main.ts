import Phaser from 'phaser';
import { createGameConfig } from './config/GameConfig';
import { Sound } from './systems/SoundManager';
import { Diagnostics } from './systems/Diagnostics';

/**
 * Entry point. Instantiates the Phaser game into #game and keeps the canvas
 * sized to the visual viewport (handles mobile URL-bar show/hide gracefully).
 */
const PARENT_ID = 'game';

const game = new Phaser.Game(createGameConfig(PARENT_ID));

// Bridge for the native Android shell (mobile/App.tsx): it injects calls to
// these on AppState change so music pauses when the app is backgrounded and
// resumes (only if it was playing) when it returns to the foreground.
(window as unknown as { __dodgeAudio?: { suspend(): void; resume(): void } }).__dodgeAudio = {
  suspend: () => Sound.suspend(),
  resume: () => Sound.resume()
};

// Re-fit when the visual viewport changes (rotation, browser chrome resize).
const refresh = () => game.scale.refresh();
window.addEventListener('resize', refresh);
window.addEventListener('orientationchange', refresh);
window.visualViewport?.addEventListener('resize', refresh);

// Block context menu / pinch-zoom gestures that would interrupt play.
window.addEventListener('contextmenu', (e) => e.preventDefault());
window.addEventListener('gesturestart', (e) => e.preventDefault());

// Expose the game + sound + diagnostics during development for debugging.
if (import.meta.env.DEV) {
  const w = window as unknown as {
    game: Phaser.Game;
    sound: typeof Sound;
    diagnostics: typeof Diagnostics;
  };
  w.game = game;
  w.sound = Sound;
  w.diagnostics = Diagnostics;
}

export default game;
