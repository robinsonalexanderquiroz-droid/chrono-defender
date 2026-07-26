import { describe, it, expect, vi, beforeEach } from 'vitest';
import { saveManager } from '../../src/systems/SaveManager';
import { AchievementManager } from '../../src/systems/AchievementManager';

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

// ─── Helper to reset AchievementManager singleton ───────────────────────────

function resetAchievementManager(): void {
  (AchievementManager as unknown as { instance: null }).instance = null;
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('AchievementManager', () => {
  beforeEach(() => {
    // Clear storage and reset in-memory state via the module-level singleton
    storage.clear();
    saveManager.resetAllData();
    resetAchievementManager();
  });

  it('check("gameStart", {...}) unlocks "first_launch"', () => {
    const am = AchievementManager.getInstance();
    am.check('gameStart', {});

    const unlocked = am.getUnlocked();
    expect(unlocked).toContain('first_launch');
  });

  it('check("enemyKill", {...}) unlocks "first_blood"', () => {
    const am = AchievementManager.getInstance();
    am.check('enemyKill', { totalKills: 1 });

    const unlocked = am.getUnlocked();
    expect(unlocked).toContain('first_blood');
  });

  it('duplicate unlock does not occur (calling check twice still only 1 notification)', () => {
    const am = AchievementManager.getInstance();

    am.check('gameStart', {});

    // Get and clear notification queue
    const notifications1 = am.getPendingNotifications();
    const firstLaunchNotifs = notifications1.filter(
      (n) => n.id === 'first_launch',
    );
    expect(firstLaunchNotifs).toHaveLength(1);

    // Check again — should not produce a new notification for first_launch
    am.check('gameStart', {});
    const notifications2 = am.getPendingNotifications();
    const duplicateNotif = notifications2.find((n) => n.id === 'first_launch');
    expect(duplicateNotif).toBeUndefined();

    // Unlocked list should have exactly one entry for first_launch
    const unlocked = am.getUnlocked();
    const firstLaunchCount = unlocked.filter(
      (id) => id === 'first_launch',
    ).length;
    expect(firstLaunchCount).toBe(1);
  });

  it('getUnlocked() returns correct IDs', () => {
    const am = AchievementManager.getInstance();

    am.check('gameStart', {});
    am.check('enemyKill', { totalKills: 1 });

    const unlocked = am.getUnlocked();
    expect(unlocked).toContain('first_launch');
    expect(unlocked).toContain('first_blood');
  });

  it('getAll() returns all 20 definitions with state', () => {
    const am = AchievementManager.getInstance();
    const all = am.getAll();

    expect(all).toHaveLength(20);

    // Each item should have the expected shape
    for (const achievement of all) {
      expect(achievement).toHaveProperty('id');
      expect(achievement).toHaveProperty('title');
      expect(achievement).toHaveProperty('description');
      expect(achievement).toHaveProperty('category');
      expect(achievement).toHaveProperty('hidden');
      expect(achievement).toHaveProperty('unlocked');
    }

    // With fresh state, all should be locked
    const unlockedCount = all.filter((a) => a.unlocked).length;
    expect(unlockedCount).toBe(0);
  });

  it('reset() clears all unlock data', () => {
    const am = AchievementManager.getInstance();

    am.check('gameStart', {});
    am.check('enemyKill', { totalKills: 1 });
    expect(am.getUnlocked().length).toBeGreaterThan(0);

    am.reset();

    expect(am.getUnlocked()).toHaveLength(0);
    const all = am.getAll();
    const anyUnlocked = all.some((a) => a.unlocked);
    expect(anyUnlocked).toBe(false);
  });

  it('hidden achievements show correct state', () => {
    const am = AchievementManager.getInstance();
    const all = am.getAll();

    // Find hidden achievements
    const hiddenAchievements = all.filter((a) => a.hidden);
    expect(hiddenAchievements.length).toBeGreaterThan(0);

    // combo_legend is hidden and requires combo >= 100
    am.check('combo', { combo: 100 });

    const updated = am.getAll();
    const comboLegend = updated.find((a) => a.id === 'combo_legend');
    expect(comboLegend).toBeDefined();
    expect(comboLegend!.hidden).toBe(true);
    expect(comboLegend!.unlocked).toBe(true);
  });

  it('progress tracking with setProgress / getProgress', () => {
    const am = AchievementManager.getInstance();

    // Initially progress is 0
    expect(am.getProgress('combo_starter')).toBe(0);

    // Set progress
    am.setProgress('combo_starter', 5);
    expect(am.getProgress('combo_starter')).toBe(5);

    // Update progress
    am.setProgress('combo_starter', 8);
    expect(am.getProgress('combo_starter')).toBe(8);

    // Persist to storage and verify it survives reload
    saveManager.saveImmediate();

    // Reset achievement manager only (saveManager keeps data)
    resetAchievementManager();
    const am2 = AchievementManager.getInstance();
    expect(am2.getProgress('combo_starter')).toBe(8);
  });
});
