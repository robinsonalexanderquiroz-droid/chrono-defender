import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SaveManager } from '../../src/systems/SaveManager';
import { SettingsManager } from '../../src/systems/SettingsManager';

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

// ─── Singleton resets ───────────────────────────────────────────────────────

function resetSingletons(): void {
  (SaveManager as unknown as { instance: null }).instance = null;
  (SettingsManager as unknown as { instance: null }).instance = null;
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('SettingsManager', () => {
  beforeEach(() => {
    storage.clear();
    resetSingletons();
  });

  it('returns default values for fresh install', () => {
    const sm = SettingsManager.getInstance();
    expect(sm.get('musicVolume')).toBe(0.4);
    expect(sm.get('difficulty')).toBe('normal');
    expect(sm.get('muted')).toBe(false);
    expect(sm.get('reducedFlashing')).toBe(false);
  });

  it('set() persists values across singleton reset', () => {
    const sm = SettingsManager.getInstance();
    sm.set('difficulty', 'hard');
    sm.set('muted', true);

    // Force save
    SaveManager.getInstance().saveImmediate();

    // Reset singletons to simulate reload
    resetSingletons();
    const sm2 = SettingsManager.getInstance();
    expect(sm2.get('difficulty')).toBe('hard');
    expect(sm2.get('muted')).toBe(true);
  });

  it('reset() restores all defaults', () => {
    const sm = SettingsManager.getInstance();
    sm.set('difficulty', 'hard');
    sm.set('screenShake', 'off');
    sm.set('hudScale', 'large');

    sm.reset();

    expect(sm.get('difficulty')).toBe('normal');
    expect(sm.get('screenShake')).toBe('medium');
    expect(sm.get('hudScale')).toBe('medium');
  });

  it('onChanged callback fires on set()', () => {
    const sm = SettingsManager.getInstance();
    const changes: Array<{ key: string; value: unknown }> = [];

    sm.onChanged((key, value) => {
      changes.push({ key, value });
    });

    sm.set('autoFire', true);
    sm.set('masterVolume', 0.5);

    expect(changes).toHaveLength(2);
    expect(changes[0]).toEqual({ key: 'autoFire', value: true });
    expect(changes[1]).toEqual({ key: 'masterVolume', value: 0.5 });
  });

  it('getAll() returns complete settings object', () => {
    const sm = SettingsManager.getInstance();
    const all = sm.getAll();

    expect(all).toHaveProperty('masterVolume');
    expect(all).toHaveProperty('musicVolume');
    expect(all).toHaveProperty('sfxVolume');
    expect(all).toHaveProperty('muted');
    expect(all).toHaveProperty('difficulty');
    expect(all).toHaveProperty('screenShake');
    expect(all).toHaveProperty('reducedFlashing');
    expect(all).toHaveProperty('aimAssist');
  });
});
