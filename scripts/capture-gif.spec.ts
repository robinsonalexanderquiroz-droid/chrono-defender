/**
 * GIF capture script for Chrono Defender.
 *
 * Records ~8 seconds of gameplay as video, then converts to GIF via ffmpeg.
 *
 * Usage:
 *   npx playwright test --config=scripts/gif.config.ts
 */
import { test } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { existsSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SCREENSHOT_DIR = path.resolve(__dirname, '../docs/screenshots');

test('capture gameplay gif', async ({ page, context }) => {
  // Ensure output directory exists
  if (!existsSync(SCREENSHOT_DIR)) {
    mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  await page.goto('/chrono-defender/');
  await page.waitForSelector('canvas', { timeout: 15_000 });
  await page.waitForTimeout(2000);

  // Start the game
  await page.keyboard.down('Enter');
  await page.waitForTimeout(80);
  await page.keyboard.up('Enter');

  // Play for ~8 seconds with movement and shooting
  await page.waitForTimeout(1500);

  // Move right and fire
  await page.keyboard.down('d');
  await page.keyboard.down('Space');
  await page.waitForTimeout(2500);

  // Move up-right
  await page.keyboard.down('w');
  await page.waitForTimeout(1500);
  await page.keyboard.up('w');

  // Move down
  await page.keyboard.down('s');
  await page.waitForTimeout(1500);
  await page.keyboard.up('s');
  await page.keyboard.up('d');

  // Move left while still firing
  await page.keyboard.down('a');
  await page.waitForTimeout(1000);
  await page.keyboard.up('a');
  await page.keyboard.up('Space');

  await page.waitForTimeout(500);

  // Close context to finalize video
  await context.close();
});

test('convert video to gif', async () => {
  // Find the recorded video file
  const videoDir = path.resolve(__dirname, '../test-results');
  const gifOutput = path.join(SCREENSHOT_DIR, 'gameplay.gif');

  // Playwright saves videos in test-results with context-specific paths
  // Find the .webm file
  const findResult = execSync(
    `find "${videoDir}" -name "*.webm" -type f | head -1`,
  )
    .toString()
    .trim();

  if (!findResult) {
    console.log(
      'No video file found. GIF capture requires video recording to succeed first.',
    );
    return;
  }

  console.log(`Found video: ${findResult}`);

  // Convert to GIF using ffmpeg
  // Scale to 960x540, 15fps, good quality palette
  const paletteFile = path.join(SCREENSHOT_DIR, '_palette.png');

  try {
    // Generate palette for better GIF quality
    execSync(
      `ffmpeg -y -i "${findResult}" -vf "fps=15,scale=960:540:flags=lanczos,palettegen=stats_mode=diff" "${paletteFile}"`,
      { stdio: 'pipe' },
    );

    // Generate GIF using palette
    execSync(
      `ffmpeg -y -i "${findResult}" -i "${paletteFile}" -lavfi "fps=15,scale=960:540:flags=lanczos[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=5" -t 8 "${gifOutput}"`,
      { stdio: 'pipe' },
    );

    // Clean up palette
    execSync(`rm -f "${paletteFile}"`);

    console.log(`GIF saved to: ${gifOutput}`);
  } catch (err) {
    console.error('ffmpeg conversion failed:', err);
  }
});
