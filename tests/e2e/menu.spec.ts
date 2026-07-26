import { test, expect, type Page } from '@playwright/test';

/**
 * E2E tests for the MenuScene navigation.
 */

async function focusGame(page: Page) {
  await page.click('canvas');
  await page.waitForTimeout(100);
}

async function pressKey(page: Page, key: string) {
  await page.keyboard.down(key);
  await page.waitForTimeout(80);
  await page.keyboard.up(key);
  await page.waitForTimeout(300);
}

async function isMenuActive(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const g = (
      window as unknown as {
        __PHASER_GAME__?: {
          scene: { isActive: (key: string) => boolean };
        };
      }
    ).__PHASER_GAME__;
    if (!g) return false;
    return g.scene.isActive('MenuScene');
  });
}

async function isGameActive(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const g = (
      window as unknown as {
        __PHASER_GAME__?: {
          scene: { isActive: (key: string) => boolean };
        };
      }
    ).__PHASER_GAME__;
    if (!g) return false;
    return g.scene.isActive('PrototypeScene');
  });
}

test.describe('Menu Navigation', () => {
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

  test('game starts on MenuScene', async ({ page }) => {
    expect(await isMenuActive(page)).toBe(true);
    expect(await isGameActive(page)).toBe(false);
  });

  test('pressing Enter starts the game from menu', async ({ page }) => {
    await focusGame(page);
    await pressKey(page, 'Enter');
    await page.waitForTimeout(1000);

    expect(await isMenuActive(page)).toBe(false);
    expect(await isGameActive(page)).toBe(true);
  });

  test('menu navigation with arrow keys does not crash', async ({ page }) => {
    await focusGame(page);
    await pressKey(page, 'ArrowDown');
    await pressKey(page, 'ArrowDown');
    await pressKey(page, 'ArrowUp');
    await pressKey(page, 'ArrowDown');
    await pressKey(page, 'ArrowDown');
    await pressKey(page, 'ArrowDown');

    // Still on menu
    expect(await isMenuActive(page)).toBe(true);
    expect(errors).toHaveLength(0);
  });

  test('no console errors during menu interaction', async ({ page }) => {
    await focusGame(page);
    await pressKey(page, 'ArrowDown');
    await pressKey(page, 'Enter'); // HIGH SCORES
    await page.waitForTimeout(500);
    await pressKey(page, 'Escape'); // Back
    await page.waitForTimeout(300);
    await pressKey(page, 'Enter'); // START GAME (back to index 0)

    expect(errors).toHaveLength(0);
  });
});
