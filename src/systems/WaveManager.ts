/**
 * WaveManager - Orchestrates wave progression in Chrono Defender.
 *
 * Tracks the current wave number, enemies remaining, and wave state.
 * Determines wave composition, mini-boss and final boss spawning,
 * and transitions between wave phases.
 * Implements singleton pattern.
 */

import {
  getWaveComposition,
  MINI_BOSS_INTERVAL,
  WAVE_CONFIG,
  type WaveComposition,
} from '../config/gameplay';

/** Possible wave states */
type WaveState =
  | 'spawning'
  | 'active'
  | 'intermission'
  | 'miniboss'
  | 'boss'
  | 'complete';

class WaveManager {
  private static instance: WaveManager | null = null;

  /** Current wave number (1-indexed during gameplay, 0 before first wave) */
  private currentWave = 0;

  /** Number of enemies remaining in the current wave */
  private enemiesRemaining = 0;

  /** Total enemies to spawn in the current wave */
  private enemiesToSpawn = 0;

  /** Current wave state */
  private state: WaveState = 'intermission';

  /** The composition data for the current wave */
  private composition: WaveComposition | null = null;

  private constructor() {
    // Private constructor for singleton
  }

  /** Get the singleton instance */
  static getInstance(): WaveManager {
    if (!WaveManager.instance) {
      WaveManager.instance = new WaveManager();
    }
    return WaveManager.instance;
  }

  /**
   * Begins the next wave. Increments the wave counter and calculates
   * the wave composition from config.
   */
  startNextWave(): void {
    this.currentWave++;
    this.composition = getWaveComposition(this.currentWave);
    this.enemiesRemaining = this.composition.enemyCount;
    this.enemiesToSpawn = this.composition.enemyCount;

    // Determine initial state based on wave composition
    if (this.shouldSpawnFinalBoss()) {
      this.state = 'boss';
    } else if (this.shouldSpawnMiniBoss()) {
      this.state = 'miniboss';
    } else {
      this.state = 'spawning';
    }
  }

  /**
   * Called when an enemy is defeated or removed from the wave.
   * Decrements the remaining count and checks for wave completion.
   */
  onEnemyDefeated(): void {
    this.enemiesRemaining = Math.max(0, this.enemiesRemaining - 1);

    if (this.enemiesRemaining === 0 && this.enemiesToSpawn === 0) {
      this.state = 'complete';
    } else if (this.enemiesToSpawn === 0 && this.state === 'spawning') {
      this.state = 'active';
    }
  }

  /**
   * Call when an enemy has been spawned to decrement the spawn counter.
   */
  onEnemySpawned(): void {
    this.enemiesToSpawn = Math.max(0, this.enemiesToSpawn - 1);

    if (this.enemiesToSpawn === 0 && this.state === 'spawning') {
      this.state = 'active';
    }
  }

  /**
   * Sets the wave state to intermission (e.g., between waves).
   */
  setIntermission(): void {
    this.state = 'intermission';
  }

  /**
   * Returns whether the current wave is complete (all enemies defeated).
   */
  isWaveComplete(): boolean {
    return this.state === 'complete';
  }

  /**
   * Returns the current wave number.
   */
  getCurrentWave(): number {
    return this.currentWave;
  }

  /**
   * Returns the current wave state.
   */
  getState(): WaveState {
    return this.state;
  }

  /**
   * Returns the current wave composition, or null if no wave is active.
   */
  getComposition(): WaveComposition | null {
    return this.composition;
  }

  /**
   * Returns the number of enemies remaining in the current wave.
   */
  getEnemiesRemaining(): number {
    return this.enemiesRemaining;
  }

  /**
   * Returns the number of enemies still to be spawned.
   */
  getEnemiesToSpawn(): number {
    return this.enemiesToSpawn;
  }

  /**
   * Checks whether the current wave should spawn a mini-boss.
   * Mini-bosses appear every MINI_BOSS_INTERVAL waves (after wave 1).
   */
  shouldSpawnMiniBoss(): boolean {
    return this.currentWave > 1 && this.currentWave % MINI_BOSS_INTERVAL === 0;
  }

  /**
   * Checks whether the current wave should spawn the final boss.
   */
  shouldSpawnFinalBoss(): boolean {
    return this.currentWave >= WAVE_CONFIG.wavesBeforeFinalBoss;
  }

  /**
   * Resets the wave manager to its initial state (wave 0).
   */
  reset(): void {
    this.currentWave = 0;
    this.enemiesRemaining = 0;
    this.enemiesToSpawn = 0;
    this.state = 'intermission';
    this.composition = null;
  }
}

/** Singleton instance of WaveManager */
export const waveManager = WaveManager.getInstance();
export default waveManager;
export { WaveManager };
export type { WaveState };
