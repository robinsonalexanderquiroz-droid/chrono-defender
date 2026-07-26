/**
 * InputManager - Unified input abstraction for Chrono Defender.
 *
 * Aggregates keyboard, gamepad, and touch inputs into a single action-state
 * interface that game logic reads each frame. Actions are OR'd across all
 * active input sources. Provides edge-detection (justPressed semantics)
 * for discrete actions like pause and weapon switch.
 * Implements singleton pattern.
 */

import { gamepadManager } from './GamepadManager';
import { touchManager } from './TouchManager';

// ─── Types ──────────────────────────────────────────────────────────────────

/** Discrete actions that support edge-detection (justPressed) */
type DiscreteAction =
  'pause' | 'mute' | 'confirm' | 'back' | 'nextWeapon' | 'prevWeapon';

// ─── InputManager Class ─────────────────────────────────────────────────────

class InputManager {
  private static instance: InputManager | null = null;

  // ── Keyboard state ──
  private keysDown: Set<string> = new Set();
  private keysJustPressed: Set<string> = new Set();
  private keysPrevFrame: Set<string> = new Set();

  // ── Mouse state ──
  private mouseDown = false;

  // ── Discrete action edge detection ──
  private actionStates: Record<DiscreteAction, boolean> = {
    pause: false,
    mute: false,
    confirm: false,
    back: false,
    nextWeapon: false,
    prevWeapon: false,
  };

  private actionPrev: Record<DiscreteAction, boolean> = {
    pause: false,
    mute: false,
    confirm: false,
    back: false,
    nextWeapon: false,
    prevWeapon: false,
  };

  /** Whether event listeners have been attached */
  private listenersAttached = false;

  private constructor() {
    this.attachListeners();
  }

  /** Get the singleton instance */
  static getInstance(): InputManager {
    if (!InputManager.instance) {
      InputManager.instance = new InputManager();
    }
    return InputManager.instance;
  }

  // ─── Public Action State ───────────────────────────────────────────

  /**
   * Horizontal movement axis.
   * @returns value from -1 (left) to 1 (right)
   */
  moveX(): number {
    let x = 0;

    // Keyboard
    if (this.keysDown.has('KeyA') || this.keysDown.has('ArrowLeft')) x -= 1;
    if (this.keysDown.has('KeyD') || this.keysDown.has('ArrowRight')) x += 1;

    // Gamepad
    const gpAxes = gamepadManager.getAxes();
    if (Math.abs(gpAxes.x) > 0) x = Math.max(-1, Math.min(1, x + gpAxes.x));

    // Touch
    const touch = touchManager.getMovement();
    if (Math.abs(touch.x) > 0) x = Math.max(-1, Math.min(1, x + touch.x));

    return Math.max(-1, Math.min(1, x));
  }

  /**
   * Vertical movement axis.
   * @returns value from -1 (up) to 1 (down)
   */
  moveY(): number {
    let y = 0;

    // Keyboard
    if (this.keysDown.has('KeyW') || this.keysDown.has('ArrowUp')) y -= 1;
    if (this.keysDown.has('KeyS') || this.keysDown.has('ArrowDown')) y += 1;

    // Gamepad
    const gpAxes = gamepadManager.getAxes();
    if (Math.abs(gpAxes.y) > 0) y = Math.max(-1, Math.min(1, y + gpAxes.y));

    // Touch
    const touch = touchManager.getMovement();
    if (Math.abs(touch.y) > 0) y = Math.max(-1, Math.min(1, y + touch.y));

    return Math.max(-1, Math.min(1, y));
  }

  /**
   * Whether the fire action is currently active (held).
   */
  isFiring(): boolean {
    return (
      this.mouseDown ||
      gamepadManager.isButtonPressed(0) || // A button
      touchManager.isFiring()
    );
  }

  /**
   * Whether pause was just pressed this frame (edge-triggered).
   */
  isPausePressed(): boolean {
    return this.actionStates.pause;
  }

  /**
   * Whether mute was just pressed this frame (edge-triggered).
   */
  isMutePressed(): boolean {
    return this.actionStates.mute;
  }

  /**
   * Whether confirm was just pressed this frame (edge-triggered).
   */
  isConfirmPressed(): boolean {
    return this.actionStates.confirm;
  }

  /**
   * Whether back was just pressed this frame (edge-triggered).
   */
  isBackPressed(): boolean {
    return this.actionStates.back;
  }

  /**
   * Whether next weapon was just pressed this frame (edge-triggered).
   */
  isNextWeapon(): boolean {
    return this.actionStates.nextWeapon;
  }

  /**
   * Whether previous weapon was just pressed this frame (edge-triggered).
   */
  isPrevWeapon(): boolean {
    return this.actionStates.prevWeapon;
  }

  // ─── Frame Update ─────────────────────────────────────────────────

  /**
   * Called once per frame to poll gamepad/touch and compute edge-detection.
   * Must be called before reading any action state.
   */
  update(): void {
    // Update subsystems
    gamepadManager.update();
    touchManager.update();

    // Compute justPressed for keyboard
    this.keysJustPressed.clear();
    for (const key of this.keysDown) {
      if (!this.keysPrevFrame.has(key)) {
        this.keysJustPressed.add(key);
      }
    }

    // Save previous action states
    this.actionPrev = { ...this.actionStates };

    // Compute discrete action raw state (any source)
    const rawPause =
      this.keysJustPressed.has('Escape') ||
      this.keysJustPressed.has('KeyP') ||
      gamepadManager.isButtonJustPressed(9) || // Start
      touchManager.isPausePressed();

    const rawMute =
      this.keysJustPressed.has('KeyM') ||
      gamepadManager.isButtonJustPressed(3) || // Y
      touchManager.isMutePressed();

    const rawConfirm =
      this.keysJustPressed.has('Enter') ||
      this.keysJustPressed.has('Space') ||
      gamepadManager.isButtonJustPressed(0); // A

    const rawBack =
      this.keysJustPressed.has('Backspace') ||
      gamepadManager.isButtonJustPressed(1); // B

    const rawNextWeapon =
      this.keysJustPressed.has('KeyE') || gamepadManager.isButtonJustPressed(5); // RB

    const rawPrevWeapon =
      this.keysJustPressed.has('KeyQ') || gamepadManager.isButtonJustPressed(4); // LB

    // Edge detection: only true for one frame
    this.actionStates = {
      pause: rawPause && !this.actionPrev.pause,
      mute: rawMute && !this.actionPrev.mute,
      confirm: rawConfirm && !this.actionPrev.confirm,
      back: rawBack && !this.actionPrev.back,
      nextWeapon: rawNextWeapon && !this.actionPrev.nextWeapon,
      prevWeapon: rawPrevWeapon && !this.actionPrev.prevWeapon,
    };

    // Save keyboard state for next frame edge detection
    this.keysPrevFrame = new Set(this.keysDown);
  }

  // ─── Reset ────────────────────────────────────────────────────────

  /**
   * Clears all input state. Useful when transitioning scenes.
   */
  reset(): void {
    this.keysDown.clear();
    this.keysJustPressed.clear();
    this.keysPrevFrame.clear();
    this.mouseDown = false;
    this.actionStates = {
      pause: false,
      mute: false,
      confirm: false,
      back: false,
      nextWeapon: false,
      prevWeapon: false,
    };
    this.actionPrev = { ...this.actionStates };
    gamepadManager.reset();
    touchManager.reset();
  }

  // ─── Event Listeners ──────────────────────────────────────────────

  private attachListeners(): void {
    if (this.listenersAttached) return;
    this.listenersAttached = true;

    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('mouseup', this.onMouseUp);
    window.addEventListener('blur', this.onBlur);
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    // Prevent default for game keys to avoid browser scrolling
    const preventKeys = new Set([
      'ArrowUp',
      'ArrowDown',
      'ArrowLeft',
      'ArrowRight',
      'Space',
    ]);
    if (preventKeys.has(e.code)) {
      e.preventDefault();
    }
    this.keysDown.add(e.code);
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    this.keysDown.delete(e.code);
  };

  private onMouseDown = (e: MouseEvent): void => {
    if (e.button === 0) {
      this.mouseDown = true;
    }
  };

  private onMouseUp = (e: MouseEvent): void => {
    if (e.button === 0) {
      this.mouseDown = false;
    }
  };

  private onBlur = (): void => {
    // Clear all keys when window loses focus
    this.keysDown.clear();
    this.mouseDown = false;
  };
}

/** Singleton instance of InputManager */
export const inputManager = InputManager.getInstance();
export default inputManager;
export { InputManager };
