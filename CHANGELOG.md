# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
