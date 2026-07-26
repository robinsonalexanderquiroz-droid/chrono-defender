import Phaser from 'phaser';

import { audioManager } from '../systems/AudioManager';

/**
 * PauseScene — launched above the gameplay scene to display a pause overlay.
 *
 * When active, the gameplay scene is paused (physics, timers, tweens, update all frozen).
 * - P or Escape resumes gameplay.
 * - Q quits to the title screen.
 */
export class PauseScene extends Phaser.Scene {
  private pKey!: Phaser.Input.Keyboard.Key;
  private escKey!: Phaser.Input.Keyboard.Key;
  private qKey!: Phaser.Input.Keyboard.Key;
  private isQuitting = false;

  constructor() {
    super({ key: 'PauseScene' });
  }

  create(): void {
    this.isQuitting = false;
    const { width, height } = this.cameras.main;

    // Semi-transparent dark background covering the full screen
    const overlay = this.add.rectangle(
      width / 2,
      height / 2,
      width,
      height,
      0x000000,
      0.7,
    );
    overlay.setDepth(100);

    // "PAUSED" title text
    this.add
      .text(width / 2, height / 2 - 40, 'PAUSED', {
        fontSize: '48px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(101);

    // Resume instruction
    this.add
      .text(width / 2, height / 2 + 20, 'P / Esc   Resume', {
        fontSize: '18px',
        color: '#aaaaaa',
      })
      .setOrigin(0.5)
      .setDepth(101);

    // Quit instruction
    this.add
      .text(width / 2, height / 2 + 50, 'Q         Quit to Title', {
        fontSize: '18px',
        color: '#aaaaaa',
      })
      .setOrigin(0.5)
      .setDepth(101);

    // Register keys (edge-triggered via JustDown in update)
    const kb = this.input.keyboard;
    if (kb) {
      this.pKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.P);
      this.escKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
      this.qKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
      // Reset key state to prevent the same keypress that triggered pause
      // from immediately triggering resume on the first update frame.
      this.pKey.reset();
      this.escKey.reset();
      this.qKey.reset();
    }
  }

  override update(): void {
    if (
      Phaser.Input.Keyboard.JustDown(this.pKey) ||
      Phaser.Input.Keyboard.JustDown(this.escKey)
    ) {
      this.resumeGame();
      return;
    }

    if (Phaser.Input.Keyboard.JustDown(this.qKey)) {
      this.quitToTitle();
    }
  }

  private resumeGame(): void {
    audioManager.playResume();
    // Resume the gameplay scene
    this.scene.resume('PrototypeScene');
    // Stop (remove) this pause scene
    this.scene.stop();
  }

  private quitToTitle(): void {
    // Prevent multiple rapid quits
    if (this.isQuitting) return;
    this.isQuitting = true;

    audioManager.playQuit();
    audioManager.stopMusic();
    // Stop the gameplay scene (cleans up its state)
    this.scene.stop('PrototypeScene');
    // Restart PrototypeScene from scratch — returns to ready/title screen
    this.scene.start('PrototypeScene');
    // Stop this pause scene
    this.scene.stop();
  }
}
