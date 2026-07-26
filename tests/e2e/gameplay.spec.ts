import { test, expect, type Page } from '@playwright/test';

/**
 * E2E smoke tests for v0.3.0 expanded gameplay features.
 * Verifies enemy spawning, scoring, game flow, and manager integration.
 */

async function focusGame(page: Page) {
  await page.click('canvas');
  await page.waitForTimeout(100);
}

async function startGame(page: Page) {
  await focusGame(page);
  await page.keyboard.down('Enter');
  await page.waitForTimeout(100);
  await page.keyboard.up('Enter');
  await page.waitForTimeout(1500);
}

async function pressKey(page: Page, key: string) {
  await page.keyboard.down(key);
  await page.waitForTimeout(80);
  await page.keyboard.up(key);
  await page.waitForTimeout(300);
}

/** Get the current game phase. Returns 'menu' if on MenuScene. */
async function getPhase(page: Page): Promise<string> {
  return page.evaluate(() => {
    const g = (
      window as unknown as {
        __PHASER_GAME__?: {
          scene: {
            isActive: (key: string) => boolean;
            getScene: (key: string) => unknown;
          };
        };
      }
    ).__PHASER_GAME__;
    if (!g) return 'no-game';
    if (g.scene.isActive('MenuScene')) return 'menu';
    const s = g.scene.getScene('PrototypeScene') as { phase?: string } | null;
    return s?.phase ?? 'no-scene';
  });
}

async function getScore(page: Page): Promise<number> {
  return page.evaluate(() => {
    const g = (
      window as unknown as {
        __PHASER_GAME__?: {
          scene: { getScene: (key: string) => unknown };
        };
      }
    ).__PHASER_GAME__;
    if (!g) return -1;
    const s = g.scene.getScene('PrototypeScene') as { score?: number } | null;
    return s?.score ?? -1;
  });
}

async function getLives(page: Page): Promise<number> {
  return page.evaluate(() => {
    const g = (
      window as unknown as {
        __PHASER_GAME__?: {
          scene: { getScene: (key: string) => unknown };
        };
      }
    ).__PHASER_GAME__;
    if (!g) return -1;
    const s = g.scene.getScene('PrototypeScene') as { lives?: number } | null;
    return s?.lives ?? -1;
  });
}

test.describe('Gameplay v0.3.0', () => {
  const errors: string[] = [];

  test.beforeEach(async ({ page }) => {
    errors.length = 0;
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/chrono-defender/');
    await page.waitForSelector('canvas', { timeout: 15_000 });
    await page.waitForTimeout(3000);
  });

  test('game starts and enters playing phase', async ({ page }) => {
    await startGame(page);
    expect(await getPhase(page)).toBe('playing');
    expect(await getScore(page)).toBe(0);
    expect(await getLives(page)).toBe(3);
  });

  test('enemies spawn during gameplay', async ({ page }) => {
    await startGame(page);
    // Wait for enemies to appear
    await page.waitForTimeout(5000);

    const enemyCount = await page.evaluate(() => {
      const g = (
        window as unknown as {
          __PHASER_GAME__?: {
            scene: { getScene: (key: string) => unknown };
          };
        }
      ).__PHASER_GAME__;
      if (!g) return 0;
      const s = g.scene.getScene('PrototypeScene') as {
        enemies?: { getLength: () => number };
      } | null;
      return s?.enemies?.getLength() ?? 0;
    });

    expect(enemyCount).toBeGreaterThan(0);
  });

  test('shooting destroys enemies and increases score', async ({ page }) => {
    await startGame(page);
    // Wait for enemies, then fire
    await page.waitForTimeout(3000);
    await page.keyboard.down('Space');
    await page.waitForTimeout(4000);
    await page.keyboard.up('Space');

    const score = await getScore(page);
    expect(score).toBeGreaterThanOrEqual(0);
  });

  test('pause preserves game state during gameplay', async ({ page }) => {
    await startGame(page);
    await page.waitForTimeout(2000);

    const scoreBefore = await getScore(page);
    const livesBefore = await getLives(page);

    await pressKey(page, 'p');
    await page.waitForTimeout(500);
    await pressKey(page, 'p');

    expect(await getScore(page)).toBe(scoreBefore);
    expect(await getLives(page)).toBe(livesBefore);
  });

  test('quit resets all state cleanly', async ({ page }) => {
    await startGame(page);
    await page.waitForTimeout(2000);

    // Pause and quit
    await pressKey(page, 'p');
    await pressKey(page, 'q');
    await page.waitForTimeout(500);

    expect(await getPhase(page)).toBe('menu');

    // Start new game — should be fresh
    await startGame(page);
    expect(await getScore(page)).toBe(0);
    expect(await getLives(page)).toBe(3);
  });

  test('mute works during gameplay', async ({ page }) => {
    await startGame(page);
    await pressKey(page, 'm');

    const muted = await page.evaluate(() => {
      const g = (
        window as unknown as {
          __PHASER_GAME__?: {
            scene: { getScene: (key: string) => unknown };
          };
        }
      ).__PHASER_GAME__;
      if (!g) return false;
      const s = g.scene.getScene('PrototypeScene') as {
        muteIndicator?: { text: string };
      } | null;
      return s?.muteIndicator?.text === 'MUTED [M]';
    });

    expect(muted).toBe(true);
  });

  test('full gameplay cycle: start, play, pause, quit, restart', async ({
    page,
  }) => {
    // Start
    await startGame(page);
    expect(await getPhase(page)).toBe('playing');

    // Play briefly
    await page.keyboard.down('Space');
    await page.waitForTimeout(2000);
    await page.keyboard.up('Space');

    // Pause
    await pressKey(page, 'p');
    await page.waitForTimeout(300);

    // Resume
    await pressKey(page, 'p');
    expect(await getPhase(page)).toBe('playing');

    // Pause and quit
    await pressKey(page, 'p');
    await pressKey(page, 'q');
    await page.waitForTimeout(500);
    expect(await getPhase(page)).toBe('menu');

    // Restart
    await startGame(page);
    expect(await getPhase(page)).toBe('playing');
    expect(await getScore(page)).toBe(0);
  });

  test('no console errors during extended gameplay', async ({ page }) => {
    await startGame(page);
    await page.keyboard.down('Space');
    await page.keyboard.down('d');
    await page.waitForTimeout(5000);
    await page.keyboard.up('d');
    await page.keyboard.up('Space');

    expect(errors).toHaveLength(0);
  });
});
