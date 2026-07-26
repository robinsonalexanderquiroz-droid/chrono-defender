import Phaser from 'phaser';

import { MenuScene } from '../scenes/MenuScene';
import { OptionsScene } from '../scenes/OptionsScene';
import { PauseScene } from '../scenes/PauseScene';
import { PrototypeScene } from '../scenes/PrototypeScene';
import { TouchOverlay } from '../ui/TouchOverlay';

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 960,
  height: 540,
  backgroundColor: '#050a1a',
  input: {
    keyboard: {
      capture: [
        Phaser.Input.Keyboard.KeyCodes.UP,
        Phaser.Input.Keyboard.KeyCodes.DOWN,
        Phaser.Input.Keyboard.KeyCodes.LEFT,
        Phaser.Input.Keyboard.KeyCodes.RIGHT,
        Phaser.Input.Keyboard.KeyCodes.SPACE,
      ],
    },
  },
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
  scene: [MenuScene, PrototypeScene, PauseScene, OptionsScene, TouchOverlay],
};
