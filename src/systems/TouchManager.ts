/**
 * TouchManager - Virtual touch controls for Chrono Defender.
 *
 * Tracks touch state for a virtual joystick (left side), fire button (right side),
 * pause button (top-right), and mute button (top-left). Does NOT create DOM
 * elements — only tracks touch positions against defined rectangular hit areas
 * for the InputManager to query. Supports multi-touch.
 * Implements singleton pattern.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

/** A rectangular touch area definition */
interface TouchRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Tracked touch point */
interface TrackedTouch {
  id: number;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

// ─── Constants ──────────────────────────────────────────────────────────────

/** Maximum joystick displacement radius in pixels */
const JOYSTICK_RADIUS = 60;

// ─── TouchManager Class ─────────────────────────────────────────────────────

class TouchManager {
  private static instance: TouchManager | null = null;

  // ── Touch area definitions (normalized 0–1 of screen, converted on use) ──

  /** Left half of lower screen for joystick */
  private joystickArea: TouchRect = { x: 0, y: 0.3, width: 0.4, height: 0.7 };

  /** Right half of lower screen for fire */
  private fireArea: TouchRect = { x: 0.6, y: 0.3, width: 0.4, height: 0.7 };

  /** Top-right corner for pause */
  private pauseArea: TouchRect = { x: 0.85, y: 0, width: 0.15, height: 0.12 };

  /** Top-left corner for mute */
  private muteArea: TouchRect = { x: 0, y: 0, width: 0.15, height: 0.12 };

  // ── State ──

  /** Active touches in the joystick area */
  private joystickTouch: TrackedTouch | null = null;

  /** Whether fire area is currently touched */
  private fireActive = false;

  /** Whether pause was triggered this frame */
  private pauseTriggered = false;

  /** Whether mute was triggered this frame */
  private muteTriggered = false;

  /** Previous frame pause/mute state for edge detection */
  private pauseTouchedPrev = false;
  private muteTouchedPrev = false;

  /** Current pause/mute touched (raw, before edge) */
  private pauseTouched = false;
  private muteTouched = false;

  /** Whether event listeners have been attached */
  private listenersAttached = false;

  /** Cached screen dimensions for coordinate conversion */
  private screenWidth = 960;
  private screenHeight = 540;

  private constructor() {
    this.attachListeners();
    this.updateScreenSize();
  }

  /** Get the singleton instance */
  static getInstance(): TouchManager {
    if (!TouchManager.instance) {
      TouchManager.instance = new TouchManager();
    }
    return TouchManager.instance;
  }

  // ─── State Queries ─────────────────────────────────────────────────

  /**
   * Detects whether the device supports touch input.
   */
  isTouchDevice(): boolean {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  /**
   * Returns the current joystick movement as normalized axes (-1 to 1).
   */
  getMovement(): { x: number; y: number } {
    if (!this.joystickTouch) return { x: 0, y: 0 };

    const dx = this.joystickTouch.currentX - this.joystickTouch.startX;
    const dy = this.joystickTouch.currentY - this.joystickTouch.startY;

    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 5) return { x: 0, y: 0 }; // small dead zone

    const clampedDist = Math.min(dist, JOYSTICK_RADIUS);
    const normalizedDist = clampedDist / JOYSTICK_RADIUS;

    const angle = Math.atan2(dy, dx);
    return {
      x: Math.cos(angle) * normalizedDist,
      y: Math.sin(angle) * normalizedDist,
    };
  }

  /**
   * Whether the fire button area is currently touched.
   */
  isFiring(): boolean {
    return this.fireActive;
  }

  /**
   * Whether the pause button was just pressed this frame (edge-triggered).
   */
  isPausePressed(): boolean {
    return this.pauseTriggered;
  }

  /**
   * Whether the mute button was just pressed this frame (edge-triggered).
   */
  isMutePressed(): boolean {
    return this.muteTriggered;
  }

  // ─── Frame Update ─────────────────────────────────────────────────

  /**
   * Processes touch state for edge detection. Called once per frame.
   */
  update(): void {
    // Edge detection for pause/mute
    this.pauseTriggered = this.pauseTouched && !this.pauseTouchedPrev;
    this.muteTriggered = this.muteTouched && !this.muteTouchedPrev;

    this.pauseTouchedPrev = this.pauseTouched;
    this.muteTouchedPrev = this.muteTouched;

    // Reset one-frame flags
    this.pauseTouched = false;
    this.muteTouched = false;
  }

  // ─── Configuration ─────────────────────────────────────────────────

  /**
   * Sets the joystick touch area (normalized 0–1 coordinates).
   */
  setJoystickArea(rect: TouchRect): void {
    this.joystickArea = { ...rect };
  }

  /**
   * Sets the fire touch area (normalized 0–1 coordinates).
   */
  setFireArea(rect: TouchRect): void {
    this.fireArea = { ...rect };
  }

  /**
   * Sets the pause touch area (normalized 0–1 coordinates).
   */
  setPauseArea(rect: TouchRect): void {
    this.pauseArea = { ...rect };
  }

  /**
   * Sets the mute touch area (normalized 0–1 coordinates).
   */
  setMuteArea(rect: TouchRect): void {
    this.muteArea = { ...rect };
  }

  // ─── Reset ────────────────────────────────────────────────────────

  /**
   * Clears all touch state.
   */
  reset(): void {
    this.joystickTouch = null;
    this.fireActive = false;
    this.pauseTriggered = false;
    this.muteTriggered = false;
    this.pauseTouched = false;
    this.muteTouched = false;
    this.pauseTouchedPrev = false;
    this.muteTouchedPrev = false;
  }

  // ─── Private Helpers ───────────────────────────────────────────────

  /**
   * Converts a normalized rect to pixel coordinates using cached screen size.
   */
  private toPixelRect(rect: TouchRect): {
    x: number;
    y: number;
    w: number;
    h: number;
  } {
    return {
      x: rect.x * this.screenWidth,
      y: rect.y * this.screenHeight,
      w: rect.width * this.screenWidth,
      h: rect.height * this.screenHeight,
    };
  }

  /**
   * Tests if a point is inside a pixel-space rectangle.
   */
  private isInRect(
    px: number,
    py: number,
    rect: { x: number; y: number; w: number; h: number },
  ): boolean {
    return (
      px >= rect.x &&
      px <= rect.x + rect.w &&
      py >= rect.y &&
      py <= rect.y + rect.h
    );
  }

  /**
   * Updates cached screen dimensions.
   */
  private updateScreenSize(): void {
    this.screenWidth = window.innerWidth;
    this.screenHeight = window.innerHeight;
  }

  /**
   * Attaches touch event listeners.
   */
  private attachListeners(): void {
    if (this.listenersAttached) return;
    this.listenersAttached = true;

    window.addEventListener('touchstart', this.onTouchStart, {
      passive: false,
    });
    window.addEventListener('touchmove', this.onTouchMove, { passive: false });
    window.addEventListener('touchend', this.onTouchEnd, { passive: false });
    window.addEventListener('touchcancel', this.onTouchEnd, { passive: false });
    window.addEventListener('resize', this.onResize);
  }

  private onTouchStart = (e: TouchEvent): void => {
    this.updateScreenSize();

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (!touch) continue;

      const px = touch.clientX;
      const py = touch.clientY;

      const joystickPixel = this.toPixelRect(this.joystickArea);
      const firePixel = this.toPixelRect(this.fireArea);
      const pausePixel = this.toPixelRect(this.pauseArea);
      const mutePixel = this.toPixelRect(this.muteArea);

      if (this.isInRect(px, py, pausePixel)) {
        this.pauseTouched = true;
        e.preventDefault();
      } else if (this.isInRect(px, py, mutePixel)) {
        this.muteTouched = true;
        e.preventDefault();
      } else if (this.isInRect(px, py, joystickPixel) && !this.joystickTouch) {
        this.joystickTouch = {
          id: touch.identifier,
          startX: px,
          startY: py,
          currentX: px,
          currentY: py,
        };
        e.preventDefault();
      } else if (this.isInRect(px, py, firePixel)) {
        this.fireActive = true;
        e.preventDefault();
      }
    }
  };

  private onTouchMove = (e: TouchEvent): void => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (!touch) continue;

      if (this.joystickTouch && touch.identifier === this.joystickTouch.id) {
        this.joystickTouch.currentX = touch.clientX;
        this.joystickTouch.currentY = touch.clientY;
        e.preventDefault();
      }
    }
  };

  private onTouchEnd = (e: TouchEvent): void => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (!touch) continue;

      if (this.joystickTouch && touch.identifier === this.joystickTouch.id) {
        this.joystickTouch = null;
      }

      // Check if fire area touch ended
      const firePixel = this.toPixelRect(this.fireArea);
      if (this.isInRect(touch.clientX, touch.clientY, firePixel)) {
        this.fireActive = false;
      }
    }

    // Check if any remaining touches are in fire area
    if (e.touches.length === 0) {
      this.fireActive = false;
    } else {
      let fireStillActive = false;
      const firePixel = this.toPixelRect(this.fireArea);
      for (let i = 0; i < e.touches.length; i++) {
        const t = e.touches[i];
        if (t && this.isInRect(t.clientX, t.clientY, firePixel)) {
          fireStillActive = true;
          break;
        }
      }
      this.fireActive = fireStillActive;
    }
  };

  private onResize = (): void => {
    this.updateScreenSize();
  };
}

/** Singleton instance of TouchManager */
export const touchManager = TouchManager.getInstance();
export default touchManager;
export { TouchManager };
