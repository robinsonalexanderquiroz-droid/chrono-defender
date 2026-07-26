/**
 * Screenshot capture script for Chrono Defender.
 *
 * Usage:
 *   npx playwright test --config=scripts/screenshots.config.ts
 *
 * This script automates the game through each visual state and captures
 * 960x540 PNG screenshots with no browser chrome or dev tools.
 */
import { test } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SCREENSHOT_DIR = path.resolve(__dirname, '../docs/screenshots');
const GAME_WIDTH = 960;
const GAME_HEIGHT = 540;

/**
 * Wait for the Phaser canvas to be present and content to render.
 */
async function waitForCanvas(page: import('@playwright/test').Page) {
  await page.waitForSelector('canvas', { timeout: 15_000 });
  // Wait for Phaser to boot and render the first frame.
  // In headless mode the first meaningful paint can take longer.
  await page.waitForTimeout(3000);
}

/**
 * Dispatch a keyboard event into the page.
 */
async function pressKey(
  page: import('@playwright/test').Page,
  key: string,
  holdMs = 80,
) {
  await page.keyboard.down(key);
  await page.waitForTimeout(holdMs);
  await page.keyboard.up(key);
}

/**
 * Helper to access the game scene via the exposed __PHASER_GAME__ global.
 */
function getSceneScript(body: string): string {
  return `
    (() => {
      const game = window.__PHASER_GAME__;
      if (!game) return false;
      const scene = game.scene.scenes[0];
      if (!scene) return false;
      ${body}
      return true;
    })();
  `;
}

test.describe('Screenshot Capture', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/chrono-defender/');
    await waitForCanvas(page);
  });

  test('title-screen', async ({ page }) => {
    // Title screen is displayed on load. Wait extra for text and starfield.
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'title-screen.png'),
      clip: { x: 0, y: 0, width: GAME_WIDTH, height: GAME_HEIGHT },
    });
  });

  test('gameplay', async ({ page }) => {
    // Start the game
    await pressKey(page, 'Enter');
    // Let gameplay run for several seconds to populate enemies
    await page.waitForTimeout(4000);
    // Move the player and fire for an action shot
    await page.keyboard.down('d');
    await page.keyboard.down('Space');
    await page.waitForTimeout(2000);
    await page.keyboard.up('d');
    await page.keyboard.down('w');
    await page.waitForTimeout(1000);
    await page.keyboard.up('w');
    await page.keyboard.up('Space');
    await page.waitForTimeout(500);
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'gameplay.png'),
      clip: { x: 0, y: 0, width: GAME_WIDTH, height: GAME_HEIGHT },
    });
  });

  test('boss-fight', async ({ page }) => {
    // Start and fast-forward to boss phase
    await pressKey(page, 'Enter');
    await page.waitForTimeout(1000);

    // Fast-forward elapsed time past COMBAT_DURATION (65000ms)
    await page.evaluate(
      getSceneScript('scene.elapsed = 64800;'),
    );

    // Wait for boss to spawn and tween into position
    await page.waitForTimeout(4000);

    // Fire at the boss for visual interest (player shoots right toward boss)
    await page.keyboard.down('Space');
    await page.waitForTimeout(2000);
    await page.keyboard.up('Space');

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'boss-fight.png'),
      clip: { x: 0, y: 0, width: GAME_WIDTH, height: GAME_HEIGHT },
    });
  });

  test('victory', async ({ page }) => {
    // Start and fast-forward to boss phase
    await pressKey(page, 'Enter');
    await page.waitForTimeout(1000);

    // Fast-forward elapsed time
    await page.evaluate(
      getSceneScript('scene.elapsed = 64800;'),
    );

    // Wait for boss to spawn and settle
    await page.waitForTimeout(5000);

    // Directly trigger the victory end-game state
    await page.evaluate(
      getSceneScript(`
        // Add score so the victory screen looks interesting
        scene.score = 4750;
        scene.defeatBoss();
      `),
    );

    // Wait for the victory text and explosions to appear
    await page.waitForTimeout(1500);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'victory.png'),
      clip: { x: 0, y: 0, width: GAME_WIDTH, height: GAME_HEIGHT },
    });
  });
});
