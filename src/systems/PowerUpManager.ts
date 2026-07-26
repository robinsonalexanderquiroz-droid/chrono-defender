/**
 * PowerUpManager - Manages power-up drops, active effects, and timers.
 *
 * Uses weighted random selection from POWERUP_DROP_WEIGHTS to determine
 * which power-up to spawn. Tracks active timed effects and their remaining
 * durations. Implements singleton pattern.
 */

import Phaser from 'phaser';

import {
  type PowerUpType,
  POWERUP_DEFS,
  POWERUP_DROP_WEIGHTS,
} from '../config/gameplay';

/** Represents an active timed power-up effect */
interface ActiveEffect {
  /** Remaining duration in ms */
  remaining: number;
  /** Total duration in ms */
  total: number;
}

class PowerUpManager {
  private static instance: PowerUpManager | null = null;

  /** Map of currently active power-up effects and their remaining durations */
  private activeEffects: Map<PowerUpType, ActiveEffect> = new Map();

  /** Pre-computed total weight for weighted random selection */
  private totalWeight: number;

  /** Sorted entries for weighted selection */
  private weightEntries: ReadonlyArray<readonly [PowerUpType, number]>;

  private constructor() {
    const entries = Object.entries(POWERUP_DROP_WEIGHTS) as Array<
      [PowerUpType, number]
    >;
    this.weightEntries = entries.map(
      ([type, weight]) => [type, weight] as const,
    );
    this.totalWeight = entries.reduce((sum, [, weight]) => sum + weight, 0);
  }

  /** Get the singleton instance */
  static getInstance(): PowerUpManager {
    if (!PowerUpManager.instance) {
      PowerUpManager.instance = new PowerUpManager();
    }
    return PowerUpManager.instance;
  }

  /**
   * Attempts to drop a power-up at the given position.
   * Rolls against the drop chance, and if successful, spawns a random power-up.
   *
   * @param scene - The active Phaser scene
   * @param group - Physics group to add the power-up sprite to
   * @param x - Drop X position
   * @param y - Drop Y position
   * @param dropChance - Probability of dropping (0–1)
   * @returns The spawned power-up sprite, or null if the roll failed
   */
  tryDrop(
    _scene: Phaser.Scene,
    group: Phaser.Physics.Arcade.Group,
    x: number,
    y: number,
    dropChance: number,
  ): Phaser.Physics.Arcade.Sprite | null {
    if (Math.random() > dropChance) {
      return null;
    }

    const type = this.selectRandomType();
    const def = POWERUP_DEFS[type];

    const powerUp = group.create(x, y, 'powerup') as
      | Phaser.Physics.Arcade.Sprite
      | undefined;

    if (!powerUp) return null;

    powerUp.setDisplaySize(20, 20);
    powerUp.setData('powerUpType', type);
    powerUp.setData('color', def.color);
    powerUp.setData('symbol', def.symbol);
    powerUp.setData('name', def.name);

    return powerUp;
  }

  /**
   * Applies a collected power-up effect.
   * Instant power-ups (duration 0) trigger their effect immediately.
   * Timed power-ups are added to the active effects map.
   *
   * @param type - The power-up type to apply
   * @param _scene - The active Phaser scene (for potential visual/audio feedback)
   */
  collect(type: PowerUpType, _scene: Phaser.Scene): void {
    const def = POWERUP_DEFS[type];

    if (def.duration === 0) {
      // Instant effects are handled by the caller (scene) based on type
      // This manager just tracks timed effects
      return;
    }

    // For timed effects, add or refresh the active effect
    this.activeEffects.set(type, {
      remaining: def.duration,
      total: def.duration,
    });
  }

  /**
   * Updates all active timed power-up effects.
   * Removes effects that have expired.
   *
   * @param delta - Frame delta time in ms
   */
  update(delta: number): void {
    const expiredKeys: PowerUpType[] = [];

    for (const [type, effect] of this.activeEffects) {
      effect.remaining -= delta;
      if (effect.remaining <= 0) {
        expiredKeys.push(type);
      }
    }

    for (const key of expiredKeys) {
      this.activeEffects.delete(key);
    }
  }

  /**
   * Returns a map of active power-up types and their remaining durations in ms.
   */
  getActiveEffects(): Map<PowerUpType, number> {
    const result = new Map<PowerUpType, number>();
    for (const [type, effect] of this.activeEffects) {
      result.set(type, effect.remaining);
    }
    return result;
  }

  /**
   * Checks whether a specific power-up effect is currently active.
   *
   * @param type - The power-up type to check
   */
  hasEffect(type: PowerUpType): boolean {
    return this.activeEffects.has(type);
  }

  /**
   * Clears all active effects.
   */
  reset(): void {
    this.activeEffects.clear();
  }

  // ─── Private Helpers ───────────────────────────────────────────────

  /**
   * Selects a random power-up type using weighted selection.
   */
  private selectRandomType(): PowerUpType {
    let roll = Math.random() * this.totalWeight;

    for (const [type, weight] of this.weightEntries) {
      roll -= weight;
      if (roll <= 0) {
        return type;
      }
    }

    // Fallback (should not reach here with valid weights)
    return 'health';
  }
}

/** Singleton instance of PowerUpManager */
export const powerUpManager = PowerUpManager.getInstance();
export default powerUpManager;
export { PowerUpManager };
