/**
 * ScoreManager - Manages scoring with combo system for Chrono Defender.
 *
 * Tracks score, combo multiplier, and high score. Provides floating
 * score popup data for visual display. High score is persisted via SaveManager.
 * Implements singleton pattern.
 */

import { SCORE_CONFIG } from '../config/gameplay';
import { saveManager } from './SaveManager';

/** Floating score popup for UI display */
interface ScorePopup {
  /** Text to display (e.g., "+200 x3") */
  text: string;
  /** X position where the popup originated */
  x: number;
  /** Y position where the popup originated */
  y: number;
  /** Age of the popup in ms (for fade/removal) */
  age: number;
}

/** Maximum age for score popups before they are removed (ms) */
const POPUP_MAX_AGE = 1500;

class ScoreManager {
  private static instance: ScoreManager | null = null;

  /** Current score */
  private score = 0;

  /** Current combo count (consecutive kills within timeout) */
  private combo = 0;

  /** Time remaining before combo resets (ms) */
  private comboTimer = 0;

  /** Session high score (loaded from SaveManager) */
  private highScore = 0;

  /** Active floating score popups */
  private popups: ScorePopup[] = [];

  private constructor() {
    this.highScore = saveManager.getStats().highScore;
  }

  /** Get the singleton instance */
  static getInstance(): ScoreManager {
    if (!ScoreManager.instance) {
      ScoreManager.instance = new ScoreManager();
    }
    return ScoreManager.instance;
  }

  /**
   * Adds a kill score with combo multiplier applied.
   * Extends the combo timer.
   *
   * @param baseScore - Base score value for the killed enemy
   * @param x - X position for score popup (defaults to 0)
   * @param y - Y position for score popup (defaults to 0)
   */
  addKill(baseScore: number, x = 0, y = 0): void {
    this.combo++;
    this.comboTimer = SCORE_CONFIG.comboTimeout;

    const multiplier = this.getMultiplier();
    const points = Math.round(baseScore * multiplier);
    this.score += points;

    // Update high score
    if (this.score > this.highScore) {
      this.highScore = this.score;
    }

    // Create popup
    const comboText = multiplier > 1 ? ` x${multiplier.toFixed(1)}` : '';
    this.popups.push({
      text: `+${points}${comboText}`,
      x,
      y,
      age: 0,
    });
  }

  /**
   * Adds a flat bonus score (wave clear, boss defeat, etc.).
   *
   * @param amount - Bonus amount to add
   * @param label - Label for the popup display
   * @param x - X position for score popup (defaults to 0)
   * @param y - Y position for score popup (defaults to 0)
   */
  addBonus(amount: number, label: string, x = 0, y = 0): void {
    this.score += amount;

    // Update high score
    if (this.score > this.highScore) {
      this.highScore = this.score;
    }

    this.popups.push({
      text: `${label} +${amount}`,
      x,
      y,
      age: 0,
    });
  }

  /**
   * Updates the combo timer and score popups.
   * Resets combo when the timer expires.
   *
   * @param delta - Frame delta time in ms
   */
  update(delta: number): void {
    // Update combo timer
    if (this.comboTimer > 0) {
      this.comboTimer -= delta;
      if (this.comboTimer <= 0) {
        this.comboTimer = 0;
        this.combo = 0;
      }
    }

    // Update popup ages and remove expired
    const activePopups: ScorePopup[] = [];
    for (const popup of this.popups) {
      popup.age += delta;
      if (popup.age < POPUP_MAX_AGE) {
        activePopups.push(popup);
      }
    }
    this.popups = activePopups;
  }

  /**
   * Returns the current score.
   */
  getScore(): number {
    return this.score;
  }

  /**
   * Returns the current combo count.
   */
  getCombo(): number {
    return this.combo;
  }

  /**
   * Returns the current score multiplier based on combo level.
   * Multiplier increases by comboMultiplierStep per combo level, capped at maxComboMultiplier.
   */
  getMultiplier(): number {
    if (this.combo <= 1) return 1;
    const multiplier = 1 + (this.combo - 1) * SCORE_CONFIG.comboMultiplierStep;
    return Math.min(multiplier, SCORE_CONFIG.maxComboMultiplier);
  }

  /**
   * Returns the high score (session or persisted).
   */
  getHighScore(): number {
    return this.highScore;
  }

  /**
   * Returns recent score popups for floating display.
   */
  getRecentPopups(): ReadonlyArray<ScorePopup> {
    return this.popups;
  }

  /**
   * Resets score and combo for a new game.
   * Preserves the high score. Persists high score via SaveManager.
   */
  reset(): void {
    // Persist high score before reset
    if (this.highScore > 0) {
      saveManager.updateHighScore(this.highScore);
    }
    if (this.combo > 0) {
      saveManager.updateHighCombo(this.combo);
    }

    this.score = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.popups = [];
  }
}

/** Singleton instance of ScoreManager */
export const scoreManager = ScoreManager.getInstance();
export default scoreManager;
export { ScoreManager };
export type { ScorePopup };
