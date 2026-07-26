/**
 * TouchOverlay - Visible touch control overlay for mobile/touch devices.
 *
 * Renders a virtual joystick, fire button, pause/mute buttons, and weapon
 * cycle buttons using Phaser Graphics. Launched above the gameplay scene
 * and only displays when the device supports touch input.
 */

import Phaser from 'phaser';

import { settingsManager } from '../systems/SettingsManager';
import { touchManager } from '../systems/TouchManager';

// ─── Constants ──────────────────────────────────────────────────────────────

/** Depth for all touch overlay elements (above game, below pause overlay) */
const OVERLAY_DEPTH = 50;

/** Joystick base radius in pixels */
const JOYSTICK_BASE_RADIUS = 70;

/** Joystick knob radius in pixels */
const JOYSTICK_KNOB_RADIUS = 30;

/** Fire button radius in pixels */
const FIRE_BUTTON_RADIUS = 60;

/** Small button size (pause, mute, weapon cycle) in pixels */
const SMALL_BUTTON_SIZE = 36;

/** Semi-transparent fill alpha for buttons */
const BUTTON_ALPHA = 0.35;

/** Pressed-state fill alpha for buttons */
const BUTTON_PRESSED_ALPHA = 0.6;

/** Maximum joystick knob displacement in pixels */
const JOYSTICK_MAX_DISPLACEMENT = 50;

// ─── TouchOverlay Scene ─────────────────────────────────────────────────────

class TouchOverlay extends Phaser.Scene {
  /** Joystick base graphic */
  private joystickBase: Phaser.GameObjects.Graphics | null = null;

  /** Joystick knob graphic */
  private joystickKnob: Phaser.GameObjects.Graphics | null = null;

  /** Fire button graphic */
  private fireButton: Phaser.GameObjects.Graphics | null = null;

  /** Fire button label */
  private fireLabel: Phaser.GameObjects.Text | null = null;

  /** Pause button graphic */
  private pauseButton: Phaser.GameObjects.Graphics | null = null;

  /** Pause button label */
  private pauseLabel: Phaser.GameObjects.Text | null = null;

  /** Mute button graphic */
  private muteButton: Phaser.GameObjects.Graphics | null = null;

  /** Mute button label */
  private muteLabel: Phaser.GameObjects.Text | null = null;

  /** Previous weapon button graphic */
  private prevWeaponButton: Phaser.GameObjects.Graphics | null = null;

  /** Previous weapon button label */
  private prevWeaponLabel: Phaser.GameObjects.Text | null = null;

  /** Next weapon button graphic */
  private nextWeaponButton: Phaser.GameObjects.Graphics | null = null;

  /** Next weapon button label */
  private nextWeaponLabel: Phaser.GameObjects.Text | null = null;

  /** Container for all overlay elements */
  private elements: Phaser.GameObjects.GameObject[] = [];

  /** Joystick center position */
  private joystickCenterX = 0;
  private joystickCenterY = 0;

  constructor() {
    super({ key: 'TouchOverlay' });
  }

  create(): void {
    if (!touchManager.isTouchDevice()) {
      return;
    }

    const { width, height } = this.scale;

    this.createJoystick(width, height);
    this.createFireButton(width, height);
    this.createPauseButton(width);
    this.createMuteButton();
    this.createWeaponCycleButtons(width, height);

    this.events.on('shutdown', this.onShutdown, this);
  }

  override update(): void {
    if (!touchManager.isTouchDevice()) {
      return;
    }

    this.updateJoystickKnob();
    this.updateFireButtonState();
  }

  /** Shows all overlay controls */
  show(): void {
    for (const element of this.elements) {
      if (element && 'setVisible' in element) {
        (
          element as Phaser.GameObjects.Graphics | Phaser.GameObjects.Text
        ).setVisible(true);
      }
    }
  }

  /** Hides all overlay controls */
  hide(): void {
    for (const element of this.elements) {
      if (element && 'setVisible' in element) {
        (
          element as Phaser.GameObjects.Graphics | Phaser.GameObjects.Text
        ).setVisible(false);
      }
    }
  }

  // ─── Private: Creation ─────────────────────────────────────────────

  private createJoystick(screenWidth: number, screenHeight: number): void {
    const margin = 40;
    this.joystickCenterX = margin + JOYSTICK_BASE_RADIUS;
    this.joystickCenterY = screenHeight - margin - JOYSTICK_BASE_RADIUS;

    // Base circle
    this.joystickBase = this.add.graphics();
    this.joystickBase.setDepth(OVERLAY_DEPTH);
    this.joystickBase.fillStyle(0xffffff, BUTTON_ALPHA);
    this.joystickBase.fillCircle(
      this.joystickCenterX,
      this.joystickCenterY,
      JOYSTICK_BASE_RADIUS,
    );
    this.joystickBase.lineStyle(2, 0x00ccff, 0.6);
    this.joystickBase.strokeCircle(
      this.joystickCenterX,
      this.joystickCenterY,
      JOYSTICK_BASE_RADIUS,
    );
    this.elements.push(this.joystickBase);

    // Knob circle
    this.joystickKnob = this.add.graphics();
    this.joystickKnob.setDepth(OVERLAY_DEPTH);
    this.redrawJoystickKnob(this.joystickCenterX, this.joystickCenterY);
    this.elements.push(this.joystickKnob);

    void screenWidth; // width used for positioning context
  }

  private createFireButton(screenWidth: number, screenHeight: number): void {
    const margin = 40;
    const cx = screenWidth - margin - FIRE_BUTTON_RADIUS;
    const cy = screenHeight - margin - FIRE_BUTTON_RADIUS;

    this.fireButton = this.add.graphics();
    this.fireButton.setDepth(OVERLAY_DEPTH);
    this.drawFireButton(false);
    this.elements.push(this.fireButton);

    this.fireLabel = this.add.text(cx, cy, 'FIRE', {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: '#00ccff',
      align: 'center',
    });
    this.fireLabel.setOrigin(0.5, 0.5);
    this.fireLabel.setDepth(OVERLAY_DEPTH);
    this.elements.push(this.fireLabel);
  }

  private createPauseButton(screenWidth: number): void {
    const margin = 16;
    const cx = screenWidth - margin - SMALL_BUTTON_SIZE;
    const cy = margin + SMALL_BUTTON_SIZE;

    this.pauseButton = this.add.graphics();
    this.pauseButton.setDepth(OVERLAY_DEPTH);
    this.pauseButton.fillStyle(0xffffff, BUTTON_ALPHA);
    this.pauseButton.fillRoundedRect(
      cx - SMALL_BUTTON_SIZE / 2,
      cy - SMALL_BUTTON_SIZE / 2,
      SMALL_BUTTON_SIZE,
      SMALL_BUTTON_SIZE,
      6,
    );
    this.pauseButton.lineStyle(1, 0x00ccff, 0.6);
    this.pauseButton.strokeRoundedRect(
      cx - SMALL_BUTTON_SIZE / 2,
      cy - SMALL_BUTTON_SIZE / 2,
      SMALL_BUTTON_SIZE,
      SMALL_BUTTON_SIZE,
      6,
    );
    this.elements.push(this.pauseButton);

    this.pauseLabel = this.add.text(cx, cy, '||', {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#00ccff',
      align: 'center',
    });
    this.pauseLabel.setOrigin(0.5, 0.5);
    this.pauseLabel.setDepth(OVERLAY_DEPTH);
    this.elements.push(this.pauseLabel);
  }

  private createMuteButton(): void {
    const margin = 16;
    const cx = margin + SMALL_BUTTON_SIZE;
    const cy = margin + SMALL_BUTTON_SIZE;

    this.muteButton = this.add.graphics();
    this.muteButton.setDepth(OVERLAY_DEPTH);
    this.muteButton.fillStyle(0xffffff, BUTTON_ALPHA);
    this.muteButton.fillRoundedRect(
      cx - SMALL_BUTTON_SIZE / 2,
      cy - SMALL_BUTTON_SIZE / 2,
      SMALL_BUTTON_SIZE,
      SMALL_BUTTON_SIZE,
      6,
    );
    this.muteButton.lineStyle(1, 0x00ccff, 0.6);
    this.muteButton.strokeRoundedRect(
      cx - SMALL_BUTTON_SIZE / 2,
      cy - SMALL_BUTTON_SIZE / 2,
      SMALL_BUTTON_SIZE,
      SMALL_BUTTON_SIZE,
      6,
    );
    this.elements.push(this.muteButton);

    const isMuted = settingsManager.get('muted');
    this.muteLabel = this.add.text(cx, cy, isMuted ? 'X' : 'M', {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#00ccff',
      align: 'center',
    });
    this.muteLabel.setOrigin(0.5, 0.5);
    this.muteLabel.setDepth(OVERLAY_DEPTH);
    this.elements.push(this.muteLabel);
  }

  private createWeaponCycleButtons(
    screenWidth: number,
    screenHeight: number,
  ): void {
    const buttonSpacing = 20;
    const cx = screenWidth * 0.65;
    const cy = screenHeight - 30;

    // Previous weapon button "<"
    this.prevWeaponButton = this.add.graphics();
    this.prevWeaponButton.setDepth(OVERLAY_DEPTH);
    this.prevWeaponButton.fillStyle(0xffffff, BUTTON_ALPHA);
    this.prevWeaponButton.fillRoundedRect(
      cx - buttonSpacing - SMALL_BUTTON_SIZE,
      cy - SMALL_BUTTON_SIZE / 2,
      SMALL_BUTTON_SIZE,
      SMALL_BUTTON_SIZE,
      6,
    );
    this.prevWeaponButton.lineStyle(1, 0xffcc00, 0.6);
    this.prevWeaponButton.strokeRoundedRect(
      cx - buttonSpacing - SMALL_BUTTON_SIZE,
      cy - SMALL_BUTTON_SIZE / 2,
      SMALL_BUTTON_SIZE,
      SMALL_BUTTON_SIZE,
      6,
    );
    this.elements.push(this.prevWeaponButton);

    this.prevWeaponLabel = this.add.text(
      cx - buttonSpacing - SMALL_BUTTON_SIZE / 2,
      cy,
      '<',
      {
        fontSize: '16px',
        fontFamily: 'monospace',
        color: '#ffcc00',
        align: 'center',
      },
    );
    this.prevWeaponLabel.setOrigin(0.5, 0.5);
    this.prevWeaponLabel.setDepth(OVERLAY_DEPTH);
    this.elements.push(this.prevWeaponLabel);

    // Next weapon button ">"
    this.nextWeaponButton = this.add.graphics();
    this.nextWeaponButton.setDepth(OVERLAY_DEPTH);
    this.nextWeaponButton.fillStyle(0xffffff, BUTTON_ALPHA);
    this.nextWeaponButton.fillRoundedRect(
      cx + buttonSpacing,
      cy - SMALL_BUTTON_SIZE / 2,
      SMALL_BUTTON_SIZE,
      SMALL_BUTTON_SIZE,
      6,
    );
    this.nextWeaponButton.lineStyle(1, 0xffcc00, 0.6);
    this.nextWeaponButton.strokeRoundedRect(
      cx + buttonSpacing,
      cy - SMALL_BUTTON_SIZE / 2,
      SMALL_BUTTON_SIZE,
      SMALL_BUTTON_SIZE,
      6,
    );
    this.elements.push(this.nextWeaponButton);

    this.nextWeaponLabel = this.add.text(
      cx + buttonSpacing + SMALL_BUTTON_SIZE / 2,
      cy,
      '>',
      {
        fontSize: '16px',
        fontFamily: 'monospace',
        color: '#ffcc00',
        align: 'center',
      },
    );
    this.nextWeaponLabel.setOrigin(0.5, 0.5);
    this.nextWeaponLabel.setDepth(OVERLAY_DEPTH);
    this.elements.push(this.nextWeaponLabel);
  }

  // ─── Private: Update Logic ─────────────────────────────────────────

  private updateJoystickKnob(): void {
    if (!this.joystickKnob) return;

    const movement = touchManager.getMovement();
    const knobX = this.joystickCenterX + movement.x * JOYSTICK_MAX_DISPLACEMENT;
    const knobY = this.joystickCenterY + movement.y * JOYSTICK_MAX_DISPLACEMENT;

    this.joystickKnob.clear();
    this.redrawJoystickKnob(knobX, knobY);
  }

  private updateFireButtonState(): void {
    if (!this.fireButton) return;

    const isFiring = touchManager.isFiring();
    this.drawFireButton(isFiring);
  }

  // ─── Private: Drawing Helpers ──────────────────────────────────────

  private redrawJoystickKnob(x: number, y: number): void {
    if (!this.joystickKnob) return;
    this.joystickKnob.fillStyle(0x00ccff, 0.6);
    this.joystickKnob.fillCircle(x, y, JOYSTICK_KNOB_RADIUS);
    this.joystickKnob.lineStyle(2, 0x00ccff, 0.9);
    this.joystickKnob.strokeCircle(x, y, JOYSTICK_KNOB_RADIUS);
  }

  private drawFireButton(pressed: boolean): void {
    if (!this.fireButton) return;

    const { width, height } = this.scale;
    const margin = 40;
    const cx = width - margin - FIRE_BUTTON_RADIUS;
    const cy = height - margin - FIRE_BUTTON_RADIUS;
    const alpha = pressed ? BUTTON_PRESSED_ALPHA : BUTTON_ALPHA;

    this.fireButton.clear();
    this.fireButton.fillStyle(0x00ccff, alpha);
    this.fireButton.fillCircle(cx, cy, FIRE_BUTTON_RADIUS);
    this.fireButton.lineStyle(2, 0x00ccff, 0.8);
    this.fireButton.strokeCircle(cx, cy, FIRE_BUTTON_RADIUS);
  }

  // ─── Private: Cleanup ──────────────────────────────────────────────

  private onShutdown(): void {
    for (const element of this.elements) {
      if (element && 'destroy' in element) {
        element.destroy();
      }
    }
    this.elements = [];
    this.joystickBase = null;
    this.joystickKnob = null;
    this.fireButton = null;
    this.fireLabel = null;
    this.pauseButton = null;
    this.pauseLabel = null;
    this.muteButton = null;
    this.muteLabel = null;
    this.prevWeaponButton = null;
    this.prevWeaponLabel = null;
    this.nextWeaponButton = null;
    this.nextWeaponLabel = null;
  }
}

export { TouchOverlay };
export default TouchOverlay;
