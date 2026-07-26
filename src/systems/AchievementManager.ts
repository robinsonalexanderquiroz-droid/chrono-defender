/**
 * AchievementManager - Tracks and unlocks achievements for Chrono Defender.
 *
 * Defines 20+ achievements across categories. Checks events against conditions,
 * unlocks achievements, tracks progress, and queues notifications for the UI.
 * Persists all data via SaveManager.
 * Implements singleton pattern.
 */

import { saveManager } from './SaveManager';
import type { AchievementPersistData } from './SaveManager';

// ─── Types ──────────────────────────────────────────────────────────────────

/** Achievement categories */
export type AchievementCategory =
  'combat' | 'survival' | 'collection' | 'mastery' | 'dedication';

/** Events the achievement system listens for */
export type AchievementEvent =
  | 'enemyKill'
  | 'waveComplete'
  | 'bossDefeat'
  | 'miniBossDefeat'
  | 'combo'
  | 'score'
  | 'weaponUsed'
  | 'powerUpCollected'
  | 'gameStart'
  | 'damageTaken'
  | 'noDamageWave';

/** Context data provided with an achievement event */
export interface AchievementEventContext {
  /** Current combo count */
  combo?: number;
  /** Current total score */
  score?: number;
  /** Current wave number */
  wave?: number;
  /** Weapon type used */
  weapon?: string;
  /** Power-up type collected */
  powerUp?: string;
  /** Total enemies killed this session */
  totalKills?: number;
  /** Total mini-bosses defeated (all-time) */
  totalMiniBosses?: number;
  /** Total games played (all-time) */
  totalGamesPlayed?: number;
  /** Set of all weapon types used this run */
  weaponsUsed?: Set<string>;
  /** Set of all power-up types collected this run */
  powerUpsCollected?: Set<string>;
  /** Number of times drone was deployed this run */
  droneDeployCount?: number;
  /** Seconds survived without firing */
  secondsWithoutFiring?: number;
  /** Whether player took damage this wave */
  tookDamageThisWave?: boolean;
  /** Whether player lost a life during boss fight */
  lostLifeDuringBoss?: boolean;
  /** Total weapon types in the game */
  totalWeaponTypes?: number;
  /** Total power-up types in the game */
  totalPowerUpTypes?: number;
}

/** Achievement definition */
export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  category: AchievementCategory;
  hidden: boolean;
  /** Events that can trigger this achievement's check */
  relevantEvents: AchievementEvent[];
  /** Condition check: returns true if achievement should unlock */
  condition: (context: AchievementEventContext) => boolean;
  /** Optional: progress target for incremental achievements */
  progressTarget?: number;
}

/** Achievement with its current unlock state */
export interface AchievementWithState extends AchievementDef {
  unlocked: boolean;
  unlockedAt?: string;
  progress?: number;
}

/** Notification for a newly unlocked achievement */
export interface AchievementNotification {
  id: string;
  title: string;
  description: string;
  category: AchievementCategory;
}

// ─── Achievement Definitions ────────────────────────────────────────────────

const ACHIEVEMENT_DEFS: AchievementDef[] = [
  {
    id: 'first_launch',
    title: 'First Launch',
    description: 'Play your first game',
    category: 'dedication',
    hidden: false,
    relevantEvents: ['gameStart'],
    condition: () => true,
  },
  {
    id: 'first_blood',
    title: 'First Blood',
    description: 'Destroy your first enemy',
    category: 'combat',
    hidden: false,
    relevantEvents: ['enemyKill'],
    condition: () => true,
  },
  {
    id: 'survivor_5',
    title: 'Survivor',
    description: 'Reach wave 5',
    category: 'survival',
    hidden: false,
    relevantEvents: ['waveComplete'],
    condition: (ctx) => (ctx.wave ?? 0) >= 5,
  },
  {
    id: 'veteran_10',
    title: 'Veteran',
    description: 'Reach wave 10',
    category: 'survival',
    hidden: false,
    relevantEvents: ['waveComplete'],
    condition: (ctx) => (ctx.wave ?? 0) >= 10,
  },
  {
    id: 'chrono_warrior',
    title: 'Chrono Warrior',
    description: 'Reach wave 20',
    category: 'survival',
    hidden: false,
    relevantEvents: ['waveComplete'],
    condition: (ctx) => (ctx.wave ?? 0) >= 20,
  },
  {
    id: 'miniboss_hunter',
    title: 'Mini-Boss Hunter',
    description: 'Defeat one mini-boss',
    category: 'combat',
    hidden: false,
    relevantEvents: ['miniBossDefeat'],
    condition: (ctx) => (ctx.totalMiniBosses ?? 0) >= 1,
    progressTarget: 1,
  },
  {
    id: 'miniboss_slayer',
    title: 'Mini-Boss Slayer',
    description: 'Defeat five mini-bosses',
    category: 'combat',
    hidden: false,
    relevantEvents: ['miniBossDefeat'],
    condition: (ctx) => (ctx.totalMiniBosses ?? 0) >= 5,
    progressTarget: 5,
  },
  {
    id: 'boss_breaker',
    title: 'Boss Breaker',
    description: 'Defeat the final boss',
    category: 'combat',
    hidden: false,
    relevantEvents: ['bossDefeat'],
    condition: () => true,
  },
  {
    id: 'untouchable',
    title: 'Untouchable',
    description: 'Complete a wave without taking damage',
    category: 'survival',
    hidden: false,
    relevantEvents: ['noDamageWave'],
    condition: () => true,
  },
  {
    id: 'perfect_run',
    title: 'Perfect Run',
    description: 'Defeat the boss without losing a life',
    category: 'mastery',
    hidden: false,
    relevantEvents: ['bossDefeat'],
    condition: (ctx) => ctx.lostLifeDuringBoss === false,
  },
  {
    id: 'combo_starter',
    title: 'Combo Starter',
    description: 'Reach a 10-hit combo',
    category: 'combat',
    hidden: false,
    relevantEvents: ['combo'],
    condition: (ctx) => (ctx.combo ?? 0) >= 10,
    progressTarget: 10,
  },
  {
    id: 'combo_master',
    title: 'Combo Master',
    description: 'Reach a 50-hit combo',
    category: 'mastery',
    hidden: false,
    relevantEvents: ['combo'],
    condition: (ctx) => (ctx.combo ?? 0) >= 50,
    progressTarget: 50,
  },
  {
    id: 'combo_legend',
    title: 'Combo Legend',
    description: 'Reach a 100-hit combo',
    category: 'mastery',
    hidden: true,
    relevantEvents: ['combo'],
    condition: (ctx) => (ctx.combo ?? 0) >= 100,
    progressTarget: 100,
  },
  {
    id: 'weapon_collector',
    title: 'Weapon Collector',
    description: 'Use every weapon type',
    category: 'collection',
    hidden: false,
    relevantEvents: ['weaponUsed'],
    condition: (ctx) =>
      ctx.weaponsUsed !== undefined &&
      ctx.totalWeaponTypes !== undefined &&
      ctx.weaponsUsed.size >= ctx.totalWeaponTypes,
  },
  {
    id: 'power_surge',
    title: 'Power Surge',
    description: 'Collect every power-up type',
    category: 'collection',
    hidden: false,
    relevantEvents: ['powerUpCollected'],
    condition: (ctx) =>
      ctx.powerUpsCollected !== undefined &&
      ctx.totalPowerUpTypes !== undefined &&
      ctx.powerUpsCollected.size >= ctx.totalPowerUpTypes,
  },
  {
    id: 'high_roller',
    title: 'High Roller',
    description: 'Score 100,000 points',
    category: 'mastery',
    hidden: false,
    relevantEvents: ['score'],
    condition: (ctx) => (ctx.score ?? 0) >= 100_000,
    progressTarget: 100_000,
  },
  {
    id: 'millionaire',
    title: 'Millionaire',
    description: 'Score 1,000,000 points',
    category: 'mastery',
    hidden: true,
    relevantEvents: ['score'],
    condition: (ctx) => (ctx.score ?? 0) >= 1_000_000,
    progressTarget: 1_000_000,
  },
  {
    id: 'drone_commander',
    title: 'Drone Commander',
    description: 'Deploy Echo Drone 10 times',
    category: 'collection',
    hidden: false,
    relevantEvents: ['powerUpCollected'],
    condition: (ctx) => (ctx.droneDeployCount ?? 0) >= 10,
    progressTarget: 10,
  },
  {
    id: 'pacifist_moment',
    title: 'Pacifist Moment',
    description: 'Survive 15 seconds without firing',
    category: 'survival',
    hidden: true,
    relevantEvents: ['waveComplete'],
    condition: (ctx) => (ctx.secondsWithoutFiring ?? 0) >= 15,
  },
  {
    id: 'dedicated_defender',
    title: 'Dedicated Defender',
    description: 'Play 25 games',
    category: 'dedication',
    hidden: false,
    relevantEvents: ['gameStart'],
    condition: (ctx) => (ctx.totalGamesPlayed ?? 0) >= 25,
    progressTarget: 25,
  },
];

// ─── AchievementManager Class ───────────────────────────────────────────────

class AchievementManager {
  private static instance: AchievementManager | null = null;

  /** Queue of notifications for recently unlocked achievements */
  private notificationQueue: AchievementNotification[] = [];

  private constructor() {
    // Initialization is lazy — data is read from SaveManager on demand
  }

  /** Get the singleton instance */
  static getInstance(): AchievementManager {
    if (!AchievementManager.instance) {
      AchievementManager.instance = new AchievementManager();
    }
    return AchievementManager.instance;
  }

  /**
   * Checks all relevant achievements against an event and its context.
   * Unlocks any achievements whose conditions are met.
   *
   * @param event - The event type that occurred
   * @param context - Contextual data for evaluating conditions
   */
  check(event: AchievementEvent, context: AchievementEventContext): void {
    for (const def of ACHIEVEMENT_DEFS) {
      if (!def.relevantEvents.includes(event)) continue;

      // Skip already unlocked
      const persisted = saveManager.getAchievementData(def.id);
      if (persisted?.unlocked) continue;

      // Evaluate condition
      if (def.condition(context)) {
        this.unlock(def.id);
      }
    }
  }

  /**
   * Marks an achievement as unlocked, persists, and queues a notification.
   *
   * @param id - The achievement identifier
   */
  unlock(id: string): void {
    const persisted = saveManager.getAchievementData(id);
    if (persisted?.unlocked) return;

    const def = ACHIEVEMENT_DEFS.find((d) => d.id === id);
    if (!def) return;

    const data: AchievementPersistData = {
      unlocked: true,
      unlockedAt: new Date().toISOString(),
      progress: def.progressTarget,
    };

    saveManager.setAchievementData(id, data);

    this.notificationQueue.push({
      id: def.id,
      title: def.title,
      description: def.description,
      category: def.category,
    });
  }

  /**
   * Gets the current progress value for an achievement.
   *
   * @param id - The achievement identifier
   * @returns The progress value, or 0 if not tracked
   */
  getProgress(id: string): number {
    const persisted = saveManager.getAchievementData(id);
    return persisted?.progress ?? 0;
  }

  /**
   * Sets the progress value for an achievement.
   *
   * @param id - The achievement identifier
   * @param value - The new progress value
   */
  setProgress(id: string, value: number): void {
    const persisted = saveManager.getAchievementData(id);
    const data: AchievementPersistData = {
      unlocked: persisted?.unlocked ?? false,
      unlockedAt: persisted?.unlockedAt,
      progress: value,
    };
    saveManager.setAchievementData(id, data);
  }

  /**
   * Returns an array of all unlocked achievement IDs.
   */
  getUnlocked(): string[] {
    const allData = saveManager.getAllAchievementData();
    const unlocked: string[] = [];

    for (const [id, data] of Object.entries(allData)) {
      if (data.unlocked) {
        unlocked.push(id);
      }
    }

    return unlocked;
  }

  /**
   * Returns all achievement definitions with their current unlock state.
   */
  getAll(): AchievementWithState[] {
    return ACHIEVEMENT_DEFS.map((def) => {
      const persisted = saveManager.getAchievementData(def.id);
      return {
        ...def,
        unlocked: persisted?.unlocked ?? false,
        unlockedAt: persisted?.unlockedAt,
        progress: persisted?.progress,
      };
    });
  }

  /**
   * Returns and clears the notification queue.
   * Used by the UI to display unlock toasts.
   */
  getPendingNotifications(): AchievementNotification[] {
    const pending = [...this.notificationQueue];
    this.notificationQueue = [];
    return pending;
  }

  /**
   * Resets all achievement unlock data.
   */
  reset(): void {
    saveManager.clearAchievements();
    this.notificationQueue = [];
  }

  /**
   * Returns the list of all achievement definitions (without state).
   */
  getDefinitions(): AchievementDef[] {
    return [...ACHIEVEMENT_DEFS];
  }
}

/** Singleton instance of AchievementManager */
export const achievementManager = AchievementManager.getInstance();
export default achievementManager;
export { AchievementManager };
