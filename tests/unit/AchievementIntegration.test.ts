import { describe, it, expect, vi, beforeEach } from 'vitest';
import { saveManager, SaveManager } from '../../src/systems/SaveManager';
import {
  achievementManager,
  AchievementManager,
} from '../../src/systems/AchievementManager';

// ─── localStorage mock ──────────────────────────────────────────────────────

const storage = new Map<string, string>();

vi.stubGlobal('localStorage', {
  getItem: (k: string) => storage.get(k) ?? null,
  setItem: (k: string, v: string) => {
    storage.set(k, v);
  },
  removeItem: (k: string) => {
    storage.delete(k);
  },
});

function resetAll(): void {
  storage.clear();
  (SaveManager as unknown as { instance: null }).instance = null;
  (AchievementManager as unknown as { instance: null }).instance = null;
}

describe('Achievement Integration - All 20 achievements have triggers', () => {
  beforeEach(() => {
    resetAll();
    saveManager.resetAllData();
  });

  it('first_launch unlocks on gameStart', () => {
    achievementManager.check('gameStart', { totalGamesPlayed: 1 });
    expect(achievementManager.getUnlocked()).toContain('first_launch');
  });

  it('first_blood unlocks on enemyKill', () => {
    achievementManager.check('enemyKill', {});
    expect(achievementManager.getUnlocked()).toContain('first_blood');
  });

  it('survivor_5 unlocks on waveComplete with wave >= 5', () => {
    achievementManager.check('waveComplete', { wave: 5 });
    expect(achievementManager.getUnlocked()).toContain('survivor_5');
  });

  it('veteran_10 unlocks on waveComplete with wave >= 10', () => {
    achievementManager.check('waveComplete', { wave: 10 });
    expect(achievementManager.getUnlocked()).toContain('veteran_10');
  });

  it('chrono_warrior unlocks on waveComplete with wave >= 20', () => {
    achievementManager.check('waveComplete', { wave: 20 });
    expect(achievementManager.getUnlocked()).toContain('chrono_warrior');
  });

  it('miniboss_hunter unlocks on miniBossDefeat with total >= 1', () => {
    achievementManager.check('miniBossDefeat', { totalMiniBosses: 1 });
    expect(achievementManager.getUnlocked()).toContain('miniboss_hunter');
  });

  it('miniboss_slayer unlocks on miniBossDefeat with total >= 5', () => {
    achievementManager.check('miniBossDefeat', { totalMiniBosses: 5 });
    expect(achievementManager.getUnlocked()).toContain('miniboss_slayer');
  });

  it('boss_breaker unlocks on bossDefeat', () => {
    achievementManager.check('bossDefeat', {});
    expect(achievementManager.getUnlocked()).toContain('boss_breaker');
  });

  it('untouchable unlocks on noDamageWave', () => {
    achievementManager.check('noDamageWave', {});
    expect(achievementManager.getUnlocked()).toContain('untouchable');
  });

  it('perfect_run unlocks on bossDefeat without losing a life', () => {
    achievementManager.check('bossDefeat', { lostLifeDuringBoss: false });
    expect(achievementManager.getUnlocked()).toContain('perfect_run');
  });

  it('combo_starter unlocks on combo >= 10', () => {
    achievementManager.check('combo', { combo: 10 });
    expect(achievementManager.getUnlocked()).toContain('combo_starter');
  });

  it('combo_master unlocks on combo >= 50', () => {
    achievementManager.check('combo', { combo: 50 });
    expect(achievementManager.getUnlocked()).toContain('combo_master');
  });

  it('combo_legend unlocks on combo >= 100', () => {
    achievementManager.check('combo', { combo: 100 });
    expect(achievementManager.getUnlocked()).toContain('combo_legend');
  });

  it('weapon_collector unlocks when all weapon types used', () => {
    const weaponsUsed = new Set([
      'laser',
      'triple',
      'spread',
      'rapid',
      'piercing',
      'plasma',
    ]);
    achievementManager.check('weaponUsed', {
      weaponsUsed,
      totalWeaponTypes: 6,
    });
    expect(achievementManager.getUnlocked()).toContain('weapon_collector');
  });

  it('power_surge unlocks when all power-up types collected', () => {
    const powerUpsCollected = new Set([
      'health',
      'shield',
      'weapon',
      'rapidfire',
      'score2x',
      'drone',
      'magnet',
      'invuln',
    ]);
    achievementManager.check('powerUpCollected', {
      powerUpsCollected,
      totalPowerUpTypes: 8,
    });
    expect(achievementManager.getUnlocked()).toContain('power_surge');
  });

  it('high_roller unlocks on score >= 100000', () => {
    achievementManager.check('score', { score: 100_000 });
    expect(achievementManager.getUnlocked()).toContain('high_roller');
  });

  it('millionaire unlocks on score >= 1000000', () => {
    achievementManager.check('score', { score: 1_000_000 });
    expect(achievementManager.getUnlocked()).toContain('millionaire');
  });

  it('drone_commander unlocks on droneDeployCount >= 10', () => {
    achievementManager.check('powerUpCollected', { droneDeployCount: 10 });
    expect(achievementManager.getUnlocked()).toContain('drone_commander');
  });

  it('pacifist_moment unlocks on waveComplete with 15s without firing', () => {
    achievementManager.check('waveComplete', { secondsWithoutFiring: 15 });
    expect(achievementManager.getUnlocked()).toContain('pacifist_moment');
  });

  it('dedicated_defender unlocks on gameStart with 25 games played', () => {
    achievementManager.check('gameStart', { totalGamesPlayed: 25 });
    expect(achievementManager.getUnlocked()).toContain('dedicated_defender');
  });

  it('duplicate unlock does not persist twice', () => {
    achievementManager.check('gameStart', { totalGamesPlayed: 1 });
    achievementManager.check('gameStart', { totalGamesPlayed: 2 });
    const unlocked = achievementManager.getUnlocked();
    const count = unlocked.filter((id) => id === 'first_launch').length;
    expect(count).toBe(1);
  });

  it('notifications queue correctly and clear', () => {
    achievementManager.check('gameStart', { totalGamesPlayed: 1 });
    achievementManager.check('enemyKill', {});

    const notifications = achievementManager.getPendingNotifications();
    expect(notifications.length).toBeGreaterThanOrEqual(2);

    // Queue should be empty after retrieval
    const empty = achievementManager.getPendingNotifications();
    expect(empty).toHaveLength(0);
  });

  it('hidden achievements conceal details before unlock', () => {
    const all = achievementManager.getAll();
    const comboLegend = all.find((a) => a.id === 'combo_legend');
    expect(comboLegend).toBeDefined();
    expect(comboLegend!.hidden).toBe(true);
    expect(comboLegend!.unlocked).toBe(false);
  });

  it('progress persists across singleton resets', () => {
    achievementManager.setProgress('combo_starter', 7);
    saveManager.saveImmediate();

    resetAll();
    const am = AchievementManager.getInstance();
    expect(am.getProgress('combo_starter')).toBe(7);
  });
});
