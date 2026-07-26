/**
 * GamepadManager - Browser Gamepad API abstraction for Chrono Defender.
 *
 * Detects gamepad connect/disconnect, polls analog sticks and buttons,
 * applies dead zones, and provides edge-detection for button presses.
 * Standard mapping: left stick/dpad = move, A = fire/confirm, B = back,
 * Start = pause, bumpers = weapon switch, Y = mute.
 * Implements singleton pattern.
 */

// ─── Constants ──────────────────────────────────────────────────────────────

/** Default analog dead zone threshold (0–1) */
const DEFAULT_DEAD_ZONE = 0.2;

/** Standard gamepad button indices (standard mapping) */
const BUTTON = {
  /** A / Cross — fire, confirm */
  A: 0,
  /** B / Circle — back */
  B: 1,
  /** X / Square */
  X: 2,
  /** Y / Triangle — mute */
  Y: 3,
  /** Left Bumper — prev weapon */
  LB: 4,
  /** Right Bumper — next weapon */
  RB: 5,
  /** Left Trigger */
  LT: 6,
  /** Right Trigger */
  RT: 7,
  /** Back / Select */
  BACK: 8,
  /** Start — pause */
  START: 9,
  /** Left Stick Press */
  LS: 10,
  /** Right Stick Press */
  RS: 11,
  /** D-Pad Up */
  DPAD_UP: 12,
  /** D-Pad Down */
  DPAD_DOWN: 13,
  /** D-Pad Left */
  DPAD_LEFT: 14,
  /** D-Pad Right */
  DPAD_RIGHT: 15,
} as const;

// ─── GamepadManager Class ───────────────────────────────────────────────────

class GamepadManager {
  private static instance: GamepadManager | null = null;

  /** Configurable dead zone for analog sticks */
  private deadZone: number = DEFAULT_DEAD_ZONE;

  /** Current button pressed state (indexed by button number) */
  private buttonsPressed: boolean[] = [];

  /** Previous frame button state for edge detection */
  private buttonsPrev: boolean[] = [];

  /** Current analog axes (left stick) */
  private axes: { x: number; y: number } = { x: 0, y: 0 };

  /** Whether a gamepad is currently connected */
  private connected = false;

  /** Pending connection notification message */
  private connectionNotification: string | null = null;

  /** Whether listeners are attached */
  private listenersAttached = false;

  private constructor() {
    this.attachListeners();
  }

  /** Get the singleton instance */
  static getInstance(): GamepadManager {
    if (!GamepadManager.instance) {
      GamepadManager.instance = new GamepadManager();
    }
    return GamepadManager.instance;
  }

  // ─── Configuration ─────────────────────────────────────────────────

  /**
   * Sets the analog dead zone threshold.
   * Values below this are treated as zero.
   *
   * @param value - Dead zone threshold (0–1)
   */
  setDeadZone(value: number): void {
    this.deadZone = Math.max(0, Math.min(1, value));
  }

  /**
   * Returns the current dead zone value.
   */
  getDeadZone(): number {
    return this.deadZone;
  }

  // ─── State Queries ─────────────────────────────────────────────────

  /**
   * Whether a gamepad is currently connected.
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Returns the current left stick axes with dead zone applied.
   * Values are normalized between -1 and 1.
   */
  getAxes(): { x: number; y: number } {
    return { ...this.axes };
  }

  /**
   * Whether a button is currently held down.
   *
   * @param button - Button index (use BUTTON constants)
   */
  isButtonPressed(button: number): boolean {
    return this.buttonsPressed[button] ?? false;
  }

  /**
   * Whether a button was just pressed this frame (edge-triggered).
   *
   * @param button - Button index (use BUTTON constants)
   */
  isButtonJustPressed(button: number): boolean {
    const current = this.buttonsPressed[button] ?? false;
    const prev = this.buttonsPrev[button] ?? false;
    return current && !prev;
  }

  /**
   * Returns and clears a pending connection notification string.
   * Returns null if no notification is pending.
   */
  getConnectionNotification(): string | null {
    const msg = this.connectionNotification;
    this.connectionNotification = null;
    return msg;
  }

  // ─── Frame Update ─────────────────────────────────────────────────

  /**
   * Polls the gamepad state. Must be called once per frame.
   */
  update(): void {
    // Save previous button state
    this.buttonsPrev = [...this.buttonsPressed];

    // Get gamepads
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    let activeGamepad: Gamepad | null = null;

    for (const gp of gamepads) {
      if (gp && gp.connected) {
        activeGamepad = gp;
        break;
      }
    }

    if (!activeGamepad) {
      // No gamepad connected — zero out state
      this.buttonsPressed = [];
      this.axes = { x: 0, y: 0 };
      return;
    }

    // Read buttons
    this.buttonsPressed = activeGamepad.buttons.map((btn) => btn.pressed);

    // Read left stick axes (indices 0, 1)
    const rawX = activeGamepad.axes[0] ?? 0;
    const rawY = activeGamepad.axes[1] ?? 0;

    // Apply dead zone
    this.axes = {
      x: this.applyDeadZone(rawX),
      y: this.applyDeadZone(rawY),
    };

    // D-Pad overrides (digital input mapped to axes)
    if (this.buttonsPressed[BUTTON.DPAD_LEFT]) this.axes.x = -1;
    if (this.buttonsPressed[BUTTON.DPAD_RIGHT]) this.axes.x = 1;
    if (this.buttonsPressed[BUTTON.DPAD_UP]) this.axes.y = -1;
    if (this.buttonsPressed[BUTTON.DPAD_DOWN]) this.axes.y = 1;
  }

  // ─── Reset ────────────────────────────────────────────────────────

  /**
   * Clears all gamepad state.
   */
  reset(): void {
    this.buttonsPressed = [];
    this.buttonsPrev = [];
    this.axes = { x: 0, y: 0 };
  }

  // ─── Private Helpers ───────────────────────────────────────────────

  /**
   * Applies dead zone to an axis value.
   * Returns 0 if within dead zone, otherwise rescales to 0–1 range.
   */
  private applyDeadZone(value: number): number {
    if (Math.abs(value) < this.deadZone) return 0;

    // Rescale so the usable range starts at 0 after the dead zone
    const sign = value > 0 ? 1 : -1;
    const rescaled = (Math.abs(value) - this.deadZone) / (1 - this.deadZone);
    return sign * Math.min(1, rescaled);
  }

  /**
   * Attaches browser gamepad connection events.
   */
  private attachListeners(): void {
    if (this.listenersAttached) return;
    this.listenersAttached = true;

    window.addEventListener('gamepadconnected', this.onGamepadConnected);
    window.addEventListener('gamepaddisconnected', this.onGamepadDisconnected);
  }

  private onGamepadConnected = (e: GamepadEvent): void => {
    this.connected = true;
    this.connectionNotification = `Gamepad connected: ${e.gamepad.id}`;
  };

  private onGamepadDisconnected = (_e: GamepadEvent): void => {
    // Check if any gamepad is still connected
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    let anyConnected = false;
    for (const gp of gamepads) {
      if (gp && gp.connected) {
        anyConnected = true;
        break;
      }
    }
    this.connected = anyConnected;

    if (!this.connected) {
      this.connectionNotification = 'Gamepad disconnected';
      this.reset();
    }
  };
}

/** Singleton instance of GamepadManager */
export const gamepadManager = GamepadManager.getInstance();
export default gamepadManager;
export { GamepadManager, BUTTON };
