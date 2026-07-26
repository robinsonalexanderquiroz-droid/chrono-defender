import { test, expect, type Page } from '@playwright/test';

/**
 * E2E tests for the Options screen.
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

async function isSceneActive(page: Page, key: string): Promise<boolean> {
  return page.evaluate((sceneKey) => {
    const g = (
      window as unknown as {
        __PHASER_GAME__?: {
          scene: { isActive: (key: string) => boolean };
        };
      }
    ).__PHASER_GAME__;
    if (!g) return false;
    return g.scene.isActive(sceneKey);
  }, key);
}

test.describe('Options Screen', () => {
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

  test('navigate to Options and back without errors', async ({ page }) => {
    await focusGame(page);
    // Navigate to OPTIONS (4th item: down 3 times)
    await pressKey(page, 'ArrowDown');
    await pressKey(page, 'ArrowDown');
    await pressKey(page, 'ArrowDown');
    await pressKey(page, 'Enter');
    await page.waitForTimeout(1000);

    // Navigate through options
    await pressKey(page, 'ArrowDown');
    await pressKey(page, 'ArrowDown');
    await pressKey(page, 'ArrowRight');
    await pressKey(page, 'ArrowLeft');
    await pressKey(page, 'ArrowDown');

    await pressKey(page, 'Escape');
    await page.waitForTimeout(500);

    expect(errors).toHaveLength(0);
  });

  test('no console errors during options navigation', async ({ page }) => {
    await focusGame(page);
    await pressKey(page, 'ArrowDown');
    await pressKey(page, 'ArrowDown');
    await pressKey(page, 'ArrowDown');
    await pressKey(page, 'Enter');
    await page.waitForTimeout(300);

    // Navigate through options
    await pressKey(page, 'ArrowDown');
    await pressKey(page, 'ArrowDown');
    await pressKey(page, 'ArrowRight');
    await pressKey(page, 'ArrowLeft');
    await pressKey(page, 'ArrowDown');
    await pressKey(page, 'Enter'); // Toggle a boolean

    await pressKey(page, 'Escape');

    expect(errors).toHaveLength(0);
  });
});
