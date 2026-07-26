import Phaser from 'phaser';

import { MenuScene } from '../scenes/MenuScene';
import { PauseScene } from '../scenes/PauseScene';
import { PrototypeScene } from '../scenes/PrototypeScene';

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 960,
  height: 540,
  backgroundColor: '#050a1a',
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [MenuScene, PrototypeScene, PauseScene],
};
