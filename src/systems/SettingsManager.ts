/**
 * SettingsManager - Type-safe settings access for Chrono Defender.
 *
 * Wraps SaveManager's extended settings with type-safe get/set,
 * default restoration, change notifications, and an applyAll() method
 * that propagates current settings to AudioManager and other systems.
 * Implements singleton pattern.
 */

import { audioManager } from './AudioManager';
import { saveManager } from './SaveManager';
import type {
  AimAssistLevel,
  DifficultyLevel,
  GameSettings,
  HudScale,
  ParticleLevel,
  ScreenShakeLevel,
} from './SaveManager';

// ─── Types ──────────────────────────────────────────────────────────────────

/** Callback invoked when a setting changes */
export type SettingsChangeCallback = (
  key: keyof GameSettings,
  value: GameSettings[keyof GameSettings],
) => void;

// ─── Defaults ───────────────────────────────────────────────────────────────

/** Default values for every setting */
const DEFAULT_SETTINGS: Readonly<GameSettings> = {
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
} as const;

// ─── SettingsManager Class ──────────────────────────────────────────────────

class SettingsManager {
  private static instance: SettingsManager | null = null;

  /** Change listeners */
  private listeners: SettingsChangeCallback[] = [];

  private constructor() {
    // Settings are stored in SaveManager — no local state needed
  }

  /** Get the singleton instance */
  static getInstance(): SettingsManager {
    if (!SettingsManager.instance) {
      SettingsManager.instance = new SettingsManager();
    }
    return SettingsManager.instance;
  }

  // ─── Typed Accessors ───────────────────────────────────────────────

  /**
   * Gets the value of a single setting.
   *
   * @param key - The setting key
   * @returns The current value for that setting
   */
  get<K extends keyof GameSettings>(key: K): GameSettings[K] {
    const settings = saveManager.getSettings();
    return settings[key];
  }

  /**
   * Sets the value of a single setting, persists, and notifies listeners.
   *
   * @param key - The setting key
   * @param value - The new value
   */
  set<K extends keyof GameSettings>(key: K, value: GameSettings[K]): void {
    saveManager.updateSetting(key, value);
    this.notifyListeners(key, value);
  }

  /**
   * Returns a copy of all current settings.
   */
  getAll(): GameSettings {
    return saveManager.getSettings();
  }

  /**
   * Restores all settings to their defaults and persists.
   */
  reset(): void {
    saveManager.saveSettings({ ...DEFAULT_SETTINGS });

    // Notify all keys changed
    for (const key of Object.keys(DEFAULT_SETTINGS) as Array<
      keyof GameSettings
    >) {
      this.notifyListeners(key, DEFAULT_SETTINGS[key]);
    }
  }

  /**
   * Returns the default settings object (for reference or comparison).
   */
  getDefaults(): Readonly<GameSettings> {
    return DEFAULT_SETTINGS;
  }

  // ─── Apply ────────────────────────────────────────────────────────

  /**
   * Applies current settings to all relevant systems.
   * Call after loading settings or when settings change in bulk.
   */
  applyAll(): void {
    const s = saveManager.getSettings();

    // Audio
    audioManager.setMusicVolume(s.musicVolume * s.masterVolume);
    audioManager.setSfxVolume(s.sfxVolume * s.masterVolume);

    // Mute state
    const currentlyMuted = audioManager.isMuted();
    if (s.muted !== currentlyMuted) {
      audioManager.toggleMute();
    }
  }

  // ─── Events ───────────────────────────────────────────────────────

  /**
   * Registers a callback to be invoked when any setting changes.
   *
   * @param callback - Function called with (key, newValue)
   */
  onChanged(callback: SettingsChangeCallback): void {
    this.listeners.push(callback);
  }

  /**
   * Removes a previously registered change callback.
   *
   * @param callback - The callback to remove
   */
  offChanged(callback: SettingsChangeCallback): void {
    this.listeners = this.listeners.filter((cb) => cb !== callback);
  }

  // ─── Private ──────────────────────────────────────────────────────

  /**
   * Notifies all registered listeners of a setting change.
   */
  private notifyListeners(
    key: keyof GameSettings,
    value: GameSettings[keyof GameSettings],
  ): void {
    for (const listener of this.listeners) {
      listener(key, value);
    }
  }
}

/** Singleton instance of SettingsManager */
export const settingsManager = SettingsManager.getInstance();
export default settingsManager;
export { SettingsManager, DEFAULT_SETTINGS };
export type {
  AimAssistLevel,
  DifficultyLevel,
  GameSettings,
  HudScale,
  ParticleLevel,
  ScreenShakeLevel,
};
