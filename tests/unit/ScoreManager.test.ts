import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SaveManager } from '../../src/systems/SaveManager';
import { ScoreManager } from '../../src/systems/ScoreManager';

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

// ─── Helper to reset singletons ─────────────────────────────────────────────

function resetSingletons(): void {
  (SaveManager as unknown as { instance: null }).instance = null;
  (ScoreManager as unknown as { instance: null }).instance = null;
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('ScoreManager', () => {
  beforeEach(() => {
    storage.clear();
    resetSingletons();
  });

  it('starts at score 0', () => {
    const sm = ScoreManager.getInstance();
    expect(sm.getScore()).toBe(0);
  });

  it('addKill(100) adds 100 on first kill (multiplier 1x)', () => {
    const sm = ScoreManager.getInstance();
    sm.addKill(100);

    // First kill: combo becomes 1, multiplier for combo <= 1 is 1.0
    expect(sm.getScore()).toBe(100);
    expect(sm.getCombo()).toBe(1);
    expect(sm.getMultiplier()).toBe(1);
  });

  it('combo increases on consecutive kills', () => {
    const sm = ScoreManager.getInstance();
    sm.addKill(100);
    sm.addKill(100);
    sm.addKill(100);

    expect(sm.getCombo()).toBe(3);
  });

  it('multiplier increases with combo', () => {
    const sm = ScoreManager.getInstance();

    // Kill 1: combo=1, multiplier=1.0
    sm.addKill(100);
    expect(sm.getMultiplier()).toBe(1.0);

    // Kill 2: combo=2, multiplier=1 + (2-1)*0.25 = 1.25
    sm.addKill(100);
    expect(sm.getMultiplier()).toBeCloseTo(1.25, 5);

    // Kill 3: combo=3, multiplier=1 + (3-1)*0.25 = 1.5
    sm.addKill(100);
    expect(sm.getMultiplier()).toBeCloseTo(1.5, 5);

    // Total score: 100*1 + 100*1.25 + 100*1.5 = 100 + 125 + 150 = 375
    expect(sm.getScore()).toBe(100 + 125 + 150);
  });

  it('combo resets after timeout (simulate with update(3000))', () => {
    const sm = ScoreManager.getInstance();

    sm.addKill(100);
    sm.addKill(100);
    expect(sm.getCombo()).toBe(2);

    // Combo timeout is 2000ms — simulate 3000ms passing
    sm.update(3000);

    expect(sm.getCombo()).toBe(0);
    expect(sm.getMultiplier()).toBe(1);
  });

  it('addBonus(500, "test") adds flat 500', () => {
    const sm = ScoreManager.getInstance();
    sm.addBonus(500, 'test');

    expect(sm.getScore()).toBe(500);
  });

  it('reset() resets score and combo', () => {
    const sm = ScoreManager.getInstance();
    sm.addKill(100);
    sm.addKill(200);
    sm.addBonus(300, 'bonus');

    expect(sm.getScore()).toBeGreaterThan(0);
    expect(sm.getCombo()).toBeGreaterThan(0);

    sm.reset();

    expect(sm.getScore()).toBe(0);
    expect(sm.getCombo()).toBe(0);
    expect(sm.getRecentPopups()).toHaveLength(0);
  });

  it('getRecentPopups() returns popup data', () => {
    const sm = ScoreManager.getInstance();
    sm.addKill(100, 50, 75);

    const popups = sm.getRecentPopups();
    expect(popups).toHaveLength(1);
    expect(popups[0].text).toContain('+100');
    expect(popups[0].x).toBe(50);
    expect(popups[0].y).toBe(75);
    expect(popups[0].age).toBe(0);
  });
});
