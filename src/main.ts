import Phaser from 'phaser';

import { gameConfig } from './config';

const game = new Phaser.Game(gameConfig);

// Expose game instance for E2E testing and screenshot capture
(window as unknown as { __PHASER_GAME__: Phaser.Game }).__PHASER_GAME__ = game;
