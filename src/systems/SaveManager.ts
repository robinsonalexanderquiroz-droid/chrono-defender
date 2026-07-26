/**
 * SaveManager - Handles localStorage persistence for Chrono Defender.
 *
 * Saves and loads game statistics and settings. Gracefully degrades when
 * localStorage is unavailable (e.g., private browsing mode in some browsers).
 * Implements singleton pattern.
 */

/** Player settings persisted to storage */
interface GameSettings {
  musicVolume: number;
  sfxVolume: number;
  muted: boolean;
}

/** Complete save data structure */
interface SaveData {
  highScore: number;
  highCombo: number;
  gamesPlayed: number;
  bossesDefeated: number;
  miniBossesDefeated: number;
  settings: GameSettings;
}

/** All game statistics */
interface GameStats {
  highScore: number;
  highCombo: number;
  gamesPlayed: number;
  bossesDefeated: number;
  miniBossesDefeated: number;
}

/** localStorage key for save data */
const STORAGE_KEY = 'chrono-defender-save';

/** Default save data for fresh installs */
const DEFAULT_SAVE_DATA: SaveData = {
  highScore: 0,
  highCombo: 0,
  gamesPlayed: 0,
  bossesDefeated: 0,
  miniBossesDefeated: 0,
  settings: {
    musicVolume: 0.4,
    sfxVolume: 0.6,
    muted: false,
  },
};

class SaveManager {
  private static instance: SaveManager | null = null;

  /** In-memory save data */
  private data: SaveData;

  /** Whether localStorage is available */
  private storageAvailable: boolean;

  private constructor() {
    this.storageAvailable = SaveManager.checkStorageAvailable();
    this.data = this.load();
  }

  /** Get the singleton instance */
  static getInstance(): SaveManager {
    if (!SaveManager.instance) {
      SaveManager.instance = new SaveManager();
    }
    return SaveManager.instance;
  }

  /**
   * Saves the current data to localStorage.
   */
  save(): void {
    if (!this.storageAvailable) return;

    try {
      const serialized = JSON.stringify(this.data);
      localStorage.setItem(STORAGE_KEY, serialized);
    } catch {
      // Storage may be full or write-protected; fail silently
    }
  }

  /**
   * Loads and validates save data from localStorage.
   * Returns default data if loading fails or data is invalid.
   */
  load(): SaveData {
    if (!this.storageAvailable) {
      return {
        ...DEFAULT_SAVE_DATA,
        settings: { ...DEFAULT_SAVE_DATA.settings },
      };
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw === null) {
        return {
          ...DEFAULT_SAVE_DATA,
          settings: { ...DEFAULT_SAVE_DATA.settings },
        };
      }

      const parsed: unknown = JSON.parse(raw);
      return SaveManager.validateSaveData(parsed);
    } catch {
      // Corrupted data; return defaults
      return {
        ...DEFAULT_SAVE_DATA,
        settings: { ...DEFAULT_SAVE_DATA.settings },
      };
    }
  }

  /**
   * Increments the games played counter and saves.
   */
  incrementGamesPlayed(): void {
    this.data.gamesPlayed++;
    this.save();
  }

  /**
   * Increments the bosses defeated counter and saves.
   */
  incrementBossesDefeated(): void {
    this.data.bossesDefeated++;
    this.save();
  }

  /**
   * Increments the mini-bosses defeated counter and saves.
   */
  incrementMiniBossesDefeated(): void {
    this.data.miniBossesDefeated++;
    this.save();
  }

  /**
   * Updates the high score if the provided score is higher.
   *
   * @param score - The new score to compare
   * @returns true if this is a new high score
   */
  updateHighScore(score: number): boolean {
    if (score > this.data.highScore) {
      this.data.highScore = score;
      this.save();
      return true;
    }
    return false;
  }

  /**
   * Updates the high combo if the provided combo is higher.
   *
   * @param combo - The new combo count to compare
   * @returns true if this is a new high combo
   */
  updateHighCombo(combo: number): boolean {
    if (combo > this.data.highCombo) {
      this.data.highCombo = combo;
      this.save();
      return true;
    }
    return false;
  }

  /**
   * Returns all game statistics.
   */
  getStats(): GameStats {
    return {
      highScore: this.data.highScore,
      highCombo: this.data.highCombo,
      gamesPlayed: this.data.gamesPlayed,
      bossesDefeated: this.data.bossesDefeated,
      miniBossesDefeated: this.data.miniBossesDefeated,
    };
  }

  /**
   * Saves game settings.
   *
   * @param settings - The settings to persist
   */
  saveSettings(settings: GameSettings): void {
    this.data.settings = { ...settings };
    this.save();
  }

  /**
   * Returns the current saved settings.
   */
  getSettings(): GameSettings {
    return { ...this.data.settings };
  }

  // ─── Private Helpers ───────────────────────────────────────────────

  /**
   * Checks if localStorage is available and writable.
   */
  private static checkStorageAvailable(): boolean {
    try {
      const testKey = '__chrono_defender_storage_test__';
      localStorage.setItem(testKey, '1');
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validates parsed save data and fills in defaults for missing fields.
   */
  private static validateSaveData(data: unknown): SaveData {
    if (typeof data !== 'object' || data === null) {
      return {
        ...DEFAULT_SAVE_DATA,
        settings: { ...DEFAULT_SAVE_DATA.settings },
      };
    }

    const obj = data as Record<string, unknown>;

    const highScore =
      typeof obj['highScore'] === 'number' && obj['highScore'] >= 0
        ? obj['highScore']
        : DEFAULT_SAVE_DATA.highScore;

    const highCombo =
      typeof obj['highCombo'] === 'number' && obj['highCombo'] >= 0
        ? obj['highCombo']
        : DEFAULT_SAVE_DATA.highCombo;

    const gamesPlayed =
      typeof obj['gamesPlayed'] === 'number' && obj['gamesPlayed'] >= 0
        ? obj['gamesPlayed']
        : DEFAULT_SAVE_DATA.gamesPlayed;

    const bossesDefeated =
      typeof obj['bossesDefeated'] === 'number' && obj['bossesDefeated'] >= 0
        ? obj['bossesDefeated']
        : DEFAULT_SAVE_DATA.bossesDefeated;

    const miniBossesDefeated =
      typeof obj['miniBossesDefeated'] === 'number' &&
      obj['miniBossesDefeated'] >= 0
        ? obj['miniBossesDefeated']
        : DEFAULT_SAVE_DATA.miniBossesDefeated;

    const settings = SaveManager.validateSettings(obj['settings']);

    return {
      highScore,
      highCombo,
      gamesPlayed,
      bossesDefeated,
      miniBossesDefeated,
      settings,
    };
  }

  /**
   * Validates the settings object from parsed save data.
   */
  private static validateSettings(raw: unknown): GameSettings {
    if (typeof raw !== 'object' || raw === null) {
      return { ...DEFAULT_SAVE_DATA.settings };
    }

    const obj = raw as Record<string, unknown>;

    const musicVolume =
      typeof obj['musicVolume'] === 'number' &&
      obj['musicVolume'] >= 0 &&
      obj['musicVolume'] <= 1
        ? obj['musicVolume']
        : DEFAULT_SAVE_DATA.settings.musicVolume;

    const sfxVolume =
      typeof obj['sfxVolume'] === 'number' &&
      obj['sfxVolume'] >= 0 &&
      obj['sfxVolume'] <= 1
        ? obj['sfxVolume']
        : DEFAULT_SAVE_DATA.settings.sfxVolume;

    const muted =
      typeof obj['muted'] === 'boolean'
        ? obj['muted']
        : DEFAULT_SAVE_DATA.settings.muted;

    return { musicVolume, sfxVolume, muted };
  }
}

/** Singleton instance of SaveManager */
export const saveManager = SaveManager.getInstance();
export default saveManager;
export { SaveManager };
export type { GameSettings, GameStats, SaveData };
