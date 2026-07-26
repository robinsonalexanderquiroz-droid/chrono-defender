/**
 * DifficultyManager - Applies difficulty scaling based on current wave.
 *
 * Uses getDifficultyForWave() from config to calculate scaling parameters,
 * then provides convenience methods for scaling individual values.
 * Implements singleton pattern.
 */

import { type DifficultyParams, getDifficultyForWave } from '../config/gameplay';

class DifficultyManager {
  private static instance: DifficultyManager | null = null;

  /** Current wave number */
  private currentWave = 1;

  /** Cached difficulty parameters for the current wave */
  private params: DifficultyParams;

  private constructor() {
    this.params = getDifficultyForWave(1);
  }

  /** Get the singleton instance */
  static getInstance(): DifficultyManager {
    if (!DifficultyManager.instance) {
      DifficultyManager.instance = new DifficultyManager();
    }
    return DifficultyManager.instance;
  }

  /**
   * Updates the internal difficulty parameters for the given wave.
   *
   * @param wave - The current wave number (1-indexed)
   */
  setWave(wave: number): void {
    this.currentWave = Math.max(1, wave);
    this.params = getDifficultyForWave(this.currentWave);
  }

  /**
   * Returns the current difficulty parameters.
   */
  getParams(): DifficultyParams {
    return { ...this.params };
  }

  /**
   * Scales base enemy HP by the current difficulty multiplier.
   *
   * @param baseHp - The base HP value to scale
   * @returns Scaled HP (rounded up to ensure at least 1 HP)
   */
  scaleEnemyHp(baseHp: number): number {
    return Math.ceil(baseHp * this.params.hpMultiplier);
  }

  /**
   * Scales base enemy speed by the current difficulty multiplier.
   *
   * @param baseSpeed - The base speed value to scale
   * @returns Scaled speed
   */
  scaleEnemySpeed(baseSpeed: number): number {
    return baseSpeed * this.params.speedMultiplier;
  }

  /**
   * Scales base spawn interval by the current difficulty multiplier.
   * Lower multiplier = faster spawns.
   *
   * @param baseInterval - The base spawn interval in ms
   * @returns Scaled interval in ms
   */
  scaleSpawnInterval(baseInterval: number): number {
    return baseInterval * this.params.spawnRateMultiplier;
  }

  /**
   * Scales base projectile speed by the current difficulty multiplier.
   *
   * @param baseSpeed - The base projectile speed
   * @returns Scaled projectile speed
   */
  scaleProjectileSpeed(baseSpeed: number): number {
    return baseSpeed * this.params.projectileSpeedMultiplier;
  }

  /**
   * Returns the current wave number.
   */
  getCurrentWave(): number {
    return this.currentWave;
  }

  /**
   * Resets difficulty to wave 1.
   */
  reset(): void {
    this.currentWave = 1;
    this.params = getDifficultyForWave(1);
  }
}

/** Singleton instance of DifficultyManager */
export const difficultyManager = DifficultyManager.getInstance();
export default difficultyManager;
export { DifficultyManager };
