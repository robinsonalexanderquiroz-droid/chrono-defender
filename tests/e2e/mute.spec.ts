import { test, expect, type Page } from '@playwright/test';

/**
 * E2E smoke tests for the mute/unmute feature.
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

async function isMuted(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const g = (
      window as unknown as {
        __PHASER_GAME__?: {
          scene: { getScene: (key: string) => unknown };
        };
      }
    ).__PHASER_GAME__;
    if (!g) return false;
    const scene = g.scene.getScene('PrototypeScene') as {
      muteIndicator?: { text: string };
    } | null;
    return scene?.muteIndicator?.text === 'MUTED [M]';
  });
}

test.describe('Mute Toggle', () => {
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

  test('M key toggles mute on menu screen', async ({ page }) => {
    // Start game first (M only works in PrototypeScene)
    await startGame(page);

    // Initially not muted
    expect(await isMuted(page)).toBe(false);

    // Mute
    await pressKey(page, 'm');
    expect(await isMuted(page)).toBe(true);

    // Unmute
    await pressKey(page, 'm');
    expect(await isMuted(page)).toBe(false);
  });

  test('M key works during gameplay', async ({ page }) => {
    await startGame(page);

    expect(await isMuted(page)).toBe(false);

    await pressKey(page, 'm');
    expect(await isMuted(page)).toBe(true);

    await pressKey(page, 'm');
    expect(await isMuted(page)).toBe(false);
  });

  test('mute persists through pause/resume', async ({ page }) => {
    await startGame(page);

    // Mute
    await pressKey(page, 'm');
    expect(await isMuted(page)).toBe(true);

    // Pause and resume
    await pressKey(page, 'p');
    await page.waitForTimeout(300);
    await pressKey(page, 'p');
    await page.waitForTimeout(300);

    // Still muted
    expect(await isMuted(page)).toBe(true);
  });

  test('no console errors during mute operations', async ({ page }) => {
    await startGame(page);
    await pressKey(page, 'm');
    await pressKey(page, 'm');
    await pressKey(page, 'm');
    expect(errors).toHaveLength(0);
  });
});
