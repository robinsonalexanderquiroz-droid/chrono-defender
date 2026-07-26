/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Browser API mocks ──────────────────────────────────────────────────────
// Must be established before the module is imported. vi.hoisted runs
// before any import statements are evaluated by vitest.

vi.hoisted(() => {
  Object.defineProperty(globalThis, 'window', {
    value: {
      addEventListener: () => {},
      removeEventListener: () => {},
    },
    writable: true,
    configurable: true,
  });
  Object.defineProperty(globalThis, 'navigator', {
    value: { getGamepads: () => [] },
    writable: true,
    configurable: true,
  });
});

import { GamepadManager } from '../../src/systems/GamepadManager';

// ─── Helper to reset singleton ──────────────────────────────────────────────

function resetSingleton(): void {
  (GamepadManager as unknown as { instance: null }).instance = null;
}

function setNavigator(nav: any): void {
  Object.defineProperty(globalThis, 'navigator', {
    value: nav,
    writable: true,
    configurable: true,
  });
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('GamepadManager', () => {
  let gm: GamepadManager;

  beforeEach(() => {
    resetSingleton();
    setNavigator({ getGamepads: () => [] });
    gm = GamepadManager.getInstance();
  });

  describe('applyDeadZone', () => {
    it('returns 0 within dead zone', () => {
      const applyDeadZone = (
        gm as unknown as { applyDeadZone: (v: number) => number }
      ).applyDeadZone.bind(gm);

      expect(applyDeadZone(0.0)).toBe(0);
      expect(applyDeadZone(0.1)).toBe(0);
      expect(applyDeadZone(0.19)).toBe(0);
      expect(applyDeadZone(-0.1)).toBe(0);
      expect(applyDeadZone(-0.19)).toBe(0);
    });

    it('rescales values outside dead zone correctly', () => {
      const applyDeadZone = (
        gm as unknown as { applyDeadZone: (v: number) => number }
      ).applyDeadZone.bind(gm);

      // Dead zone = 0.2, value 0.6:
      // rescaled = (0.6 - 0.2) / (1 - 0.2) = 0.5
      expect(applyDeadZone(0.6)).toBeCloseTo(0.5, 5);

      // Value 1.0: rescaled = 0.8 / 0.8 = 1.0
      expect(applyDeadZone(1.0)).toBeCloseTo(1.0, 5);

      // Negative: -0.6 => -0.5
      expect(applyDeadZone(-0.6)).toBeCloseTo(-0.5, 5);

      // Boundary: abs(0.2) < 0.2 is false, so rescale = 0/0.8 = 0
      expect(applyDeadZone(0.2)).toBeCloseTo(0, 5);

      // Slightly above: 0.21 => 0.01/0.8 = 0.0125
      expect(applyDeadZone(0.21)).toBeCloseTo(0.0125, 3);
    });
  });

  it('isConnected() is false initially', () => {
    expect(gm.isConnected()).toBe(false);
  });

  it('getAxes() returns {x:0, y:0} when no gamepad', () => {
    gm.update();
    expect(gm.getAxes()).toEqual({ x: 0, y: 0 });
  });

  it('reset() clears button state', () => {
    const mockGamepad = {
      connected: true,
      buttons: Array.from({ length: 16 }, () => ({
        pressed: true,
        value: 1,
      })),
      axes: [0.5, -0.3, 0, 0],
    };
    setNavigator({ getGamepads: () => [mockGamepad] });

    gm.update();
    expect(gm.isButtonPressed(0)).toBe(true);

    gm.reset();
    expect(gm.isButtonPressed(0)).toBe(false);
    expect(gm.getAxes()).toEqual({ x: 0, y: 0 });
  });
});
