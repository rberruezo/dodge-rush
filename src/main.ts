import Phaser from 'phaser';
import { createGameConfig } from './config/GameConfig';

/**
 * Entry point. Instantiates the Phaser game into #game and keeps the canvas
 * sized to the visual viewport (handles mobile URL-bar show/hide gracefully).
 */
const PARENT_ID = 'game';

const game = new Phaser.Game(createGameConfig(PARENT_ID));

// Re-fit when the visual viewport changes (rotation, browser chrome resize).
const refresh = () => game.scale.refresh();
window.addEventListener('resize', refresh);
window.addEventListener('orientationchange', refresh);
window.visualViewport?.addEventListener('resize', refresh);

// Block context menu / pinch-zoom gestures that would interrupt play.
window.addEventListener('contextmenu', (e) => e.preventDefault());
window.addEventListener('gesturestart', (e) => e.preventDefault());

// Expose the game instance during development for debugging in the console.
if (import.meta.env.DEV) {
  (window as unknown as { game: Phaser.Game }).game = game;
}

export default game;
