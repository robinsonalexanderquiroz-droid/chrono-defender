/**
 * AchievementNotificationRenderer - Animated achievement unlock toasts.
 *
 * Checks for pending achievement notifications and displays them one at a
 * time as slide-in toasts from the top-right corner. Respects reduced motion
 * settings, prevents duplicate notifications, and plays an unlock sound.
 */

import Phaser from 'phaser';

import {
  achievementManager,
  type AchievementCategory,
  type AchievementNotification,
} from '../systems/AchievementManager';
import { audioManager } from '../systems/AudioManager';
import { settingsManager } from '../systems/SettingsManager';

// Runtime reference ensures the Phaser module is loaded for scene operations
void Phaser.VERSION;

// ─── Constants ──────────────────────────────────────────────────────────────

/** Depth for notification toasts */
const NOTIFICATION_DEPTH = 50;

/** Duration the toast is visible in milliseconds */
const DISPLAY_DURATION = 3000;

/** Slide animation duration in milliseconds */
const SLIDE_DURATION = 400;

/** Toast width in pixels */
const TOAST_WIDTH = 280;

/** Toast height in pixels */
const TOAST_HEIGHT = 80;

/** Toast margin from screen edge */
const TOAST_MARGIN = 16;

/** Border width for category color accent */
const BORDER_WIDTH = 3;

/** Category accent colors */
const CATEGORY_COLORS: Record<AchievementCategory, number> = {
  combat: 0xff4444,
  survival: 0x44ff44,
  collection: 0xffcc00,
  mastery: 0xcc44ff,
  dedication: 0x4488ff,
};

// ─── Types ──────────────────────────────────────────────────────────────────

/** Internal state for an active toast */
interface ActiveToast {
  container: Phaser.GameObjects.Container;
  background: Phaser.GameObjects.Graphics;
  headerText: Phaser.GameObjects.Text;
  titleText: Phaser.GameObjects.Text;
  descText: Phaser.GameObjects.Text;
  tweens: Phaser.Tweens.Tween[];
  timer: Phaser.Time.TimerEvent | null;
}

// ─── AchievementNotificationRenderer Class ──────────────────────────────────

class AchievementNotificationRenderer {
  private scene: Phaser.Scene;

  /** Queue of notifications waiting to be displayed */
  private queue: AchievementNotification[] = [];

  /** Currently active toast (only one at a time) */
  private activeToast: ActiveToast | null = null;

  /** Set of achievement IDs already shown to prevent duplicates */
  private shownIds: Set<string> = new Set();

  /** Whether the current toast is in the process of dismissing */
  private isDismissing = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Checks for pending notifications and processes the display queue.
   * Should be called every frame from the gameplay scene's update loop.
   */
  update(): void {
    // Fetch any new pending notifications from the achievement manager
    const pending = achievementManager.getPendingNotifications();

    for (const notification of pending) {
      // Prevent duplicate notifications for the same achievement
      if (!this.shownIds.has(notification.id)) {
        this.queue.push(notification);
        this.shownIds.add(notification.id);
      }
    }

    // If no active toast and queue has items, show the next one
    if (!this.activeToast && !this.isDismissing && this.queue.length > 0) {
      const next = this.queue.shift();
      if (next) {
        this.showToast(next);
      }
    }
  }

  /**
   * Cleans up all active tweens, timers, and graphics.
   */
  destroy(): void {
    if (this.activeToast) {
      this.cleanupToast(this.activeToast);
      this.activeToast = null;
    }
    this.queue = [];
    this.isDismissing = false;
  }

  // ─── Private: Toast Display ────────────────────────────────────────

  private showToast(notification: AchievementNotification): void {
    const { width } = this.scene.scale;
    const reducedMotion = settingsManager.get('reducedMotion');
    const categoryColor = CATEGORY_COLORS[notification.category];

    // Starting position (off-screen right)
    const targetX = width - TOAST_MARGIN - TOAST_WIDTH;
    const targetY = TOAST_MARGIN;
    const startX = reducedMotion ? targetX : width + TOAST_WIDTH;

    // Create container
    const container = this.scene.add.container(startX, targetY);
    container.setDepth(NOTIFICATION_DEPTH);

    // Background with rounded rectangle
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x1a1a2e, 0.92);
    bg.fillRoundedRect(0, 0, TOAST_WIDTH, TOAST_HEIGHT, 8);
    bg.lineStyle(BORDER_WIDTH, categoryColor, 1);
    bg.strokeRoundedRect(0, 0, TOAST_WIDTH, TOAST_HEIGHT, 8);
    container.add(bg);

    // Header text
    const headerText = this.scene.add.text(12, 8, 'ACHIEVEMENT UNLOCKED', {
      fontSize: '10px',
      fontFamily: 'monospace',
      color: '#aaaaaa',
    });
    container.add(headerText);

    // Title text (bold via font weight)
    const titleText = this.scene.add.text(12, 26, notification.title, {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    container.add(titleText);

    // Description text
    const descText = this.scene.add.text(12, 48, notification.description, {
      fontSize: '11px',
      fontFamily: 'monospace',
      color: '#cccccc',
      wordWrap: { width: TOAST_WIDTH - 24 },
    });
    container.add(descText);

    const tweens: Phaser.Tweens.Tween[] = [];

    const toast: ActiveToast = {
      container,
      background: bg,
      headerText,
      titleText,
      descText,
      tweens,
      timer: null,
    };

    this.activeToast = toast;

    // Play unlock sound
    audioManager.playUpgradeCollected();

    if (reducedMotion) {
      // No animation: just appear at final position, then disappear after duration
      container.setPosition(targetX, targetY);
      toast.timer = this.scene.time.delayedCall(DISPLAY_DURATION, () => {
        this.dismissToast(toast, true);
      });
    } else {
      // Slide in from right
      const slideIn = this.scene.tweens.add({
        targets: container,
        x: targetX,
        duration: SLIDE_DURATION,
        ease: 'Power2',
        onComplete: () => {
          // Wait for display duration, then slide out
          toast.timer = this.scene.time.delayedCall(DISPLAY_DURATION, () => {
            this.dismissToast(toast, false);
          });
        },
      });
      tweens.push(slideIn);
    }
  }

  private dismissToast(toast: ActiveToast, instant: boolean): void {
    this.isDismissing = true;

    if (instant) {
      this.cleanupToast(toast);
      this.activeToast = null;
      this.isDismissing = false;
      return;
    }

    const { width } = this.scene.scale;

    const slideOut = this.scene.tweens.add({
      targets: toast.container,
      x: width + TOAST_WIDTH,
      duration: SLIDE_DURATION,
      ease: 'Power2',
      onComplete: () => {
        this.cleanupToast(toast);
        this.activeToast = null;
        this.isDismissing = false;
      },
    });
    toast.tweens.push(slideOut);
  }

  private cleanupToast(toast: ActiveToast): void {
    // Stop all active tweens
    for (const tween of toast.tweens) {
      if (tween.isPlaying()) {
        tween.stop();
      }
    }
    toast.tweens = [];

    // Cancel timer
    if (toast.timer) {
      toast.timer.destroy();
      toast.timer = null;
    }

    // Destroy all game objects
    toast.container.destroy();
  }
}

export { AchievementNotificationRenderer };
export default AchievementNotificationRenderer;
