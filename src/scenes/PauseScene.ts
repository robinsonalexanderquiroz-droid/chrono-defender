import Phaser from 'phaser';

/**
 * PauseScene — launched above the gameplay scene to display a pause overlay.
 *
 * When active, the gameplay scene is paused (physics, timers, tweens, update all frozen).
 * Pressing P or Escape resumes the gameplay scene and stops this scene.
 */
export class PauseScene extends Phaser.Scene {
  private pKey!: Phaser.Input.Keyboard.Key;
  private escKey!: Phaser.Input.Keyboard.Key;

  constructor() {
    super({ key: 'PauseScene' });
  }

  create(): void {
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
      .text(width / 2, height / 2 - 30, 'PAUSED', {
        fontSize: '48px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(101);

    // Instructions subtitle
    this.add
      .text(width / 2, height / 2 + 30, 'Press P or Esc to Resume', {
        fontSize: '18px',
        color: '#aaaaaa',
      })
      .setOrigin(0.5)
      .setDepth(101);

    // Register resume keys (edge-triggered via JustDown in update)
    const kb = this.input.keyboard;
    if (kb) {
      this.pKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.P);
      this.escKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    }
  }

  override update(): void {
    if (
      Phaser.Input.Keyboard.JustDown(this.pKey) ||
      Phaser.Input.Keyboard.JustDown(this.escKey)
    ) {
      this.resumeGame();
    }
  }

  private resumeGame(): void {
    // Resume the gameplay scene
    this.scene.resume('PrototypeScene');
    // Stop (remove) this pause scene
    this.scene.stop();
  }
}
