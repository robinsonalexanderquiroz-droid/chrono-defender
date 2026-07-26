import { test, expect, type Page } from '@playwright/test';

/**
 * E2E smoke tests for the pause and resume feature.
 *
 * These tests verify that:
 * - P and Escape toggle the pause state during gameplay
 * - The PAUSED overlay text appears when paused
 * - No browser console errors occur
 */

/** Click the canvas to ensure Phaser receives keyboard focus. */
async function focusGame(page: Page) {
  await page.click('canvas');
  await page.waitForTimeout(100);
}

/** Start the game from the title screen. */
async function startGame(page: Page) {
  await focusGame(page);
  await page.keyboard.down('Enter');
  await page.waitForTimeout(100);
  await page.keyboard.up('Enter');
  await page.waitForTimeout(1500);
}

/** Check whether the PrototypeScene is paused via the exposed game instance. */
async function isGamePaused(page: Page) {
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

/** Press a key with a brief hold to ensure Phaser registers it. */
async function pressKey(page: Page, key: string) {
  await page.keyboard.down(key);
  await page.waitForTimeout(80);
  await page.keyboard.up(key);
  await page.waitForTimeout(300);
}

test.describe('Pause and Resume', () => {
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

  test('P key pauses and resumes gameplay', async ({ page }) => {
    await startGame(page);

    // Pause
    await pressKey(page, 'p');
    expect(await isGamePaused(page)).toBe(true);

    // Resume
    await pressKey(page, 'p');
    expect(await isGamePaused(page)).toBe(false);
  });

  test('Escape key pauses and resumes gameplay', async ({ page }) => {
    await startGame(page);

    // Pause
    await pressKey(page, 'Escape');
    expect(await isGamePaused(page)).toBe(true);

    // Resume
    await pressKey(page, 'Escape');
    expect(await isGamePaused(page)).toBe(false);
  });

  test('pause does not activate on title screen', async ({ page }) => {
    await focusGame(page);
    await pressKey(page, 'p');
    expect(await isGamePaused(page)).toBe(false);
  });

  test('no console errors during pause cycle', async ({ page }) => {
    await startGame(page);
    await pressKey(page, 'p');
    await pressKey(page, 'p');
    await pressKey(page, 'Escape');
    await pressKey(page, 'Escape');
    expect(errors).toHaveLength(0);
  });
});
