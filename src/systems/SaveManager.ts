/**
 * SaveManager - Handles localStorage persistence for Chrono Defender.
 *
 * Saves and loads game statistics, settings, leaderboard, and achievement data.
 * Gracefully degrades when localStorage is unavailable (e.g., private browsing).
 * Implements singleton pattern with debounced writes (max once per 500ms).
 * Schema version: 4 — migrates from older schemas preserving stats.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

/** Screen shake intensity options */
export type ScreenShakeLevel = 'off' | 'low' | 'medium' | 'high';

/** Particle effects quality options */
export type ParticleLevel = 'low' | 'medium' | 'high';

/** HUD scale options */
export type HudScale = 'small' | 'medium' | 'large';

/** Difficulty options */
export type DifficultyLevel = 'easy' | 'normal' | 'hard';

/** Aim assist options */
export type AimAssistLevel = 'off' | 'low' | 'medium';

/** Game result type */
export type GameResult = 'victory' | 'gameover';

/** Extended settings persisted to storage */
export interface GameSettings {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  muted: boolean;
  fullscreen: boolean;
  screenShake: ScreenShakeLevel;
  particleEffects: ParticleLevel;
  reducedFlashing: boolean;
  hudScale: HudScale;
  highContrast: boolean;
  difficulty: DifficultyLevel;
  autoFire: boolean;
  pauseOnFocusLoss: boolean;
  vibration: boolean;
  aimAssist: AimAssistLevel;
  reducedMotion: boolean;
}

/** A single leaderboard entry */
export interface LeaderboardEntry {
  score: number;
  wave: number;
  combo: number;
  weapon: string;
  date: string;
  result: GameResult;
}

/** Achievement persistence data for a single achievement */
export interface AchievementPersistData {
  unlocked: boolean;
  unlockedAt?: string;
  progress?: number;
}

/** All game statistics */
export interface GameStats {
  highScore: number;
  highCombo: number;
  gamesPlayed: number;
  bossesDefeated: number;
  miniBossesDefeated: number;
}

/** Complete save data structure (schema v4) */
interface SaveData {
  schemaVersion: number;
  highScore: number;
  highCombo: number;
  gamesPlayed: number;
  bossesDefeated: number;
  miniBossesDefeated: number;
  settings: GameSettings;
  leaderboard: LeaderboardEntry[];
  achievements: Record<string, AchievementPersistData>;
}

// ─── Constants ──────────────────────────────────────────────────────────────

/** Current schema version */
const SCHEMA_VERSION = 4;

/** localStorage key for save data */
const STORAGE_KEY = 'chrono-defender-save';

/** Maximum leaderboard entries to retain */
const MAX_LEADERBOARD_ENTRIES = 10;

/** Debounce interval for saves (ms) */
const SAVE_DEBOUNCE_MS = 500;

/** Default settings for fresh installs */
const DEFAULT_SETTINGS: GameSettings = {
  masterVolume: 0.8,
  musicVolume: 0.4,
  sfxVolume: 0.6,
  muted: false,
  fullscreen: false,
  screenShake: 'medium',
  particleEffects: 'medium',
  reducedFlashing: false,
  hudScale: 'medium',
  highContrast: false,
  difficulty: 'normal',
  autoFire: false,
  pauseOnFocusLoss: true,
  vibration: true,
  aimAssist: 'off',
  reducedMotion: false,
};

/** Default save data for fresh installs */
const DEFAULT_SAVE_DATA: SaveData = {
  schemaVersion: SCHEMA_VERSION,
  highScore: 0,
  highCombo: 0,
  gamesPlayed: 0,
  bossesDefeated: 0,
  miniBossesDefeated: 0,
  settings: { ...DEFAULT_SETTINGS },
  leaderboard: [],
  achievements: {},
};

// ─── SaveManager Class ──────────────────────────────────────────────────────

class SaveManager {
  private static instance: SaveManager | null = null;

  /** In-memory save data */
  private data: SaveData;

  /** Whether localStorage is available */
  private storageAvailable: boolean;

  /** Debounce timer ID for save operations */
  private saveTimerId: ReturnType<typeof setTimeout> | null = null;

  /** Whether a save is pending (debounced) */
  private savePending = false;

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

  // ─── Save / Load ────────────────────────────────────────────────────

  /**
   * Schedules a debounced save to localStorage.
   * Actual write happens at most once per 500ms.
   */
  save(): void {
    if (!this.storageAvailable) return;

    this.savePending = true;

    if (this.saveTimerId !== null) return;

    this.saveTimerId = setTimeout(() => {
      this.flushSave();
      this.saveTimerId = null;
    }, SAVE_DEBOUNCE_MS);
  }

  /**
   * Forces an immediate save, bypassing debounce.
   * Useful before page unload.
   */
  saveImmediate(): void {
    if (!this.storageAvailable) return;
    if (this.saveTimerId !== null) {
      clearTimeout(this.saveTimerId);
      this.saveTimerId = null;
    }
    this.flushSave();
  }

  /**
   * Loads and validates save data from localStorage.
   * Returns default data if loading fails or data is invalid.
   */
  load(): SaveData {
    if (!this.storageAvailable) {
      return SaveManager.cloneDefaults();
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw === null) {
        return SaveManager.cloneDefaults();
      }

      const parsed: unknown = JSON.parse(raw);
      return SaveManager.migrateAndValidate(parsed);
    } catch {
      // Corrupted JSON; return defaults
      return SaveManager.cloneDefaults();
    }
  }

  // ─── Stats (backward compatible) ───────────────────────────────────

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

  // ─── Settings ──────────────────────────────────────────────────────

  /**
   * Saves game settings (full replacement).
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

  /**
   * Updates a single setting key.
   */
  updateSetting<K extends keyof GameSettings>(
    key: K,
    value: GameSettings[K],
  ): void {
    this.data.settings[key] = value;
    this.save();
  }

  // ─── Leaderboard ──────────────────────────────────────────────────

  /**
   * Adds a score entry to the leaderboard.
   * Maintains the top 10, sorted descending by score.
   */
  addScore(entry: LeaderboardEntry): void {
    this.data.leaderboard.push(entry);
    this.data.leaderboard.sort((a, b) => b.score - a.score);
    this.data.leaderboard = this.data.leaderboard.slice(
      0,
      MAX_LEADERBOARD_ENTRIES,
    );
    this.save();
  }

  /**
   * Returns the leaderboard sorted by score descending.
   */
  getLeaderboard(): LeaderboardEntry[] {
    return [...this.data.leaderboard];
  }

  /**
   * Clears only the leaderboard data.
   */
  clearLeaderboard(): void {
    this.data.leaderboard = [];
    this.save();
  }

  // ─── Achievements ─────────────────────────────────────────────────

  /**
   * Returns achievement persistence data for a given ID.
   */
  getAchievementData(id: string): AchievementPersistData | undefined {
    return this.data.achievements[id];
  }

  /**
   * Sets achievement persistence data for a given ID.
   */
  setAchievementData(id: string, data: AchievementPersistData): void {
    this.data.achievements[id] = data;
    this.save();
  }

  /**
   * Clears all achievement data.
   */
  clearAchievements(): void {
    this.data.achievements = {};
    this.save();
  }

  /**
   * Returns the full achievements record.
   */
  getAllAchievementData(): Record<string, AchievementPersistData> {
    return { ...this.data.achievements };
  }

  // ─── Reset ─────────────────────────────────────────────────────────

  /**
   * Resets all persisted data to defaults (stats, leaderboard, achievements, settings).
   */
  resetAllData(): void {
    this.data = SaveManager.cloneDefaults();
    this.saveImmediate();
  }

  // ─── Private Helpers ───────────────────────────────────────────────

  /**
   * Performs the actual write to localStorage.
   */
  private flushSave(): void {
    if (!this.savePending) return;
    this.savePending = false;

    try {
      const serialized = JSON.stringify(this.data);
      localStorage.setItem(STORAGE_KEY, serialized);
    } catch {
      // Storage may be full or write-protected; fail silently
    }
  }

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
   * Deep-clones the default save data structure.
   */
  private static cloneDefaults(): SaveData {
    return {
      ...DEFAULT_SAVE_DATA,
      settings: { ...DEFAULT_SETTINGS },
      leaderboard: [],
      achievements: {},
    };
  }

  /**
   * Migrates old schema data to the current version and validates fields.
   */
  private static migrateAndValidate(raw: unknown): SaveData {
    if (typeof raw !== 'object' || raw === null) {
      return SaveManager.cloneDefaults();
    }

    const obj = raw as Record<string, unknown>;

    // Determine source schema version
    const sourceVersion =
      typeof obj['schemaVersion'] === 'number' ? obj['schemaVersion'] : 1;

    // Extract stats (preserved across all migrations)
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

    // Migrate settings
    const settings = SaveManager.migrateSettings(
      obj['settings'],
      sourceVersion,
    );

    // Migrate leaderboard (added in schema v4)
    const leaderboard = SaveManager.validateLeaderboard(obj['leaderboard']);

    // Migrate achievements (added in schema v4)
    const achievements = SaveManager.validateAchievements(obj['achievements']);

    return {
      schemaVersion: SCHEMA_VERSION,
      highScore,
      highCombo,
      gamesPlayed,
      bossesDefeated,
      miniBossesDefeated,
      settings,
      leaderboard,
      achievements,
    };
  }

  /**
   * Migrates settings from any schema version to the current format.
   * Preserves valid values from older schemas and fills defaults for new fields.
   */
  private static migrateSettings(
    raw: unknown,
    _sourceVersion: number,
  ): GameSettings {
    if (typeof raw !== 'object' || raw === null) {
      return { ...DEFAULT_SETTINGS };
    }

    const obj = raw as Record<string, unknown>;

    const clampVolume = (v: unknown, fallback: number): number => {
      if (typeof v === 'number' && v >= 0 && v <= 1) return v;
      return fallback;
    };

    const validScreenShake = (v: unknown): ScreenShakeLevel => {
      if (v === 'off' || v === 'low' || v === 'medium' || v === 'high')
        return v;
      return DEFAULT_SETTINGS.screenShake;
    };

    const validParticle = (v: unknown): ParticleLevel => {
      if (v === 'low' || v === 'medium' || v === 'high') return v;
      return DEFAULT_SETTINGS.particleEffects;
    };

    const validHudScale = (v: unknown): HudScale => {
      if (v === 'small' || v === 'medium' || v === 'large') return v;
      return DEFAULT_SETTINGS.hudScale;
    };

    const validDifficulty = (v: unknown): DifficultyLevel => {
      if (v === 'easy' || v === 'normal' || v === 'hard') return v;
      return DEFAULT_SETTINGS.difficulty;
    };

    const validAimAssist = (v: unknown): AimAssistLevel => {
      if (v === 'off' || v === 'low' || v === 'medium') return v;
      return DEFAULT_SETTINGS.aimAssist;
    };

    const validBool = (v: unknown, fallback: boolean): boolean => {
      if (typeof v === 'boolean') return v;
      return fallback;
    };

    return {
      masterVolume: clampVolume(
        obj['masterVolume'],
        DEFAULT_SETTINGS.masterVolume,
      ),
      musicVolume: clampVolume(
        obj['musicVolume'],
        DEFAULT_SETTINGS.musicVolume,
      ),
      sfxVolume: clampVolume(obj['sfxVolume'], DEFAULT_SETTINGS.sfxVolume),
      muted: validBool(obj['muted'], DEFAULT_SETTINGS.muted),
      fullscreen: validBool(obj['fullscreen'], DEFAULT_SETTINGS.fullscreen),
      screenShake: validScreenShake(obj['screenShake']),
      particleEffects: validParticle(obj['particleEffects']),
      reducedFlashing: validBool(
        obj['reducedFlashing'],
        DEFAULT_SETTINGS.reducedFlashing,
      ),
      hudScale: validHudScale(obj['hudScale']),
      highContrast: validBool(
        obj['highContrast'],
        DEFAULT_SETTINGS.highContrast,
      ),
      difficulty: validDifficulty(obj['difficulty']),
      autoFire: validBool(obj['autoFire'], DEFAULT_SETTINGS.autoFire),
      pauseOnFocusLoss: validBool(
        obj['pauseOnFocusLoss'],
        DEFAULT_SETTINGS.pauseOnFocusLoss,
      ),
      vibration: validBool(obj['vibration'], DEFAULT_SETTINGS.vibration),
      aimAssist: validAimAssist(obj['aimAssist']),
      reducedMotion: validBool(
        obj['reducedMotion'],
        DEFAULT_SETTINGS.reducedMotion,
      ),
    };
  }

  /**
   * Validates and extracts leaderboard data from raw storage.
   */
  private static validateLeaderboard(raw: unknown): LeaderboardEntry[] {
    if (!Array.isArray(raw)) return [];

    const entries: LeaderboardEntry[] = [];

    for (const item of raw) {
      if (typeof item !== 'object' || item === null) continue;
      const entry = item as Record<string, unknown>;

      if (
        typeof entry['score'] !== 'number' ||
        typeof entry['wave'] !== 'number' ||
        typeof entry['combo'] !== 'number' ||
        typeof entry['weapon'] !== 'string' ||
        typeof entry['date'] !== 'string' ||
        (entry['result'] !== 'victory' && entry['result'] !== 'gameover')
      ) {
        continue;
      }

      entries.push({
        score: entry['score'],
        wave: entry['wave'],
        combo: entry['combo'],
        weapon: entry['weapon'],
        date: entry['date'],
        result: entry['result'],
      });
    }

    return entries
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_LEADERBOARD_ENTRIES);
  }

  /**
   * Validates and extracts achievement data from raw storage.
   */
  private static validateAchievements(
    raw: unknown,
  ): Record<string, AchievementPersistData> {
    if (typeof raw !== 'object' || raw === null) return {};

    const result: Record<string, AchievementPersistData> = {};
    const obj = raw as Record<string, unknown>;

    for (const key of Object.keys(obj)) {
      const val = obj[key];
      if (typeof val !== 'object' || val === null) continue;

      const entry = val as Record<string, unknown>;
      if (typeof entry['unlocked'] !== 'boolean') continue;

      const data: AchievementPersistData = {
        unlocked: entry['unlocked'],
      };

      if (typeof entry['unlockedAt'] === 'string') {
        data.unlockedAt = entry['unlockedAt'];
      }
      if (typeof entry['progress'] === 'number') {
        data.progress = entry['progress'];
      }

      result[key] = data;
    }

    return result;
  }
}

/** Singleton instance of SaveManager */
export const saveManager = SaveManager.getInstance();
export default saveManager;
export { SaveManager };
export type { SaveData };
