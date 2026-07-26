import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SaveManager } from '../../src/systems/SaveManager';
import type { LeaderboardEntry } from '../../src/systems/SaveManager';

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

// ─── Helper to reset singleton ──────────────────────────────────────────────

function resetSingleton(): void {
  (SaveManager as unknown as { instance: null }).instance = null;
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('SaveManager', () => {
  beforeEach(() => {
    storage.clear();
    resetSingleton();
  });

  it('loads default data when localStorage is empty', () => {
    const sm = SaveManager.getInstance();
    const stats = sm.getStats();

    expect(stats.highScore).toBe(0);
    expect(stats.highCombo).toBe(0);
    expect(stats.gamesPlayed).toBe(0);
    expect(sm.getLeaderboard()).toEqual([]);
  });

  it('saves and loads data correctly', () => {
    const sm = SaveManager.getInstance();
    sm.updateHighScore(5000);
    sm.saveImmediate();

    // Reset singleton to force reload from storage
    resetSingleton();
    const sm2 = SaveManager.getInstance();
    expect(sm2.getStats().highScore).toBe(5000);
  });

  it('addScore inserts entries sorted by score, limits to 10', () => {
    const sm = SaveManager.getInstance();

    // Add 12 entries with different scores
    for (let i = 1; i <= 12; i++) {
      const entry: LeaderboardEntry = {
        score: i * 100,
        wave: i,
        combo: i,
        weapon: 'laser',
        date: '2024-01-01',
        result: 'gameover',
      };
      sm.addScore(entry);
    }

    sm.saveImmediate();
    const leaderboard = sm.getLeaderboard();

    expect(leaderboard).toHaveLength(10);
    // Highest score first
    expect(leaderboard[0].score).toBe(1200);
    // Lowest retained score is 300
    expect(leaderboard[9].score).toBe(300);
  });

  it('clearLeaderboard clears only scores', () => {
    const sm = SaveManager.getInstance();
    sm.updateHighScore(9999);
    sm.addScore({
      score: 500,
      wave: 3,
      combo: 2,
      weapon: 'laser',
      date: '2024-01-01',
      result: 'gameover',
    });
    sm.saveImmediate();

    sm.clearLeaderboard();
    sm.saveImmediate();

    expect(sm.getLeaderboard()).toEqual([]);
    // Stats should still be present
    expect(sm.getStats().highScore).toBe(9999);
  });

  it('updateHighScore returns true only for new highs', () => {
    const sm = SaveManager.getInstance();

    expect(sm.updateHighScore(100)).toBe(true);
    expect(sm.updateHighScore(50)).toBe(false);
    expect(sm.updateHighScore(100)).toBe(false);
    expect(sm.updateHighScore(200)).toBe(true);
    expect(sm.getStats().highScore).toBe(200);
  });

  it('incrementGamesPlayed increments correctly', () => {
    const sm = SaveManager.getInstance();

    expect(sm.getStats().gamesPlayed).toBe(0);
    sm.incrementGamesPlayed();
    sm.incrementGamesPlayed();
    sm.incrementGamesPlayed();
    expect(sm.getStats().gamesPlayed).toBe(3);
  });

  it('handles corrupted JSON gracefully (returns defaults)', () => {
    // Write corrupted data to storage
    storage.set('chrono-defender-save', '{not valid json!!!');

    const sm = SaveManager.getInstance();
    const stats = sm.getStats();

    expect(stats.highScore).toBe(0);
    expect(stats.gamesPlayed).toBe(0);
    expect(sm.getLeaderboard()).toEqual([]);
  });

  it('migrates old schema (no schemaVersion field) preserving stats', () => {
    // Simulate old schema data without schemaVersion
    const oldData = {
      highScore: 7500,
      highCombo: 15,
      gamesPlayed: 42,
      bossesDefeated: 3,
      miniBossesDefeated: 7,
      settings: {
        masterVolume: 0.5,
        sfxVolume: 0.9,
      },
    };
    storage.set('chrono-defender-save', JSON.stringify(oldData));

    const sm = SaveManager.getInstance();
    const stats = sm.getStats();

    // Stats should be preserved
    expect(stats.highScore).toBe(7500);
    expect(stats.highCombo).toBe(15);
    expect(stats.gamesPlayed).toBe(42);
    expect(stats.bossesDefeated).toBe(3);
    expect(stats.miniBossesDefeated).toBe(7);

    // Settings should be migrated (existing values preserved, new ones default)
    const settings = sm.getSettings();
    expect(settings.masterVolume).toBe(0.5);
    expect(settings.sfxVolume).toBe(0.9);
    // New fields get defaults
    expect(settings.difficulty).toBe('normal');
  });

  it('resetAllData resets everything', () => {
    const sm = SaveManager.getInstance();
    sm.updateHighScore(10000);
    sm.incrementGamesPlayed();
    sm.addScore({
      score: 5000,
      wave: 10,
      combo: 5,
      weapon: 'laser',
      date: '2024-01-01',
      result: 'victory',
    });
    sm.setAchievementData('first_blood', { unlocked: true });
    sm.saveImmediate();

    sm.resetAllData();

    expect(sm.getStats().highScore).toBe(0);
    expect(sm.getStats().gamesPlayed).toBe(0);
    expect(sm.getLeaderboard()).toEqual([]);
    expect(sm.getAchievementData('first_blood')).toBeUndefined();
  });
});
