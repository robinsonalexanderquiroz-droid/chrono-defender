# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
