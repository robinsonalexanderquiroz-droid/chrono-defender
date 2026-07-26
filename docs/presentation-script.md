# Chrono Defender — Presentation Script

**Duration:** 5 minutes maximum
**Format:** Screen recording with narration

---

## Slide 1: Introduction (0:00 – 0:30)

**Show:** Title screen of the game running in the browser.

**Script:**

"Hi, I'm presenting Chrono Defender — an arcade-inspired horizontal shoot 'em up built entirely in the browser using Phaser 3 and TypeScript.

The goal of this project was to build a fully playable, professionally structured game from scratch with no external art or audio assets — everything is generated procedurally at runtime.

Let me show you what it can do."

---

## Slide 2: Live Demo – Gameplay (0:30 – 2:00)

**Show:** Navigate the menu, start a game, play through a combat phase.

**Script:**

"Here's the game running live on GitHub Pages. The menu system is fully navigable with keyboard, gamepad, or touch.

When I press Enter, the game starts immediately. You can see the player ship, the parallax starfield background, and enemies spawning from the right side.

I'm using WASD to move and Space to fire. Notice the HUD showing my score, lives, current weapon, and combo multiplier. As I chain kills, the combo increases — up to 4x score multiplier.

The game has five distinct enemy types: Scouts that fly straight, Interceptors with zigzag patterns, Heavies that fire back, Bombers that dive, and Snipers that stop and aim.

I can switch weapons with number keys 1 through 6 — here's the Spread Shot, and here's the Piercing Laser that passes through enemies.

When I collect a Chrono Shard, it advances my Upgrade Rail. I can activate an Echo Drone that fires alongside me, or a Shield that absorbs one hit."

---

## Slide 3: Boss Fight and Audio (2:00 – 2:45)

**Show:** Fast-forward or reach the boss. Show the boss battle.

**Script:**

"After surviving the combat phase, the Epoch Warden boss appears. Notice the music transitions — the boss theme uses heavier, lower-frequency synthesis.

All audio in Chrono Defender is generated using the Web Audio API. There are no audio files in the repository. The AudioManager synthesizes over 15 different sounds: laser fire, explosions, pickups, and five unique music themes — all created with oscillators, noise buffers, and envelopes.

The boss has an armored body and an exposed temporal core that's vulnerable only during certain cycles. When I hit it, you can see the camera shake and hear the impact sound."

---

## Slide 4: Technical Architecture (2:45 – 3:45)

**Show:** VS Code with the project structure, then specific files.

**Script:**

"Let me show the code architecture. The project uses TypeScript in strict mode — zero `any` usage throughout the entire codebase.

The architecture is modular with singleton managers:

```
src/systems/
├── AudioManager.ts      — procedural Web Audio synthesis
├── EnemyManager.ts      — 5 enemy types, 5 movement patterns
├── WeaponManager.ts     — 6 weapons with spread/piercing
├── ScoreManager.ts      — combo system with floating popups
├── DifficultyManager.ts — adaptive scaling formulas
├── SaveManager.ts       — localStorage with schema migration
├── AchievementManager.ts — 20 achievements, event-driven
├── InputManager.ts      — unified keyboard/gamepad/touch
└── SettingsManager.ts   — 16 configurable options
```

All gameplay parameters live in a single data-driven config file. Enemy stats, weapon definitions, power-up weights, and difficulty curves are all defined declaratively — no magic numbers in the game logic.

The build pipeline uses Vite for fast development and optimized production builds. ESLint and Prettier enforce code quality. The CI workflow runs typecheck, lint, tests, and audit on every push."

---

## Slide 5: Testing and Security (3:45 – 4:15)

**Show:** Terminal running tests, then Playwright test results.

**Script:**

"The project has comprehensive automated testing. Let me run the test suite.

64 unit tests verify the game managers: save data migration, achievement unlock logic, difficulty scaling, combo scoring, and gamepad dead-zone calculations.

26 end-to-end tests using Playwright verify the actual game running in a headless browser: menu navigation, pause and resume, quit to title, mute toggle, gameplay flow, and options screen interaction.

The `npm audit` check runs with every CI build — currently zero vulnerabilities. All dependencies use tilde version ranges for reproducibility."

---

## Slide 6: Deployment and Accessibility (4:15 – 4:45)

**Show:** GitHub Actions workflow, then the live deployed site.

**Script:**

"Deployment is fully automated. When code is pushed to main, GitHub Actions builds the project and deploys to GitHub Pages. The game is always live at the public URL.

For accessibility: the game supports reduced flashing, reduced motion, configurable screen shake intensity, high-contrast HUD, and a mute shortcut. Touch controls with a virtual joystick make it playable on mobile. Gamepad support works with Xbox and PlayStation controllers including analog movement and dead zones.

All settings persist to localStorage across sessions."

---

## Slide 7: Conclusion (4:45 – 5:00)

**Show:** Title screen with the game URL.

**Script:**

"Chrono Defender is a complete, playable arcade game — built with modern web technologies, fully tested, professionally structured, and publicly deployed. No backend, no secrets, no external assets. Just TypeScript, Web Audio, and Phaser.

You can play it right now at the link on screen, and the full source code is available on GitHub under the MIT license. Thank you."

---

## Links

- **Live Demo:** https://robinsonalexanderquiroz-droid.github.io/chrono-defender/
- **Repository:** https://github.com/robinsonalexanderquiroz-droid/chrono-defender
- **Video:** _(to be recorded and linked here after production)_
