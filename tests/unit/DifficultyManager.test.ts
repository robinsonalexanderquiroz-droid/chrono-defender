import { describe, it, expect, beforeEach } from 'vitest';
import { DifficultyManager } from '../../src/systems/DifficultyManager';

// ─── Helper to reset singleton ──────────────────────────────────────────────

function resetSingleton(): void {
  (DifficultyManager as unknown as { instance: null }).instance = null;
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('DifficultyManager', () => {
  beforeEach(() => {
    resetSingleton();
  });

  it('wave 1 returns multiplier 1.0 for all params', () => {
    const dm = DifficultyManager.getInstance();
    dm.setWave(1);
    const params = dm.getParams();

    expect(params.hpMultiplier).toBe(1.0);
    expect(params.speedMultiplier).toBe(1.0);
    expect(params.spawnRateMultiplier).toBe(1.0);
    expect(params.projectileSpeedMultiplier).toBe(1.0);
  });

  it('scaleEnemyHp(2) at wave 5 returns Math.ceil(2 * 1.4) = 3', () => {
    const dm = DifficultyManager.getInstance();
    dm.setWave(5);

    // Wave 5: hpMultiplier = 1.0 + (5-1) * 0.1 = 1.4
    const params = dm.getParams();
    expect(params.hpMultiplier).toBeCloseTo(1.4, 5);

    // scaleEnemyHp uses Math.ceil(baseHp * multiplier)
    expect(dm.scaleEnemyHp(2)).toBe(Math.ceil(2 * 1.4)); // 3
  });

  it('scaleEnemySpeed(100) at wave 10 returns 100 * 1.45 = 145', () => {
    const dm = DifficultyManager.getInstance();
    dm.setWave(10);

    // Wave 10: speedMultiplier = 1.0 + (10-1) * 0.05 = 1.45
    const params = dm.getParams();
    expect(params.speedMultiplier).toBeCloseTo(1.45, 5);

    expect(dm.scaleEnemySpeed(100)).toBeCloseTo(145, 5);
  });

  it('caps are respected (wave 100 does not exceed max multipliers)', () => {
    const dm = DifficultyManager.getInstance();
    dm.setWave(100);
    const params = dm.getParams();

    // HP capped at 3.0
    expect(params.hpMultiplier).toBe(3.0);
    // Speed capped at 2.0
    expect(params.speedMultiplier).toBe(2.0);
    // Spawn rate capped at 0.4
    expect(params.spawnRateMultiplier).toBe(0.4);
    // Projectile speed capped at 1.8
    expect(params.projectileSpeedMultiplier).toBe(1.8);
  });

  it('reset() returns to wave 1 params', () => {
    const dm = DifficultyManager.getInstance();
    dm.setWave(20);

    const paramsBefore = dm.getParams();
    expect(paramsBefore.hpMultiplier).toBeGreaterThan(1.0);

    dm.reset();

    expect(dm.getCurrentWave()).toBe(1);
    const paramsAfter = dm.getParams();
    expect(paramsAfter.hpMultiplier).toBe(1.0);
    expect(paramsAfter.speedMultiplier).toBe(1.0);
    expect(paramsAfter.spawnRateMultiplier).toBe(1.0);
    expect(paramsAfter.projectileSpeedMultiplier).toBe(1.0);
  });
});
