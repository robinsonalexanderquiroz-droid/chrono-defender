/**
 * WeaponSwitcher - Handles weapon switching input and HUD feedback.
 *
 * Registers number keys 1-6 for direct weapon selection and uses
 * InputManager's edge-detected E/Q keys for cycling. Plays a click
 * sound on weapon switch and provides edge detection to prevent
 * repeated switching while a key is held.
 */

import Phaser from 'phaser';

import { WEAPON_CYCLE, type WeaponType, WEAPON_DEFS } from '../config/gameplay';
import { audioManager } from '../systems/AudioManager';
import { inputManager } from '../systems/InputManager';
import { weaponManager } from '../systems/WeaponManager';

// ─── Constants ──────────────────────────────────────────────────────────────

/** Key codes for number keys 1-6 mapped to weapon indices */
const NUMBER_KEY_CODES: readonly string[] = [
  'ONE',
  'TWO',
  'THREE',
  'FOUR',
  'FIVE',
  'SIX',
] as const;

// ─── WeaponSwitcher Class ───────────────────────────────────────────────────

class WeaponSwitcher {
  private scene: Phaser.Scene;

  /** Phaser key objects for number keys 1-6 */
  private numberKeys: Phaser.Input.Keyboard.Key[] = [];

  /** Previous pressed state for number keys (edge detection) */
  private numberKeysPrev: boolean[] = [
    false,
    false,
    false,
    false,
    false,
    false,
  ];

  /** Current weapon index in WEAPON_CYCLE */
  private currentIndex = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.registerKeys();
  }

  /**
   * Checks for weapon switch input each frame.
   * Uses edge detection to prevent repeated switching on held keys.
   */
  update(): void {
    // Check number keys 1-6 for direct weapon selection
    for (let i = 0; i < this.numberKeys.length; i++) {
      const key = this.numberKeys[i];
      if (!key) continue;

      const isDown = key.isDown;
      const wasDown = this.numberKeysPrev[i] ?? false;

      // Edge detection: only trigger on press, not hold
      if (isDown && !wasDown) {
        this.selectWeaponByIndex(i);
      }

      this.numberKeysPrev[i] = isDown;
    }

    // Check E/Q via InputManager (already edge-detected)
    if (inputManager.isNextWeapon()) {
      this.cycleNext();
    } else if (inputManager.isPrevWeapon()) {
      this.cyclePrev();
    }
  }

  /**
   * Returns the display name of the currently equipped weapon.
   */
  getCurrentWeaponName(): string {
    const weaponType = weaponManager.getCurrentWeapon();
    return WEAPON_DEFS[weaponType].name;
  }

  /**
   * Resets to the default weapon (first in WEAPON_CYCLE).
   */
  reset(): void {
    this.currentIndex = 0;
    weaponManager.reset();
    this.numberKeysPrev = [false, false, false, false, false, false];
  }

  /**
   * Removes all key listeners and cleans up resources.
   */
  destroy(): void {
    if (this.scene.input.keyboard) {
      for (const key of this.numberKeys) {
        if (key) {
          this.scene.input.keyboard.removeKey(key, true);
        }
      }
    }
    this.numberKeys = [];
    this.numberKeysPrev = [];
  }

  // ─── Private ──────────────────────────────────────────────────────

  private registerKeys(): void {
    if (!this.scene.input.keyboard) return;

    for (const code of NUMBER_KEY_CODES) {
      const key = this.scene.input.keyboard.addKey(
        Phaser.Input.Keyboard.KeyCodes[
          code as keyof typeof Phaser.Input.Keyboard.KeyCodes
        ] as number,
        false,
        false,
      );
      this.numberKeys.push(key);
    }
  }

  private selectWeaponByIndex(index: number): void {
    if (index < 0 || index >= WEAPON_CYCLE.length) return;

    const targetWeapon = WEAPON_CYCLE[index];
    if (targetWeapon === undefined) return;

    const currentWeapon = weaponManager.getCurrentWeapon();
    if (currentWeapon === targetWeapon) return;

    // Cycle weapon manager until we reach the target weapon
    this.setWeaponDirect(targetWeapon, index);
    audioManager.playResume();
  }

  private cycleNext(): void {
    this.currentIndex = (this.currentIndex + 1) % WEAPON_CYCLE.length;
    weaponManager.upgradeWeapon();
    this.currentIndex = this.getWeaponIndex(weaponManager.getCurrentWeapon());
    audioManager.playResume();
  }

  private cyclePrev(): void {
    this.currentIndex =
      (this.currentIndex - 1 + WEAPON_CYCLE.length) % WEAPON_CYCLE.length;

    // WeaponManager only has upgradeWeapon (next), so cycle forward N-1 times
    const stepsForward = WEAPON_CYCLE.length - 1;
    for (let i = 0; i < stepsForward; i++) {
      weaponManager.upgradeWeapon();
    }

    this.currentIndex = this.getWeaponIndex(weaponManager.getCurrentWeapon());
    audioManager.playResume();
  }

  private setWeaponDirect(_target: WeaponType, targetIndex: number): void {
    const currentWeapon = weaponManager.getCurrentWeapon();
    const currentIdx = this.getWeaponIndex(currentWeapon);

    // Calculate how many forward cycles needed to reach target
    const stepsNeeded =
      (targetIndex - currentIdx + WEAPON_CYCLE.length) % WEAPON_CYCLE.length;

    for (let i = 0; i < stepsNeeded; i++) {
      weaponManager.upgradeWeapon();
    }

    this.currentIndex = targetIndex;
  }

  private getWeaponIndex(weapon: WeaponType): number {
    const idx = WEAPON_CYCLE.indexOf(weapon);
    return idx >= 0 ? idx : 0;
  }
}

export { WeaponSwitcher };
export default WeaponSwitcher;
