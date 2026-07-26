import { test, expect, type Page } from '@playwright/test';

/**
 * E2E smoke tests for the Quit to Title feature.
 *
 * Verifies that pressing Q while paused returns to the title screen,
 * and that a new game can be started cleanly afterward.
 */

/** Click the canvas to ensure Phaser receives keyboard focus. */
async function focusGame(page: Page) {
  await page.click('canvas');
  await page.waitForTimeout(100);
}

/** Start the game from the title/ready screen. */
async function startGame(page: Page) {
  await focusGame(page);
  await page.keyboard.down('Enter');
  await page.waitForTimeout(100);
  await page.keyboard.up('Enter');
  await page.waitForTimeout(1500);
}

/** Press a key with a brief hold for Phaser to register. */
async function pressKey(page: Page, key: string) {
  await page.keyboard.down(key);
  await page.waitForTimeout(80);
  await page.keyboard.up(key);
  await page.waitForTimeout(300);
}

/** Get the current game phase. Returns 'menu' if on MenuScene, or PrototypeScene phase. */
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

/** Check whether PrototypeScene is paused. */
async function isGamePaused(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const g = (
      window as unknown as {
        __PHASER_GAME__?: {
          scene: { isPaused: (key: string) => boolean };
        };
      }
    ).__PHASER_GAME__;
    if (!g) return false;
    return g.scene.isPaused('PrototypeScene');
  });
}

test.describe('Quit to Title', () => {
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

  test('Q during pause returns to title screen', async ({ page }) => {
    await startGame(page);
    expect(await getPhase(page)).toBe('playing');

    // Pause
    await pressKey(page, 'p');
    expect(await isGamePaused(page)).toBe(true);

    // Quit
    await pressKey(page, 'q');
    await page.waitForTimeout(500);

    // Should be back on title/ready screen
    expect(await getPhase(page)).toBe('menu');
    expect(await isGamePaused(page)).toBe(false);
  });

  test('can start a new game after quitting', async ({ page }) => {
    await startGame(page);

    // Pause and quit
    await pressKey(page, 'p');
    await pressKey(page, 'q');
    await page.waitForTimeout(500);

    expect(await getPhase(page)).toBe('menu');

    // Start a new game
    await startGame(page);
    expect(await getPhase(page)).toBe('playing');
  });

  test('quit/restart cycle works 5 consecutive times', async ({ page }) => {
    for (let i = 0; i < 5; i++) {
      await startGame(page);
      expect(await getPhase(page)).toBe('playing');

      await pressKey(page, 'p');
      expect(await isGamePaused(page)).toBe(true);

      await pressKey(page, 'q');
      await page.waitForTimeout(500);
      expect(await getPhase(page)).toBe('menu');
    }
  });

  test('no console errors during quit cycle', async ({ page }) => {
    await startGame(page);
    await pressKey(page, 'p');
    await pressKey(page, 'q');
    await page.waitForTimeout(500);

    await startGame(page);
    await pressKey(page, 'p');
    await pressKey(page, 'q');
    await page.waitForTimeout(500);

    expect(errors).toHaveLength(0);
  });
});
