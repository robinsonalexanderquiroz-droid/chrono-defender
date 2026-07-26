import Phaser from 'phaser';

import { gameConfig } from './config';

const game = new Phaser.Game(gameConfig);

// Expose game instance for E2E testing and screenshot capture
(window as unknown as { __PHASER_GAME__: Phaser.Game }).__PHASER_GAME__ = game;

// Auto-focus the canvas so keyboard input works without clicking first
game.events.on('ready', () => {
  const canvas = game.canvas;
  if (canvas) {
    canvas.setAttribute('tabindex', '0');
    canvas.style.outline = 'none';
    canvas.focus();
  }
});

// Re-focus on any click within the page
document.addEventListener('click', () => {
  const canvas = game.canvas;
  if (canvas) {
    canvas.focus();
  }
});
