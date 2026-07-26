# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.1] - 2025-07-26

### Added

- Full interactive OptionsScene with Audio, Display, Gameplay, Accessibility, and Data sections
- Keyboard-navigable settings with sliders, toggles, and multi-choice controls
- In-game confirmation modal for destructive data actions (no browser dialogs)
- Visible mobile touch-control overlay (joystick, fire, pause, mute, weapon cycle buttons)
- Weapon switching via keyboard (1-6 direct, E/Q cycle) and gamepad (bumpers)
- Achievement notification toasts (slide-in from top-right, queued, respect reduced motion)
- WeaponSwitcher class with edge-detected key input
- AchievementNotificationRenderer with category-colored borders
- TouchOverlay Phaser scene for touch-device rendering
- SettingsManager unit tests (5 tests)
- Options E2E tests (2 tests)

### Changed

- MenuScene OPTIONS item now launches dedicated OptionsScene (replaced placeholder)
- PrototypeScene auto-starts gameplay (MenuScene handles title)
- Settings changes apply immediately through SettingsManager
- Touch overlay launches automatically on touch devices during gameplay

### Fixed

- Completed all v0.4.0 placeholder features that were architecturally defined but not user-facing

## [0.4.0] - 2025-07-26

### Added

- Navigable title menu with START GAME, HIGH SCORES, ACHIEVEMENTS, OPTIONS, CONTROLS
- Persistent leaderboard: top 10 scores with wave, combo, weapon, date, result
- Achievement system with 20 achievements across 5 categories (combat, survival, collection, mastery, dedication)
- Achievement progress tracking and notification queue
- Unified InputManager abstracting keyboard, gamepad, and touch input
- GamepadManager with standard controller mapping, dead zones, and edge detection
- TouchManager with virtual joystick and fire/pause/mute button areas
- SettingsManager with type-safe get/set, defaults, and change notifications
- Extended settings: master volume, fullscreen, screen shake, particle effects, reduced flashing, HUD scale, high contrast, difficulty, auto-fire, pause on focus loss, vibration, aim assist, reduced motion
- Save schema v4 with migration from older versions
- Debounced localStorage writes (max once per 500ms)
- Clear scores with in-game confirmation dialog
- Achievements screen with unlock count, progress, and hidden achievement support
- Controls reference screen
- High scores screen with rank/score/wave/combo/result/date table
- 35 unit tests (SaveManager, AchievementManager, GamepadManager, DifficultyManager, ScoreManager)
- Gamepad connect/disconnect notifications

### Changed

- Game starts from MenuScene instead of PrototypeScene directly
- Quit to Title now navigates to MenuScene
- SaveManager rewritten with schema versioning and leaderboard support

### Technical

- Schema migration preserves existing save data from v0.3.x
- All new managers use singleton pattern
- InputManager OR's actions across keyboard, gamepad, and touch sources
- Edge-detection for discrete actions (pause, mute, confirm, weapon switch)
- GamepadManager applies dead zone rescaling for smooth analog input
- TouchManager tracks multi-touch against configurable screen areas
- AchievementManager uses event-driven checking against 20 condition functions

## [0.3.0] - 2025-07-26

### Added

- Data-driven gameplay configuration (`src/config/gameplay.ts`)
- Five enemy type definitions: Scout, Interceptor, Heavy, Bomber, Sniper
- Six weapon definitions: Standard Laser, Spread Shot, Triple Shot, Rapid Fire, Piercing Laser, Plasma Beam
- Eight power-up types: Health, Shield, Weapon Upgrade, Rapid Fire, Score x2, Drone, Magnet, Invulnerability
- EnemyManager with five movement patterns (straight, zigzag, stop-and-go, dive, orbit)
- WeaponManager with weapon cycling and spread/piercing mechanics
- PowerUpManager with weighted random drop system and timed effects
- WaveManager with wave state machine and mini-boss/final boss triggers
- ScoreManager with combo system, multiplier scaling, and floating score popups
- DifficultyManager with adaptive scaling (HP, speed, spawn rate, projectile speed)
- SaveManager with localStorage persistence (high score, stats, settings)
- Mini-boss encounter definitions (Chrono Sentinel)
- Wave composition formulas driven by wave number
- Combo multiplier display in HUD
- Current weapon name display in HUD
- High score display on game over screen
- Games played and bosses defeated tracking

### Changed

- Score system now uses ScoreManager with combo multiplier
- HUD shows combo count, multiplier, and weapon name
- Game over screen displays high score and combo stats
- Game start increments games played counter
- Boss defeat increments bosses defeated counter

### Technical

- All gameplay parameters defined in a single config module
- Singleton pattern for all managers (matches AudioManager)
- Managers reset cleanly on scene restart
- No breaking changes to existing gameplay or E2E tests

## [0.2.0] - 2025-07-26

### Added

- Procedural audio system (AudioManager) with Web Audio API synthesis
- Background music: title theme, gameplay theme, boss theme, victory fanfare, game over theme
- Sound effects: laser fire, enemy destroyed, boss damaged, boss defeated, player hit, player death, upgrade collected, echo drone attack, pause, resume, quit, start game
- Mute toggle (M key) with persistent visual indicator
- Enhanced particle explosions with flash ring effect
- Player thruster particles during movement
- Player damage flash (red tint) feedback
- Camera shake on player damage
- Mute indicator in HUD (top-right corner)
- Pause/resume audio cues
- Quit to title audio cue
- Volume control architecture (music/SFX separation)
- Graceful audio degradation (no errors when AudioContext unavailable)

### Changed

- Explosions now produce more particles with varied sizes and a bright ring flash
- Pause overlay updated with Quit to Title option (Q key)
- README updated with new controls and features

### Technical

- AudioManager singleton with Web Audio API oscillator synthesis
- No external audio files required
- Anti-clipping protection (max 12 simultaneous sounds)
- Browser autoplay policy handling via resumeContext()

## [0.1.0] - 2025-07-26

### Added

- Initial playable prototype
- Horizontal scrolling shooter gameplay
- Upgrade Rail system with six slots (Thrust, Missile, Split, Beam, Echo, Shield)
- Echo Drone autonomous support orb
- Boss battle against the Epoch Warden with vulnerable temporal core
- Parallax multi-layer starfield background
- Three enemy types: Scouts, Heavy Drones, Epoch Warden
- Player invulnerability and respawn on damage
- Chrono Shard collectibles for upgrade progression
- Shield power-up with pulsing energy visual
- Explosion particle effects
- Title screen with controls display
- Victory and defeat end screens with final score
- GitHub Pages deployment workflow
- CI quality gate workflow

### Technical

- Phaser 3.90 game framework
- TypeScript 5.9 with strict mode
- Vite 6.4 build tooling
- ESLint 10 with flat config
- Prettier 3.9 formatting
- Vitest 4.1 unit testing
- Playwright 1.61 E2E testing
- GitHub Actions CI/CD pipelines
- Automated screenshot capture scripts

### Known Issues

- Placeholder procedural graphics (no sprite artwork yet)
- Single level with one boss encounter
- No audio or sound effects
- Difficulty balancing needs tuning
- MISSILE and BEAM upgrades map to existing effects (not unique)
- Large single JS bundle (Phaser not code-split)
